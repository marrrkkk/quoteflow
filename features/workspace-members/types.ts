import type { BusinessMemberAssignableRole } from "@/lib/business-members";
import type { WorkspaceMemberRole } from "@/lib/db/schema/workspaces";

/* ─── Assignable roles (owner is never assignable via invite) ─── */

export const workspaceMemberAssignableRoles = ["admin", "member"] as const;
export type WorkspaceMemberAssignableRole =
  (typeof workspaceMemberAssignableRoles)[number];

export const workspaceMemberRoleMeta: Record<
  WorkspaceMemberRole,
  { label: string; description: string }
> = {
  owner: {
    label: "Owner",
    description: "Full control over the workspace, billing, and all businesses.",
  },
  admin: {
    label: "Admin",
    description:
      "Can manage workspace members, businesses, and operational settings.",
  },
  member: {
    label: "Member",
    description:
      "Can access assigned businesses and work on inquiries and quotes.",
  },
};

/* ─── Business assignment ─── */

export type BusinessAssignment = {
  businessId: string;
  role: BusinessMemberAssignableRole;
};

/* ─── Views ─── */

export type WorkspaceMemberView = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: WorkspaceMemberRole;
  joinedAt: Date;
  isCurrentUser: boolean;
};

export type WorkspaceMemberInviteView = {
  inviteId: string;
  email: string;
  workspaceRole: WorkspaceMemberAssignableRole;
  businessAssignments: BusinessAssignment[];
  inviterName: string;
  createdAt: Date;
  expiresAt: Date;
};

export type WorkspaceMembersSettingsView = {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  currentUserId: string;
  members: WorkspaceMemberView[];
  invites: WorkspaceMemberInviteView[];
  /** All businesses in the workspace (for owner/admin scope). */
  businesses: { id: string; name: string; slug: string }[];
  /** Invite permission for the current user. */
  invitePermission: {
    canInvite: boolean;
    /** The highest workspace role the inviter can assign. */
    maxAssignableWorkspaceRole: WorkspaceMemberAssignableRole;
    /** Business IDs the inviter can assign (null = all). */
    allowedBusinessIds: string[] | null;
  };
};

export type WorkspaceMemberInviteAcceptanceView = {
  inviteId: string;
  token: string;
  email: string;
  workspaceRole: WorkspaceMemberAssignableRole;
  businessAssignments: BusinessAssignment[];
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  inviter: {
    name: string;
    email: string;
  };
  expiresAt: Date;
  currentWorkspaceMembershipRole: WorkspaceMemberRole | null;
};

/* ─── Action states ─── */

export type WorkspaceMemberInviteFieldErrors = Partial<
  Record<"email" | "workspaceRole", string[] | undefined>
>;

export type WorkspaceMemberInviteActionState = {
  error?: string;
  success?: string;
  fieldErrors?: WorkspaceMemberInviteFieldErrors;
};

export type WorkspaceMemberRoleFieldErrors = Partial<
  Record<"role", string[] | undefined>
>;

export type WorkspaceMemberRoleActionState = {
  error?: string;
  success?: string;
  fieldErrors?: WorkspaceMemberRoleFieldErrors;
};

export type WorkspaceMemberRemoveActionState = {
  error?: string;
  success?: string;
};

export type WorkspaceMemberInviteAcceptActionState = {
  error?: string;
  success?: string;
};
