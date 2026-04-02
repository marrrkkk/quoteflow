import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { user, workspaceMembers, workspaces } from "@/lib/db/schema";
import type { PublicInquiryWorkspace } from "@/features/inquiries/types";

export async function getPublicInquiryWorkspaceBySlug(
  slug: string,
): Promise<PublicInquiryWorkspace | null> {
  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      inquiryHeadline: workspaces.inquiryHeadline,
      publicInquiryEnabled: workspaces.publicInquiryEnabled,
    })
    .from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);

  if (!workspace || !workspace.publicInquiryEnabled) {
    return null;
  }

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    inquiryHeadline: workspace.inquiryHeadline,
  };
}

export async function getWorkspaceOwnerNotificationEmails(workspaceId: string) {
  const rows = await db
    .select({
      email: user.email,
    })
    .from(workspaceMembers)
    .innerJoin(user, eq(workspaceMembers.userId, user.id))
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.role, "owner"),
      ),
    )
    .orderBy(asc(user.email));

  const dedupedEmails = new Map<string, string>();

  for (const row of rows) {
    const email = row.email.trim();

    if (!email) {
      continue;
    }

    const key = email.toLowerCase();

    if (!dedupedEmails.has(key)) {
      dedupedEmails.set(key, email);
    }
  }

  return Array.from(dedupedEmails.values());
}
