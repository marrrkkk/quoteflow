import { redirect } from "next/navigation";

import { getBusinessSettingsPath } from "@/features/businesses/routes";
import { getBusinessOwnerPageContext } from "../_lib/page-context";

export default async function LegacyBusinessPricingLibraryRedirect() {
  const { businessContext } = await getBusinessOwnerPageContext();

  redirect(getBusinessSettingsPath(businessContext.business.slug, "pricing"));
}
