import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Flame, Sun, Snowflake } from "lucide-react";
import type { Temperature } from "@/features/inquiries/qualification/types";

const temperatureConfig: Record<
  Temperature,
  { label: string; icon: typeof Flame; className: string }
> = {
  hot: {
    label: "Hot",
    icon: Flame,
    className:
      "!border-rose-500/30 !bg-rose-500/15 !text-rose-800 dark:!border-rose-500/25 dark:!bg-rose-500/12 dark:!text-rose-200",
  },
  warm: {
    label: "Warm",
    icon: Sun,
    className:
      "!border-amber-500/30 !bg-amber-500/15 !text-amber-800 dark:!border-amber-500/25 dark:!bg-amber-500/12 dark:!text-amber-200",
  },
  cold: {
    label: "Cold",
    icon: Snowflake,
    className:
      "!border-sky-500/30 !bg-sky-500/15 !text-sky-800 dark:!border-sky-500/25 dark:!bg-sky-500/12 dark:!text-sky-200",
  },
};

type TemperatureBadgeProps = {
  temperature: Temperature | null;
  className?: string;
};

export function TemperatureBadge({
  temperature,
  className,
}: TemperatureBadgeProps) {
  if (!temperature) return null;

  const config = temperatureConfig[temperature];
  const Icon = config.icon;

  return (
    <Badge
      className={cn("shrink-0 rounded-full", config.className, className)}
      variant="secondary"
    >
      <Icon data-icon="inline-start" />
      {config.label}
    </Badge>
  );
}
