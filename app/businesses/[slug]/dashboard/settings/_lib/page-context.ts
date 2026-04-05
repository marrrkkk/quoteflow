import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { getBusinessDashboardPath } from "@/features/businesses/routes";
import { requireCurrentBusinessContext } from "@/lib/db/business-access";

export const getBusinessOwnerPageContext = cache(async () => {
  const context = await requireCurrentBusinessContext();

  if (context.businessContext.role !== "owner") {
    redirect(getBusinessDashboardPath(context.businessContext.business.slug));
  }

  return context;
});
