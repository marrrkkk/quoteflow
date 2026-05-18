// Qualification Engine types for rule-based lead scoring and duplicate detection

export type ScoringSignal =
  | "budget_presence"
  | "deadline_urgency"
  | "pricing_match"
  | "customer_history"
  | "detail_completeness";

export type Temperature = "hot" | "warm" | "cold";

export type SignalScore = {
  signal: ScoringSignal;
  points: number;
  maxPoints: number;
  reason: string | null; // null when data is missing
};

export type QualificationResult = {
  compositeScore: number;
  temperature: Temperature;
  signals: SignalScore[];
};

export type DuplicateFlag = {
  originalInquiryId: string;
  reason: "email_recency" | "text_similarity" | "both";
  tokenOverlap: number | null; // percentage, null for email-only
};

export type QualificationOutput = {
  qualification: QualificationResult | null; // null on error
  duplicate: DuplicateFlag | null;
};

// --- Input types for scoring and detection functions ---

/** Represents a quote library entry for pricing match scoring */
export type QuoteLibraryMatchInput = {
  name: string;
  itemDescriptions: string[];
};

/** Represents customer history lookup result for customer history scoring */
export type CustomerHistoryInput = {
  hasPreviousInquiry: boolean;
  hasLinkedQuote: boolean;
};

/** Represents the inquiry fields needed for detail completeness scoring */
export type DetailCompletenessInput = {
  customerName: string | null;
  customerEmail: string | null;
  serviceCategory: string | null;
  requestedDeadline: string | null;
  budgetText: string | null;
  details: string | null;
  subject: string | null;
};

/** Represents a recent inquiry for duplicate detection */
export type RecentInquiryInput = {
  id: string;
  details: string;
  submittedAt: Date;
  customerEmail: string;
};

/** Represents the full inquiry input needed by the qualification orchestrator */
export type InquiryQualificationInput = {
  customerName: string | null;
  customerEmail: string | null;
  serviceCategory: string;
  requestedDeadline: string | null;
  budgetText: string | null;
  details: string;
  subject: string | null;
  submittedAt: Date;
};
