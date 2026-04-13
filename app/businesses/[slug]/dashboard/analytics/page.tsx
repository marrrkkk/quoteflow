import { redirect } from "next/navigation";

import { DashboardPage } from "@/components/shared/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsTabsClient } from "@/features/analytics/components/analytics-tabs-client";
import {
  getBusinessAnalyticsData,
  getConversionAnalyticsData,
  getWorkflowAnalyticsData,
} from "@/features/analytics/queries";
import { businessesHubPath } from "@/features/businesses/routes";
import { requireSession } from "@/lib/auth/session";
import {
  getBusinessContextForMembershipSlug,
  hasOperationalBusinessAccess,
} from "@/lib/db/business-access";

type AnalyticsPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const [session, { slug }] = await Promise.all([requireSession(), params]);
  const businessContext = await getBusinessContextForMembershipSlug(
    session.user.id,
    slug,
  );

  if (!businessContext) {
    redirect(businessesHubPath);
  }

  if (!hasOperationalBusinessAccess(businessContext.role)) {
    redirect(`/businesses/${businessContext.business.slug}/dashboard`);
  }

  const businessId = businessContext.business.id;
  const [overviewData, conversionData, workflowData] = await Promise.all([
    getBusinessAnalyticsData(businessId),
    getConversionAnalyticsData(businessId),
    getWorkflowAnalyticsData(businessId),
  ]);

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Analytics"
        title="Inquiry-to-quote performance"
        description="Track your inquiry pipeline, quote conversions, and workflow efficiency."
      />

      <AnalyticsTabsClient
        overviewData={overviewData}
        conversionData={conversionData}
        workflowData={workflowData}
        currency={businessContext.business.defaultCurrency}
        plan={businessContext.business.plan}
      />
    </DashboardPage>
  );
}
