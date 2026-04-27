import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import type { WorkspaceMemberRole } from "@/lib/db/schema/workspaces";
import type { BusinessMemberRole } from "@/lib/business-members";
import type { WorkspaceMemberAssignableRole } from "@/features/workspace-members/types";
import { db } from "@/lib/db/client";
import { businessMembers, businesses } from "@/lib/db/schema";

/* ─── Pure permission helpers ─── */

export type InviteScope = "all" | "managed" | "none";

export type InvitePermission = {
  canInvite: boolean;
  scope: InviteScope;
  /** The highest workspace role the inviter is allowed to assign. */
  maxAssignableWorkspaceRole: WorkspaceMemberAssignableRole;
};

/**
 * Determines whether a user can invite workspace members and what
 * business scope they are limited to.
 *
 * - Owner / Admin → can invite, scope: all businesses
 * - Member with business manager/owner role → can invite, scope: managed businesses only
 * - Member without business management → cannot invite
 */
export function getInvitePermission(
  workspaceRole: WorkspaceMemberRole,
  managedBusinessCount: number,
): InvitePermission {
  if (workspaceRole === "owner" || workspaceRole === "admin") {
    return {
      canInvite: true,
      scope: "all",
      maxAssignableWorkspaceRole: "admin",
    };
  }

  if (managedBusinessCount > 0) {
    return {
      canInvite: true,
      scope: "managed",
      maxAssignableWorkspaceRole: "member",
    };
  }

  return {
    canInvite: false,
    scope: "none",
    maxAssignableWorkspaceRole: "member",
  };
}

/* ─── Query helpers ─── */

/**
 * Returns the list of businesses in a workspace where the user
 * has `owner` or `manager` role (i.e. can manage members).
 */
export async function getManagedBusinessesForUser(
  workspaceId: string,
  userId: string,
): Promise<{ id: string; name: string; slug: string }[]> {
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
    })
    .from(businessMembers)
    .innerJoin(businesses, eq(businessMembers.businessId, businesses.id))
    .where(
      and(
        eq(businesses.workspaceId, workspaceId),
        eq(businessMembers.userId, userId),
        inArray(businessMembers.role, ["owner", "manager"] satisfies BusinessMemberRole[]),
      ),
    )
    .orderBy(businesses.name);

  return rows;
}

/**
 * Validates that the requested business assignments are all within
 * the inviter's allowed scope. Returns the filtered list.
 *
 * - If scope is "all", all assignments pass through unchanged.
 * - If scope is "managed", only assignments for managed businesses pass.
 * - If scope is "none", returns empty.
 */
export function filterBusinessAssignmentsToScope<
  T extends { businessId: string },
>(
  assignments: T[],
  scope: InviteScope,
  allowedBusinessIds: Set<string>,
): { valid: T[]; rejected: T[] } {
  if (scope === "none") {
    return { valid: [], rejected: assignments };
  }

  if (scope === "all") {
    return { valid: assignments, rejected: [] };
  }

  const valid: T[] = [];
  const rejected: T[] = [];

  for (const assignment of assignments) {
    if (allowedBusinessIds.has(assignment.businessId)) {
      valid.push(assignment);
    } else {
      rejected.push(assignment);
    }
  }

  return { valid, rejected };
}
