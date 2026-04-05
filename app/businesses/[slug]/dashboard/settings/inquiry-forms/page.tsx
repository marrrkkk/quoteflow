import { redirect } from "next/navigation";

import { getBusinessSettingsPath } from "@/features/businesses/routes";
import { getBusinessOwnerPageContext } from "../_lib/page-context";

export default async function LegacyBusinessInquiryFormsRedirect() {
  const { businessContext } = await getBusinessOwnerPageContext();

  redirect(getBusinessSettingsPath(businessContext.business.slug, "inquiry"));
}
