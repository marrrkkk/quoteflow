import type { ReactNode } from "react";

import { DashboardPage } from "@/components/shared/dashboard-layout";
import { getBusinessOwnerPageContext } from "./_lib/page-context";

type BusinessSettingsLayoutProps = {
  children: ReactNode;
};

export default async function BusinessSettingsLayout({
  children,
}: BusinessSettingsLayoutProps) {
  await getBusinessOwnerPageContext();

  return <DashboardPage className="dashboard-side-stack min-w-0">{children}</DashboardPage>;
}
