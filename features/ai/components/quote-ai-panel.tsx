"use client";

import { AIChatPopover } from "@/features/ai/components/ai-chat-popover";

type QuoteAiPanelProps = {
  businessSlug: string;
  quoteId: string;
  userName: string;
};

export function QuoteAiPanel({
  businessSlug,
  quoteId,
  userName,
}: QuoteAiPanelProps) {
  return (
    <AIChatPopover
      businessSlug={businessSlug}
      entityId={quoteId}
      surface="quote"
      title="Quote Assistant"
      userName={userName}
    />
  );
}
