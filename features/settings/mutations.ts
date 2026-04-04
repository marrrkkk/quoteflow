import "server-only";

import { and, eq, isNull, ne } from "drizzle-orm";

import { type WorkspaceBusinessType } from "@/features/inquiries/business-types";
import { normalizeInquiryFormSlug } from "@/features/inquiries/inquiry-forms";
import { createInquiryFormConfigDefaults } from "@/features/inquiries/form-config";
import { createInquiryPageConfigDefaults } from "@/features/inquiries/page-config";
import type {
  WorkspaceDeleteInput,
  WorkspaceGeneralSettingsInput,
  WorkspaceInquiryFormCreateInput,
  WorkspaceInquiryFormPresetInput,
  WorkspaceInquiryFormSettingsInput,
  WorkspaceInquiryPageSettingsInput,
  WorkspaceQuoteSettingsInput,
} from "@/features/settings/schemas";
import { publicInquiryAttachmentBucket } from "@/features/inquiries/schemas";
import { knowledgeFilesBucket } from "@/features/knowledge/schemas";
import { resolveSafeContentType } from "@/lib/files";
import {
  sanitizeWorkspaceLogoFileName,
  workspaceLogoBucket,
  workspaceLogoExtensionToMimeType,
} from "@/features/settings/utils";
import { db } from "@/lib/db/client";
import {
  activityLogs,
  inquiries,
  inquiryAttachments,
  knowledgeFiles,
  workspaceInquiryForms,
  workspaces,
} from "@/lib/db/schema";
import { appendRandomSlugSuffix } from "@/lib/slugs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type UpdateWorkspaceGeneralSettingsInput = {
  workspaceId: string;
  actorUserId: string;
  values: WorkspaceGeneralSettingsInput;
};

type UpdateWorkspaceQuoteSettingsInput = {
  workspaceId: string;
  actorUserId: string;
  values: WorkspaceQuoteSettingsInput;
};

type DeleteWorkspaceInput = {
  workspaceId: string;
  actorUserId: string;
  values: WorkspaceDeleteInput;
};

type UpdateWorkspaceInquiryPageInput = {
  workspaceId: string;
  actorUserId: string;
  values: WorkspaceInquiryPageSettingsInput;
};

type UpdateWorkspaceInquiryFormInput = {
  workspaceId: string;
  actorUserId: string;
  values: WorkspaceInquiryFormSettingsInput;
};

type ApplyWorkspaceInquiryFormPresetInput = {
  workspaceId: string;
  actorUserId: string;
  values: WorkspaceInquiryFormPresetInput;
};

type CreateWorkspaceInquiryFormInput = {
  workspaceId: string;
  actorUserId: string;
  values: WorkspaceInquiryFormCreateInput;
};

type TargetWorkspaceInquiryFormInput = {
  workspaceId: string;
  actorUserId: string;
  targetFormId: string;
};

type UpdateWorkspaceSettingsResult =
  | { ok: true; previousSlug: string; nextSlug: string }
  | { ok: false; reason: "not-found" | "slug-taken" };

type DeleteWorkspaceResult =
  | { ok: true; workspaceSlug: string }
  | { ok: false; reason: "not-found" | "confirmation-mismatch" };

type UpdateWorkspaceInquiryFormSettingsResult =
  | {
      ok: true;
      previousSlug: string;
      nextSlug: string;
      previousFormSlug: string;
      nextFormSlug: string;
    }
  | { ok: false; reason: "not-found" | "slug-taken" };

type WorkspaceInquiryFormMutationResult =
  | { ok: true; workspaceSlug: string; formSlug: string }
  | {
      ok: false;
      reason:
        | "not-found"
        | "invalid-target"
        | "last-active"
        | "has-inquiries";
    };

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function chunkPaths(paths: string[], size = 100) {
  const chunks: string[][] = [];

  for (let index = 0; index < paths.length; index += size) {
    chunks.push(paths.slice(index, index + size));
  }

  return chunks;
}

async function removeStoragePaths(
  bucket: string,
  paths: Array<string | null | undefined>,
) {
  const sanitizedPaths = paths.filter((path): path is string => Boolean(path));

  if (!sanitizedPaths.length) {
    return;
  }

  const storageClient = createSupabaseAdminClient();

  for (const chunk of chunkPaths(sanitizedPaths)) {
    const { error } = await storageClient.storage.from(bucket).remove(chunk);

    if (error) {
      console.error(`Failed to remove storage objects from ${bucket}.`, error);
    }
  }
}

async function getAvailableWorkspaceInquiryFormSlug({
  workspaceId,
  baseSlug,
  excludeFormId,
}: {
  workspaceId: string;
  baseSlug: string;
  excludeFormId?: string;
}) {
  const normalizedBaseSlug = normalizeInquiryFormSlug(baseSlug);
  let candidate = normalizedBaseSlug;

  while (true) {
    const conditions = [
      eq(workspaceInquiryForms.workspaceId, workspaceId),
      eq(workspaceInquiryForms.slug, candidate),
    ];

    if (excludeFormId) {
      conditions.push(ne(workspaceInquiryForms.id, excludeFormId));
    }

    const [existingForm] = await db
      .select({ id: workspaceInquiryForms.id })
      .from(workspaceInquiryForms)
      .where(and(...conditions))
      .limit(1);

    if (!existingForm) {
      return candidate;
    }

    candidate = appendRandomSlugSuffix(normalizedBaseSlug, {
      fallback: "inquiry",
    });
  }
}

function createDuplicateInquiryFormName(name: string) {
  const nextName = `${name} copy`.trim();

  return nextName.slice(0, 80).trim() || name;
}

function createInquiryFormSeedValues({
  businessType,
  name,
  workspaceName,
  workspaceShortDescription,
}: {
  businessType: WorkspaceBusinessType;
  name: string;
  workspaceName: string;
  workspaceShortDescription?: string | null;
}) {
  const inquiryFormConfig = createInquiryFormConfigDefaults({
    businessType,
  });
  const inquiryPageConfig = createInquiryPageConfigDefaults({
    workspaceName,
    workspaceShortDescription,
    businessType,
  });

  return {
    name,
    businessType,
    publicInquiryEnabled: true,
    inquiryFormConfig,
    inquiryPageConfig: {
      ...inquiryPageConfig,
      formTitle: name,
    },
  };
}

export async function updateWorkspaceSettings({
  workspaceId,
  actorUserId,
  values,
}: UpdateWorkspaceGeneralSettingsInput): Promise<UpdateWorkspaceSettingsResult> {
  const [currentWorkspace] = await db
    .select({
      id: workspaces.id,
      slug: workspaces.slug,
      logoStoragePath: workspaces.logoStoragePath,
      logoContentType: workspaces.logoContentType,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!currentWorkspace) {
    return {
      ok: false,
      reason: "not-found",
    };
  }

  const [conflictingWorkspace] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(and(eq(workspaces.slug, values.slug), ne(workspaces.id, workspaceId)))
    .limit(1);

  if (conflictingWorkspace) {
    return {
      ok: false,
      reason: "slug-taken",
    };
  }

  const now = new Date();
  const logoFile = values.logo;
  const storageClient = logoFile ? createSupabaseAdminClient() : null;
  const previousLogoStoragePath = currentWorkspace.logoStoragePath;
  const nextLogoContentType = logoFile
    ? resolveSafeContentType(logoFile, {
        extensionToMimeType: workspaceLogoExtensionToMimeType,
        fallback: "application/octet-stream",
      })
    : null;
  const nextLogoStoragePath =
    logoFile && storageClient
      ? `${workspaceId}/logo/${createId("asset")}-${sanitizeWorkspaceLogoFileName(
          logoFile.name,
        )}`
      : null;

  if (nextLogoStoragePath && storageClient && logoFile) {
    const { error } = await storageClient.storage
      .from(workspaceLogoBucket)
      .upload(nextLogoStoragePath, logoFile, {
        contentType: nextLogoContentType ?? "application/octet-stream",
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload workspace logo: ${error.message}`);
    }
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(workspaces)
        .set({
          name: values.name,
          slug: values.slug,
          shortDescription: values.shortDescription ?? null,
          contactEmail: values.contactEmail ?? null,
          logoStoragePath: values.removeLogo
            ? nextLogoStoragePath
            : nextLogoStoragePath ?? previousLogoStoragePath ?? null,
          logoContentType: values.removeLogo
            ? nextLogoContentType
            : nextLogoContentType ?? currentWorkspace.logoContentType ?? null,
          defaultEmailSignature: values.defaultEmailSignature ?? null,
          aiTonePreference: values.aiTonePreference,
          notifyOnNewInquiry: values.notifyOnNewInquiry,
          updatedAt: now,
        })
        .where(eq(workspaces.id, workspaceId));

      await tx.insert(activityLogs).values({
        id: createId("act"),
        workspaceId,
        actorUserId,
        type: "workspace.settings_updated",
        summary: "Workspace settings updated.",
        metadata: {
          slug: values.slug,
          hasLogo: Boolean(logoFile || previousLogoStoragePath) && !values.removeLogo,
          aiTonePreference: values.aiTonePreference,
          notifyOnNewInquiry: values.notifyOnNewInquiry,
        },
        createdAt: now,
        updatedAt: now,
      });
    });
  } catch (error) {
    if (nextLogoStoragePath && storageClient) {
      const { error: cleanupError } = await storageClient.storage
        .from(workspaceLogoBucket)
        .remove([nextLogoStoragePath]);

      if (cleanupError) {
        console.error(
          "Failed to clean up uploaded workspace logo after a database error.",
          cleanupError,
        );
      }
    }

    throw error;
  }

  const shouldRemovePreviousLogo =
    previousLogoStoragePath &&
    ((Boolean(nextLogoStoragePath) && nextLogoStoragePath !== previousLogoStoragePath) ||
      (values.removeLogo && !nextLogoStoragePath));

  if (shouldRemovePreviousLogo) {
    const storageClient = createSupabaseAdminClient();
    const { error } = await storageClient.storage
      .from(workspaceLogoBucket)
      .remove([previousLogoStoragePath]);

    if (error) {
      console.error("Failed to clean up the previous workspace logo.", error);
    }
  }

  return {
    ok: true,
    previousSlug: currentWorkspace.slug,
    nextSlug: values.slug,
  };
}

export async function updateWorkspaceQuoteSettings({
  workspaceId,
  actorUserId,
  values,
}: UpdateWorkspaceQuoteSettingsInput): Promise<UpdateWorkspaceSettingsResult> {
  const [workspace] = await db
    .select({
      id: workspaces.id,
      slug: workspaces.slug,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    return {
      ok: false,
      reason: "not-found",
    };
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(workspaces)
      .set({
        defaultQuoteNotes: values.defaultQuoteNotes ?? null,
        defaultQuoteValidityDays: values.defaultQuoteValidityDays,
        notifyOnQuoteSent: values.notifyOnQuoteSent,
        defaultCurrency: values.defaultCurrency,
        updatedAt: now,
      })
      .where(eq(workspaces.id, workspaceId));

    await tx.insert(activityLogs).values({
      id: createId("act"),
      workspaceId,
      actorUserId,
      type: "workspace.quote_settings_updated",
      summary: "Quote settings updated.",
      metadata: {
        defaultCurrency: values.defaultCurrency,
        defaultQuoteValidityDays: values.defaultQuoteValidityDays,
        hasDefaultQuoteNotes: Boolean(values.defaultQuoteNotes?.trim()),
        notifyOnQuoteSent: values.notifyOnQuoteSent,
      },
      createdAt: now,
      updatedAt: now,
    });
  });

  return {
    ok: true,
    previousSlug: workspace.slug,
    nextSlug: workspace.slug,
  };
}

export async function deleteWorkspace({
  workspaceId,
  actorUserId,
  values,
}: DeleteWorkspaceInput): Promise<DeleteWorkspaceResult> {
  void actorUserId;

  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      logoStoragePath: workspaces.logoStoragePath,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    return {
      ok: false,
      reason: "not-found",
    };
  }

  if (values.confirmation !== workspace.name) {
    return {
      ok: false,
      reason: "confirmation-mismatch",
    };
  }

  const [knowledgeFileRows, inquiryAttachmentRows] = await Promise.all([
    db
      .select({
        storagePath: knowledgeFiles.storagePath,
      })
      .from(knowledgeFiles)
      .where(eq(knowledgeFiles.workspaceId, workspaceId)),
    db
      .select({
        storagePath: inquiryAttachments.storagePath,
      })
      .from(inquiryAttachments)
      .where(eq(inquiryAttachments.workspaceId, workspaceId)),
  ]);

  await db.delete(workspaces).where(eq(workspaces.id, workspaceId));

  await Promise.all([
    removeStoragePaths(workspaceLogoBucket, [workspace.logoStoragePath]),
    removeStoragePaths(
      knowledgeFilesBucket,
      knowledgeFileRows.map((row) => row.storagePath),
    ),
    removeStoragePaths(
      publicInquiryAttachmentBucket,
      inquiryAttachmentRows.map((row) => row.storagePath),
    ),
  ]);

  return {
    ok: true,
    workspaceSlug: workspace.slug,
  };
}

export async function updateWorkspaceInquiryPageSettings({
  workspaceId,
  actorUserId,
  values,
}: UpdateWorkspaceInquiryPageInput): Promise<UpdateWorkspaceSettingsResult> {
  const [currentWorkspace, currentForm] = await Promise.all([
    db
      .select({
        id: workspaces.id,
        slug: workspaces.slug,
      })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1),
    db
      .select({
        id: workspaceInquiryForms.id,
        slug: workspaceInquiryForms.slug,
      })
      .from(workspaceInquiryForms)
      .where(
        and(
          eq(workspaceInquiryForms.workspaceId, workspaceId),
          eq(workspaceInquiryForms.id, values.formId),
          isNull(workspaceInquiryForms.archivedAt),
        ),
      )
      .limit(1),
  ]);

  const workspace = currentWorkspace[0];
  const form = currentForm[0];

  if (!workspace || !form) {
    return {
      ok: false,
      reason: "not-found",
    };
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(workspaceInquiryForms)
      .set({
        publicInquiryEnabled: values.publicInquiryEnabled,
        inquiryPageConfig: {
          template: values.template,
          eyebrow: values.eyebrow,
          headline: values.headline,
          description: values.description,
          brandTagline: values.brandTagline,
          formTitle: values.formTitle,
          formDescription: values.formDescription,
          cards: values.cards,
        },
        updatedAt: now,
      })
      .where(
        and(
          eq(workspaceInquiryForms.workspaceId, workspaceId),
          eq(workspaceInquiryForms.id, values.formId),
        ),
      );

    await tx.insert(activityLogs).values({
      id: createId("act"),
      workspaceId,
      actorUserId,
      type: "workspace.inquiry_form_page_updated",
      summary: `Inquiry page updated for ${form.slug}.`,
      metadata: {
        inquiryFormId: values.formId,
        inquiryFormSlug: form.slug,
        publicInquiryEnabled: values.publicInquiryEnabled,
        template: values.template,
        cardCount: values.cards.length,
      },
      createdAt: now,
      updatedAt: now,
    });
  });

  return {
    ok: true,
    previousSlug: workspace.slug,
    nextSlug: workspace.slug,
  };
}

export async function updateWorkspaceInquiryFormSettings({
  workspaceId,
  actorUserId,
  values,
}: UpdateWorkspaceInquiryFormInput): Promise<UpdateWorkspaceInquiryFormSettingsResult> {
  const [currentWorkspace, currentForm] = await Promise.all([
    db
      .select({
        id: workspaces.id,
        slug: workspaces.slug,
      })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1),
    db
      .select({
        id: workspaceInquiryForms.id,
        slug: workspaceInquiryForms.slug,
      })
      .from(workspaceInquiryForms)
      .where(
        and(
          eq(workspaceInquiryForms.workspaceId, workspaceId),
          eq(workspaceInquiryForms.id, values.formId),
          isNull(workspaceInquiryForms.archivedAt),
        ),
      )
      .limit(1),
  ]);

  const workspace = currentWorkspace[0];
  const form = currentForm[0];

  if (!workspace || !form) {
    return {
      ok: false,
      reason: "not-found",
    };
  }

  if (values.slug !== form.slug) {
    const [conflictingForm] = await db
      .select({ id: workspaceInquiryForms.id })
      .from(workspaceInquiryForms)
      .where(
        and(
          eq(workspaceInquiryForms.workspaceId, workspaceId),
          eq(workspaceInquiryForms.slug, values.slug),
          ne(workspaceInquiryForms.id, values.formId),
        ),
      )
      .limit(1);

    if (conflictingForm) {
      return {
        ok: false,
        reason: "slug-taken",
      };
    }
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(workspaceInquiryForms)
      .set({
        name: values.name,
        slug: values.slug,
        businessType: values.businessType,
        inquiryFormConfig: {
          ...values.inquiryFormConfig,
          businessType: values.businessType,
        },
        updatedAt: now,
      })
      .where(
        and(
          eq(workspaceInquiryForms.workspaceId, workspaceId),
          eq(workspaceInquiryForms.id, values.formId),
        ),
      );

    await tx.insert(activityLogs).values({
      id: createId("act"),
      workspaceId,
      actorUserId,
      type: "workspace.inquiry_form_updated",
      summary: `Inquiry form updated for ${form.slug}.`,
      metadata: {
        inquiryFormId: values.formId,
        inquiryFormSlug: values.slug,
        previousInquiryFormSlug: form.slug,
        businessType: values.businessType,
        projectFieldCount: values.inquiryFormConfig.projectFields.length,
      },
      createdAt: now,
      updatedAt: now,
    });
  });

  return {
    ok: true,
    previousSlug: workspace.slug,
    nextSlug: workspace.slug,
    previousFormSlug: form.slug,
    nextFormSlug: values.slug,
  };
}

export async function applyWorkspaceInquiryFormPreset({
  workspaceId,
  actorUserId,
  values,
}: ApplyWorkspaceInquiryFormPresetInput): Promise<UpdateWorkspaceSettingsResult> {
  const [currentWorkspace, currentForm] = await Promise.all([
    db
      .select({
        id: workspaces.id,
        slug: workspaces.slug,
        name: workspaces.name,
        shortDescription: workspaces.shortDescription,
        inquiryHeadline: workspaces.inquiryHeadline,
      })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1),
    db
      .select({
        id: workspaceInquiryForms.id,
        slug: workspaceInquiryForms.slug,
        name: workspaceInquiryForms.name,
        publicInquiryEnabled: workspaceInquiryForms.publicInquiryEnabled,
      })
      .from(workspaceInquiryForms)
      .where(
        and(
          eq(workspaceInquiryForms.workspaceId, workspaceId),
          eq(workspaceInquiryForms.id, values.formId),
          isNull(workspaceInquiryForms.archivedAt),
        ),
      )
      .limit(1),
  ]);

  const workspace = currentWorkspace[0];
  const form = currentForm[0];

  if (!workspace || !form) {
    return {
      ok: false,
      reason: "not-found",
    };
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(workspaceInquiryForms)
      .set({
        businessType: values.businessType,
        inquiryFormConfig: createInquiryFormConfigDefaults({
          businessType: values.businessType,
        }),
        inquiryPageConfig: {
          ...createInquiryPageConfigDefaults({
            workspaceName: workspace.name,
            workspaceShortDescription: workspace.shortDescription,
            legacyInquiryHeadline: workspace.inquiryHeadline,
            businessType: values.businessType,
          }),
          formTitle: form.name,
        },
        publicInquiryEnabled: form.publicInquiryEnabled,
        updatedAt: now,
      })
      .where(
        and(
          eq(workspaceInquiryForms.workspaceId, workspaceId),
          eq(workspaceInquiryForms.id, values.formId),
        ),
      );

    await tx.insert(activityLogs).values({
      id: createId("act"),
      workspaceId,
      actorUserId,
      type: "workspace.inquiry_form_preset_applied",
      summary: `Inquiry preset applied to ${form.slug}.`,
      metadata: {
        inquiryFormId: values.formId,
        inquiryFormSlug: form.slug,
        businessType: values.businessType,
      },
      createdAt: now,
      updatedAt: now,
    });
  });

  return {
    ok: true,
    previousSlug: workspace.slug,
    nextSlug: workspace.slug,
  };
}

export async function createWorkspaceInquiryForm({
  workspaceId,
  actorUserId,
  values,
}: CreateWorkspaceInquiryFormInput): Promise<WorkspaceInquiryFormMutationResult> {
  const [workspace] = await db
    .select({
      id: workspaces.id,
      slug: workspaces.slug,
      name: workspaces.name,
      shortDescription: workspaces.shortDescription,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    return {
      ok: false,
      reason: "not-found",
    };
  }

  const now = new Date();
  const formId = createId("ifm");
  const formSeed = createInquiryFormSeedValues({
    businessType: values.businessType,
    name: values.name,
    workspaceName: workspace.name,
    workspaceShortDescription: workspace.shortDescription,
  });
  const formSlug = await getAvailableWorkspaceInquiryFormSlug({
    workspaceId,
    baseSlug: values.name,
  });

  await db.transaction(async (tx) => {
    await tx.insert(workspaceInquiryForms).values({
      id: formId,
      workspaceId,
      name: formSeed.name,
      slug: formSlug,
      businessType: formSeed.businessType,
      isDefault: false,
      publicInquiryEnabled: formSeed.publicInquiryEnabled,
      inquiryFormConfig: formSeed.inquiryFormConfig,
      inquiryPageConfig: formSeed.inquiryPageConfig,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(activityLogs).values({
      id: createId("act"),
      workspaceId,
      actorUserId,
      type: "workspace.inquiry_form_created",
      summary: `Inquiry form created: ${formSeed.name}.`,
      metadata: {
        inquiryFormId: formId,
        inquiryFormSlug: formSlug,
        businessType: formSeed.businessType,
      },
      createdAt: now,
      updatedAt: now,
    });
  });

  return {
    ok: true,
    workspaceSlug: workspace.slug,
    formSlug,
  };
}

export async function duplicateWorkspaceInquiryForm({
  workspaceId,
  actorUserId,
  targetFormId,
}: TargetWorkspaceInquiryFormInput): Promise<WorkspaceInquiryFormMutationResult> {
  const [workspaceRows, sourceFormRows] = await Promise.all([
    db
      .select({
        id: workspaces.id,
        slug: workspaces.slug,
      })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1),
    db
      .select({
        id: workspaceInquiryForms.id,
        name: workspaceInquiryForms.name,
        businessType: workspaceInquiryForms.businessType,
        publicInquiryEnabled: workspaceInquiryForms.publicInquiryEnabled,
        inquiryFormConfig: workspaceInquiryForms.inquiryFormConfig,
        inquiryPageConfig: workspaceInquiryForms.inquiryPageConfig,
      })
      .from(workspaceInquiryForms)
      .where(
        and(
          eq(workspaceInquiryForms.workspaceId, workspaceId),
          eq(workspaceInquiryForms.id, targetFormId),
          isNull(workspaceInquiryForms.archivedAt),
        ),
      )
      .limit(1),
  ]);

  const workspace = workspaceRows[0];
  const sourceForm = sourceFormRows[0];

  if (!workspace || !sourceForm) {
    return {
      ok: false,
      reason: "not-found",
    };
  }

  const now = new Date();
  const nextName = createDuplicateInquiryFormName(sourceForm.name);
  const formId = createId("ifm");
  const formSlug = await getAvailableWorkspaceInquiryFormSlug({
    workspaceId,
    baseSlug: nextName,
  });

  await db.transaction(async (tx) => {
    await tx.insert(workspaceInquiryForms).values({
      id: formId,
      workspaceId,
      name: nextName,
      slug: formSlug,
      businessType: sourceForm.businessType,
      isDefault: false,
      publicInquiryEnabled: sourceForm.publicInquiryEnabled,
      inquiryFormConfig: sourceForm.inquiryFormConfig,
      inquiryPageConfig: {
        ...sourceForm.inquiryPageConfig,
        formTitle: nextName,
      },
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(activityLogs).values({
      id: createId("act"),
      workspaceId,
      actorUserId,
      type: "workspace.inquiry_form_duplicated",
      summary: `Inquiry form duplicated: ${nextName}.`,
      metadata: {
        inquiryFormId: formId,
        inquiryFormSlug: formSlug,
        sourceInquiryFormId: targetFormId,
      },
      createdAt: now,
      updatedAt: now,
    });
  });

  return {
    ok: true,
    workspaceSlug: workspace.slug,
    formSlug,
  };
}

export async function setDefaultWorkspaceInquiryForm({
  workspaceId,
  actorUserId,
  targetFormId,
}: TargetWorkspaceInquiryFormInput): Promise<WorkspaceInquiryFormMutationResult> {
  const [workspaceRows, targetFormRows] = await Promise.all([
    db
      .select({
        id: workspaces.id,
        slug: workspaces.slug,
      })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1),
    db
      .select({
        id: workspaceInquiryForms.id,
        slug: workspaceInquiryForms.slug,
      })
      .from(workspaceInquiryForms)
      .where(
        and(
          eq(workspaceInquiryForms.workspaceId, workspaceId),
          eq(workspaceInquiryForms.id, targetFormId),
          isNull(workspaceInquiryForms.archivedAt),
        ),
      )
      .limit(1),
  ]);

  const workspace = workspaceRows[0];
  const targetForm = targetFormRows[0];

  if (!workspace || !targetForm) {
    return {
      ok: false,
      reason: "not-found",
    };
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(workspaceInquiryForms)
      .set({
        isDefault: false,
        updatedAt: now,
      })
      .where(eq(workspaceInquiryForms.workspaceId, workspaceId));

    await tx
      .update(workspaceInquiryForms)
      .set({
        isDefault: true,
        updatedAt: now,
      })
      .where(
        and(
          eq(workspaceInquiryForms.workspaceId, workspaceId),
          eq(workspaceInquiryForms.id, targetFormId),
        ),
      );

    await tx.insert(activityLogs).values({
      id: createId("act"),
      workspaceId,
      actorUserId,
      type: "workspace.inquiry_form_default_changed",
      summary: `Default inquiry form set to ${targetForm.slug}.`,
      metadata: {
        inquiryFormId: targetFormId,
        inquiryFormSlug: targetForm.slug,
      },
      createdAt: now,
      updatedAt: now,
    });
  });

  return {
    ok: true,
    workspaceSlug: workspace.slug,
    formSlug: targetForm.slug,
  };
}

export async function archiveWorkspaceInquiryForm({
  workspaceId,
  actorUserId,
  targetFormId,
}: TargetWorkspaceInquiryFormInput): Promise<WorkspaceInquiryFormMutationResult> {
  const [workspaceRows, targetFormRows, activeForms] = await Promise.all([
    db
      .select({
        id: workspaces.id,
        slug: workspaces.slug,
      })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1),
    db
      .select({
        id: workspaceInquiryForms.id,
        slug: workspaceInquiryForms.slug,
        isDefault: workspaceInquiryForms.isDefault,
      })
      .from(workspaceInquiryForms)
      .where(
        and(
          eq(workspaceInquiryForms.workspaceId, workspaceId),
          eq(workspaceInquiryForms.id, targetFormId),
          isNull(workspaceInquiryForms.archivedAt),
        ),
      )
      .limit(1),
    db
      .select({
        id: workspaceInquiryForms.id,
      })
      .from(workspaceInquiryForms)
      .where(
        and(
          eq(workspaceInquiryForms.workspaceId, workspaceId),
          isNull(workspaceInquiryForms.archivedAt),
        ),
      ),
  ]);

  const workspace = workspaceRows[0];
  const targetForm = targetFormRows[0];

  if (!workspace || !targetForm) {
    return {
      ok: false,
      reason: "not-found",
    };
  }

  if (targetForm.isDefault) {
    return {
      ok: false,
      reason: "invalid-target",
    };
  }

  if (activeForms.length <= 1) {
    return {
      ok: false,
      reason: "last-active",
    };
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(workspaceInquiryForms)
      .set({
        archivedAt: now,
        isDefault: false,
        updatedAt: now,
      })
      .where(
        and(
          eq(workspaceInquiryForms.workspaceId, workspaceId),
          eq(workspaceInquiryForms.id, targetFormId),
        ),
      );

    await tx.insert(activityLogs).values({
      id: createId("act"),
      workspaceId,
      actorUserId,
      type: "workspace.inquiry_form_archived",
      summary: `Inquiry form archived: ${targetForm.slug}.`,
      metadata: {
        inquiryFormId: targetFormId,
        inquiryFormSlug: targetForm.slug,
      },
      createdAt: now,
      updatedAt: now,
    });
  });

  return {
    ok: true,
    workspaceSlug: workspace.slug,
    formSlug: targetForm.slug,
  };
}

export async function deleteWorkspaceInquiryForm({
  workspaceId,
  actorUserId,
  targetFormId,
}: TargetWorkspaceInquiryFormInput): Promise<WorkspaceInquiryFormMutationResult> {
  const [workspaceRows, targetFormRows, activeForms, linkedInquiries] = await Promise.all([
    db
      .select({
        id: workspaces.id,
        slug: workspaces.slug,
      })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1),
    db
      .select({
        id: workspaceInquiryForms.id,
        slug: workspaceInquiryForms.slug,
        isDefault: workspaceInquiryForms.isDefault,
      })
      .from(workspaceInquiryForms)
      .where(
        and(
          eq(workspaceInquiryForms.workspaceId, workspaceId),
          eq(workspaceInquiryForms.id, targetFormId),
          isNull(workspaceInquiryForms.archivedAt),
        ),
      )
      .limit(1),
    db
      .select({
        id: workspaceInquiryForms.id,
      })
      .from(workspaceInquiryForms)
      .where(
        and(
          eq(workspaceInquiryForms.workspaceId, workspaceId),
          isNull(workspaceInquiryForms.archivedAt),
        ),
      ),
    db
      .select({
        id: inquiries.id,
      })
      .from(inquiries)
      .where(eq(inquiries.workspaceInquiryFormId, targetFormId))
      .limit(1),
  ]);

  const workspace = workspaceRows[0];
  const targetForm = targetFormRows[0];

  if (!workspace || !targetForm) {
    return {
      ok: false,
      reason: "not-found",
    };
  }

  if (targetForm.isDefault) {
    return {
      ok: false,
      reason: "invalid-target",
    };
  }

  if (activeForms.length <= 1) {
    return {
      ok: false,
      reason: "last-active",
    };
  }

  if (linkedInquiries.length) {
    return {
      ok: false,
      reason: "has-inquiries",
    };
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .delete(workspaceInquiryForms)
      .where(
        and(
          eq(workspaceInquiryForms.workspaceId, workspaceId),
          eq(workspaceInquiryForms.id, targetFormId),
        ),
      );

    await tx.insert(activityLogs).values({
      id: createId("act"),
      workspaceId,
      actorUserId,
      type: "workspace.inquiry_form_deleted",
      summary: `Inquiry form deleted: ${targetForm.slug}.`,
      metadata: {
        inquiryFormId: targetFormId,
        inquiryFormSlug: targetForm.slug,
      },
      createdAt: now,
      updatedAt: now,
    });
  });

  return {
    ok: true,
    workspaceSlug: workspace.slug,
    formSlug: targetForm.slug,
  };
}
