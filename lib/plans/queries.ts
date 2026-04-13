import "server-only";

/**
 * Lightweight plan lookup helpers for contexts that don't have
 * BusinessContext (e.g., public inquiry submission where the business
 * is resolved from slug).
 *
 * Plans now live on the workspace, so these helpers look up through
 * the business → workspace relationship.
 */

import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { businesses, workspaces } from "@/lib/db/schema";
import type { WorkspacePlan } from "@/lib/plans/plans";

/**
 * Returns the workspace plan for a business by its ID, or `"free"` if not found.
 * Looks up through business → workspace → plan.
 */
export async function getWorkspacePlanByBusinessId(
  businessId: string,
): Promise<{ plan: WorkspacePlan; workspaceId: string }> {
  const [row] = await db
    .select({
      plan: workspaces.plan,
      workspaceId: workspaces.id,
    })
    .from(businesses)
    .innerJoin(workspaces, eq(businesses.workspaceId, workspaces.id))
    .where(eq(businesses.id, businessId))
    .limit(1);

  return {
    plan: (row?.plan as WorkspacePlan) ?? "free",
    workspaceId: row?.workspaceId ?? "",
  };
}

/**
 * Returns the plan for a workspace by ID, or `"free"` if not found.
 */
export async function getWorkspacePlanById(
  workspaceId: string,
): Promise<WorkspacePlan> {
  const [row] = await db
    .select({ plan: workspaces.plan })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  return (row?.plan as WorkspacePlan) ?? "free";
}

/** @deprecated Use `getWorkspacePlanByBusinessId` instead. */
export async function getBusinessPlanById(
  businessId: string,
): Promise<WorkspacePlan> {
  const result = await getWorkspacePlanByBusinessId(businessId);
  return result.plan;
}
