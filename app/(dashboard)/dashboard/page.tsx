import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Globe2,
  Inbox,
  Settings2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsMetricCard } from "@/features/analytics/components/analytics-metric-card";
import { getWorkspaceAnalyticsData } from "@/features/analytics/queries";
import { formatAnalyticsPercent } from "@/features/analytics/utils";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import { QuoteStatusBadge } from "@/features/quotes/components/quote-status-badge";
import { formatQuoteDate } from "@/features/quotes/utils";
import { getWorkspacePublicInquiryUrl } from "@/features/settings/utils";
import { getWorkspaceOverviewData } from "@/features/workspaces/queries";
import { requireCurrentWorkspaceContext } from "@/lib/db/workspace-access";

export default async function DashboardOverviewPage() {
  const { workspaceContext } = await requireCurrentWorkspaceContext();
  const [analytics, overview] = await Promise.all([
    getWorkspaceAnalyticsData(workspaceContext.workspace.id),
    getWorkspaceOverviewData(workspaceContext.workspace.id),
  ]);
  const closedOutcomeCount = analytics.wonCount + analytics.lostCount;
  const winRate = closedOutcomeCount
    ? analytics.wonCount / closedOutcomeCount
    : 0;
  const publicInquiryUrl = getWorkspacePublicInquiryUrl(
    workspaceContext.workspace.slug,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Overview"
        title="Clear view of the work"
        description={`See what is new in ${workspaceContext.workspace.name}, what needs a quote, and what is ready to move.`}
        actions={
          <>
            <Button asChild>
              <Link href="/dashboard/inquiries" prefetch={false}>
                Open inquiries
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/quotes/new" prefetch={false}>
                Create quote
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={publicInquiryUrl} prefetch={false} target="_blank">
                Open public form
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard
          description="All inquiries"
          icon={Inbox}
          title="Total inquiries"
          value={`${analytics.totalInquiries}`}
        />
        <AnalyticsMetricCard
          description="Last 7 days"
          icon={BarChart3}
          title="Inquiries this week"
          value={`${analytics.inquiriesThisWeek}`}
        />
        <AnalyticsMetricCard
          description="Sent to customers"
          icon={FileText}
          title="Sent quotes"
          value={`${analytics.quoteSummary.sentQuotes}`}
        />
        <AnalyticsMetricCard
          description={`${analytics.wonCount} won / ${analytics.lostCount} lost`}
          icon={Sparkles}
          title="Win rate"
          value={formatAnalyticsPercent(winRate)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QuickLinkCard
          href={publicInquiryUrl}
          icon={Globe2}
          label="Public form"
          value={workspaceContext.workspace.slug}
        />
        <QuickLinkCard
          href="/dashboard/settings"
          icon={Settings2}
          label="Settings"
          value="Workspace defaults"
        />
        <QuickLinkCard
          href="/dashboard/inquiries"
          icon={Inbox}
          label="Inbox"
          value={`${analytics.totalInquiries} inquiries`}
        />
        <QuickLinkCard
          href="/dashboard/quotes"
          icon={FileText}
          label="Quotes"
          value={`${analytics.quoteSummary.totalQuotes} quotes`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="bg-background/70">
          <CardHeader className="gap-2">
            <CardTitle>Recent inquiries</CardTitle>
            <p className="text-sm text-muted-foreground">Newest first.</p>
          </CardHeader>
          <CardContent>
            {overview.recentInquiries.length ? (
              <div className="flex flex-col gap-3">
                {overview.recentInquiries.map((inquiry) => (
                  <Link
                    className="rounded-[1.3rem] border bg-background/80 p-4 transition-colors hover:bg-background"
                    href={`/dashboard/inquiries/${inquiry.id}`}
                    key={inquiry.id}
                    prefetch={false}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 flex-col gap-1">
                        <p className="text-sm font-medium text-foreground">
                          {inquiry.customerName}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {inquiry.customerEmail}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {inquiry.serviceCategory}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <InquiryStatusBadge status={inquiry.status} />
                        <span className="rounded-full border bg-muted/35 px-3 py-1 text-xs text-muted-foreground">
                          {formatQuoteDate(inquiry.submittedAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyTitle>No inquiries yet</EmptyTitle>
                  <EmptyDescription>
                    Share the public inquiry page to start collecting customer
                    requests into the dashboard.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card className="bg-background/70">
          <CardHeader className="gap-2">
            <CardTitle>Quotes needing attention</CardTitle>
            <p className="text-sm text-muted-foreground">Draft, sent, or expired.</p>
          </CardHeader>
          <CardContent>
            {overview.quoteAttention.length ? (
              <div className="flex flex-col gap-3">
                {overview.quoteAttention.map((quote) => (
                  <Link
                    className="rounded-[1.3rem] border bg-background/80 p-4 transition-colors hover:bg-background"
                    href={`/dashboard/quotes/${quote.id}`}
                    key={quote.id}
                    prefetch={false}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {quote.quoteNumber}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {quote.title}
                          </p>
                        </div>
                        <QuoteStatusBadge status={quote.status} />
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <span>{quote.customerName}</span>
                        <span>Valid until {formatQuoteDate(quote.validUntil)}</span>
                        <span>
                          {quote.customerRespondedAt
                            ? `Customer responded ${formatQuoteDate(quote.customerRespondedAt)}`
                            : `Updated ${formatQuoteDate(quote.updatedAt)}`}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyTitle>No open quote work</EmptyTitle>
                  <EmptyDescription>
                    Draft or send a quote when an inquiry is ready to move into
                    pricing.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickLinkCard({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: typeof Globe2;
  label: string;
  value: string;
}) {
  const isExternal = href.startsWith("/inquire/");

  return (
    <Card className="bg-background/70">
      <CardContent className="p-5">
        <Link
          className="flex items-start justify-between gap-4"
          href={href}
          prefetch={false}
          rel={isExternal ? "noreferrer" : undefined}
          target={isExternal ? "_blank" : undefined}
        >
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border bg-secondary">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="meta-label">{label}</p>
              <p className="mt-2 truncate text-sm font-medium text-foreground">{value}</p>
            </div>
          </div>
          <ArrowRight className="mt-0.5 size-4 text-muted-foreground" />
        </Link>
      </CardContent>
    </Card>
  );
}
