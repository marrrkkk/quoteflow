export const inquiryStatuses = [
  "new",
  "reviewing",
  "quoted",
  "booked",
  "closed",
  "archived",
] as const;

export type InquiryStatus = (typeof inquiryStatuses)[number];
