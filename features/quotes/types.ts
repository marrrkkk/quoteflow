export const quoteStatuses = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
] as const;

export type QuoteStatus = (typeof quoteStatuses)[number];
export const quoteStatusFilterValues = ["all", ...quoteStatuses] as const;
export type QuoteStatusFilterValue = (typeof quoteStatusFilterValues)[number];

export type QuoteListFilters = {
  q?: string;
  status: QuoteStatusFilterValue;
};

export type DashboardQuoteListItem = {
  id: string;
  inquiryId: string | null;
  quoteNumber: string;
  title: string;
  customerName: string;
  customerEmail: string;
  totalInCents: number;
  validUntil: string;
  status: QuoteStatus;
  createdAt: Date;
  sentAt: Date | null;
};

export type DashboardQuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unitPriceInCents: number;
  lineTotalInCents: number;
  position: number;
};

export type DashboardQuoteActivity = {
  id: string;
  type: string;
  summary: string;
  createdAt: Date;
  actorName: string | null;
};

export type QuoteLinkedInquirySummary = {
  id: string;
  customerName: string;
  customerEmail: string;
  serviceCategory: string;
  status: string;
};

export type QuoteInquiryPrefill = {
  id: string;
  customerName: string;
  customerEmail: string;
  serviceCategory: string;
  status: string;
  details: string;
  requestedDeadline: string | null;
  budgetText: string | null;
};

export type DashboardQuoteDetail = {
  id: string;
  workspaceId: string;
  inquiryId: string | null;
  quoteNumber: string;
  title: string;
  customerName: string;
  customerEmail: string;
  currency: string;
  notes: string | null;
  subtotalInCents: number;
  discountInCents: number;
  totalInCents: number;
  validUntil: string;
  status: QuoteStatus;
  sentAt: Date | null;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: DashboardQuoteItem[];
  activities: DashboardQuoteActivity[];
  linkedInquiry: QuoteLinkedInquirySummary | null;
};

export type QuoteEditorLineItemValue = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

export type QuoteEditorValues = {
  title: string;
  customerName: string;
  customerEmail: string;
  notes: string;
  validUntil: string;
  discount: string;
  items: QuoteEditorLineItemValue[];
};

export type QuoteEditorFieldName =
  | "title"
  | "customerName"
  | "customerEmail"
  | "notes"
  | "validUntil"
  | "discount"
  | "items";

export type QuoteEditorFieldErrors = Partial<
  Record<QuoteEditorFieldName, string[] | undefined>
>;

export type QuoteEditorActionState = {
  error?: string;
  success?: string;
  fieldErrors?: QuoteEditorFieldErrors;
};

export type QuoteStatusActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"status", string[] | undefined>>;
};

export type QuoteSendActionState = {
  error?: string;
  success?: string;
};
