import { Suspense } from "react";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/shell/dashboard-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { UpgradeButton } from "@/features/billing/components/upgrade-button";
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

  // Core shell data — needed synchronously for sidebar nav, user menu, business switcher
  const [themePreference, businessMemberships, profile] = await Promise.all([
    getThemePreferenceForUser(session.user.id),
    getBusinessMembershipsForUser(session.user.id),
    getAccountProfileForUser(session.user.id),
  ]);

  const avatarSrc = resolveUserAvatarSrc({
    avatarStoragePath: profile?.avatarStoragePath,
    profileUpdatedAt: profile?.updatedAt,
    oauthImage: session.user.image ?? null,
  });

  // Notification bell and upgrade button stream independently via Suspense.
  // The shell renders immediately with skeleton placeholders for these slots,
  // then each streams in as its data resolves — no blocking the layout.
  const notificationSlot = (
    <Suspense fallback={<Skeleton className="size-9 rounded-lg" />}>
      <NotificationBellStreamedSection
        businessId={businessContext.business.id}
        businessSlug={businessContext.business.slug}
        userId={session.user.id}
      />
    </Suspense>
  );

  const upgradeSlot = (
    <Suspense fallback={null}>
      <UpgradeButtonStreamedSection
        workspaceId={businessContext.business.workspaceId}
        workspaceSlug={businessContext.business.workspaceSlug}
      />
    </Suspense>
  );

  return (
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
  );
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
      userId={userId}
    />
  );
}

async function UpgradeButtonStreamedSection({
  workspaceId,
  workspaceSlug,
}: {
  workspaceId: string;
  workspaceSlug: string;
}) {
  const billing = await getWorkspaceBillingOverview(workspaceId);

  if (!billing || billing.currentPlan !== "free") {
    return null;
  }

  return (
    <div className="shrink-0">
      <UpgradeButton
        className="whitespace-nowrap"
        currentPlan={billing.currentPlan}
        defaultCurrency={billing.defaultCurrency}
        region={billing.region}
        size="sm"
        workspaceId={billing.workspaceId}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
}
