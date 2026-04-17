import "server-only";

/**
 * Lemon Squeezy provider client for card/global payments.
 *
 * Uses the Lemon Squeezy REST API directly (no SDK dependency).
 * Checkout flow:
 *   1. Create checkout session with variant ID + custom data
 *   2. Redirect user to hosted checkout page
 *   3. Webhook fires with subscription lifecycle events
 */

import crypto from "crypto";

import { env } from "@/lib/env";
import type { CheckoutResult, PaidPlan, SubscriptionStatus } from "@/lib/billing/types";

const LS_API_BASE = "https://api.lemonsqueezy.com/v1";

async function lsRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${LS_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Lemon Squeezy API error ${response.status}: ${errorBody}`,
    );
  }

  return response.json() as Promise<T>;
}

/* ── Variant ID mapping ───────────────────────────────────────────────────── */

function getVariantId(plan: PaidPlan): string {
  const variantId =
    plan === "pro"
      ? env.LEMONSQUEEZY_PRO_VARIANT_ID
      : env.LEMONSQUEEZY_BUSINESS_VARIANT_ID;

  if (!variantId) {
    throw new Error(`Missing Lemon Squeezy variant ID for ${plan} plan`);
  }

  return variantId;
}

/* ── Checkout ─────────────────────────────────────────────────────────────── */

type LsCheckoutResponse = {
  data: {
    id: string;
    attributes: {
      url: string;
    };
  };
};

/**
 * Creates a hosted checkout session on Lemon Squeezy.
 */
export async function createLemonSqueezyCheckout(params: {
  plan: PaidPlan;
  workspaceId: string;
  userEmail: string;
  userName?: string;
  successUrl?: string;
}): Promise<CheckoutResult> {
  const variantId = getVariantId(params.plan);
  const storeId = env.LEMONSQUEEZY_STORE_ID;

  if (!storeId) {
    return { type: "error", message: "Payment provider not configured." };
  }

  try {
    const response = await lsRequest<LsCheckoutResponse>(
      "POST",
      "/checkouts",
      {
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: params.userEmail,
              name: params.userName,
              custom: {
                workspace_id: params.workspaceId,
                plan: params.plan,
              },
            },
            product_options: {
              redirect_url:
                params.successUrl ??
                `${env.BETTER_AUTH_URL}/workspaces?billing=success`,
            },
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: storeId,
              },
            },
            variant: {
              data: {
                type: "variants",
                id: variantId,
              },
            },
          },
        },
      },
    );

    return {
      type: "redirect",
      url: response.data.attributes.url,
    };
  } catch (error) {
    console.error("[LemonSqueezy] Checkout error:", error);
    return {
      type: "error",
      message:
        error instanceof Error
          ? error.message
          : "Payment creation failed. Please try again.",
    };
  }
}

/* ── Subscription management ──────────────────────────────────────────────── */

type LsSubscriptionResponse = {
  data: {
    id: string;
    attributes: {
      status: string;
      renews_at: string | null;
      ends_at: string | null;
      created_at: string;
      updated_at: string;
      customer_id: number;
      variant_id: number;
    };
  };
};

/**
 * Retrieves a Lemon Squeezy subscription by ID.
 */
export async function getLemonSqueezySubscription(
  subscriptionId: string,
): Promise<LsSubscriptionResponse["data"] | null> {
  try {
    const response = await lsRequest<LsSubscriptionResponse>(
      "GET",
      `/subscriptions/${subscriptionId}`,
    );
    return response.data;
  } catch {
    return null;
  }
}

/**
 * Cancels a Lemon Squeezy subscription.
 */
export async function cancelLemonSqueezySubscription(
  subscriptionId: string,
): Promise<boolean> {
  try {
    await lsRequest<LsSubscriptionResponse>(
      "DELETE",
      `/subscriptions/${subscriptionId}`,
    );
    return true;
  } catch (error) {
    console.error("[LemonSqueezy] Cancel error:", error);
    return false;
  }
}

/**
 * Resumes a canceled Lemon Squeezy subscription (if within grace period).
 */
export async function resumeLemonSqueezySubscription(
  subscriptionId: string,
): Promise<boolean> {
  try {
    await lsRequest<LsSubscriptionResponse>(
      "PATCH",
      `/subscriptions/${subscriptionId}`,
      {
        data: {
          type: "subscriptions",
          id: subscriptionId,
          attributes: {
            cancelled: false,
          },
        },
      },
    );
    return true;
  } catch (error) {
    console.error("[LemonSqueezy] Resume error:", error);
    return false;
  }
}

/* ── Webhook verification ─────────────────────────────────────────────────── */

/**
 * Verifies the Lemon Squeezy webhook signature using HMAC-SHA256.
 */
export function verifyLemonSqueezyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
): boolean {
  const secret = env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[LemonSqueezy] Missing webhook secret");
    return false;
  }

  try {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signature = Buffer.from(signatureHeader, "utf8");

    if (digest.length !== signature.length) {
      return false;
    }

    return crypto.timingSafeEqual(digest, signature);
  } catch {
    return false;
  }
}

/* ── Status mapping ───────────────────────────────────────────────────────── */

/**
 * Maps a Lemon Squeezy subscription status to internal subscription status.
 */
export function mapLemonSqueezyStatus(lsStatus: string): SubscriptionStatus {
  switch (lsStatus) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "cancelled":
      return "canceled";
    case "expired":
      return "expired";
    case "on_trial":
      return "active";
    case "unpaid":
      return "past_due";
    case "paused":
      return "canceled";
    default:
      return "incomplete";
  }
}
