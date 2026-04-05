import { redirect } from "next/navigation";

import { getDefaultBusinessInquiryFormForBusiness } from "@/features/settings/queries";
import {
  getBusinessInquiryFormPreviewPath,
  getBusinessInquiryFormsPath,
} from "@/features/businesses/routes";
import { getBusinessOwnerPageContext } from "../../_lib/page-context";

export default async function LegacyBusinessInquiryPagePreviewRedirect() {
  const { businessContext } = await getBusinessOwnerPageContext();

  const form = await getDefaultBusinessInquiryFormForBusiness(
    businessContext.business.id,
  );

  if (!form) {
    redirect(getBusinessInquiryFormsPath(businessContext.business.slug));
  }

  redirect(
    getBusinessInquiryFormPreviewPath(
      businessContext.business.slug,
      form.slug,
    ),
  );
}
