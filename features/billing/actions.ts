"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { getWorkspaceContextForUser } from "@/lib/db/workspace-access";
import { isPayMongoConfigured, isLemonSqueezyConfigured } from "@/lib/env";
import { getProviderForCurrency } from "@/lib/billing/region";
import { createPendingSubscription } from "@/lib/billing/subscription-service";
import { recordPaymentAttempt } from "@/lib/billing/webhook-processor";
import type { CheckoutActionState, CancelActionState } from "@/features/billing/types";
import type { BillingCurrency, PaidPlan } from "@/lib/billing/types";
import { getWorkspacePath } from "@/features/workspaces/routes";

/**
 * Creates a checkout session for a workspace upgrade.
 * Selects the provider based on the billing currency.
 */
export async function createCheckoutAction(
  _prev: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const user = await requireUser();

  const workspaceId = formData.get("workspaceId");
  const plan = formData.get("plan");
  const currency = formData.get("currency");

  if (
    typeof workspaceId !== "string" ||
    typeof plan !== "string" ||
    typeof currency !== "string"
  ) {
    return { error: "Invalid input." };
  }

  // Validate plan
  if (plan !== "pro" && plan !== "business") {
    return { error: "Invalid plan selected." };
  }

  // Validate currency
  if (currency !== "PHP" && currency !== "USD") {
    return { error: "Invalid currency." };
  }

  // Verify workspace ownership
  const workspace = await getWorkspaceContextForUser(user.id, workspaceId);

  if (!workspace) {
    return { error: "Workspace not found." };
  }

  if (workspace.memberRole !== "owner") {
    return { error: "Only workspace owners can manage billing." };
  }

  // Check current plan
  if (workspace.plan === plan) {
    return { error: `You're already on the ${plan} plan.` };
  }

  const typedPlan = plan as PaidPlan;
  const typedCurrency = currency as BillingCurrency;
  const provider = getProviderForCurrency(typedCurrency);

  // Route to correct provider
  if (provider === "paymongo") {
    if (!isPayMongoConfigured) {
      return { error: "QRPh payments are not yet configured. Please try card payment instead." };
    }

    const { createQrPhCheckout } = await import(
      "@/lib/billing/providers/paymongo"
    );

    // Create pending subscription
    await createPendingSubscription({
      workspaceId,
      plan: typedPlan,
      provider: "paymongo",
      currency: "PHP",
    });

    const result = await createQrPhCheckout({
      plan: typedPlan,
      workspaceId,
    });

    if (result.type === "error") {
      return { error: result.message };
    }

    if (result.type === "qrph") {
      // Record pending payment
      await recordPaymentAttempt({
        workspaceId,
        plan: typedPlan,
        provider: "paymongo",
        providerPaymentId: result.paymentIntentId,
        amount: result.amount,
        currency: "PHP",
        status: "pending",
      });

      return {
        qrData: {
          qrCodeData: result.qrCodeData,
          paymentIntentId: result.paymentIntentId,
          expiresAt: result.expiresAt,
          amount: result.amount,
          currency: "PHP",
        },
      };
    }

    return { error: "Unexpected checkout result." };
  }

  // Lemon Squeezy
  if (!isLemonSqueezyConfigured) {
    return { error: "Card payments are not yet configured. Please try QRPh payment instead." };
  }

  const { createLemonSqueezyCheckout } = await import(
    "@/lib/billing/providers/lemonsqueezy"
  );

  const result = await createLemonSqueezyCheckout({
    plan: typedPlan,
    workspaceId,
    userEmail: user.email,
    userName: user.name,
    successUrl: `${process.env.BETTER_AUTH_URL}/workspaces/${workspace.slug}?billing=success`,
  });

  if (result.type === "error") {
    return { error: result.message };
  }

  if (result.type === "redirect") {
    return { checkoutUrl: result.url };
  }

  return { error: "Unexpected checkout result." };
}

/**
 * Cancels the current workspace subscription.
 */
export async function cancelSubscriptionAction(
  _prev: CancelActionState,
  formData: FormData,
): Promise<CancelActionState> {
  const user = await requireUser();

  const workspaceId = formData.get("workspaceId");

  if (typeof workspaceId !== "string") {
    return { error: "Invalid input." };
  }

  // Verify workspace ownership
  const workspace = await getWorkspaceContextForUser(user.id, workspaceId);

  if (!workspace) {
    return { error: "Workspace not found." };
  }

  if (workspace.memberRole !== "owner") {
    return { error: "Only workspace owners can manage billing." };
  }

  // Get subscription
  const { getWorkspaceSubscription } = await import(
    "@/lib/billing/subscription-service"
  );
  const subscription = await getWorkspaceSubscription(workspaceId);

  if (!subscription || subscription.status === "free") {
    return { error: "No active subscription to cancel." };
  }

  // Cancel based on provider
  if (
    subscription.billingProvider === "lemonsqueezy" &&
    subscription.providerSubscriptionId
  ) {
    const { cancelLemonSqueezySubscription } = await import(
      "@/lib/billing/providers/lemonsqueezy"
    );
    const success = await cancelLemonSqueezySubscription(
      subscription.providerSubscriptionId,
    );

    if (!success) {
      return { error: "Failed to cancel subscription. Please try again." };
    }
  }

  // For PayMongo (no managed subscription), just cancel locally
  const { cancelSubscription } = await import(
    "@/lib/billing/subscription-service"
  );
  await cancelSubscription(workspaceId);

  revalidatePath(getWorkspacePath(workspace.slug));

  return { success: "Subscription canceled. You'll keep access until the end of your billing period." };
}
