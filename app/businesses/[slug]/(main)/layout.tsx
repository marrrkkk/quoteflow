import { Suspense } from "react";
import { redirect } from "next/navigation";

import { RecentBusinessTracker } from "@/features/businesses/components/recent-business-tracker";

import { DashboardShell } from "@/components/shell/dashboard-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { UpgradeButton } from "@/features/billing/components/upgrade-button";
import { WorkspaceCheckoutProvider } from "@/features/billing/components/workspace-checkout-provider";
import { getAccountProfileForUser } from "@/features/account/queries";
import { resolveUserAvatarSrc } from "@/features/account/utils";
import { getThemePreferenceForUser } from "@/features/theme/queries";
import { getWorkspaceBillingOverview } from "@/features/billing/queries";
import { getBusinessNotificationBellView } from "@/features/notifications/queries";
import { DashboardNotificationBell } from "@/features/notifications/components/dashboard-notification-bell";
import { workspacesHubPath } from "@/features/workspaces/routes";
import { requireSession } from "@/lib/auth/session";
import {
  getBusinessContextForMembershipSlug,
  getBusinessMembershipsForUser,
} from "@/lib/db/business-access";
import { timed } from "@/lib/dev/server-timing";

export const unstable_instant = false;

export default async function BusinessDashboardLayout({
  children,
  params,
}: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const [session, { slug }] = await Promise.all([requireSession(), params]);
  const businessContext = await getBusinessContextForMembershipSlug(
    session.user.id,
    slug,
  );

  if (!businessContext) {
    redirect(workspacesHubPath);
  }

  // Shell data — all use "use cache" so these resolve from cache on repeat navs.
  // Billing is fetched in parallel so it never blocks shell + page rendering.
  const [themePreference, allBusinessMemberships, profile, billing] = await timed(
    "layout:shellData",
    Promise.all([
      getThemePreferenceForUser(session.user.id),
      getBusinessMembershipsForUser(session.user.id),
      getAccountProfileForUser(session.user.id),
      getWorkspaceBillingOverview(businessContext.business.workspaceId).catch(
        () => null,
      ),
    ]),
  );

  // Filter to only show businesses in the current workspace
  const businessMemberships = allBusinessMemberships.filter(
    (membership) => membership.business.workspaceId === businessContext.business.workspaceId
  );

  const avatarSrc = resolveUserAvatarSrc({
    avatarStoragePath: profile?.avatarStoragePath,
    profileUpdatedAt: profile?.updatedAt,
    oauthImage: session.user.image ?? null,
  });

  // Notification bell streams independently via Suspense.
  // The shell renders immediately with a skeleton placeholder for this slot,
  // then it streams in as its data resolves — no blocking the layout.
  const notificationSlot = (
    <Suspense fallback={<Skeleton className="size-9 rounded-lg" />}>
      <NotificationBellStreamedSection
        businessId={businessContext.business.id}
        businessSlug={businessContext.business.slug}
        userId={session.user.id}
      />
    </Suspense>
  );

  // Upgrade button uses the already-fetched billing data — no extra fetch needed
  const upgradeSlot = billing && billing.currentPlan !== "business" ? (
    <div className="shrink-0">
      <UpgradeButton
        className="whitespace-nowrap"
        currentPlan={billing.currentPlan}
        defaultCurrency={billing.defaultCurrency}
        region={billing.region}
        size="sm"
        workspaceId={billing.workspaceId}
        workspaceSlug={billing.workspaceSlug}
      />
    </div>
  ) : null;

  const shellContent = (
    <>
      <RecentBusinessTracker
        businessSlug={businessContext.business.slug}
      />
      <DashboardShell
        themePreference={themePreference}
        user={{
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          avatarSrc,
        }}
        businessContext={businessContext}
        businessMemberships={businessMemberships}
        notificationSlot={notificationSlot}
        upgradeSlot={upgradeSlot}
      >
        {children}
      </DashboardShell>
    </>
  );

  // Wrap with checkout context when billing data is available.
  // Billing is already fetched in parallel above, so this never blocks.
  if (billing) {
    return (
      <WorkspaceCheckoutProvider billing={billing}>
        {shellContent}
      </WorkspaceCheckoutProvider>
    );
  }

  return shellContent;
}

/* -------------------------------------------------------------------------- */
/*  Streamed sections — async server components wrapped in Suspense above     */
/* -------------------------------------------------------------------------- */

async function NotificationBellStreamedSection({
  businessId,
  businessSlug,
  userId,
}: {
  businessId: string;
  businessSlug: string;
  userId: string;
}) {
  const notificationView = await getBusinessNotificationBellView({
    businessId,
    businessSlug,
    userId,
  });

  return (
    <DashboardNotificationBell
      businessId={businessId}
      businessSlug={businessSlug}
      initialView={notificationView}
      key={[
        businessId,
        notificationView.unreadCount,
        notificationView.lastReadAt ?? "unread",
        notificationView.items[0]?.id ?? "empty",
      ].join(":")}
      userId={userId}
    />
  );
}
