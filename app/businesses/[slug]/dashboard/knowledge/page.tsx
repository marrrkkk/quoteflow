import { redirect } from "next/navigation";

import { getBusinessSettingsPath } from "@/features/businesses/routes";
import { requireCurrentBusinessContext } from "@/lib/db/business-access";

export default async function KnowledgePage() {
  const { businessContext } = await requireCurrentBusinessContext();

  redirect(getBusinessSettingsPath(businessContext.business.slug, "knowledge"));
}
