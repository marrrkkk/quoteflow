"use client";

import { AIChatPopover } from "@/features/ai/components/ai-chat-popover";

type InquiryAiPanelProps = {
  businessSlug: string;
  inquiryId: string;
  userName: string;
};

export function InquiryAiPanel({
  businessSlug,
  inquiryId,
  userName,
}: InquiryAiPanelProps) {
  return (
    <AIChatPopover
      businessSlug={businessSlug}
      entityId={inquiryId}
      surface="inquiry"
      title="Inquiry Assistant"
      userName={userName}
    />
  );
}
