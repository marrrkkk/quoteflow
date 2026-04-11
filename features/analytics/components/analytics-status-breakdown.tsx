import { BarChart3 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import type { BusinessAnalyticsStatusCount } from "@/features/analytics/types";

export function AnalyticsStatusBreakdown({
  rows,
}: {
  rows: BusinessAnalyticsStatusCount[];
}) {
  const maxCount = Math.max(...rows.map((row) => row.count), 1);

  return (
    <Card className="gap-0 bg-background/72">
      <CardHeader className="gap-2">
        <CardTitle>Inquiry status breakdown</CardTitle>
        <CardDescription>Current inquiry workload by status.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.map((row) => (
          <div
            className="soft-panel p-4 shadow-none"
            key={row.status}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <InquiryStatusBadge status={row.status} />
                <span className="text-sm font-medium text-foreground">
                  {row.count}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                <div
                  className="h-full rounded-full bg-primary/75"
                  style={{
                    width: `${Math.max(
                      10,
                      Math.round((row.count / maxCount) * 100),
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        {!rows.some((row) => row.count > 0) ? (
          <div className="soft-panel border-dashed bg-muted/15 p-4 text-sm text-muted-foreground shadow-none">
            <div className="flex items-center gap-2">
              <BarChart3 />
              <span>Status counts will appear once inquiries start coming in.</span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
