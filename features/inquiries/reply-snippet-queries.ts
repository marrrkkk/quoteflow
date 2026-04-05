import "server-only";

import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db/client";
import { replySnippets } from "@/lib/db/schema";
import {
  getBusinessReplySnippetsCacheTags,
  settingsBusinessCacheLife,
} from "@/lib/cache/business-tags";
import type { DashboardReplySnippet } from "@/features/inquiries/reply-snippet-types";

export async function getReplySnippetsForBusiness(
  businessId: string,
): Promise<DashboardReplySnippet[]> {
  "use cache";

  cacheLife(settingsBusinessCacheLife);
  cacheTag(...getBusinessReplySnippetsCacheTags(businessId));

  return db
    .select({
      id: replySnippets.id,
      title: replySnippets.title,
      body: replySnippets.body,
      createdAt: replySnippets.createdAt,
      updatedAt: replySnippets.updatedAt,
    })
    .from(replySnippets)
    .where(eq(replySnippets.businessId, businessId))
    .orderBy(asc(replySnippets.title), asc(replySnippets.createdAt));
}
