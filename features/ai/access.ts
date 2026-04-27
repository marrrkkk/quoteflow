import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { getConversationByIdForUser } from "@/features/ai/conversations";
import type { AiConversation, AiSurface } from "@/features/ai/types";
import { getBusinessContextForMembershipSlug } from "@/lib/db/business-access";
import type { BusinessContext } from "@/lib/db/business-access";
import { db } from "@/lib/db/client";
import {
  businessMembers,
  businesses,
  inquiries,
  quotes,
} from "@/lib/db/schema";

export type AiSurfaceAccess = {
  userId: string;
  workspaceId: string;
  businessContext: BusinessContext;
  surface: AiSurface;
  entityId: string;
  title: string;
};

export type AiAuthorizedConversation = {
  conversation: AiConversation;
  businessId: string | null;
  businessSlug: string | null;
};

export async function resolveAiSurfaceAccess({
  userId,
  businessSlug,
  surface,
  entityId,
}: {
  userId: string;
  businessSlug: string;
  surface: AiSurface;
  entityId: string;
}): Promise<AiSurfaceAccess | null> {
  const businessContext = await getBusinessContextForMembershipSlug(
    userId,
    businessSlug,
    false,
  );

  if (!businessContext) {
    return null;
  }

  if (surface === "dashboard") {
    if (entityId !== "global" && entityId !== businessContext.business.id) {
      return null;
    }

    return {
      userId,
      workspaceId: businessContext.business.workspaceId,
      businessContext,
      surface,
      entityId: "global",
      title: "New dashboard chat",
    };
  }

  if (surface === "inquiry") {
    const [inquiry] = await db
      .select({
        id: inquiries.id,
        subject: inquiries.subject,
        customerName: inquiries.customerName,
      })
      .from(inquiries)
      .where(
        and(
          eq(inquiries.id, entityId),
          eq(inquiries.businessId, businessContext.business.id),
        ),
      )
      .limit(1);

    if (!inquiry) {
      return null;
    }

    return {
      userId,
      workspaceId: businessContext.business.workspaceId,
      businessContext,
      surface,
      entityId,
      title: inquiry.subject?.trim() || `${inquiry.customerName} inquiry`,
    };
  }

  const [quote] = await db
    .select({
      id: quotes.id,
      quoteNumber: quotes.quoteNumber,
      title: quotes.title,
    })
    .from(quotes)
    .where(
      and(
        eq(quotes.id, entityId),
        eq(quotes.businessId, businessContext.business.id),
      ),
    )
    .limit(1);

  if (!quote) {
    return null;
  }

  return {
    userId,
    workspaceId: businessContext.business.workspaceId,
    businessContext,
    surface,
    entityId,
    title: quote.title?.trim() || quote.quoteNumber || "Quote Chat",
  };
}

export async function getAuthorizedAiConversation({
  userId,
  conversationId,
}: {
  userId: string;
  conversationId: string;
}): Promise<AiAuthorizedConversation | null> {
  const conversation = await getConversationByIdForUser({
    userId,
    conversationId,
  });

  if (!conversation) {
    return null;
  }

  if (conversation.surface === "dashboard") {
    const [membership] = await db
      .select({
        businessId: businesses.id,
        businessSlug: businesses.slug,
      })
      .from(businesses)
      .innerJoin(businessMembers, eq(businesses.id, businessMembers.businessId))
      .where(
        and(
          conversation.entityId === "global"
            ? eq(businesses.workspaceId, conversation.workspaceId)
            : eq(businesses.id, conversation.entityId),
          eq(businessMembers.userId, userId),
          isNull(businesses.deletedAt),
        ),
      )
      .limit(1);

    return membership
      ? {
          conversation,
          businessId: membership.businessId,
          businessSlug: membership.businessSlug,
        }
      : null;
  }

  if (conversation.surface === "inquiry") {
    const [row] = await db
      .select({
        businessId: businesses.id,
        businessSlug: businesses.slug,
      })
      .from(inquiries)
      .innerJoin(businesses, eq(inquiries.businessId, businesses.id))
      .innerJoin(businessMembers, eq(businesses.id, businessMembers.businessId))
      .where(
        and(
          eq(inquiries.id, conversation.entityId),
          eq(businesses.workspaceId, conversation.workspaceId),
          eq(businessMembers.userId, userId),
          isNull(businesses.deletedAt),
        ),
      )
      .limit(1);

    return row
      ? {
          conversation,
          businessId: row.businessId,
          businessSlug: row.businessSlug,
        }
      : null;
  }

  const [row] = await db
    .select({
      businessId: businesses.id,
      businessSlug: businesses.slug,
    })
    .from(quotes)
    .innerJoin(businesses, eq(quotes.businessId, businesses.id))
    .innerJoin(businessMembers, eq(businesses.id, businessMembers.businessId))
    .where(
      and(
        eq(quotes.id, conversation.entityId),
        eq(businesses.workspaceId, conversation.workspaceId),
        eq(businessMembers.userId, userId),
        isNull(businesses.deletedAt),
      ),
    )
    .limit(1);

  return row
    ? {
        conversation,
        businessId: row.businessId,
        businessSlug: row.businessSlug,
      }
    : null;
}

export function conversationMatchesSurface(input: {
  conversation: AiConversation;
  workspaceId: string;
  surface: AiSurface;
  entityId: string;
}) {
  return (
    input.conversation.workspaceId === input.workspaceId &&
    input.conversation.surface === input.surface &&
    input.conversation.entityId === input.entityId
  );
}
