import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function AnalyticsMetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="bg-background/70">
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex size-11 items-center justify-center rounded-full border bg-secondary">
          <Icon className="size-4" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="meta-label">
            {title}
          </p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
