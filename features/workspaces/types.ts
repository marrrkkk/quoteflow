import type { InquiryStatus } from "@/features/inquiries/types";
import type { QuoteStatus } from "@/features/quotes/types";

export const workspaceMemberRoles = ["owner", "member"] as const;

export type WorkspaceMemberRole = (typeof workspaceMemberRoles)[number];

export type WorkspaceOverviewRecentInquiry = {
  id: string;
  customerName: string;
  customerEmail: string;
  serviceCategory: string;
  status: InquiryStatus;
  submittedAt: Date;
};

export type WorkspaceOverviewQuoteAttentionItem = {
  id: string;
  quoteNumber: string;
  title: string;
  customerName: string;
  status: QuoteStatus;
  validUntil: string;
  customerRespondedAt: Date | null;
  updatedAt: Date;
};

export type WorkspaceOverviewData = {
  recentInquiries: WorkspaceOverviewRecentInquiry[];
  quoteAttention: WorkspaceOverviewQuoteAttentionItem[];
  quoteAttentionCount: number;
};
