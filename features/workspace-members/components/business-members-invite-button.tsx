"use client";

import { InviteMemberDialog } from "@/features/workspace-members/components/invite-member-dialog";
import type { WorkspaceMemberInviteActionState } from "@/features/workspace-members/types";
import type { WorkspaceMemberAssignableRole } from "@/features/workspace-members/types";

type BusinessMembersInviteButtonProps = {
  workspaceId: string;
  businessId: string;
  businessName: string;
  createInviteAction: (
    state: WorkspaceMemberInviteActionState,
    formData: FormData,
  ) => Promise<WorkspaceMemberInviteActionState>;
  /** Highest workspace role this inviter can assign. Defaults to "admin". */
  maxWorkspaceRole?: WorkspaceMemberAssignableRole;
};

export function BusinessMembersInviteButton({
  workspaceId,
  businessId,
  businessName,
  createInviteAction,
  maxWorkspaceRole,
}: BusinessMembersInviteButtonProps) {
  return (
    <InviteMemberDialog
      workspaceId={workspaceId}
      action={createInviteAction}
      fixedBusinessId={businessId}
      fixedBusinessName={businessName}
      maxWorkspaceRole={maxWorkspaceRole}
    />
  );
}
