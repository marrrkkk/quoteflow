import "server-only";

import { randomUUID } from "node:crypto";

import { and, desc, eq, sql } from "drizzle-orm";

import type {
  InquiryMessage,
  InquiryMessageRole,
  InquiryMessageStatus,
} from "@/features/ai/types";
import type { AiChatMessage, AiProviderName } from "@/lib/ai";
import { db } from "@/lib/db/client";
import { inquiries, inquiryMessages } from "@/lib/db/schema";

const aiProviderNames = new Set<AiProviderName>([
  "groq",
  "gemini",
  "openrouter",
]);

type InquiryMessageCursor = {
  createdAt: Date;
  id: string;
};

type InquiryMessageRow = typeof inquiryMessages.$inferSelect;

type CreateInquiryMessageInput = {
  businessId: string;
  inquiryId: string;
  role: InquiryMessageRole;
  content: string;
  provider?: AiProviderName | null;
  model?: string | null;
  status?: InquiryMessageStatus;
  metadata?: Record<string, unknown>;
};

type UpdateInquiryAssistantMessageInput = {
  businessId: string;
  inquiryId: string;
  messageId: string;
  content?: string;
  provider?: AiProviderName | null;
  model?: string | null;
  status: Extract<InquiryMessageStatus, "completed" | "failed">;
  metadata?: Record<string, unknown>;
};

function createId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

function normalizeProvider(value: string | null): AiProviderName | null {
  if (!value) {
    return null;
  }

  return aiProviderNames.has(value as AiProviderName)
    ? (value as AiProviderName)
    : null;
}

function toInquiryMessage(row: InquiryMessageRow): InquiryMessage {
  return {
    id: row.id,
    inquiryId: row.inquiryId,
    role: row.role,
    content: row.content,
    provider: normalizeProvider(row.provider),
    model: row.model,
    status: row.status,
    metadata: row.metadata ?? {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function encodeInquiryMessageCursor(input: {
  createdAt: Date | string;
  id: string;
}) {
  const createdAt =
    typeof input.createdAt === "string"
      ? input.createdAt
      : input.createdAt.toISOString();

  return Buffer.from(
    JSON.stringify({
      createdAt,
      id: input.id,
    }),
  ).toString("base64url");
}

export function decodeInquiryMessageCursor(
  value: string,
): { ok: true; cursor: InquiryMessageCursor } | { ok: false } {
  try {
    const decoded = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as {
      createdAt?: unknown;
      id?: unknown;
    };

    if (typeof decoded.createdAt !== "string" || typeof decoded.id !== "string") {
      return { ok: false };
    }

    const createdAt = new Date(decoded.createdAt);

    if (Number.isNaN(createdAt.getTime()) || !decoded.id.trim()) {
      return { ok: false };
    }

    return {
      ok: true,
      cursor: {
        createdAt,
        id: decoded.id,
      },
    };
  } catch {
    return { ok: false };
  }
}

export async function inquiryBelongsToBusiness(input: {
  businessId: string;
  inquiryId: string;
}) {
  const [inquiry] = await db
    .select({ id: inquiries.id })
    .from(inquiries)
    .where(
      and(
        eq(inquiries.id, input.inquiryId),
        eq(inquiries.businessId, input.businessId),
      ),
    )
    .limit(1);

  return Boolean(inquiry);
}

export async function getPaginatedInquiryMessagesForBusiness({
  businessId,
  inquiryId,
  limit,
  before,
}: {
  businessId: string;
  inquiryId: string;
  limit: number;
  before?: InquiryMessageCursor | null;
}) {
  const boundedLimit = Math.min(Math.max(limit, 1), 50);
  const beforeCondition = before
    ? sql`(${inquiryMessages.createdAt}, ${inquiryMessages.id}) < (${before.createdAt}::timestamptz, ${before.id})`
    : undefined;

  const rawRows = await db
    .select({
      id: inquiryMessages.id,
      inquiryId: inquiryMessages.inquiryId,
      role: inquiryMessages.role,
      content: inquiryMessages.content,
      provider: inquiryMessages.provider,
      model: inquiryMessages.model,
      status: inquiryMessages.status,
      metadata: inquiryMessages.metadata,
      createdAt: inquiryMessages.createdAt,
      updatedAt: inquiryMessages.updatedAt,
    })
    .from(inquiryMessages)
    .innerJoin(inquiries, eq(inquiryMessages.inquiryId, inquiries.id))
    .where(
      and(
        eq(inquiries.businessId, businessId),
        eq(inquiryMessages.inquiryId, inquiryId),
        beforeCondition,
      ),
    )
    .orderBy(desc(inquiryMessages.createdAt), desc(inquiryMessages.id))
    .limit(boundedLimit + 1);

  const hasMore = rawRows.length > boundedLimit;
  const rows = (hasMore ? rawRows.slice(0, boundedLimit) : rawRows).reverse();
  const oldest = rows[0];

  return {
    messages: rows.map(toInquiryMessage),
    nextCursor:
      hasMore && oldest
        ? encodeInquiryMessageCursor({
            createdAt: oldest.createdAt,
            id: oldest.id,
          })
        : null,
    hasMore,
  };
}

export async function getRecentCompletedInquiryMessagesForBusiness({
  businessId,
  inquiryId,
  limit = 20,
}: {
  businessId: string;
  inquiryId: string;
  limit?: number;
}) {
  const boundedLimit = Math.min(Math.max(limit, 1), 50);

  const rows = await db
    .select({
      id: inquiryMessages.id,
      inquiryId: inquiryMessages.inquiryId,
      role: inquiryMessages.role,
      content: inquiryMessages.content,
      provider: inquiryMessages.provider,
      model: inquiryMessages.model,
      status: inquiryMessages.status,
      metadata: inquiryMessages.metadata,
      createdAt: inquiryMessages.createdAt,
      updatedAt: inquiryMessages.updatedAt,
    })
    .from(inquiryMessages)
    .innerJoin(inquiries, eq(inquiryMessages.inquiryId, inquiries.id))
    .where(
      and(
        eq(inquiries.businessId, businessId),
        eq(inquiryMessages.inquiryId, inquiryId),
        eq(inquiryMessages.status, "completed"),
      ),
    )
    .orderBy(desc(inquiryMessages.createdAt), desc(inquiryMessages.id))
    .limit(boundedLimit);

  return rows.reverse().map(toInquiryMessage);
}

export function toAiChatHistory(
  messages: InquiryMessage[],
  excludeMessageId?: string,
): AiChatMessage[] {
  return messages
    .filter(
      (message) =>
        message.id !== excludeMessageId &&
        message.status === "completed" &&
        message.content.trim().length > 0,
    )
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

export async function createInquiryMessageForBusiness(
  input: CreateInquiryMessageInput,
) {
  const hasAccess = await inquiryBelongsToBusiness(input);

  if (!hasAccess) {
    return null;
  }

  const now = new Date();
  const [message] = await db
    .insert(inquiryMessages)
    .values({
      id: createId("imsg"),
      inquiryId: input.inquiryId,
      role: input.role,
      content: input.content,
      provider: input.provider ?? null,
      model: input.model ?? null,
      status: input.status ?? "completed",
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return message ? toInquiryMessage(message) : null;
}

export function createInquiryUserMessageForBusiness(input: {
  businessId: string;
  inquiryId: string;
  content: string;
  metadata?: Record<string, unknown>;
}) {
  return createInquiryMessageForBusiness({
    ...input,
    role: "user",
    status: "completed",
  });
}

export function createInquiryAssistantMessageForBusiness(input: {
  businessId: string;
  inquiryId: string;
  content?: string;
  provider?: AiProviderName | null;
  model?: string | null;
  status?: InquiryMessageStatus;
  metadata?: Record<string, unknown>;
}) {
  return createInquiryMessageForBusiness({
    ...input,
    role: "assistant",
    content: input.content ?? "",
    status: input.status ?? "generating",
  });
}

export async function updateInquiryAssistantMessageForBusiness(
  input: UpdateInquiryAssistantMessageInput,
) {
  const [existing] = await db
    .select({
      id: inquiryMessages.id,
      metadata: inquiryMessages.metadata,
    })
    .from(inquiryMessages)
    .innerJoin(inquiries, eq(inquiryMessages.inquiryId, inquiries.id))
    .where(
      and(
        eq(inquiries.businessId, input.businessId),
        eq(inquiryMessages.inquiryId, input.inquiryId),
        eq(inquiryMessages.id, input.messageId),
        eq(inquiryMessages.role, "assistant"),
      ),
    )
    .limit(1);

  if (!existing) {
    return null;
  }

  const now = new Date();
  const [message] = await db
    .update(inquiryMessages)
    .set({
      content: input.content,
      provider: input.provider ?? null,
      model: input.model ?? null,
      status: input.status,
      metadata: {
        ...(existing.metadata ?? {}),
        ...(input.metadata ?? {}),
      },
      updatedAt: now,
    })
    .where(eq(inquiryMessages.id, input.messageId))
    .returning();

  return message ? toInquiryMessage(message) : null;
}
