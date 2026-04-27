"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

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
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useActionStateWithSonner } from "@/hooks/use-action-state-with-sonner";
import {
  businessMemberAssignableRoles,
  businessMemberRoleMeta,
  type BusinessMemberAssignableRole,
} from "@/lib/business-members";
import {
  workspaceMemberAssignableRoles,
  workspaceMemberRoleMeta,
  type WorkspaceMemberAssignableRole,
} from "@/features/workspace-members/types";
import type {
  WorkspaceMemberInviteActionState,
  WorkspaceMembersSettingsView,
} from "@/features/workspace-members/types";

type WorkspaceRoleOption = {
  label: string;
  searchText: string;
  value: WorkspaceMemberAssignableRole;
};

const workspaceRoleOptions: WorkspaceRoleOption[] =
  workspaceMemberAssignableRoles.map((role) => ({
    label: workspaceMemberRoleMeta[role].label,
    searchText: `${workspaceMemberRoleMeta[role].label} ${workspaceMemberRoleMeta[role].description}`,
    value: role,
  }));

const initialInviteState: WorkspaceMemberInviteActionState = {};

export type InviteMemberDialogProps = {
  workspaceId: string;
  action: (
    state: WorkspaceMemberInviteActionState,
    formData: FormData,
  ) => Promise<WorkspaceMemberInviteActionState>;
  /**
   * Optional list of businesses for the business-access picker.
   * When omitted or empty, the business-access section is hidden.
   */
  businesses?: WorkspaceMembersSettingsView["businesses"];
  /**
   * When set, the business selector is hidden and this business
   * is automatically included in the invite with the selected
   * business role. Used on the business members page.
   */
  fixedBusinessId?: string | null;
  /**
   * Optional label for the fixed business (shown as context in
   * the dialog description when `fixedBusinessId` is set).
   */
  fixedBusinessName?: string | null;
  /** Pre-select a business in the multi-business picker. */
  preselectedBusinessId?: string | null;
  /**
   * The highest workspace role the inviter can assign.
   * When "member", the role selector is hidden and locked.
   * Defaults to "admin" (full choice).
   */
  maxWorkspaceRole?: WorkspaceMemberAssignableRole;
};

export function InviteMemberDialog({
  workspaceId,
  businesses = [],
  fixedBusinessId,
  fixedBusinessName,
  preselectedBusinessId,
  maxWorkspaceRole = "admin",
  action,
}: InviteMemberDialogProps) {
  const isFixedBusiness = Boolean(fixedBusinessId);
  const isRoleLocked = maxWorkspaceRole === "member";
  const availableRoleOptions = isRoleLocked
    ? workspaceRoleOptions.filter((o) => o.value === "member")
    : workspaceRoleOptions;
  const [selectedRole, setSelectedRole] = useState<WorkspaceMemberAssignableRole>(
    isRoleLocked ? "member" : "member",
  );
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<Set<string>>(
    () => new Set(preselectedBusinessId ? [preselectedBusinessId] : []),
  );
  const [businessRole, setBusinessRole] = useState<BusinessMemberAssignableRole>(
    "staff",
  );
  const [state, formAction, isPending] = useActionStateWithSonner(
    action,
    initialInviteState,
  );
  const emailError = state.fieldErrors?.email?.[0];
  const roleError = state.fieldErrors?.workspaceRole?.[0];
  const selectedRoleMeta = workspaceMemberRoleMeta[selectedRole];

  function toggleBusiness(businessId: string) {
    setSelectedBusinessIds((prev) => {
      const next = new Set(prev);
      if (next.has(businessId)) {
        next.delete(businessId);
      } else {
        next.add(businessId);
      }
      return next;
    });
  }

  function getBusinessAssignmentsJson() {
    if (isFixedBusiness && fixedBusinessId) {
      return JSON.stringify([
        { businessId: fixedBusinessId, role: businessRole },
      ]);
    }

    if (selectedBusinessIds.size === 0) return "";
    return JSON.stringify(
      Array.from(selectedBusinessIds).map((id) => ({
        businessId: id,
        role: businessRole,
      })),
    );
  }

  const hasBusinessAssignment =
    isFixedBusiness || selectedBusinessIds.size > 0;

  const description = isFixedBusiness && fixedBusinessName
    ? `Send an invite to join this workspace with access to ${fixedBusinessName}.`
    : "Send an invite to join this workspace.";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus data-icon="inline-start" />
          Invite member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input name="workspaceId" type="hidden" value={workspaceId} />
          <input name="workspaceRole" type="hidden" value={selectedRole} />
          <input
            name="businessAssignments"
            type="hidden"
            value={getBusinessAssignmentsJson()}
          />
          <DialogBody className="flex flex-col gap-4">
            <Field data-invalid={Boolean(emailError) || undefined}>
              <FieldLabel htmlFor="member-email">Email address</FieldLabel>
              <FieldContent>
                <Input
                  autoComplete="email"
                  disabled={isPending}
                  id="member-email"
                  name="email"
                  placeholder="teammate@example.com"
                  required
                  type="email"
                />
                <FieldError errors={emailError ? [{ message: emailError }] : undefined} />
              </FieldContent>
            </Field>

            {/* Workspace role — hidden when locked to a single role */}
            {!isRoleLocked ? (
              <Field data-invalid={Boolean(roleError) || undefined}>
                <FieldLabel htmlFor="member-workspace-role">Workspace role</FieldLabel>
                <FieldContent>
                  <Combobox
                    disabled={isPending}
                    id="member-workspace-role"
                    onValueChange={(value) =>
                      setSelectedRole(value as WorkspaceMemberAssignableRole)
                    }
                    options={availableRoleOptions}
                    placeholder="Choose a role"
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
                  <FieldDescription>{selectedRoleMeta.description}</FieldDescription>
                  <FieldError errors={roleError ? [{ message: roleError }] : undefined} />
                </FieldContent>
              </Field>
            ) : null}

            {/* Business access — multi-select (workspace page) */}
            {!isFixedBusiness && businesses.length > 0 ? (
              <Field>
                <FieldLabel>Business access</FieldLabel>
                <FieldDescription>
                  Optionally grant access to specific businesses.
                </FieldDescription>
                <FieldContent>
                  <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-3">
                    {businesses.map((business) => (
                      <label
                        key={business.id}
                        className="flex cursor-pointer items-center gap-2.5 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="size-4 rounded border-border accent-primary"
                          checked={selectedBusinessIds.has(business.id)}
                          disabled={isPending}
                          onChange={() => toggleBusiness(business.id)}
                        />
                        <span className="truncate">{business.name}</span>
                      </label>
                    ))}
                  </div>
                </FieldContent>
              </Field>
            ) : null}

            {/* Business role picker — shown when any business is assigned */}
            {hasBusinessAssignment ? (
              <Field>
                <FieldLabel htmlFor="member-business-role">
                  {isFixedBusiness ? "Business role" : "Business role for selected businesses"}
                </FieldLabel>
                <FieldContent>
                  <Combobox
                    disabled={isPending}
                    id="member-business-role"
                    onValueChange={(value) =>
                      setBusinessRole(value as BusinessMemberAssignableRole)
                    }
                    options={businessMemberAssignableRoles.map((role) => ({
                      label: businessMemberRoleMeta[role].label,
                      searchText: `${businessMemberRoleMeta[role].label} ${businessMemberRoleMeta[role].description}`,
                      value: role,
                    }))}
                    placeholder="Business role"
                    value={businessRole}
                  />
                </FieldContent>
              </Field>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button disabled={isPending} type="submit">
              {isPending ? (
                <>
                  <Spinner aria-hidden="true" data-icon="inline-start" />
                  Sending...
                </>
              ) : (
                "Send invite"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
