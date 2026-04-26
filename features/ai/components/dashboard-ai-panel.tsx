"use client";

import { usePathname } from "next/navigation";

import { AIChatPopover } from "@/features/ai/components/ai-chat-popover";

type DashboardAiPanelProps = {
  businessId: string;
  businessSlug: string;
  userName: string;
};

const entityDetailPattern =
  /\/dashboard\/(?:inquiries|quotes)\/(?!new(?:\/|$))[^/]+\/?$/;

export function DashboardAiPanel({
  businessSlug,
  userName,
}: DashboardAiPanelProps) {
  const pathname = usePathname();

  if (entityDetailPattern.test(pathname)) {
    return null;
  }

  return (
    <AIChatPopover
      businessSlug={businessSlug}
      entityId="global"
      surface="dashboard"
      title="Dashboard Assistant"
      userName={userName}
    />
  );
}
