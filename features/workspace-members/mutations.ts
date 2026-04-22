import { and, eq, sql } from "drizzle-orm";

import { writeAuditLog } from "@/features/audit/mutations";
import type { BusinessMemberAssignableRole } from "@/lib/business-members";
import type { WorkspaceMemberRole } from "@/lib/db/schema/workspaces";
import type {
  BusinessAssignment,
  WorkspaceMemberAssignableRole,
} from "@/features/workspace-members/types";
import {
  createWorkspaceMemberInviteToken,
  getWorkspaceMemberInviteLookupCondition,
} from "@/features/workspace-members/invite-tokens";
import { db } from "@/lib/db/client";
import {
  businessMembers,
  businesses,
  user,
  workspaceMemberInvites,
  workspaceMembers,
  workspaces,
} from "@/lib/db/schema";

const INVITE_DURATION_DAYS = 14;

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function normalizeEmailAddress(email: string) {
  return email.trim().toLowerCase();
}

function getInviteExpirationDate() {
  return new Date(Date.now() + INVITE_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

/* ─── Create invite ─── */

export async function createWorkspaceMemberInvite({
  workspaceId,
  actorUserId,
  actorUserName,
  email,
  workspaceRole,
  businessAssignments,
}: {
  workspaceId: string;
  actorUserId: string;
  actorUserName: string;
  email: string;
  workspaceRole: WorkspaceMemberAssignableRole;
  businessAssignments: BusinessAssignment[];
}) {
  const normalizedEmail = normalizeEmailAddress(email);

  return db.transaction(async (tx) => {
    const [workspace] = await tx
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
      })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return { ok: false as const, reason: "workspace-not-found" as const };
    }

    // Check if already a workspace member
    const [existingMember] = await tx
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          sql`lower(${user.email}) = ${normalizedEmail}`,
        ),
      )
      .limit(1);

    if (existingMember) {
      return { ok: false as const, reason: "already-member" as const };
    }

    // Upsert invite
    const [existingInvite] = await tx
      .select({ id: workspaceMemberInvites.id })
      .from(workspaceMemberInvites)
      .where(
        and(
          eq(workspaceMemberInvites.workspaceId, workspaceId),
          eq(workspaceMemberInvites.email, normalizedEmail),
        ),
      )
      .limit(1);

    const inviteId = existingInvite?.id ?? createId("wmi");
    const { rawToken, tokenHash } = createWorkspaceMemberInviteToken();
    const expiresAt = getInviteExpirationDate();
    const now = new Date();
    const assignmentsJson =
      businessAssignments.length > 0 ? businessAssignments : null;

    if (existingInvite) {
      await tx
        .update(workspaceMemberInvites)
        .set({
          inviterUserId: actorUserId,
          workspaceRole,
          businessAssignments: assignmentsJson,
          token: null,
          tokenHash,
          expiresAt,
          updatedAt: now,
        })
        .where(eq(workspaceMemberInvites.id, existingInvite.id));
    } else {
      await tx.insert(workspaceMemberInvites).values({
        id: inviteId,
        workspaceId,
        inviterUserId: actorUserId,
        email: normalizedEmail,
        workspaceRole,
        businessAssignments: assignmentsJson,
        token: null,
        tokenHash,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      });
    }

    await writeAuditLog(tx, {
      workspaceId,
      actorUserId,
      actorName: actorUserName,
      entityType: "member",
      entityId: inviteId,
      action: "member.invited",
      metadata: {
        email: normalizedEmail,
        workspaceRole,
        businessAssignments: assignmentsJson,
      },
      createdAt: now,
    });

    return {
      ok: true as const,
      inviteId,
      token: rawToken,
      workspaceRole,
      email: normalizedEmail,
      expiresAt,
      workspace,
    };
  });
}

/* ─── Regenerate invite link ─── */

export async function regenerateWorkspaceMemberInviteLink({
  workspaceId,
  actorUserId,
  actorUserName,
  inviteId,
}: {
  workspaceId: string;
  actorUserId: string;
  actorUserName: string;
  inviteId: string;
}) {
  const now = new Date();
  const expiresAt = getInviteExpirationDate();
  const { rawToken, tokenHash } = createWorkspaceMemberInviteToken();

  return db.transaction(async (tx) => {
    const [invite] = await tx
      .select({
        id: workspaceMemberInvites.id,
        email: workspaceMemberInvites.email,
        workspaceRole: workspaceMemberInvites.workspaceRole,
      })
      .from(workspaceMemberInvites)
      .where(
        and(
          eq(workspaceMemberInvites.workspaceId, workspaceId),
          eq(workspaceMemberInvites.id, inviteId),
        ),
      )
      .limit(1);

    if (!invite) {
      return { ok: false as const, reason: "not-found" as const };
    }

    await tx
      .update(workspaceMemberInvites)
      .set({
        inviterUserId: actorUserId,
        token: null,
        tokenHash,
        expiresAt,
        updatedAt: now,
      })
      .where(eq(workspaceMemberInvites.id, invite.id));

    await writeAuditLog(tx, {
      workspaceId,
      actorUserId,
      actorName: actorUserName,
      entityType: "member",
      entityId: inviteId,
      action: "member.invite_link_regenerated",
      metadata: {
        email: invite.email,
        workspaceRole: invite.workspaceRole,
      },
      createdAt: now,
    });

    return {
      ok: true as const,
      email: invite.email,
      expiresAt,
      inviteId: invite.id,
      workspaceRole: invite.workspaceRole,
      token: rawToken,
    };
  });
}

/* ─── Cancel invite ─── */

export async function cancelWorkspaceMemberInvite({
  workspaceId,
  actorUserId,
  actorUserName,
  inviteId,
}: {
  workspaceId: string;
  actorUserId: string;
  actorUserName: string;
  inviteId: string;
}) {
  const now = new Date();

  return db.transaction(async (tx) => {
    const [invite] = await tx
      .select({
        id: workspaceMemberInvites.id,
        email: workspaceMemberInvites.email,
        workspaceRole: workspaceMemberInvites.workspaceRole,
      })
      .from(workspaceMemberInvites)
      .where(
        and(
          eq(workspaceMemberInvites.workspaceId, workspaceId),
          eq(workspaceMemberInvites.id, inviteId),
        ),
      )
      .limit(1);

    if (!invite) {
      return { ok: false as const, reason: "not-found" as const };
    }

    await tx
      .delete(workspaceMemberInvites)
      .where(eq(workspaceMemberInvites.id, invite.id));

    await writeAuditLog(tx, {
      workspaceId,
      actorUserId,
      actorName: actorUserName,
      entityType: "member",
      entityId: inviteId,
      action: "member.invite_canceled",
      metadata: {
        email: invite.email,
        workspaceRole: invite.workspaceRole,
      },
      createdAt: now,
    });

    return { ok: true as const };
  });
}

/* ─── Accept invite ─── */

export async function acceptWorkspaceMemberInvite({
  token,
  userId,
  userEmail,
  userName,
}: {
  token: string;
  userId: string;
  userEmail: string;
  userName: string;
}) {
  const normalizedUserEmail = normalizeEmailAddress(userEmail);
  const now = new Date();

  return db.transaction(async (tx) => {
    const [invite] = await tx
      .select({
        inviteId: workspaceMemberInvites.id,
        workspaceId: workspaceMemberInvites.workspaceId,
        email: workspaceMemberInvites.email,
        workspaceRole: workspaceMemberInvites.workspaceRole,
        businessAssignments: workspaceMemberInvites.businessAssignments,
        expiresAt: workspaceMemberInvites.expiresAt,
        workspaceSlug: workspaces.slug,
      })
      .from(workspaceMemberInvites)
      .innerJoin(
        workspaces,
        eq(workspaceMemberInvites.workspaceId, workspaces.id),
      )
      .where(getWorkspaceMemberInviteLookupCondition(token))
      .limit(1);

    if (!invite) {
      return { ok: false as const, reason: "invalid" as const };
    }

    if (invite.expiresAt <= now) {
      await tx
        .delete(workspaceMemberInvites)
        .where(eq(workspaceMemberInvites.id, invite.inviteId));

      return { ok: false as const, reason: "expired" as const };
    }

    if (normalizeEmailAddress(invite.email) !== normalizedUserEmail) {
      return {
        ok: false as const,
        reason: "email-mismatch" as const,
        invitedEmail: invite.email,
      };
    }

    // Create workspace membership if not already a member
    const [existingMembership] = await tx
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, invite.workspaceId),
          eq(workspaceMembers.userId, userId),
        ),
      )
      .limit(1);

    if (!existingMembership) {
      await tx.insert(workspaceMembers).values({
        id: createId("wm"),
        workspaceId: invite.workspaceId,
        userId,
        role: invite.workspaceRole,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Create business memberships from assignments
    const assignments = Array.isArray(invite.businessAssignments)
      ? (invite.businessAssignments as { businessId: string; role: string }[])
      : [];

    for (const assignment of assignments) {
      const [existingBizMembership] = await tx
        .select({ id: businessMembers.id })
        .from(businessMembers)
        .where(
          and(
            eq(businessMembers.businessId, assignment.businessId),
            eq(businessMembers.userId, userId),
          ),
        )
        .limit(1);

      if (!existingBizMembership) {
        // Verify business belongs to workspace
        const [business] = await tx
          .select({ id: businesses.id })
          .from(businesses)
          .where(
            and(
              eq(businesses.id, assignment.businessId),
              eq(businesses.workspaceId, invite.workspaceId),
            ),
          )
          .limit(1);

        if (business) {
          await tx.insert(businessMembers).values({
            id: createId("bm"),
            businessId: assignment.businessId,
            userId,
            role: assignment.role as BusinessMemberAssignableRole,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    // Delete the invite
    await tx
      .delete(workspaceMemberInvites)
      .where(eq(workspaceMemberInvites.id, invite.inviteId));

    await writeAuditLog(tx, {
      workspaceId: invite.workspaceId,
      actorUserId: userId,
      actorName: userName,
      entityType: "member",
      entityId: userId,
      action: "member.joined",
      metadata: {
        inviteId: invite.inviteId,
        workspaceRole: invite.workspaceRole,
        businessAssignmentCount: assignments.length,
      },
      createdAt: now,
    });

    return {
      ok: true as const,
      workspaceSlug: invite.workspaceSlug,
      workspaceId: invite.workspaceId,
      alreadyMember: Boolean(existingMembership),
      role: (existingMembership?.role ??
        invite.workspaceRole) as WorkspaceMemberRole,
    };
  });
}

/* ─── Decline invite ─── */

export async function declineWorkspaceMemberInvite({
  token,
  userEmail,
}: {
  token: string;
  userEmail: string;
}) {
  const normalizedUserEmail = normalizeEmailAddress(userEmail);
  const now = new Date();

  return db.transaction(async (tx) => {
    const [invite] = await tx
      .select({
        inviteId: workspaceMemberInvites.id,
        workspaceId: workspaceMemberInvites.workspaceId,
        email: workspaceMemberInvites.email,
        workspaceRole: workspaceMemberInvites.workspaceRole,
        expiresAt: workspaceMemberInvites.expiresAt,
      })
      .from(workspaceMemberInvites)
      .where(getWorkspaceMemberInviteLookupCondition(token))
      .limit(1);

    if (!invite) {
      return { ok: false as const, reason: "invalid" as const };
    }

    if (invite.expiresAt <= now) {
      await tx
        .delete(workspaceMemberInvites)
        .where(eq(workspaceMemberInvites.id, invite.inviteId));

      return { ok: false as const, reason: "expired" as const };
    }

    if (normalizeEmailAddress(invite.email) !== normalizedUserEmail) {
      return {
        ok: false as const,
        reason: "email-mismatch" as const,
        invitedEmail: invite.email,
      };
    }

    await tx
      .delete(workspaceMemberInvites)
      .where(eq(workspaceMemberInvites.id, invite.inviteId));

    return {
      ok: true as const,
      workspaceId: invite.workspaceId,
    };
  });
}

/* ─── Update workspace member role ─── */

export async function updateWorkspaceMemberRole({
  workspaceId,
  actorUserId,
  actorUserName,
  membershipId,
  role,
}: {
  workspaceId: string;
  actorUserId: string;
  actorUserName: string;
  membershipId: string;
  role: WorkspaceMemberAssignableRole;
}) {
  const now = new Date();

  return db.transaction(async (tx) => {
    const [target] = await tx
      .select({
        membershipId: workspaceMembers.id,
        userId: workspaceMembers.userId,
        role: workspaceMembers.role,
        email: user.email,
      })
      .from(workspaceMembers)
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.id, membershipId),
        ),
      )
      .limit(1);

    if (!target) {
      return { ok: false as const, reason: "not-found" as const };
    }

    if (target.userId === actorUserId) {
      return { ok: false as const, reason: "self-change-blocked" as const };
    }

    if (target.role === "owner") {
      return { ok: false as const, reason: "owner-protected" as const };
    }

    await tx
      .update(workspaceMembers)
      .set({ role, updatedAt: now })
      .where(eq(workspaceMembers.id, membershipId));

    await writeAuditLog(tx, {
      workspaceId,
      actorUserId,
      actorName: actorUserName,
      entityType: "member",
      entityId: membershipId,
      action: "member.role_changed",
      metadata: {
        targetEmail: target.email,
        previousRole: target.role,
        nextRole: role,
      },
      createdAt: now,
    });

    return {
      ok: true as const,
      previousRole: target.role,
      nextRole: role,
    };
  });
}

/* ─── Remove workspace member ─── */

export async function removeWorkspaceMember({
  workspaceId,
  actorUserId,
  actorUserName,
  membershipId,
}: {
  workspaceId: string;
  actorUserId: string;
  actorUserName: string;
  membershipId: string;
}) {
  const now = new Date();

  return db.transaction(async (tx) => {
    const [target] = await tx
      .select({
        membershipId: workspaceMembers.id,
        userId: workspaceMembers.userId,
        role: workspaceMembers.role,
        email: user.email,
      })
      .from(workspaceMembers)
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.id, membershipId),
        ),
      )
      .limit(1);

    if (!target) {
      return { ok: false as const, reason: "not-found" as const };
    }

    if (target.userId === actorUserId) {
      return { ok: false as const, reason: "self-remove-blocked" as const };
    }

    if (target.role === "owner") {
      return { ok: false as const, reason: "owner-protected" as const };
    }

    // Remove workspace membership (cascading via FK removes nothing for business_members,
    // so we explicitly remove business access for this workspace's businesses)
    const workspaceBusinessIds = await tx
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.workspaceId, workspaceId));

    if (workspaceBusinessIds.length > 0) {
      for (const biz of workspaceBusinessIds) {
        await tx
          .delete(businessMembers)
          .where(
            and(
              eq(businessMembers.businessId, biz.id),
              eq(businessMembers.userId, target.userId),
            ),
          );
      }
    }

    await tx
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.id, membershipId));

    await writeAuditLog(tx, {
      workspaceId,
      actorUserId,
      actorName: actorUserName,
      entityType: "member",
      entityId: membershipId,
      action: "member.removed",
      metadata: {
        targetEmail: target.email,
        removedRole: target.role,
      },
      createdAt: now,
    });

    return { ok: true as const };
  });
}
