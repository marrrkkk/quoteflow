import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { activityLogs, replySnippets } from "@/lib/db/schema";
import type { ReplySnippetInput } from "@/features/inquiries/reply-snippet-schemas";

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

type CreateReplySnippetForBusinessInput = {
  businessId: string;
  actorUserId: string;
  snippet: ReplySnippetInput;
};

export async function createReplySnippetForBusiness({
  businessId,
  actorUserId,
  snippet,
}: CreateReplySnippetForBusinessInput) {
  const snippetId = createId("rsn");
  const now = new Date();

  return db.transaction(async (tx) => {
    await tx.insert(replySnippets).values({
      id: snippetId,
      businessId,
      title: snippet.title,
      body: snippet.body,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(activityLogs).values({
      id: createId("act"),
      businessId,
      actorUserId,
      type: "reply_snippet.created",
      summary: `Reply snippet ${snippet.title} created.`,
      metadata: {
        replySnippetId: snippetId,
        title: snippet.title,
      },
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: snippetId,
    };
  });
}

type UpdateReplySnippetForBusinessInput = {
  businessId: string;
  actorUserId: string;
  replySnippetId: string;
  snippet: ReplySnippetInput;
};

export async function updateReplySnippetForBusiness({
  businessId,
  actorUserId,
  replySnippetId,
  snippet,
}: UpdateReplySnippetForBusinessInput) {
  const now = new Date();

  return db.transaction(async (tx) => {
    const [existingSnippet] = await tx
      .select({
        id: replySnippets.id,
      })
      .from(replySnippets)
      .where(
        and(
          eq(replySnippets.businessId, businessId),
          eq(replySnippets.id, replySnippetId),
        ),
      )
      .limit(1);

    if (!existingSnippet) {
      return null;
    }

    await tx
      .update(replySnippets)
      .set({
        title: snippet.title,
        body: snippet.body,
        updatedAt: now,
      })
      .where(
        and(
          eq(replySnippets.businessId, businessId),
          eq(replySnippets.id, replySnippetId),
        ),
      );

    await tx.insert(activityLogs).values({
      id: createId("act"),
      businessId,
      actorUserId,
      type: "reply_snippet.updated",
      summary: `Reply snippet ${snippet.title} updated.`,
      metadata: {
        replySnippetId,
        title: snippet.title,
      },
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: replySnippetId,
    };
  });
}

type DeleteReplySnippetForBusinessInput = {
  businessId: string;
  actorUserId: string;
  replySnippetId: string;
};

export async function deleteReplySnippetForBusiness({
  businessId,
  actorUserId,
  replySnippetId,
}: DeleteReplySnippetForBusinessInput) {
  const now = new Date();

  return db.transaction(async (tx) => {
    const [existingSnippet] = await tx
      .select({
        id: replySnippets.id,
        title: replySnippets.title,
      })
      .from(replySnippets)
      .where(
        and(
          eq(replySnippets.businessId, businessId),
          eq(replySnippets.id, replySnippetId),
        ),
      )
      .limit(1);

    if (!existingSnippet) {
      return null;
    }

    await tx
      .delete(replySnippets)
      .where(
        and(
          eq(replySnippets.businessId, businessId),
          eq(replySnippets.id, replySnippetId),
        ),
      );

    await tx.insert(activityLogs).values({
      id: createId("act"),
      businessId,
      actorUserId,
      type: "reply_snippet.deleted",
      summary: `Reply snippet ${existingSnippet.title} deleted.`,
      metadata: {
        replySnippetId,
        title: existingSnippet.title,
      },
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: replySnippetId,
    };
  });
}
