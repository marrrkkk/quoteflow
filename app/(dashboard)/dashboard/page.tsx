import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Globe2,
  Inbox,
  Settings2,
} from "lucide-react";

import {
  DashboardActionsRow,
  DashboardEmptyState,
  DashboardPage,
} from "@/components/shared/dashboard-layout";
import { HelpTooltip } from "@/components/shared/help-tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWorkspaceAnalyticsData } from "@/features/analytics/queries";
import { formatAnalyticsPercent } from "@/features/analytics/utils";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import { QuoteStatusBadge } from "@/features/quotes/components/quote-status-badge";
import { formatQuoteDate } from "@/features/quotes/utils";
import { getWorkspacePublicInquiryUrl } from "@/features/settings/utils";
import { getWorkspaceOverviewData } from "@/features/workspaces/queries";
import { requireCurrentWorkspaceContext } from "@/lib/db/workspace-access";
import { cn } from "@/lib/utils";

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
  const newInquiryCount =
    analytics.inquiryStatusCounts.find((row) => row.status === "new")?.count ?? 0;
  const quoteAttentionCount = overview.quoteAttentionCount;
  const focusCount = newInquiryCount + quoteAttentionCount;
  const publicInquiryUrl = getWorkspacePublicInquiryUrl(
    workspaceContext.workspace.slug,
  );

  return (
    <DashboardPage className="gap-5 xl:gap-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-stretch">
        <section className="section-panel h-full overflow-hidden">
          <div className="flex h-full flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6">
            <div className="xl:flex xl:flex-1 xl:items-start xl:pt-3">
              <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={focusCount ? "outline" : "secondary"}>
                      {focusCount ? `${focusCount} items need attention` : "Workspace is caught up"}
                    </Badge>
                    <Badge
                      variant={workspaceContext.workspace.publicInquiryEnabled ? "secondary" : "outline"}
                    >
                      {workspaceContext.workspace.publicInquiryEnabled ? "Public form live" : "Public form paused"}
                    </Badge>
                  </div>
                  <h1 className="mt-3 font-heading text-[1.95rem] font-semibold leading-tight tracking-tight text-balance sm:text-[2.35rem]">
                    {workspaceContext.workspace.name}
                  </h1>
                </div>

                <DashboardActionsRow className="w-full [&>*]:w-full sm:[&>*]:w-auto lg:w-auto lg:justify-end">
                  <Button asChild>
                    <Link href="/dashboard/inquiries" prefetch={false}>
                      Open inquiries
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/dashboard/quotes/new" prefetch={false}>
                      Create quote
                    </Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href={publicInquiryUrl} prefetch={false} target="_blank">
                      Open public form
                    </Link>
                  </Button>
                </DashboardActionsRow>
              </div>
            </div>

            <div className="mt-auto grid gap-4 border-t border-border/70 pt-4 sm:grid-cols-3">
              <OverviewSummaryMetric
                accent={newInquiryCount > 0}
                label="Need reply"
                value={`${newInquiryCount}`}
              />
              <OverviewSummaryMetric
                accent={quoteAttentionCount > 0}
                label="Quote follow-up"
                value={`${quoteAttentionCount}`}
              />
              <OverviewSummaryMetric
                label="Win rate"
                value={formatAnalyticsPercent(winRate)}
              />
            </div>
          </div>
        </section>

        <aside className="section-panel overflow-hidden">
          <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col divide-y divide-border/70">
              <OverviewSidebarMetric
                label="This week"
                tooltip="New inquiries this week"
                value={`${analytics.inquiriesThisWeek}`}
              />
              <OverviewSidebarMetric
                label="Coverage"
                tooltip="Inquiries turned into quotes"
                value={formatAnalyticsPercent(analytics.quoteSummary.inquiryCoverageRate)}
              />
              <OverviewSidebarMetric
                label="Intake"
                tooltip="Public form status"
                value={
                  workspaceContext.workspace.publicInquiryEnabled ? "Live" : "Paused"
                }
              />
            </div>

            <div className="border-t border-border/70 pt-4">
              <div className="flex flex-col">
                <OverviewQuickLink
                  href="/dashboard/settings"
                  icon={Settings2}
                  label="Workspace settings"
                />
                <OverviewQuickLink
                  href="/dashboard/analytics"
                  icon={BarChart3}
                  label="Analytics"
                />
                <OverviewQuickLink
                  external
                  href={publicInquiryUrl}
                  icon={Globe2}
                  label="Public inquiry page"
                />
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <OverviewQueueCard
          action={
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard/inquiries" prefetch={false}>
                All inquiries
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          }
          title="Recent inquiries"
        >
          {overview.recentInquiries.length ? (
            <div className="flex flex-col divide-y divide-border/70">
              {overview.recentInquiries.map((inquiry) => (
                <OverviewInquiryRow
                  inquiry={inquiry}
                  key={inquiry.id}
                />
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              action={
                <Button asChild variant="outline">
                  <Link href={publicInquiryUrl} prefetch={false} target="_blank">
                    Open public form
                  </Link>
                </Button>
              }
              className="px-5 py-12 sm:px-6"
              description="Share the form to start collecting requests."
              icon={Inbox}
              title="No inquiries yet"
              variant="flat"
            />
          )}
        </OverviewQueueCard>

        <OverviewQueueCard
          action={
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard/quotes" prefetch={false}>
                All quotes
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          }
          title="Open quotes"
        >
          {overview.quoteAttention.length ? (
            <div className="flex flex-col divide-y divide-border/70">
              {overview.quoteAttention.map((quote) => (
                <OverviewQuoteRow
                  key={quote.id}
                  quote={quote}
                />
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              action={
                <Button asChild>
                  <Link href="/dashboard/quotes/new" prefetch={false}>
                    Create quote
                  </Link>
                </Button>
              }
              className="px-5 py-12 sm:px-6"
              description="Create a quote when pricing is ready."
              icon={FileText}
              title="No quote follow-up"
              variant="flat"
            />
          )}
        </OverviewQueueCard>
      </div>
    </DashboardPage>
  );
}

function OverviewSummaryMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="meta-label">{label}</p>
      <p
        className={cn(
          "mt-2 text-[1.9rem] font-semibold tracking-tight text-foreground",
          accent && "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function OverviewSidebarMetric({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-center gap-1.5">
        <p className="text-sm text-muted-foreground">{label}</p>
        {tooltip ? (
          <HelpTooltip content={tooltip} label={label} />
        ) : null}
      </div>
      <p className="text-sm font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function OverviewQuickLink({
  href,
  label,
  icon: Icon,
  external = false,
}: {
  href: string;
  label: string;
  icon: typeof Globe2;
  external?: boolean;
}) {
  return (
    <Link
      className="group flex items-center gap-3 rounded-lg px-0 py-2.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
      href={href}
      prefetch={false}
      rel={external ? "noreferrer" : undefined}
      target={external ? "_blank" : undefined}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/85 text-accent-foreground">
        <Icon className="size-4" />
      </div>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function OverviewQueueCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("section-panel overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function OverviewInquiryRow({
  inquiry,
}: {
  inquiry: Awaited<ReturnType<typeof getWorkspaceOverviewData>>["recentInquiries"][number];
}) {
  return (
    <Link
      className="group block px-5 py-4 transition-colors hover:bg-accent/22 sm:px-6"
      href={`/dashboard/inquiries/${inquiry.id}`}
      prefetch={false}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {inquiry.customerName}
              </p>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {inquiry.customerEmail}
              </p>
            </div>
            <InquiryStatusBadge
              className={getPastelInquiryBadgeClassName(inquiry.status)}
              status={inquiry.status}
            />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex min-w-0 items-center gap-2">
          <Badge
            className="h-6 border-transparent bg-muted/70 px-2.5 text-[0.68rem] font-medium text-muted-foreground"
            variant="secondary"
          >
            {inquiry.serviceCategory}
          </Badge>
          <span className="truncate">Submitted {formatQuoteDate(inquiry.submittedAt)}</span>
        </div>
        <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function OverviewQuoteRow({
  quote,
}: {
  quote: Awaited<ReturnType<typeof getWorkspaceOverviewData>>["quoteAttention"][number];
}) {
  const secondaryMeta = quote.customerRespondedAt
    ? `Responded ${formatQuoteDate(quote.customerRespondedAt)}`
    : quote.status === "sent"
      ? `Valid until ${formatQuoteDate(quote.validUntil)}`
      : `Updated ${formatQuoteDate(quote.updatedAt)}`;

  return (
    <Link
      className="group block px-5 py-4 transition-colors hover:bg-accent/22 sm:px-6"
      href={`/dashboard/quotes/${quote.id}`}
      prefetch={false}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">
                  {quote.title}
                </p>
                <span className="shrink-0 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {quote.quoteNumber}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {quote.customerName}
              </p>
            </div>
            <QuoteStatusBadge
              className={getPastelQuoteBadgeClassName(quote.status)}
              status={quote.status}
            />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="truncate">{secondaryMeta}</span>
        <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function getPastelInquiryBadgeClassName(
  status: Awaited<ReturnType<typeof getWorkspaceOverviewData>>["recentInquiries"][number]["status"],
) {
  switch (status) {
    case "new":
      return "border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/12 dark:text-sky-200";
    case "quoted":
      return "border-violet-200/80 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/12 dark:text-violet-200";
    case "waiting":
      return "border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/12 dark:text-amber-200";
    case "won":
      return "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/12 dark:text-emerald-200";
    case "lost":
      return "border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/12 dark:text-rose-200";
    case "archived":
      return "border-slate-200/80 bg-slate-100 text-slate-700 dark:border-slate-500/25 dark:bg-slate-500/12 dark:text-slate-200";
  }
}

function getPastelQuoteBadgeClassName(
  status: Awaited<ReturnType<typeof getWorkspaceOverviewData>>["quoteAttention"][number]["status"],
) {
  switch (status) {
    case "draft":
      return "border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/12 dark:text-sky-200";
    case "sent":
      return "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/12 dark:text-emerald-200";
    case "accepted":
      return "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/12 dark:text-emerald-200";
    case "rejected":
      return "border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/12 dark:text-rose-200";
    case "expired":
      return "border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/12 dark:text-rose-200";
  }
}
