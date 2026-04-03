import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import type { WorkspaceOverviewData } from "@/features/workspaces/types";
import { db } from "@/lib/db/client";
import { inquiries, quotes } from "@/lib/db/schema";
import { syncExpiredQuotesForWorkspace } from "@/features/quotes/mutations";

export async function getWorkspaceOverviewData(
  workspaceId: string,
): Promise<WorkspaceOverviewData> {
  await syncExpiredQuotesForWorkspace(workspaceId);

  const [recentInquiries, quoteAttention] = await Promise.all([
    db
      .select({
        id: inquiries.id,
        customerName: inquiries.customerName,
        customerEmail: inquiries.customerEmail,
        serviceCategory: inquiries.serviceCategory,
        status: inquiries.status,
        submittedAt: inquiries.submittedAt,
      })
      .from(inquiries)
      .where(eq(inquiries.workspaceId, workspaceId))
      .orderBy(desc(inquiries.submittedAt), desc(inquiries.createdAt))
      .limit(5),
    db
      .select({
        id: quotes.id,
        quoteNumber: quotes.quoteNumber,
        title: quotes.title,
        customerName: quotes.customerName,
        status: quotes.status,
        validUntil: quotes.validUntil,
        customerRespondedAt: quotes.customerRespondedAt,
        updatedAt: quotes.updatedAt,
      })
      .from(quotes)
      .where(
        and(
          eq(quotes.workspaceId, workspaceId),
          inArray(quotes.status, ["draft", "sent", "expired"]),
        ),
      )
      .orderBy(desc(quotes.updatedAt), desc(quotes.createdAt))
      .limit(5),
  ]);

  return {
    recentInquiries,
    quoteAttention,
  };
}
