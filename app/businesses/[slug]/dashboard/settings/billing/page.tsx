import { PageHeader } from "@/components/shared/page-header";
import { PlanBadge } from "@/components/shared/paywall";
import { BillingStatusCard } from "@/features/billing/components/billing-status-card";
import { getWorkspaceBillingOverview } from "@/features/billing/queries";
import { getBusinessOwnerPageContext } from "../_lib/page-context";

export default async function BillingSettingsPage() {
  const { businessContext } = await getBusinessOwnerPageContext();
  const billingOverview = await getWorkspaceBillingOverview(
    businessContext.business.workspaceId,
  );

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Plan & billing"
        description="Manage your workspace subscription, payment method, and billing details."
        actions={
          <PlanBadge plan={businessContext.business.workspacePlan} />
        }
      />

      {billingOverview ? (
        <BillingStatusCard billing={billingOverview} />
      ) : null}
    </>
  );
}
