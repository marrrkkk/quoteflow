import { NextResponse } from "next/server";

import {
  verifyLemonSqueezyWebhookSignature,
  mapLemonSqueezyStatus,
} from "@/lib/billing/providers/lemonsqueezy";
import {
  recordWebhookEvent,
  markEventProcessed,
  recordPaymentAttempt,
} from "@/lib/billing/webhook-processor";
import {
  activateSubscription,
  updateSubscriptionStatus,
  expireSubscription,
} from "@/lib/billing/subscription-service";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  // 1. Verify signature
  if (!verifyLemonSqueezyWebhookSignature(rawBody, signature)) {
    console.error("[LemonSqueezy Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 2. Parse payload
  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const meta = payload.meta as Record<string, unknown> | undefined;
  const eventName = meta?.event_name as string | undefined;

  if (!eventName) {
    return NextResponse.json({ error: "Missing event name" }, { status: 400 });
  }

  // 3. Extract custom data
  const customData = meta?.custom_data as Record<string, string> | undefined;
  const workspaceId = customData?.workspace_id;
  const plan = customData?.plan;

  // Extract subscription data
  const data = payload.data as Record<string, unknown> | undefined;
  const subscriptionId = data?.id as string | undefined;
  const attributes = data?.attributes as Record<string, unknown> | undefined;
  const lsStatus = attributes?.status as string | undefined;
  const customerId = attributes?.customer_id as number | undefined;
  const renewsAt = attributes?.renews_at as string | null | undefined;
  const endsAt = attributes?.ends_at as string | null | undefined;

  // 4. Idempotency check — use a composite ID since LS doesn't provide event IDs
  const providerEventId = `ls_${eventName}_${subscriptionId ?? "unknown"}_${Date.now()}`;

  const { isNew, eventId: storedEventId } = await recordWebhookEvent({
    providerEventId,
    provider: "lemonsqueezy",
    eventType: eventName,
    workspaceId: workspaceId ?? null,
    payload,
  });

  if (!isNew) {
    return NextResponse.json({ message: "Event already processed" });
  }

  // 5. Process event
  try {
    switch (eventName) {
      case "subscription_created": {
        if (!workspaceId || !plan || !subscriptionId) {
          console.warn("[LemonSqueezy Webhook] Missing data for subscription_created");
          break;
        }

        const periodEnd = renewsAt ? new Date(renewsAt) : null;

        await activateSubscription({
          workspaceId,
          plan: plan as "pro" | "business",
          provider: "lemonsqueezy",
          currency: "USD",
          status: mapLemonSqueezyStatus(lsStatus ?? "active"),
          providerSubscriptionId: subscriptionId,
          providerCustomerId: customerId?.toString() ?? null,
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
        });

        // Record payment
        const firstAmount = plan === "pro" ? 499 : 999;
        await recordPaymentAttempt({
          workspaceId,
          plan,
          provider: "lemonsqueezy",
          providerPaymentId: `ls_sub_${subscriptionId}`,
          amount: firstAmount,
          currency: "USD",
          status: "succeeded",
        });

        console.log(
          `[LemonSqueezy Webhook] Subscription created: ${plan} for workspace ${workspaceId}`,
        );
        break;
      }

      case "subscription_updated": {
        if (!workspaceId || !subscriptionId) {
          // Try to find workspace by subscription ID
          console.warn("[LemonSqueezy Webhook] Missing workspaceId for subscription_updated");
          break;
        }

        const status = mapLemonSqueezyStatus(lsStatus ?? "active");
        const periodEnd = renewsAt ? new Date(renewsAt) : null;

        await updateSubscriptionStatus(workspaceId, status, {
          providerSubscriptionId: subscriptionId,
          currentPeriodEnd: periodEnd,
        });

        console.log(
          `[LemonSqueezy Webhook] Subscription updated: ${lsStatus} for workspace ${workspaceId}`,
        );
        break;
      }

      case "subscription_cancelled": {
        if (!workspaceId) {
          break;
        }

        const endsAtDate = endsAt ? new Date(endsAt) : null;

        await updateSubscriptionStatus(workspaceId, "canceled", {
          canceledAt: new Date(),
          currentPeriodEnd: endsAtDate,
        });

        console.log(
          `[LemonSqueezy Webhook] Subscription cancelled for workspace ${workspaceId}`,
        );
        break;
      }

      case "subscription_expired": {
        if (!workspaceId) {
          break;
        }

        await expireSubscription(workspaceId);

        console.log(
          `[LemonSqueezy Webhook] Subscription expired for workspace ${workspaceId}`,
        );
        break;
      }

      case "subscription_payment_success": {
        if (!workspaceId) {
          break;
        }

        // Renewal payment
        const renewalPlan = plan ?? "pro";
        const renewalAmount = renewalPlan === "pro" ? 499 : 999;

        await recordPaymentAttempt({
          workspaceId,
          plan: renewalPlan,
          provider: "lemonsqueezy",
          providerPaymentId: `ls_renewal_${subscriptionId}_${Date.now()}`,
          amount: renewalAmount,
          currency: "USD",
          status: "succeeded",
        });

        // Ensure subscription is active
        const periodEndDate = renewsAt ? new Date(renewsAt) : null;
        await updateSubscriptionStatus(workspaceId, "active", {
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEndDate,
        });

        break;
      }

      case "subscription_payment_failed": {
        if (!workspaceId) {
          break;
        }

        await updateSubscriptionStatus(workspaceId, "past_due");

        console.log(
          `[LemonSqueezy Webhook] Payment failed for workspace ${workspaceId}`,
        );
        break;
      }

      default:
        console.log(`[LemonSqueezy Webhook] Unhandled event: ${eventName}`);
    }

    await markEventProcessed(storedEventId);
  } catch (error) {
    console.error("[LemonSqueezy Webhook] Processing error:", error);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "OK" });
}
