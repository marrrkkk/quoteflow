import type { ReactNode } from "react";

import { DashboardPage } from "@/components/shared/dashboard-layout";
import { getBusinessSettingsPath } from "@/features/businesses/routes";
import { BusinessSettingsTabs } from "@/features/settings/components/business-settings-tabs";
import { getBusinessOwnerPageContext } from "./_lib/page-context";

type BusinessSettingsLayoutProps = {
  children: ReactNode;
};

export default async function BusinessSettingsLayout({
  children,
}: BusinessSettingsLayoutProps) {
  const { businessContext } = await getBusinessOwnerPageContext();
  const businessSlug = businessContext.business.slug;
  const tabItems = [
    { href: getBusinessSettingsPath(businessSlug, "profile"), label: "Owner profile" },
    { href: getBusinessSettingsPath(businessSlug, "general"), label: "Business details" },
    { href: getBusinessSettingsPath(businessSlug, "replies"), label: "Reply snippets" },
    { href: getBusinessSettingsPath(businessSlug, "knowledge"), label: "Knowledge files" },
    { href: getBusinessSettingsPath(businessSlug, "quote"), label: "Quote preferences" },
    { href: getBusinessSettingsPath(businessSlug, "pricing"), label: "Service pricing library" },
  ];

  return (
    <DashboardPage>
      <div className="flex flex-col gap-6">
        <BusinessSettingsTabs items={tabItems} />
        <div className="min-w-0">{children}</div>
      </div>
    </DashboardPage>
  );
}
