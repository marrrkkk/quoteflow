import type { CustomerHistoryInput, DetailCompletenessInput, QuoteLibraryMatchInput, SignalScore, Temperature } from "./types";
import { computeTokenOverlap } from "./duplicate-detection";

/**
 * Extracts the first numeric value from a budget text string.
 * Handles formats like "$500", "around 3000", "$10,000", "5k", etc.
 * Strips currency symbols, commas, and surrounding text.
 */
function parseNumericBudget(text: string): number | null {
  // Remove currency symbols and commas, then find the first number
  const cleaned = text.replace(/[$€£¥]/g, "").replace(/,/g, "");
  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  return isNaN(value) ? null : value;
}

/**
 * Computes the budget_presence scoring signal.
 *
 * Scoring logic:
 * - null or empty string → 0 points, reason: null
 * - Contains text but no parseable numeric value → 5 points
 * - Contains parseable numeric value → 5 + min(20, 20 × (parsedAmount / threshold))
 *   where threshold defaults to 5000. Capped at 25 total.
 */
export function computeBudgetScore(
  budgetText: string | null,
  highBudgetThreshold: number = 5000,
): SignalScore {
  const signal = "budget_presence" as const;
  const maxPoints = 25;

  // Null or empty → 0 points
  if (!budgetText || budgetText.trim() === "") {
    return { signal, points: 0, maxPoints, reason: null };
  }

  // Try to parse a numeric value
  const parsedAmount = parseNumericBudget(budgetText);

  // Non-numeric text → 5 points (acknowledging budget intent)
  if (parsedAmount === null) {
    return {
      signal,
      points: 5,
      maxPoints,
      reason: "Budget intent stated without specific amount",
    };
  }

  // Numeric value → 5 + linear scale up to 25
  const scaledPoints = Math.min(20, 20 * (parsedAmount / highBudgetThreshold));
  const totalPoints = Math.min(maxPoints, 5 + scaledPoints);

  return {
    signal,
    points: Math.round(totalPoints * 100) / 100, // avoid floating point noise
    maxPoints,
    reason: `Budget of ${parsedAmount} stated`,
  };
}

/**
 * Compute the deadline urgency scoring signal based on the number of calendar days
 * between the submission date and the requested deadline.
 *
 * Step function:
 * - null deadline → 0 points
 * - ≤ 7 days → 25 points
 * - 8–14 days → 20 points
 * - 15–30 days → 15 points
 * - 31–60 days → 8 points
 * - > 60 days → 3 points
 */
export function computeDeadlineScore(
  requestedDeadline: string | null,
  submittedAt: Date,
): SignalScore {
  const signal = "deadline_urgency" as const;
  const maxPoints = 25;

  if (requestedDeadline === null) {
    return { signal, points: 0, maxPoints, reason: null };
  }

  const deadlineDate = new Date(requestedDeadline);
  const days = computeCalendarDays(submittedAt, deadlineDate);

  let points: number;
  let reason: string;

  if (days <= 7) {
    points = 25;
    reason = `Deadline within 7 days (${days} days)`;
  } else if (days <= 14) {
    points = 20;
    reason = `Deadline within 8–14 days (${days} days)`;
  } else if (days <= 30) {
    points = 15;
    reason = `Deadline within 15–30 days (${days} days)`;
  } else if (days <= 60) {
    points = 8;
    reason = `Deadline within 31–60 days (${days} days)`;
  } else {
    points = 3;
    reason = `Deadline more than 60 days away (${days} days)`;
  }

  return { signal, points, maxPoints, reason };
}

/**
 * Compute the number of calendar days between two dates.
 * Uses UTC dates to avoid timezone issues with day boundaries.
 */
function computeCalendarDays(from: Date, to: Date): number {
  const msPerDay = 86_400_000;
  const fromUtcDay = Math.floor(from.getTime() / msPerDay);
  const toUtcDay = Math.floor(to.getTime() / msPerDay);
  return toUtcDay - fromUtcDay;
}

/**
 * Computes the pricing_match scoring signal.
 *
 * Scoring logic:
 * 1. If quoteLibraryEntries is empty (length 0), return 0 points.
 * 2. Category match score: If serviceCategory matches the name of any entry
 *    (case-insensitive), score = 15.
 * 3. Text overlap score: For each entry, compute token overlap between
 *    (serviceCategory + " " + details) and (entry.name + " " + entry.itemDescriptions.join(" ")).
 *    If highest overlap > 30%, score = 5 + proportional scaling up to 20
 *    (at 100% overlap → 20 points, at 30% → 5 points, linear between).
 * 4. Final score: max(categoryMatchScore, textOverlapScore), capped at 20.
 */
export function computePricingMatchScore(
  serviceCategory: string,
  details: string,
  quoteLibraryEntries: QuoteLibraryMatchInput[],
): SignalScore {
  const signal = "pricing_match" as const;
  const maxPoints = 20;

  // Empty library → 0 points
  if (quoteLibraryEntries.length === 0) {
    return { signal, points: 0, maxPoints, reason: null };
  }

  // Category match score: 15 if serviceCategory matches any entry name (case-insensitive)
  const normalizedCategory = serviceCategory.toLowerCase().trim();
  let categoryMatchScore = 0;
  for (const entry of quoteLibraryEntries) {
    if (entry.name.toLowerCase().trim() === normalizedCategory) {
      categoryMatchScore = 15;
      break;
    }
  }

  // Text overlap score: compute token overlap for each entry, take the highest
  const inquiryText = serviceCategory + " " + details;
  let highestOverlap = 0;

  for (const entry of quoteLibraryEntries) {
    const entryText = entry.name + " " + entry.itemDescriptions.join(" ");
    const overlap = computeTokenOverlap(inquiryText, entryText);
    if (overlap > highestOverlap) {
      highestOverlap = overlap;
    }
  }

  let textOverlapScore = 0;
  if (highestOverlap > 30) {
    // Linear scale: at 30% → 5 points, at 100% → 20 points
    // score = 5 + (overlap - 30) / (100 - 30) * (20 - 5)
    textOverlapScore = 5 + ((highestOverlap - 30) / 70) * 15;
  }

  // Final score: max of both, capped at 20
  const points = Math.min(maxPoints, Math.max(categoryMatchScore, textOverlapScore));

  // Build reason
  let reason: string | null = null;
  if (categoryMatchScore > 0 && categoryMatchScore >= textOverlapScore) {
    reason = `Category "${serviceCategory}" matches pricing library entry`;
  } else if (textOverlapScore > 0) {
    reason = `Token overlap of ${Math.round(highestOverlap)}% with pricing library`;
  }

  return {
    signal,
    points: Math.round(points * 100) / 100, // avoid floating point noise
    maxPoints,
    reason,
  };
}

/**
 * Computes the detail_completeness scoring signal.
 *
 * Evaluates 7 fields for completeness:
 * - customerName: non-null and non-empty after trimming
 * - customerEmail: non-null and non-empty after trimming
 * - serviceCategory: non-null and non-empty after trimming
 * - requestedDeadline: non-null and non-empty after trimming
 * - budgetText: non-null and non-empty after trimming
 * - details: non-null, non-empty after trimming, AND at least 50 characters
 * - subject: non-null and non-empty after trimming
 *
 * Score = floor((completeCount / 7) × 15)
 */
export function computeDetailCompletenessScore(
  inquiry: DetailCompletenessInput,
): SignalScore {
  const signal = "detail_completeness" as const;
  const maxPoints = 15;
  const totalFields = 7;

  let completeCount = 0;

  // Check standard string fields (non-null and non-empty after trimming)
  if (inquiry.customerName && inquiry.customerName.trim().length > 0) {
    completeCount++;
  }
  if (inquiry.customerEmail && inquiry.customerEmail.trim().length > 0) {
    completeCount++;
  }
  if (inquiry.serviceCategory && inquiry.serviceCategory.trim().length > 0) {
    completeCount++;
  }
  if (inquiry.requestedDeadline && inquiry.requestedDeadline.trim().length > 0) {
    completeCount++;
  }
  if (inquiry.budgetText && inquiry.budgetText.trim().length > 0) {
    completeCount++;
  }
  if (inquiry.subject && inquiry.subject.trim().length > 0) {
    completeCount++;
  }

  // Details field has additional minimum length requirement (50 chars)
  if (
    inquiry.details &&
    inquiry.details.trim().length >= 50
  ) {
    completeCount++;
  }

  const points = Math.floor((completeCount / totalFields) * maxPoints);

  return {
    signal,
    points,
    maxPoints,
    reason:
      completeCount === 0
        ? null
        : `${completeCount} of ${totalFields} fields complete`,
  };
}

/**
 * Compute the customer_history scoring signal based on whether the customer
 * has previous inquiries and linked quotes for the same business.
 *
 * Tier logic:
 * - null input (no email or no history available) → 0 points
 * - Previous inquiry with a linked quote → 15 points (returning customer)
 * - Previous inquiry without a linked quote → 8 points (repeat inquirer)
 * - No previous inquiry → 0 points
 */
export function computeCustomerHistoryScore(
  customerHistory: CustomerHistoryInput | null,
): SignalScore {
  const signal = "customer_history" as const;
  const maxPoints = 15;

  if (customerHistory === null) {
    return { signal, points: 0, maxPoints, reason: null };
  }

  if (!customerHistory.hasPreviousInquiry) {
    return { signal, points: 0, maxPoints, reason: "No previous inquiries" };
  }

  if (customerHistory.hasLinkedQuote) {
    return {
      signal,
      points: 15,
      maxPoints,
      reason: "Returning customer with linked quote",
    };
  }

  return {
    signal,
    points: 8,
    maxPoints,
    reason: "Previous inquiry without linked quote",
  };
}

/**
 * Computes the composite qualification score by summing all signal scores.
 * The result represents the total qualification score for an inquiry (0–100).
 */
export function computeCompositeScore(signals: SignalScore[]): number {
  return signals.reduce((sum, signal) => sum + signal.points, 0);
}

/**
 * Classifies the inquiry temperature based on the composite score.
 *
 * Classification:
 * - "hot" when score ≥ 70
 * - "warm" when score is between 40 and 69 inclusive
 * - "cold" when score < 40
 */
export function classifyTemperature(compositeScore: number): Temperature {
  if (compositeScore >= 70) return "hot";
  if (compositeScore >= 40) return "warm";
  return "cold";
}
