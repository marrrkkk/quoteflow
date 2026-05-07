"use client";

import type {
  BillingProvider,
  PaidPlan,
} from "@/lib/billing/types";

export type PendingPaymongoCheckout = {
  provider: "paymongo";
  plan: PaidPlan;
  amount: number;
  currency: "PHP";
  expiresAt: string;
  paymentIntentId: string;
  qrCodeData: string;
};

export type PersistedPendingCheckout = PendingPaymongoCheckout;

const PENDING_CHECKOUT_KEY = "requo:pending-checkout";
const PENDING_QR_LEGACY_KEY = "requo:pending-qrph";
const PENDING_CHECKOUT_CHANGE_EVENT = "requo:pending-checkout:change";

type PendingCheckoutChangeDetail = {
  businessId: string;
};

function getPendingCheckoutStorageKey(businessId: string) {
  return `${PENDING_CHECKOUT_KEY}:${businessId}`;
}

function getLegacyPendingQrStorageKey(businessId: string) {
  return `${PENDING_QR_LEGACY_KEY}:${businessId}`;
}

function isPaidPlan(value: unknown): value is PaidPlan {
  return value === "pro" || value === "business";
}

function isPendingPaymongoCheckout(
  value: unknown,
): value is PendingPaymongoCheckout {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    candidate.provider === "paymongo" &&
    isPaidPlan(candidate.plan) &&
    typeof candidate.amount === "number" &&
    candidate.currency === "PHP" &&
    typeof candidate.expiresAt === "string" &&
    typeof candidate.paymentIntentId === "string" &&
    typeof candidate.qrCodeData === "string"
  );
}

function isPersistedPendingCheckout(
  value: unknown,
): value is PersistedPendingCheckout {
  return isPendingPaymongoCheckout(value);
}

function dispatchPendingCheckoutChange(businessId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<PendingCheckoutChangeDetail>(PENDING_CHECKOUT_CHANGE_EVENT, {
      detail: { businessId },
    }),
  );
}

function migrateLegacyPendingQr(
  businessId: string,
): PendingPaymongoCheckout | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(
      getLegacyPendingQrStorageKey(businessId),
    );

    if (!raw) {
      return null;
    }

    const data = JSON.parse(raw) as Record<string, unknown>;

    if (
      !isPaidPlan(data.plan) ||
      typeof data.amount !== "number" ||
      data.currency !== "PHP" ||
      typeof data.expiresAt !== "string" ||
      typeof data.paymentIntentId !== "string" ||
      typeof data.qrCodeData !== "string"
    ) {
      window.sessionStorage.removeItem(getLegacyPendingQrStorageKey(businessId));
      return null;
    }

    const migrated: PendingPaymongoCheckout = {
      amount: data.amount,
      currency: "PHP",
      expiresAt: data.expiresAt,
      paymentIntentId: data.paymentIntentId,
      plan: data.plan,
      provider: "paymongo",
      qrCodeData: data.qrCodeData,
    };

    window.sessionStorage.setItem(
      getPendingCheckoutStorageKey(businessId),
      JSON.stringify(migrated),
    );
    window.sessionStorage.removeItem(getLegacyPendingQrStorageKey(businessId));
    dispatchPendingCheckoutChange(businessId);

    return migrated;
  } catch {
    return null;
  }
}

export function getCachedPendingCheckout(
  businessId: string,
): PersistedPendingCheckout | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(
      getPendingCheckoutStorageKey(businessId),
    );

    if (!raw) {
      return migrateLegacyPendingQr(businessId);
    }

    const data = JSON.parse(raw) as unknown;

    if (!isPersistedPendingCheckout(data)) {
      window.sessionStorage.removeItem(getPendingCheckoutStorageKey(businessId));
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function getCachedPendingCheckoutForPlan(
  businessId: string,
  plan: PaidPlan,
): PersistedPendingCheckout | null {
  const pendingCheckout = getCachedPendingCheckout(businessId);

  if (!pendingCheckout || pendingCheckout.plan !== plan) {
    return null;
  }

  return pendingCheckout;
}

export function setCachedPendingCheckout(
  businessId: string,
  checkout: PersistedPendingCheckout,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      getPendingCheckoutStorageKey(businessId),
      JSON.stringify(checkout),
    );
    dispatchPendingCheckoutChange(businessId);
  } catch {
    // Ignore unavailable or full storage.
  }
}

export function clearCachedPendingCheckout(
  businessId: string,
  provider?: BillingProvider,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (provider) {
      const existing = getCachedPendingCheckout(businessId);

      if (!existing || existing.provider !== provider) {
        return;
      }
    }

    window.sessionStorage.removeItem(getPendingCheckoutStorageKey(businessId));
    window.sessionStorage.removeItem(getLegacyPendingQrStorageKey(businessId));
    dispatchPendingCheckoutChange(businessId);
  } catch {
    // Ignore unavailable storage.
  }
}

export function clearCachedPendingQrCheckout(businessId: string): void {
  clearCachedPendingCheckout(businessId, "paymongo");
}

export function subscribeToPendingCheckout(
  businessId: string,
  callback: (checkout: PersistedPendingCheckout | null) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => {
    callback(getCachedPendingCheckout(businessId));
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.storageArea !== window.sessionStorage) {
      return;
    }

    const key = event.key;
    if (
      key !== null &&
      key !== getPendingCheckoutStorageKey(businessId) &&
      key !== getLegacyPendingQrStorageKey(businessId)
    ) {
      return;
    }

    handleChange();
  };

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<PendingCheckoutChangeDetail>;

    if (customEvent.detail.businessId !== businessId) {
      return;
    }

    handleChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(
    PENDING_CHECKOUT_CHANGE_EVENT,
    handleCustomEvent as EventListener,
  );
  handleChange();

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(
      PENDING_CHECKOUT_CHANGE_EVENT,
      handleCustomEvent as EventListener,
    );
  };
}
