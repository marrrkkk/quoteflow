import "server-only";

import { desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/lib/db/client";
import { businesses } from "@/lib/db/schema/businesses";
import { paymentAttempts } from "@/lib/db/schema/subscriptions";
import {
  getBusinessSubscription,
  resolveEffectivePlanFromSubscription,
} from "@/lib/billing/subscription-service";
import { getBillingRegion, getDefaultCurrency } from "@/lib/billing/region";
import {
  getBusinessBillingCacheTags,
  billingShellCacheLife,
} from "@/lib/cache/shell-tags";
import type { WorkspaceBillingOverview } from "@/features/billing/types";
import type { BusinessPlan } from "@/lib/plans/plans";
import type { BillingRegion } from "@/lib/billing/types";

/**
 * Cached business identity and fallback plan (no dynamic APIs like headers()).
 */
async function getCachedBusinessBillingData(businessId: string) {
  "use cache";

  cacheLife(billingShellCacheLife);
  cacheTag(...getBusinessBillingCacheTags(businessId));

  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      plan: businesses.plan,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  const biz = rows[0];

  if (!biz) {
    return null;
  }

  return {
    businessId: biz.id,
    businessName: biz.name,
    businessSlug: biz.slug,
    fallbackPlan: biz.plan as BusinessPlan,
  };
}

/**
 * Returns a full billing overview for the business billing UI.
 */
export async function getBusinessBillingOverview(
  businessId: string,
): Promise<WorkspaceBillingOverview | null> {
  try {
    const [billingData, subscription, requestHeaders] = await Promise.all([
      getCachedBusinessBillingData(businessId),
      getBusinessSubscription(businessId),
      headers(),
    ]);

    if (!billingData) {
      return null;
    }

    const region = getBillingRegion(requestHeaders);
    const defaultCurrency = getDefaultCurrency(region);
    const { fallbackPlan, ...businessBillingData } = billingData;
    const currentPlan = subscription
      ? resolveEffectivePlanFromSubscription(subscription)
      : fallbackPlan;

    return {
      ...businessBillingData,
      currentPlan,
      region,
      defaultCurrency,
      subscription: subscription
        ? {
            status: subscription.status,
            plan: subscription.plan,
            provider: subscription.billingProvider,
            currency: subscription.billingCurrency,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            canceledAt: subscription.canceledAt,
            providerSubscriptionId: subscription.providerSubscriptionId,
          }
        : null,
    };
  } catch (error) {
    console.error(
      "Failed to load business billing overview.",
      { businessId },
      error,
    );

    return null;
  }
}

/** @deprecated Use `getBusinessBillingOverview` instead. */
export const getWorkspaceBillingOverview = getBusinessBillingOverview;

/**
 * Returns payment history for a business.
 */
export async function getBusinessPaymentHistory(
  businessId: string,
  limit = 10,
) {
  return db
    .select()
    .from(paymentAttempts)
    .where(eq(paymentAttempts.businessId, businessId))
    .orderBy(desc(paymentAttempts.createdAt))
    .limit(limit);
}

/** @deprecated Use `getBusinessPaymentHistory` instead. */
export const getWorkspacePaymentHistory = getBusinessPaymentHistory;

/**
 * Detects the billing region for the current request.
 */
export async function detectBillingRegion(): Promise<BillingRegion> {
  const requestHeaders = await headers();
  return getBillingRegion(requestHeaders);
}
