"use client";

import { useState } from "react";
import { MailPlus, MoreHorizontal, Search, Users } from "lucide-react";

import { DashboardEmptyState } from "@/components/shared/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useActionStateWithSonner } from "@/hooks/use-action-state-with-sonner";
import {
  workspaceMemberAssignableRoles,
  workspaceMemberRoleMeta,
  type WorkspaceMemberAssignableRole,
} from "@/features/workspace-members/types";
import { CopyWorkspaceInviteLinkButton } from "@/features/workspace-members/components/copy-workspace-invite-link-button";
import { InviteMemberDialog } from "@/features/workspace-members/components/invite-member-dialog";
import type {
  WorkspaceMemberInviteActionState,
  WorkspaceMemberRemoveActionState,
  WorkspaceMemberRoleActionState,
  WorkspaceMembersSettingsView,
} from "@/features/workspace-members/types";

type WorkspaceMembersManagerProps = {
  workspaceId: string;
  view: WorkspaceMembersSettingsView;
  preselectedBusinessId?: string | null;
  createInviteAction: (
    state: WorkspaceMemberInviteActionState,
    formData: FormData,
  ) => Promise<WorkspaceMemberInviteActionState>;
  copyInviteLinkAction: (
    inviteId: string,
    workspaceId: string,
  ) => Promise<{ error?: string; inviteUrl?: string }>;
  updateRoleAction: (
    membershipId: string,
    state: WorkspaceMemberRoleActionState,
    formData: FormData,
  ) => Promise<WorkspaceMemberRoleActionState>;
  removeMemberAction: (
    membershipId: string,
    state: WorkspaceMemberRemoveActionState,
    formData: FormData,
  ) => Promise<WorkspaceMemberRemoveActionState>;
  cancelInviteAction: (
    inviteId: string,
    state: WorkspaceMemberRemoveActionState,
    formData: FormData,
  ) => Promise<WorkspaceMemberRemoveActionState>;
};

const initialRoleState: WorkspaceMemberRoleActionState = {};
const initialDangerState: WorkspaceMemberRemoveActionState = {};

const workspaceRoleOptions = workspaceMemberAssignableRoles.map((role) => ({
  label: workspaceMemberRoleMeta[role].label,
  searchText: `${workspaceMemberRoleMeta[role].label} ${workspaceMemberRoleMeta[role].description}`,
  value: role,
}));

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function WorkspaceMembersManager({
  workspaceId,
  view,
  preselectedBusinessId,
  createInviteAction,
  copyInviteLinkAction,
  updateRoleAction,
  removeMemberAction,
  cancelInviteAction,
}: WorkspaceMembersManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = view.members.filter((member) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(lowerQuery) ||
      member.email.toLowerCase().includes(lowerQuery)
    );
  });

  const { invitePermission } = view;

  // Scope the business list based on invite permission
  const inviteBusinesses = invitePermission.allowedBusinessIds === null
    ? view.businesses
    : view.businesses.filter((b) =>
        invitePermission.allowedBusinessIds!.includes(b.id),
      );

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageHeader
        title="Members"
        description="Manage who has access to this workspace and their roles."
        actions={
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            {view.invites.length > 0 ? (
              <PendingInvitesDialog
                workspaceId={workspaceId}
                cancelInviteAction={cancelInviteAction}
                copyInviteLinkAction={copyInviteLinkAction}
                invites={view.invites}
              />
            ) : null}
            {invitePermission.canInvite ? (
              <InviteMemberDialog
                action={createInviteAction}
                businesses={inviteBusinesses}
                maxWorkspaceRole={invitePermission.maxAssignableWorkspaceRole}
                preselectedBusinessId={preselectedBusinessId}
                workspaceId={workspaceId}
              />
            ) : null}
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9"
            />
          </div>
        </div>

        {/* Members list */}
        {filteredMembers.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/50 shadow-sm">
            <div className="flex flex-col">
              {filteredMembers.map((member, i) => (
                <div
                  key={member.membershipId}
                  className={cn(
                    i > 0 && "border-t border-border/70",
                  )}
                >
                  <MemberRow
                    workspaceId={workspaceId}
                    member={member}
                    removeAction={removeMemberAction.bind(null, member.membershipId)}
                    updateRoleAction={updateRoleAction.bind(null, member.membershipId)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <DashboardEmptyState
            description={
              searchQuery
                ? "No members match your search."
                : "Invite your first teammate to get started."
            }
            icon={Users}
            title={searchQuery ? "No members found" : "No members yet"}
            variant="section"
          />
        )}
      </div>
    </div>
  );
}



/* ─── Member row ─── */

function MemberRow({
  workspaceId,
  member,
  updateRoleAction,
  removeAction,
}: {
  workspaceId: string;
  member: WorkspaceMembersSettingsView["members"][number];
  updateRoleAction: (
    state: WorkspaceMemberRoleActionState,
    formData: FormData,
  ) => Promise<WorkspaceMemberRoleActionState>;
  removeAction: (
    state: WorkspaceMemberRemoveActionState,
    formData: FormData,
  ) => Promise<WorkspaceMemberRemoveActionState>;
}) {
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const isEditable = member.role !== "owner" && !member.isCurrentUser;

  return (
    <>
      <div className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-muted/30">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar>
            {member.image ? <AvatarImage alt={member.name} src={member.image} /> : null}
            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                {member.name}
              </p>
              <Badge variant={member.role === "owner" ? "secondary" : "outline"}>
                {workspaceMemberRoleMeta[member.role].label}
              </Badge>
              {member.isCurrentUser ? <Badge variant="outline">You</Badge> : null}
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{member.email}</p>
          </div>
        </div>

        {isEditable ? (
          <div className="flex shrink-0 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={() => setShowRoleDialog(true)}>
                  Change role
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setShowRemoveDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  Remove member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>

      {isEditable ? (
        <>
          <ChangeRoleDialog
            workspaceId={workspaceId}
            currentRole={member.role as WorkspaceMemberAssignableRole}
            memberName={member.name}
            updateRoleAction={updateRoleAction}
            open={showRoleDialog}
            onOpenChange={setShowRoleDialog}
          />
          <RemoveMemberDialog
            workspaceId={workspaceId}
            memberName={member.name}
            removeAction={removeAction}
            open={showRemoveDialog}
            onOpenChange={setShowRemoveDialog}
          />
        </>
      ) : null}
    </>
  );
}

/* ─── Change role dialog ─── */

function ChangeRoleDialog({
  workspaceId,
  currentRole,
  updateRoleAction,
  memberName,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  currentRole: WorkspaceMemberAssignableRole;
  updateRoleAction: (
    state: WorkspaceMemberRoleActionState,
    formData: FormData,
  ) => Promise<WorkspaceMemberRoleActionState>;
  memberName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<WorkspaceMemberAssignableRole>(
    currentRole,
  );
  const [roleState, roleFormAction, isRolePending] = useActionStateWithSonner(
    updateRoleAction,
    initialRoleState,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            Update the access level for {memberName}.
          </DialogDescription>
        </DialogHeader>
        <form
          action={(formData) => {
            roleFormAction(formData);
            onOpenChange(false);
          }}
        >
          <input name="workspaceId" type="hidden" value={workspaceId} />
          <input name="role" type="hidden" value={selectedRole} />
          <DialogBody>
            <Field>
              <FieldLabel htmlFor={`member-role-${currentRole}`}>Role</FieldLabel>
              <FieldContent>
                <Combobox
                  disabled={isRolePending}
                  id={`member-role-${currentRole}`}
                  onValueChange={(value) =>
                    setSelectedRole(value as WorkspaceMemberAssignableRole)
                  }
                  options={workspaceRoleOptions}
                  placeholder="Role"
                  renderOption={(option) => (
                    <div className="min-w-0">
                      <p className="truncate font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {workspaceMemberRoleMeta[option.value].description}
                      </p>
                    </div>
                  )}
                  searchPlaceholder="Search role"
                  value={selectedRole}
                />
                <FieldError
                  errors={
                    roleState.fieldErrors?.role?.[0]
                      ? [{ message: roleState.fieldErrors.role[0] }]
                      : undefined
                  }
                />
              </FieldContent>
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button
              disabled={isRolePending}
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button disabled={isRolePending} type="submit">
              {isRolePending ? (
                <>
                  <Spinner aria-hidden="true" data-icon="inline-start" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Remove member dialog ─── */

function RemoveMemberDialog({
  workspaceId,
  removeAction,
  memberName,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  removeAction: (
    state: WorkspaceMemberRemoveActionState,
    formData: FormData,
  ) => Promise<WorkspaceMemberRemoveActionState>;
  memberName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [, removeFormAction, isRemovePending] = useActionStateWithSonner(
    removeAction,
    initialDangerState,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remove {memberName}</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this member from the workspace? They
            will lose access to all businesses in this workspace immediately.
          </DialogDescription>
        </DialogHeader>
        <form action={removeFormAction}>
          <input name="workspaceId" type="hidden" value={workspaceId} />
          <DialogFooter>
            <Button
              disabled={isRemovePending}
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button disabled={isRemovePending} variant="destructive" type="submit">
              {isRemovePending ? (
                <>
                  <Spinner aria-hidden="true" data-icon="inline-start" />
                  Removing...
                </>
              ) : (
                "Remove member"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Pending invites dialog ─── */

function PendingInvitesDialog({
  workspaceId,
  invites,
  cancelInviteAction,
  copyInviteLinkAction,
}: {
  workspaceId: string;
  invites: WorkspaceMembersSettingsView["invites"];
  cancelInviteAction: WorkspaceMembersManagerProps["cancelInviteAction"];
  copyInviteLinkAction: WorkspaceMembersManagerProps["copyInviteLinkAction"];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <MailPlus data-icon="inline-start" />
          {invites.length} pending
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pending invites</DialogTitle>
          <DialogDescription>
            Invites stay active until accepted or canceled.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-2">
            {invites.map((invite) => (
              <InviteRow
                workspaceId={workspaceId}
                cancelAction={cancelInviteAction.bind(null, invite.inviteId)}
                copyInviteLinkAction={copyInviteLinkAction}
                invite={invite}
                key={invite.inviteId}
              />
            ))}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Invite row (inside pending dialog) ─── */

function InviteRow({
  workspaceId,
  invite,
  cancelAction,
  copyInviteLinkAction,
}: {
  workspaceId: string;
  invite: WorkspaceMembersSettingsView["invites"][number];
  cancelAction: (
    state: WorkspaceMemberRemoveActionState,
    formData: FormData,
  ) => Promise<WorkspaceMemberRemoveActionState>;
  copyInviteLinkAction: WorkspaceMembersManagerProps["copyInviteLinkAction"];
}) {
  const [, cancelFormAction, isPending] = useActionStateWithSonner(
    cancelAction,
    initialDangerState,
  );

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5">
      <Avatar size="sm">
        <AvatarFallback>{invite.email[0]?.toUpperCase() ?? "?"}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-medium text-foreground">
            {invite.email}
          </p>
          <Badge variant="outline">
            {workspaceMemberRoleMeta[invite.workspaceRole].label}
          </Badge>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <CopyWorkspaceInviteLinkButton
          workspaceId={workspaceId}
          copyInviteLinkAction={copyInviteLinkAction}
          inviteId={invite.inviteId}
        />
        <form action={cancelFormAction}>
          <input name="workspaceId" type="hidden" value={workspaceId} />
          <Button disabled={isPending} size="sm" type="submit" variant="ghost">
            {isPending ? (
              <Spinner aria-hidden="true" />
            ) : (
              "Cancel"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
