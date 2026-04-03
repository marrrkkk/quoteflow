import {
  ArrowUpRight,
  CircleCheckBig,
  FileText,
  ShieldAlert,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkspaceAnalyticsData } from "@/features/analytics/types";
import { formatAnalyticsPercent } from "@/features/analytics/utils";

export function AnalyticsQuoteSummary({
  data,
}: {
  data: WorkspaceAnalyticsData["quoteSummary"];
}) {
  return (
    <Card className="gap-0 bg-background/72">
      <CardHeader className="gap-2">
        <CardTitle>Quote conversion summary</CardTitle>
        <CardDescription>Draft to accepted.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryTile
            icon={FileText}
            label="Total quotes"
            value={`${data.totalQuotes}`}
          />
          <SummaryTile
            icon={ArrowUpRight}
            label="Sent quotes"
            value={`${data.sentQuotes}`}
          />
          <SummaryTile
            icon={CircleCheckBig}
            label="Accepted rate"
            value={formatAnalyticsPercent(data.acceptanceRate)}
          />
          <SummaryTile
            icon={ShieldAlert}
            label="Inquiry coverage"
            value={formatAnalyticsPercent(data.inquiryCoverageRate)}
          />
        </div>

        <div className="soft-panel p-4 shadow-none">
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Accepted" value={data.acceptedQuotes} />
            <MiniMetric label="Rejected" value={data.rejectedQuotes} />
            <MiniMetric label="Expired" value={data.expiredQuotes} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="info-tile p-4 shadow-none">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-full border border-border/75 bg-secondary">
          <Icon className="size-4" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="meta-label">{label}</p>
          <p className="text-xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="soft-panel bg-muted/15 px-3 py-3 shadow-none">
      <p className="meta-label">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
