import type { InquiryStatus } from "@/features/inquiries/types";

export type BusinessAnalyticsStatusCount = {
  status: InquiryStatus;
  count: number;
};

export type BusinessAnalyticsTrendPoint = {
  label: string;
  weekStart: string;
  inquiries: number;
  won: number;
  lost: number;
  acceptedQuotes: number;
};

export type BusinessAnalyticsData = {
  totalInquiries: number;
  inquiriesThisWeek: number;
  wonCount: number;
  lostCount: number;
  inquiryStatusCounts: BusinessAnalyticsStatusCount[];
  quoteSummary: {
    totalQuotes: number;
    sentQuotes: number;
    acceptedQuotes: number;
    rejectedQuotes: number;
    expiredQuotes: number;
    linkedInquiryCount: number;
    acceptanceRate: number;
    inquiryCoverageRate: number;
  };
  recentTrend: BusinessAnalyticsTrendPoint[];
};
