import "server-only";

import { and, count, eq, isNull, sql } from "drizzle-orm";

import type { BusinessQuotaSnapshot } from "@/features/businesses/types";
import { db } from "@/lib/db/client";
import { businesses } from "@/lib/db/schema";
import { getUpgradePlan, planMeta, type BusinessPlan as plan } from "@/lib/plans/plans";
import { getUsageLimit } from "@/lib/plans/usage-limits";

type DatabaseClient =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

const businessQuotaLockNamespace = 842_731_119;

export class BusinessQuotaExceededError extends Error {
  quota: BusinessQuotaSnapshot;

  constructor(quota: BusinessQuotaSnapshot) {
    super(getBusinessQuotaExceededMessage(quota));
    this.name = "BusinessQuotaExceededError";
    this.quota = quota;
  }
}

export function isBusinessQuotaExceededError(
  error: unknown,
): error is BusinessQuotaExceededError {
  return error instanceof BusinessQuotaExceededError;
}

export function getBusinessQuotaLimit(plan: plan) {
  return getUsageLimit(plan, "businessesPerWorkspace");
}

export async function getOwnedBusinessCountForUser(
  ownerUserId: string,
  client: DatabaseClient = db,
) {
  const [row] = await client
    .select({ value: count(businesses.id) })
    .from(businesses)
    .where(
      and(
        eq(businesses.ownerUserId, ownerUserId),
        isNull(businesses.deletedAt),
        isNull(businesses.deletedAt),
      ),
    );

  return Number(row?.value ?? 0);
}

export async function getBusinessQuotaForUser({
  ownerUserId,
  plan,
  client = db,
}: {
  ownerUserId: string;
  plan: plan;
  client?: DatabaseClient;
}): Promise<BusinessQuotaSnapshot> {
  const [current, limit] = await Promise.all([
    getOwnedBusinessCountForUser(ownerUserId, client),
    Promise.resolve(getBusinessQuotaLimit(plan)),
  ]);

  return {
    ownerUserId,
    plan,
    current,
    limit,
    allowed: limit === null || current < limit,
    upgradePlan: getUpgradePlan(plan),
  };
}

export function getBusinessQuotaExceededMessage(
  quota: BusinessQuotaSnapshot,
) {
  if (quota.limit === null) {
    return "This plan has no business limit.";
  }

  const planLabel = planMeta[quota.plan].label;
  const businessLabel = quota.limit === 1 ? "business" : "businesses";
  const upgradeMessage = quota.upgradePlan
    ? ` Upgrade this workspace to ${planMeta[quota.upgradePlan].label} to add more.`
    : "";

  return `Your ${planLabel} plan supports ${quota.limit} total ${businessLabel} across all businesses. You already have ${quota.current}.${upgradeMessage}`;
}

async function lockBusinessQuotaForUser(
  tx: DatabaseClient,
  ownerUserId: string,
) {
  await tx.execute(
    sql`select pg_advisory_xact_lock(${businessQuotaLockNamespace}, hashtext(${ownerUserId}))`,
  );
}

export async function assertBusinessQuotaAvailableForUser({
  tx,
  ownerUserId,
  plan,
}: {
  tx: DatabaseClient;
  ownerUserId: string;
  plan: plan;
}) {
  await lockBusinessQuotaForUser(tx, ownerUserId);

  const quota = await getBusinessQuotaForUser({
    ownerUserId,
    plan,
    client: tx,
  });

  if (!quota.allowed) {
    throw new BusinessQuotaExceededError(quota);
  }

  return quota;
}
