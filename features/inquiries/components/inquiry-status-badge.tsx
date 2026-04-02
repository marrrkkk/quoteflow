import { Badge } from "@/components/ui/badge";
import type { InquiryStatus } from "@/features/inquiries/types";
import {
  getInquiryStatusLabel,
  inquiryStatusIcons,
  inquiryStatusVariants,
} from "@/features/inquiries/utils";

type InquiryStatusBadgeProps = {
  status: InquiryStatus;
};

export function InquiryStatusBadge({ status }: InquiryStatusBadgeProps) {
  const Icon = inquiryStatusIcons[status];

  return (
    <Badge variant={inquiryStatusVariants[status]}>
      <Icon data-icon="inline-start" />
      {getInquiryStatusLabel(status)}
    </Badge>
  );
}
