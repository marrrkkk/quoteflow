import { after, NextResponse } from "next/server";

import {
  mapPaddleStatus,
  verifyPaddleWebhookSignature,
} from "@/lib/billing/providers/paddle";
import {
  markEventProcessed,
  recordPaymentAttempt,
  recordWebhookEvent,
  updatePaymentAttemptStatus,
} from "@/lib/billing/webhook-processor";
import {
  activateSubscription,
  getBusinessSubscription,
  expireSubscription,
  updateSubscriptionStatus,
} from "@/lib/billing/subscription-service";
import { writeSubscriptionTransitionAuditLogs } from "@/features/audit/subscription";


function runAfterResponse(task: () => Promise<unknown> | unknown) {
  try {
    after(task);
  } catch {
    void task();
  }
}

async function getPaddleAttempt(providerPaymentId: string) {
  const { db } = await import("@/lib/db/client");
  const { paymentAttempts } = await import("@/lib/db/schema/subscriptions");
  const { desc, eq } = await import("drizzle-orm");

  const [attempt] = await db
    .select({
      amount: paymentAttempts.amount,
      currency: paymentAttempts.currency,
      plan: paymentAttempts.plan,
      businessId: paymentAttempts.businessId,
    })
    .from(paymentAttempts)
    .where(eq(paymentAttempts.providerPaymentId, providerPaymentId))
    .orderBy(desc(paymentAttempts.createdAt))
    .limit(1);

  return attempt ?? null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("paddle-signature") ?? "";

  if (!verifyPaddleWebhookSignature(rawBody, signature)) {
    console.error("[Paddle Webhook] Invalid signature.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = payload.event_type as string | undefined;
  const eventId = (payload as Record<string, unknown>).event_id as
    | string
    | undefined;

  if (!eventType || !eventId) {
    return NextResponse.json(
      { error: "Missing event type or ID" },
      { status: 400 },
    );
  }

  const data = payload.data as Record<string, unknown> | undefined;
  const customData = data?.custom_data as Record<string, string> | undefined;
  const transactionId = data?.id as string | undefined;
  const matchedAttempt = eventType.startsWith("transaction.") && transactionId
    ? await getPaddleAttempt(transactionId)
    : null;
  const businessId = customData?.workspace_id ?? matchedAttempt?.businessId;
  const plan = customData?.plan ?? matchedAttempt?.plan;
  const subscriptionId = data?.id as string | undefined;
  const paddleStatus = data?.status as string | undefined;
  const customerId = data?.customer_id as string | undefined;
  const billingPeriod = data?.current_billing_period as
    | { starts_at: string; ends_at: string }
    | undefined;
  const scheduledChange = data?.scheduled_change as
    | { action: string; effective_at: string }
    | null
    | undefined;

  const { eventId: storedEventId, isNew } = await recordWebhookEvent({
    providerEventId: eventId,
    provider: "paddle",
    eventType,
    payload,
    businessId: businessId ?? null,
  });

  if (!isNew) {
    return NextResponse.json({ message: "Event already processed" });
  }

  try {
    switch (eventType) {
      case "subscription.created":
      case "subscription.activated": {
        if (!businessId || !plan || !subscriptionId) {
          console.warn("[Paddle Webhook] Missing subscription activation data.", {
            eventType,
          });
          break;
        }

        const previousSubscription = await getBusinessSubscription(businessId);
        const periodStart = billingPeriod?.starts_at
          ? new Date(billingPeriod.starts_at)
          : new Date();
        const periodEnd = billingPeriod?.ends_at
          ? new Date(billingPeriod.ends_at)
          : null;

        const nextSubscription = await activateSubscription({
          currency: "USD",
          currentPeriodEnd: periodEnd,
          currentPeriodStart: periodStart,
          plan: plan as "pro" | "business",
          provider: "paddle",
          providerCustomerId: customerId ?? null,
          providerSubscriptionId: subscriptionId,
          status: mapPaddleStatus(paddleStatus ?? "active"),
          businessId,
        });

        runAfterResponse(() =>
          writeSubscriptionTransitionAuditLogs({
            businessId,
            previousSubscription,
            nextSubscription,
            source: "webhook",
            providerEventId: eventId,
          }),
        );
        break;
      }

      case "subscription.updated": {
        if (!businessId || !subscriptionId) {
          console.warn("[Paddle Webhook] Missing subscription update data.");
          break;
        }

        const previousSubscription = await getBusinessSubscription(businessId);
        const periodEnd = billingPeriod?.ends_at
          ? new Date(billingPeriod.ends_at)
          : null;
        const status = mapPaddleStatus(paddleStatus ?? "active");
        const canceledAt =
          scheduledChange?.action === "cancel" ? new Date() : undefined;

        const nextSubscription = await updateSubscriptionStatus(businessId, status, {
          ...(canceledAt ? { canceledAt } : {}),
          currentPeriodEnd: periodEnd,
          providerSubscriptionId: subscriptionId,
        });

        runAfterResponse(() =>
          writeSubscriptionTransitionAuditLogs({
            businessId,
            previousSubscription,
            nextSubscription,
            source: "webhook",
            providerEventId: eventId,
          }),
        );
        break;
      }

      case "subscription.canceled": {
        if (!businessId) {
          break;
        }

        const previousSubscription = await getBusinessSubscription(businessId);
        const endsAt = billingPeriod?.ends_at
          ? new Date(billingPeriod.ends_at)
          : scheduledChange?.effective_at
            ? new Date(scheduledChange.effective_at)
            : null;

        const nextSubscription = await updateSubscriptionStatus(businessId, "canceled", {
          canceledAt: new Date(),
          currentPeriodEnd: endsAt,
        });

        runAfterResponse(() =>
          writeSubscriptionTransitionAuditLogs({
            businessId,
            previousSubscription,
            nextSubscription,
            source: "webhook",
            providerEventId: eventId,
          }),
        );
        break;
      }

      case "subscription.expired": {
        if (!businessId) {
          break;
        }

        await expireSubscription(businessId);
        break;
      }

      case "subscription.past_due": {
        if (!businessId) {
          break;
        }

        await updateSubscriptionStatus(businessId, "past_due");
        break;
      }

      case "transaction.completed": {
        if (!businessId || !plan || !transactionId) {
          break;
        }

        const details = data?.details as Record<string, unknown> | undefined;
        const totals = details?.totals as Record<string, unknown> | undefined;
        const total = totals?.total as string | undefined;
        const currencyCode = (data?.currency_code as string) ?? "USD";
        const updated = await updatePaymentAttemptStatus(
          transactionId,
          "succeeded",
        );

        if (!updated) {
          await recordPaymentAttempt({
            amount: total
              ? Number.parseInt(total, 10)
              : matchedAttempt?.amount ?? 0,
            currency:
              currencyCode === "PHP"
                ? "PHP"
                : (matchedAttempt?.currency ?? "USD"),
            plan,
            provider: "paddle",
            providerPaymentId: transactionId,
            status: "succeeded",
            businessId,
          });
        }
        break;
      }

      case "transaction.payment_failed": {
        if (!businessId || !transactionId) {
          break;
        }

        const updated = await updatePaymentAttemptStatus(transactionId, "failed");

        if (!updated) {
          await recordPaymentAttempt({
            amount: matchedAttempt?.amount ?? 0,
            currency: matchedAttempt?.currency ?? "USD",
            plan: plan ?? "pro",
            provider: "paddle",
            providerPaymentId: transactionId,
            status: "failed",
            businessId,
          });
        }
        break;
      }

      default:
        console.warn("[Paddle Webhook] Unhandled event type.", {
          eventType,
        });
    }

    if (businessId) {
      runAfterResponse(() =>(businessId));
    }

    await markEventProcessed(storedEventId);
  } catch {
    console.error("[Paddle Webhook] Processing error.", {
      eventType,
      businessId: businessId ?? null,
    });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ message: "OK" });
}
