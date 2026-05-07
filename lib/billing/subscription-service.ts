import "server-only";

/**
 * Core subscription operations. All business plan state mutations go
 * through this module so the logic stays centralized.
 *
 * The business `plan` column is kept in sync as a denormalized read
 * cache. The authoritative state lives in `business_subscriptions`.
 */

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { db } from "@/lib/db/client";
import { businesses } from "@/lib/db/schema/businesses";
import { getBusinessBillingCacheTags } from "@/lib/cache/shell-tags";
import {
  businessSubscriptions,
  type BillingCurrency,
  type BillingProvider,
  type SubscriptionStatus,
} from "@/lib/db/schema/subscriptions";
import type { BusinessPlan } from "@/lib/plans/plans";

type SubscriptionRow = typeof businessSubscriptions.$inferSelect;

/* ── Read ──────────────────────────────────────────────────────────────────── */

/**
 * Returns the subscription row for a business, or `null` if no
 * subscription exists (business is implicitly free).
 */
export async function getBusinessSubscription(
  businessId: string,
): Promise<SubscriptionRow | null> {
  const [row] = await db
    .select()
    .from(businessSubscriptions)
    .where(eq(businessSubscriptions.businessId, businessId))
    .limit(1);

  return row ?? null;
}

/** @deprecated Use `getBusinessSubscription` instead. */
export const getWorkspaceSubscription = getBusinessSubscription;

/**
 * Resolves the effective plan from the subscription state.
 * Falls back to the `businesses.plan` column for backward compatibility
 * with existing free businesses that don't have a subscription row.
 */
export async function getEffectivePlan(
  businessId: string,
): Promise<BusinessPlan> {
  const subscription = await getBusinessSubscription(businessId);

  if (!subscription) {
    // No subscription row → read from business.plan (backward compat)
    const [biz] = await db
      .select({ plan: businesses.plan })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    return (biz?.plan as BusinessPlan) ?? "free";
  }

  return resolveEffectivePlanFromSubscription(subscription);
}

/**
 * Pure function that resolves the effective business plan from a
 * subscription row. Exported for unit testing.
 */
export function resolveEffectivePlanFromSubscription(
  subscription: SubscriptionRow,
): BusinessPlan {
  switch (subscription.status) {
    case "active":
      return subscription.plan as BusinessPlan;

    case "canceled":
      // Still active until end of billing period
      if (
        subscription.currentPeriodEnd &&
        subscription.currentPeriodEnd > new Date()
      ) {
        return subscription.plan as BusinessPlan;
      }
      return "free";

    case "past_due":
      // Grace period: keep paid access
      return subscription.plan as BusinessPlan;

    case "pending":
    case "expired":
    case "incomplete":
    case "free":
    default:
      return "free";
  }
}

/* ── Write ─────────────────────────────────────────────────────────────────── */

function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

type ActivateSubscriptionParams = {
  businessId: string;
  plan: BusinessPlan;
  provider: BillingProvider;
  currency: BillingCurrency;
  status?: SubscriptionStatus;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  providerCheckoutId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
};

/**
 * Creates or updates a business subscription to an active state.
 * Also syncs the business `plan` column.
 */
export async function activateSubscription(
  params: ActivateSubscriptionParams,
): Promise<SubscriptionRow> {
  const now = new Date();
  const existing = await getBusinessSubscription(params.businessId);

  let subscription: SubscriptionRow;

  if (existing) {
    const [updated] = await db
      .update(businessSubscriptions)
      .set({
        status: params.status ?? "active",
        plan: params.plan,
        billingProvider: params.provider,
        billingCurrency: params.currency,
        providerCustomerId: params.providerCustomerId ?? existing.providerCustomerId,
        providerSubscriptionId:
          params.providerSubscriptionId ?? existing.providerSubscriptionId,
        providerCheckoutId:
          params.providerCheckoutId ?? existing.providerCheckoutId,
        currentPeriodStart: params.currentPeriodStart ?? now,
        currentPeriodEnd: params.currentPeriodEnd ?? null,
        canceledAt: null,
        updatedAt: now,
      })
      .where(eq(businessSubscriptions.id, existing.id))
      .returning();

    subscription = updated!;
  } else {
    const [created] = await db
      .insert(businessSubscriptions)
      .values({
        id: generateId("sub"),
        businessId: params.businessId,
        status: params.status ?? "active",
        plan: params.plan,
        billingProvider: params.provider,
        billingCurrency: params.currency,
        providerCustomerId: params.providerCustomerId ?? null,
        providerSubscriptionId: params.providerSubscriptionId ?? null,
        providerCheckoutId: params.providerCheckoutId ?? null,
        currentPeriodStart: params.currentPeriodStart ?? now,
        currentPeriodEnd: params.currentPeriodEnd ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: businessSubscriptions.businessId,
        set: {
          status: params.status ?? "active",
          plan: params.plan,
          billingProvider: params.provider,
          billingCurrency: params.currency,
          providerCustomerId: params.providerCustomerId ?? null,
          providerSubscriptionId: params.providerSubscriptionId ?? null,
          providerCheckoutId: params.providerCheckoutId ?? null,
          currentPeriodStart: params.currentPeriodStart ?? now,
          currentPeriodEnd: params.currentPeriodEnd ?? null,
          canceledAt: null,
          updatedAt: now,
        },
      })
      .returning();

    subscription = created!;
  }

  // Sync business plan column — only upgrade when status grants access
  const effectiveStatus = params.status ?? "active";
  const planToSync =
    effectiveStatus === "active" || effectiveStatus === "past_due"
      ? params.plan
      : "free";
  await syncBusinessPlanColumn(params.businessId, planToSync);

  return subscription;
}

/**
 * Creates a pending subscription (e.g., QRPh payment awaiting scan).
 */
export async function createPendingSubscription(
  params: Omit<ActivateSubscriptionParams, "status">,
): Promise<SubscriptionRow> {
  return activateSubscription({ ...params, status: "pending" });
}

/**
 * Updates a subscription status from a provider event.
 */
export async function updateSubscriptionStatus(
  businessId: string,
  status: SubscriptionStatus,
  updates?: {
    providerSubscriptionId?: string | null;
    providerCustomerId?: string | null;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
    canceledAt?: Date | null;
  },
): Promise<SubscriptionRow | null> {
  const existing = await getBusinessSubscription(businessId);

  if (!existing) {
    return null;
  }

  const [updated] = await db
    .update(businessSubscriptions)
    .set({
      status,
      providerSubscriptionId:
        updates?.providerSubscriptionId ?? existing.providerSubscriptionId,
      providerCustomerId:
        updates?.providerCustomerId ?? existing.providerCustomerId,
      currentPeriodStart:
        updates?.currentPeriodStart ?? existing.currentPeriodStart,
      currentPeriodEnd:
        updates?.currentPeriodEnd ?? existing.currentPeriodEnd,
      canceledAt: updates?.canceledAt ?? existing.canceledAt,
      updatedAt: new Date(),
    })
    .where(eq(businessSubscriptions.id, existing.id))
    .returning();

  // Sync business plan column
  const effectivePlan = resolveEffectivePlanFromSubscription(updated!);
  await syncBusinessPlanColumn(businessId, effectivePlan);

  return updated!;
}

/**
 * Marks a subscription as canceled. The business keeps paid access
 * until `currentPeriodEnd`.
 */
export async function cancelSubscription(
  businessId: string,
): Promise<SubscriptionRow | null> {
  return updateSubscriptionStatus(businessId, "canceled", {
    canceledAt: new Date(),
  });
}

/**
 * Marks a subscription as expired and downgrades the business to free.
 */
export async function expireSubscription(
  businessId: string,
): Promise<SubscriptionRow | null> {
  return updateSubscriptionStatus(businessId, "expired");
}

/* ── Sync helper ───────────────────────────────────────────────────────────── */

/**
 * Keeps the business `plan` column in sync with the subscription state.
 * This column is used as a denormalized read cache by `lib/plans/queries.ts`.
 */
async function syncBusinessPlanColumn(
  businessId: string,
  plan: BusinessPlan,
): Promise<void> {
  await db
    .update(businesses)
    .set({ plan, updatedAt: new Date() })
    .where(eq(businesses.id, businessId));

  for (const tag of getBusinessBillingCacheTags(businessId)) {
    revalidateTag(tag, { expire: 0 });
  }
}
