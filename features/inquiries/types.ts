export const inquiryStatuses = [
  "new",
  "reviewing",
  "quoted",
  "booked",
  "closed",
  "archived",
] as const;

export type InquiryStatus = (typeof inquiryStatuses)[number];

export type PublicInquiryWorkspace = {
  id: string;
  name: string;
  slug: string;
  inquiryHeadline: string | null;
};

export type PublicInquiryFieldName =
  | "customerName"
  | "customerEmail"
  | "customerPhone"
  | "serviceCategory"
  | "deadline"
  | "budget"
  | "details"
  | "attachment";

export type PublicInquiryFieldErrors = Partial<
  Record<PublicInquiryFieldName, string[] | undefined>
>;

export type PublicInquiryFormState = {
  error?: string;
  success?: string;
  fieldErrors?: PublicInquiryFieldErrors;
  inquiryId?: string;
};
