import { eq, sql } from "drizzle-orm";

import { createInquiryFormPreset } from "@/features/inquiries/inquiry-forms";
import { createInquiryFormConfigDefaults } from "@/features/inquiries/form-config";
import { createInquiryPageConfigDefaults } from "@/features/inquiries/page-config";
import { db } from "@/lib/db/client";
import {
  activityLogs,
  profiles,
  workspaceInquiryForms,
  workspaceMembers,
  workspaces,
} from "@/lib/db/schema";
import { appendRandomSlugSuffix, slugifyPublicName } from "@/lib/slugs";

type BootstrapUser = {
  id: string;
  name: string;
  email: string;
};

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

async function getAvailableWorkspaceSlug(baseSlug: string) {
  let candidate = baseSlug;

  while (true) {
    const existing = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.slug, candidate))
      .limit(1);

    if (!existing[0]) {
      return candidate;
    }

    candidate = appendRandomSlugSuffix(baseSlug, {
      fallback: "workspace",
    });
  }
}

export async function ensureProfileForUser(user: BootstrapUser) {
  const now = new Date();

  const [existingProfile] = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);

  if (existingProfile) {
    return;
  }

  await db.insert(profiles).values({
    userId: user.id,
    fullName: user.name,
    createdAt: now,
    updatedAt: now,
  });
}

export async function bootstrapWorkspaceForUser(user: BootstrapUser) {
  const workspaceBaseName =
    user.name.trim() || user.email.split("@")[0] || "Relay";
  const workspaceName = `${workspaceBaseName}'s Workspace`;
  const now = new Date();

  await db.transaction(async (tx) => {
    const [existingProfile] = await tx
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (!existingProfile) {
      await tx.insert(profiles).values({
        userId: user.id,
        fullName: user.name,
        createdAt: now,
        updatedAt: now,
      });
    }

    const [existingMembership] = await tx
      .select({
        membershipId: workspaceMembers.id,
        workspaceId: workspaceMembers.workspaceId,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, user.id))
      .orderBy(
        sql`case when ${workspaceMembers.role} = 'owner' then 0 else 1 end`,
        workspaceMembers.createdAt,
      )
      .limit(1);

    if (!existingMembership) {
      const workspaceSlug = await getAvailableWorkspaceSlug(
        slugifyPublicName(workspaceBaseName, {
          fallback: "workspace",
        }),
      );
      const workspaceId = createId("ws");
      const membershipId = createId("wm");
      const activityId = createId("act");
      const defaultInquiryForm = createInquiryFormPreset({
        businessType: "general_services",
        workspaceName,
      });

      await tx.insert(workspaces).values({
        id: workspaceId,
        name: workspaceName,
        slug: workspaceSlug,
        businessType: "general_services",
        contactEmail: user.email,
        inquiryFormConfig: createInquiryFormConfigDefaults({
          businessType: "general_services",
        }),
        inquiryPageConfig: createInquiryPageConfigDefaults({
          workspaceName,
          businessType: "general_services",
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
        id: membershipId,
        workspaceId,
        userId: user.id,
        role: "owner",
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(activityLogs).values({
        id: activityId,
        workspaceId,
        actorUserId: user.id,
        type: "workspace.created",
        summary: "Workspace created during initial signup bootstrap.",
        metadata: {
          source: "better-auth-signup",
        },
        createdAt: now,
        updatedAt: now,
      });

      return;
    }

    if (existingMembership.role !== "owner") {
      await tx
        .update(workspaceMembers)
        .set({
          role: "owner",
          updatedAt: now,
        })
        .where(eq(workspaceMembers.id, existingMembership.membershipId));
    }
  });
}
