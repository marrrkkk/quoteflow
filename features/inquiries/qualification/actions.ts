"use server";

import { updateTag } from "next/cache";

import {
  getBusinessInquiryDetailCacheTags,
} from "@/lib/cache/business-tags";
import { getWorkspaceBusinessActionContext } from "@/lib/db/business-access";
import { db } from "@/lib/db/client";
import { inquiryDuplicates } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Dismiss a duplicate warning for an inquiry.
 * Persists the dismissal so the warning does not reappear.
 */
export async function dismissDuplicateWarningAction(
  duplicateId: string,
  businessId: string,
  inquiryId: string,
): Promise<void> {
  const { userId } = await getWorkspaceBusinessActionContext(businessId);

  await db
    .update(inquiryDuplicates)
    .set({
      dismissedAt: new Date(),
      dismissedBy: userId,
    })
    .where(
      and(
        eq(inquiryDuplicates.id, duplicateId),
        eq(inquiryDuplicates.businessId, businessId),
      ),
    );

  const tags = getBusinessInquiryDetailCacheTags(businessId, inquiryId);
  for (const tag of tags) {
    updateTag(tag);
  }
}
