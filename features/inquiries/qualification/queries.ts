import { and, eq, gte, isNull, ne } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { inquiries, quotes } from "@/lib/db/schema";
import type {
  CustomerHistoryInput,
  RecentInquiryInput,
} from "@/features/inquiries/qualification/types";

/**
 * Fetch customer history for scoring.
 *
 * Checks whether the customer (by email) has submitted previous inquiries
 * for the same business, and whether any of those inquiries have a linked quote.
 */
export async function getCustomerHistoryForScoring(input: {
  businessId: string;
  customerEmail: string;
  excludeInquiryId: string;
}): Promise<CustomerHistoryInput> {
  const { businessId, customerEmail, excludeInquiryId } = input;

  // Find at least one previous inquiry from the same email for the same business
  const [previousInquiry] = await db
    .select({ id: inquiries.id })
    .from(inquiries)
    .where(
      and(
        eq(inquiries.businessId, businessId),
        eq(inquiries.customerEmail, customerEmail),
        ne(inquiries.id, excludeInquiryId),
        isNull(inquiries.deletedAt),
      ),
    )
    .limit(1);

  if (!previousInquiry) {
    return { hasPreviousInquiry: false, hasLinkedQuote: false };
  }

  // Check if any previous inquiry from this customer has a linked quote
  const [linkedQuote] = await db
    .select({ id: quotes.id })
    .from(quotes)
    .innerJoin(inquiries, eq(quotes.inquiryId, inquiries.id))
    .where(
      and(
        eq(inquiries.businessId, businessId),
        eq(inquiries.customerEmail, customerEmail),
        ne(inquiries.id, excludeInquiryId),
        isNull(inquiries.deletedAt),
        isNull(quotes.deletedAt),
      ),
    )
    .limit(1);

  return {
    hasPreviousInquiry: true,
    hasLinkedQuote: !!linkedQuote,
  };
}

/**
 * Fetch recent inquiries from the same email for duplicate detection.
 *
 * Returns inquiries from the same customerEmail for the same business
 * within the last `windowDays` days, excluding the current inquiry.
 */
export async function getRecentInquiriesForDuplicateCheck(input: {
  businessId: string;
  customerEmail: string;
  excludeInquiryId: string;
  windowDays: number;
}): Promise<RecentInquiryInput[]> {
  const { businessId, customerEmail, excludeInquiryId, windowDays } = input;

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - windowDays);

  const rows = await db
    .select({
      id: inquiries.id,
      details: inquiries.details,
      submittedAt: inquiries.submittedAt,
      customerEmail: inquiries.customerEmail,
    })
    .from(inquiries)
    .where(
      and(
        eq(inquiries.businessId, businessId),
        eq(inquiries.customerEmail, customerEmail),
        ne(inquiries.id, excludeInquiryId),
        gte(inquiries.submittedAt, windowStart),
        isNull(inquiries.deletedAt),
      ),
    );

  return rows.map((row) => ({
    id: row.id,
    details: row.details,
    submittedAt: row.submittedAt,
    customerEmail: row.customerEmail!,
  }));
}
