/**
 * Plan pricing definitions for the billing system.
 *
 * Prices are intentional localized plan prices — not exchange-rate conversions.
 * PHP is shown to Philippines users, USD to everyone else.
 */

import type { BillingCurrency, PaidPlan, PlanPricing } from "@/lib/billing/types";

/** Prices in smallest currency unit (centavos for PHP, cents for USD). */
export const planPricing: Record<PaidPlan, PlanPricing> = {
  pro: { PHP: 29900, USD: 499 },
  business: { PHP: 59900, USD: 999 },
};

/** Returns the price in smallest unit for a plan and currency. */
export function getPlanPrice(plan: PaidPlan, currency: BillingCurrency): number {
  return planPricing[plan][currency];
}

/** Formats a price for display. */
export function formatPrice(
  amountInSmallestUnit: number,
  currency: BillingCurrency,
): string {
  const decimal = amountInSmallestUnit / 100;

  if (currency === "PHP") {
    return `₱${decimal.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  return `$${decimal.toFixed(2)}`;
}

/** Returns the formatted monthly price string for a plan and currency. */
export function getPlanPriceLabel(
  plan: PaidPlan,
  currency: BillingCurrency,
): string {
  return `${formatPrice(getPlanPrice(plan, currency), currency)}/mo`;
}

/** Returns the currency symbol for a billing currency. */
export function getCurrencySymbol(currency: BillingCurrency): string {
  return currency === "PHP" ? "₱" : "$";
}
