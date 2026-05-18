import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { inquiries, inquiryDuplicates } from "@/lib/db/schema";
import { getQuoteLibraryForBusiness } from "@/features/quotes/quote-library-queries";

import {
  computeBudgetScore,
  computeCompositeScore,
  computeCustomerHistoryScore,
  computeDeadlineScore,
  computeDetailCompletenessScore,
  computePricingMatchScore,
  classifyTemperature,
} from "./scoring";
import {
  findEmailRecencyDuplicate,
  findTextSimilarityDuplicate,
} from "./duplicate-detection";
import {
  getCustomerHistoryForScoring,
  getRecentInquiriesForDuplicateCheck,
} from "./queries";
import type {
  DuplicateFlag,
  InquiryQualificationInput,
  QualificationOutput,
  QuoteLibraryMatchInput,
} from "./types";

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

/**
 * Orchestrates the full qualification pipeline for an inquiry.
 *
 * Steps:
 * 1. Fetch quote library entries for pricing match scoring
 * 2. Fetch customer history for customer history scoring
 * 3. Fetch recent inquiries for duplicate detection
 * 4. Run all five scoring functions
 * 5. Compute composite score and classify temperature
 * 6. Run duplicate detection (email recency + text similarity)
 * 7. Persist results to the database
 * 8. Return the qualification output
 *
 * Wrapped in try/catch so failures never block inquiry creation.
 */
export async function qualifyInquiry(input: {
  inquiryId: string;
  businessId: string;
  inquiry: InquiryQualificationInput;
}): Promise<QualificationOutput> {
  const { inquiryId, businessId, inquiry } = input;

  try {
    // 1. Fetch quote library entries and map to scoring input
    const quoteLibraryEntries = await fetchQuoteLibraryForScoring(businessId);

    // 2. Fetch customer history (skip if no email)
    const customerHistory = inquiry.customerEmail
      ? await getCustomerHistoryForScoring({
          businessId,
          customerEmail: inquiry.customerEmail,
          excludeInquiryId: inquiryId,
        })
      : null;

    // 3. Fetch recent inquiries for duplicate detection (skip if no email)
    const recentInquiries = inquiry.customerEmail
      ? await getRecentInquiriesForDuplicateCheck({
          businessId,
          customerEmail: inquiry.customerEmail,
          excludeInquiryId: inquiryId,
          windowDays: 30, // Use the larger window to cover both checks
        })
      : [];

    // 4. Run all five scoring functions
    const budgetSignal = computeBudgetScore(inquiry.budgetText);
    const deadlineSignal = computeDeadlineScore(
      inquiry.requestedDeadline,
      inquiry.submittedAt,
    );
    const pricingMatchSignal = computePricingMatchScore(
      inquiry.serviceCategory,
      inquiry.details,
      quoteLibraryEntries,
    );
    const customerHistorySignal = computeCustomerHistoryScore(customerHistory);
    const detailCompletenessSignal = computeDetailCompletenessScore(inquiry);

    const signals = [
      budgetSignal,
      deadlineSignal,
      pricingMatchSignal,
      customerHistorySignal,
      detailCompletenessSignal,
    ];

    // 5. Compute composite score and classify temperature
    const compositeScore = computeCompositeScore(signals);
    const temperature = classifyTemperature(compositeScore);

    // 6. Run duplicate detection
    const duplicate = detectDuplicate(inquiry, recentInquiries);

    // 7. Persist results to the database
    const now = new Date();

    await db
      .update(inquiries)
      .set({
        qualificationScore: Math.round(compositeScore),
        qualificationTemperature: temperature,
        qualificationSignals: signals,
        qualifiedAt: now,
      })
      .where(eq(inquiries.id, inquiryId));

    if (duplicate) {
      await db.insert(inquiryDuplicates).values({
        id: createId("dup"),
        businessId,
        inquiryId,
        originalInquiryId: duplicate.originalInquiryId,
        reason: duplicate.reason,
        tokenOverlap: duplicate.tokenOverlap
          ? Math.round(duplicate.tokenOverlap)
          : null,
      });
    }

    // 8. Return the qualification output
    return {
      qualification: {
        compositeScore: Math.round(compositeScore),
        temperature,
        signals,
      },
      duplicate,
    };
  } catch (error) {
    console.error("Inquiry qualification failed:", {
      inquiryId,
      businessId,
      error,
    });

    return { qualification: null, duplicate: null };
  }
}

/**
 * Fetches quote library entries and maps them to the scoring input format.
 */
async function fetchQuoteLibraryForScoring(
  businessId: string,
): Promise<QuoteLibraryMatchInput[]> {
  const entries = await getQuoteLibraryForBusiness(businessId);

  return entries.map((entry) => ({
    name: entry.name,
    itemDescriptions: entry.items.map((item) => item.description),
  }));
}

/**
 * Runs both duplicate detection checks and combines results into a single
 * DuplicateFlag if either matches.
 */
function detectDuplicate(
  inquiry: InquiryQualificationInput,
  recentInquiries: { id: string; details: string; submittedAt: Date; customerEmail: string }[],
): DuplicateFlag | null {
  const emailDuplicateId = findEmailRecencyDuplicate(
    inquiry.customerEmail,
    recentInquiries,
    inquiry.submittedAt,
  );

  const textDuplicate = findTextSimilarityDuplicate(
    inquiry.details,
    inquiry.customerEmail,
    recentInquiries,
    inquiry.submittedAt,
  );

  if (!emailDuplicateId && !textDuplicate) {
    return null;
  }

  // Determine the reason and original inquiry ID
  if (emailDuplicateId && textDuplicate) {
    // Both matched — use the email recency match as the primary reference
    // since it's the stronger signal (same email within 7 days)
    return {
      originalInquiryId: emailDuplicateId,
      reason: "both",
      tokenOverlap: textDuplicate.overlap,
    };
  }

  if (emailDuplicateId) {
    return {
      originalInquiryId: emailDuplicateId,
      reason: "email_recency",
      tokenOverlap: null,
    };
  }

  // textDuplicate is guaranteed non-null here
  return {
    originalInquiryId: textDuplicate!.inquiryId,
    reason: "text_similarity",
    tokenOverlap: textDuplicate!.overlap,
  };
}
