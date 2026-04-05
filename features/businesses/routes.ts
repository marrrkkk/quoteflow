export const businessesHubPath = "/businesses";
export const activeBusinessSlugCookieName = "requo-active-business";

export type BusinessSettingsSection =
  | "general"
  | "inquiry"
  | "quote"
  | "pricing"
  | "knowledge";

export function getBusinessPath(slug: string) {
  return `${businessesHubPath}/${slug}`;
}

export function getBusinessDashboardPath(slug: string) {
  return `${getBusinessPath(slug)}/dashboard`;
}

export function getBusinessAnalyticsPath(slug: string) {
  return `${getBusinessDashboardPath(slug)}/analytics`;
}

export function getBusinessInquiriesPath(slug: string) {
  return `${getBusinessDashboardPath(slug)}/inquiries`;
}

export function getBusinessInquiryPath(slug: string, inquiryId: string) {
  return `${getBusinessInquiriesPath(slug)}/${inquiryId}`;
}

export function getBusinessQuotesPath(slug: string) {
  return `${getBusinessDashboardPath(slug)}/quotes`;
}

export function getBusinessNewQuotePath(
  slug: string,
  inquiryId?: string | null,
) {
  const basePath = `${getBusinessQuotesPath(slug)}/new`;

  if (!inquiryId) {
    return basePath;
  }

  const searchParams = new URLSearchParams({
    inquiryId,
  });

  return `${basePath}?${searchParams.toString()}`;
}

export function getBusinessQuotePath(slug: string, quoteId: string) {
  return `${getBusinessQuotesPath(slug)}/${quoteId}`;
}

export function getBusinessSettingsPath(
  slug: string,
  section?: BusinessSettingsSection,
) {
  const basePath = `${getBusinessDashboardPath(slug)}/settings`;

  return section ? `${basePath}/${section}` : basePath;
}

export function getBusinessInquiryFormsPath(slug: string) {
  return getBusinessSettingsPath(slug, "inquiry");
}

export function getBusinessInquiryFormEditorPath(
  slug: string,
  formSlug: string,
) {
  return `${getBusinessInquiryFormsPath(slug)}/${formSlug}`;
}

export function getBusinessInquiryPageEditorPath(
  slug: string,
  formSlug: string,
) {
  return getBusinessInquiryFormEditorPath(slug, formSlug);
}

export function getBusinessInquiryFormPreviewPath(
  slug: string,
  formSlug: string,
) {
  return `${getBusinessPath(slug)}/preview/inquiry/${formSlug}`;
}

export function getBusinessKnowledgeCompatibilityPath(slug: string) {
  return `${getBusinessDashboardPath(slug)}/knowledge`;
}

export function getBusinessDashboardSlugFromPathname(pathname: string) {
  const match = /^\/businesses\/([^/]+)(?:\/|$)/.exec(pathname);

  return match ? decodeURIComponent(match[1]) : null;
}
