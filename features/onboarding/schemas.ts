import { z } from "zod";

import { ownerProfileDetailsSchema } from "@/features/account/schemas";
import {
  isSupportedBusinessCountryCode,
  normalizeBusinessCountryCode,
} from "@/features/businesses/locale";
import { businessTypes } from "@/features/inquiries/business-types";
import { workspacePlans } from "@/lib/plans/plans";

export const referralSources = [
  "google_search",
  "facebook",
  "instagram",
  "twitter_x",
  "linkedin",
  "product_hunt",
  "youtube",
  "tiktok",
  "reddit",
  "friend_referral",
  "blog_article",
  "podcast",
  "other",
] as const;

export type ReferralSource = (typeof referralSources)[number];

export const referralSourceLabels: Record<ReferralSource, string> = {
  google_search: "Google Search",
  facebook: "Facebook",
  instagram: "Instagram",
  twitter_x: "X (Twitter)",
  linkedin: "LinkedIn",
  product_hunt: "Product Hunt",
  youtube: "YouTube",
  tiktok: "TikTok",
  reddit: "Reddit",
  friend_referral: "Friend or referral",
  blog_article: "Blog or article",
  podcast: "Podcast",
  other: "Other",
};

export const referralSourceOptions = referralSources.map((source) => ({
  value: source,
  label: referralSourceLabels[source],
}));

export const jobTitleOptions = [
  { value: "Owner", label: "Owner" },
  { value: "Founder", label: "Founder" },
  { value: "Co-founder", label: "Co-founder" },
  { value: "CEO", label: "CEO" },
  { value: "Director", label: "Director" },
  { value: "Manager", label: "Manager" },
  { value: "Operations Manager", label: "Operations Manager" },
  { value: "Project Manager", label: "Project Manager" },
  { value: "Account Manager", label: "Account Manager" },
  { value: "Sales Manager", label: "Sales Manager" },
  { value: "Admin", label: "Admin" },
  { value: "Freelancer", label: "Freelancer" },
  { value: "Consultant", label: "Consultant" },
  { value: "Other", label: "Other" },
];

export const onboardingWorkspaceSchema = z.object({
  workspaceName: z
    .string()
    .trim()
    .min(2, "Enter a workspace name.")
    .max(80, "Use 80 characters or fewer."),
  workspacePlan: z.enum(workspacePlans),
});

export const onboardingBusinessSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Enter a business name.")
    .max(80, "Use 80 characters or fewer."),
  businessType: z.enum(businessTypes),
  countryCode: z
    .string()
    .trim()
    .min(1, "Choose a country.")
    .transform(normalizeBusinessCountryCode)
    .refine(
      isSupportedBusinessCountryCode,
      "Choose a valid country.",
    ),
});

export const onboardingProfileSchema = z.object({
  fullName: ownerProfileDetailsSchema.shape.fullName,
  jobTitle: z
    .string()
    .trim()
    .min(1, "Choose a role.")
    .max(80, "Use 80 characters or fewer."),
});

export const onboardingReferralSchema = z.object({
  referralSource: z
    .string()
    .trim()
    .min(1, "Let us know how you found us."),
});

export const completeOnboardingSchema = z.object({
  ...onboardingWorkspaceSchema.shape,
  ...onboardingBusinessSchema.shape,
  ...onboardingProfileSchema.shape,
  ...onboardingReferralSchema.shape,
});
