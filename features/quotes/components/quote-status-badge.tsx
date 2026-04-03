import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuoteStatus } from "@/features/quotes/types";
import {
  getQuoteStatusLabel,
  quoteStatusIcons,
  quoteStatusVariants,
} from "@/features/quotes/utils";

type QuoteStatusBadgeProps = {
  status: QuoteStatus;
  className?: string;
};

export function QuoteStatusBadge({
  status,
  className,
}: QuoteStatusBadgeProps) {
  const Icon = quoteStatusIcons[status];

  return (
    <Badge
      className={cn("shrink-0 rounded-full", className)}
      variant={quoteStatusVariants[status]}
    >
      <Icon data-icon="inline-start" />
      {getQuoteStatusLabel(status)}
    </Badge>
  );
}
