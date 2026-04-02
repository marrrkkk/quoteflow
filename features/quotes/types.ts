export const quoteStatuses = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
] as const;

export type QuoteStatus = (typeof quoteStatuses)[number];
