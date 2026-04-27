import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { LockedFeaturePage } from "@/components/shared/paywall";
import {
  cancelWorkspaceMemberInviteAction,
  copyWorkspaceMemberInviteLinkAction,
  createWorkspaceMemberInviteAction,
  removeWorkspaceMemberAction,
  updateWorkspaceMemberRoleAction,
} from "@/features/workspace-members/actions";
import { WorkspaceMembersManager } from "@/features/workspace-members/components/workspace-members-manager";
import {
  getInvitePermission,
  getManagedBusinessesForUser,
} from "@/features/workspace-members/permissions";
import { getWorkspaceMembersSettingsForWorkspace } from "@/features/workspace-members/queries";
import { getWorkspaceBillingOverview } from "@/features/billing/queries";
import { requireUser } from "@/lib/auth/session";
import { getWorkspaceContextForUser } from "@/lib/db/workspace-access";
import { hasFeatureAccess } from "@/lib/plans";

export default async function WorkspaceMembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams?: Promise<{ business?: string }>;
}) {
  const { workspaceSlug } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const user = await requireUser();
  const workspaceContext = await getWorkspaceContextForUser(
    user.id,
    undefined,
    workspaceSlug,
  );

  if (!workspaceContext) {
    notFound();
  }

  // Allow owner, admin, or any member who manages at least one business
  const managedBusinesses = await getManagedBusinessesForUser(
    workspaceContext.id,
    user.id,
  );
  const permission = getInvitePermission(
    workspaceContext.memberRole,
    managedBusinesses.length,
  );

  // Only owner/admin can see the full members page.
  // Business managers can only invite — they shouldn't access settings-level
  // member management. Gate them out of this page entirely.
  if (
    workspaceContext.memberRole !== "owner" &&
    workspaceContext.memberRole !== "admin"
  ) {
    notFound();
  }

  if (!hasFeatureAccess(workspaceContext.plan, "members")) {
    const billingOverview = await getWorkspaceBillingOverview(
      workspaceContext.id,
    );

    return (
      <>
        <PageHeader title="Members" />
        <LockedFeaturePage
          feature="members"
          plan={workspaceContext.plan}
          description="Upgrade to invite teammates and assign workspace roles."
          upgradeAction={
            billingOverview
              ? {
                  workspaceId: billingOverview.workspaceId,
                  workspaceSlug: billingOverview.workspaceSlug,
                  currentPlan: billingOverview.currentPlan,
                  region: billingOverview.region,
                  defaultCurrency: billingOverview.defaultCurrency,
                  ctaLabel: "Upgrade to invite members",
                }
              : undefined
          }
        />
      </>
    );
  }

  const rawView = await getWorkspaceMembersSettingsForWorkspace(
    workspaceContext.id,
    user.id,
  );

  if (!rawView) {
    notFound();
  }

  // Merge invite permission into the view
  const view = {
    ...rawView,
    invitePermission: {
      canInvite: permission.canInvite,
      maxAssignableWorkspaceRole: permission.maxAssignableWorkspaceRole,
      allowedBusinessIds:
        permission.scope === "all"
          ? null
          : managedBusinesses.map((b) => b.id),
    },
  };

  return (
    <WorkspaceMembersManager
      workspaceId={workspaceContext.id}
      cancelInviteAction={cancelWorkspaceMemberInviteAction}
      copyInviteLinkAction={copyWorkspaceMemberInviteLinkAction}
      createInviteAction={createWorkspaceMemberInviteAction}
      removeMemberAction={removeWorkspaceMemberAction}
      updateRoleAction={updateWorkspaceMemberRoleAction}
      preselectedBusinessId={resolvedSearchParams.business ?? null}
      view={view}
    />
  );
}
