"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { BusinessAnalyticsTrendPoint } from "@/features/analytics/types";

const chartConfig = {
  inquiries: {
    label: "Inquiries",
    color: "oklch(0.623 0.214 259.815)",
  },
  won: {
    label: "Won",
    color: "oklch(0.765 0.177 163.223)",
  },
  lost: {
    label: "Lost",
    color: "oklch(0.637 0.237 25.331)",
  },
} satisfies ChartConfig;

export function AnalyticsTrendOverview({
  points,
}: {
  points: BusinessAnalyticsTrendPoint[];
}) {
  return (
    <Card className="gap-0">
      <CardHeader className="gap-2">
        <CardTitle>Inquiry trend</CardTitle>
        <CardDescription>Rolling six-week view.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart
            data={points}
            barCategoryGap="20%"
            barGap={2}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={12}
              width={32}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="inquiries"
              fill="var(--color-inquiries)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="won"
              fill="var(--color-won)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="lost"
              fill="var(--color-lost)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
