import type { BusinessType } from "@/features/inquiries/business-types";
import { createInquiryFormConfigDefaults } from "@/features/inquiries/form-config";
import { createInquiryPageConfigDefaults } from "@/features/inquiries/page-config";
import { slugifyPublicName } from "@/lib/slugs";

function slugify(value: string) {
  return slugifyPublicName(value, {
    fallback: "inquiry",
  });
}

export function normalizeInquiryFormSlug(value: string) {
  return slugify(value);
}

export function getDefaultInquiryFormName(
  businessType: BusinessType,
) {
  switch (businessType) {
    case "print_signage":
      return "Project request";
    case "home_services":
      return "Service request";
    case "repair_services":
      return "Repair request";
    case "cleaning_services":
      return "Cleaning request";
    case "landscaping_outdoor":
      return "Outdoor request";
    case "creative_studio_agency":
      return "Project brief";
    case "it_web_services":
      return "Project request";
    case "photo_video_events":
      return "Booking request";
    case "coaching_consulting":
      return "Discovery request";
    case "general_services":
    default:
      return "General inquiry";
  }
}

type CreateInquiryFormPresetInput = {
  businessType: BusinessType;
  businessName: string;
  businessShortDescription?: string | null;
  legacyInquiryHeadline?: string | null;
  templateName?: string;
};

export function createInquiryFormPreset({
  businessType,
  businessName,
  businessShortDescription,
  legacyInquiryHeadline,
}: CreateInquiryFormPresetInput) {
  const name = getDefaultInquiryFormName(businessType);

  return {
    name,
    slug: normalizeInquiryFormSlug(name),
    businessType,
    publicInquiryEnabled: true,
    inquiryFormConfig: createInquiryFormConfigDefaults({
      businessType,
    }),
    inquiryPageConfig: createInquiryPageConfigDefaults({
      businessName,
      businessShortDescription,
      legacyInquiryHeadline,
      businessType,
    }),
  };
}
