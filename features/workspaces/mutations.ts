import "server-only";

import { eq } from "drizzle-orm";

import type { WorkspaceBusinessType } from "@/features/inquiries/business-types";
import { createInquiryFormPreset } from "@/features/inquiries/inquiry-forms";
import { createInquiryFormConfigDefaults } from "@/features/inquiries/form-config";
import { createInquiryPageConfigDefaults } from "@/features/inquiries/page-config";
import { ensureProfileForUser } from "@/lib/auth/workspace-bootstrap";
import { db } from "@/lib/db/client";
import {
  activityLogs,
  workspaceInquiryForms,
  workspaceMembers,
  workspaces,
} from "@/lib/db/schema";
import { appendRandomSlugSuffix, slugifyPublicName } from "@/lib/slugs";

type CreateWorkspaceForUserInput = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  name: string;
  businessType: WorkspaceBusinessType;
};

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

async function getAvailableWorkspaceSlug(baseSlug: string) {
  let candidate = baseSlug;

  while (true) {
    const [existingWorkspace] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.slug, candidate))
      .limit(1);

    if (!existingWorkspace) {
      return candidate;
    }

    candidate = appendRandomSlugSuffix(baseSlug, {
      fallback: "workspace",
    });
  }
}

export async function createWorkspaceForUser({
  user,
  name,
  businessType,
}: CreateWorkspaceForUserInput) {
  const trimmedName = name.trim();
  const now = new Date();
  const slug = await getAvailableWorkspaceSlug(
    slugifyPublicName(trimmedName, {
      fallback: "workspace",
    }),
  );
  const workspaceId = createId("ws");
  const defaultInquiryForm = createInquiryFormPreset({
    businessType,
    workspaceName: trimmedName,
  });

  await ensureProfileForUser(user);

  await db.transaction(async (tx) => {
    await tx.insert(workspaces).values({
      id: workspaceId,
      name: trimmedName,
      slug,
      businessType,
      contactEmail: user.email,
      inquiryFormConfig: createInquiryFormConfigDefaults({
        businessType,
      }),
      inquiryPageConfig: createInquiryPageConfigDefaults({
        workspaceName: trimmedName,
        businessType,
      }),
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(workspaceInquiryForms).values({
      id: createId("ifm"),
      workspaceId,
      name: defaultInquiryForm.name,
      slug: defaultInquiryForm.slug,
      businessType: defaultInquiryForm.businessType,
      isDefault: true,
      publicInquiryEnabled: defaultInquiryForm.publicInquiryEnabled,
      inquiryFormConfig: defaultInquiryForm.inquiryFormConfig,
      inquiryPageConfig: defaultInquiryForm.inquiryPageConfig,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(workspaceMembers).values({
      id: createId("wm"),
      workspaceId,
      userId: user.id,
      role: "owner",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(activityLogs).values({
      id: createId("act"),
      workspaceId,
      actorUserId: user.id,
      type: "workspace.created",
      summary: "Workspace created.",
      metadata: {
        source: "workspace-hub",
      },
      createdAt: now,
      updatedAt: now,
    });
  });

  return {
    id: workspaceId,
    slug,
  };
}
