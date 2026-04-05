import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Eye } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { submitPublicInquiryAction } from "@/features/inquiries/actions";
import { PublicInquiryPageRenderer } from "@/features/inquiries/components/public-inquiry-page-renderer";
import { getInquiryBusinessPreviewByFormSlug } from "@/features/inquiries/queries";
import { getBusinessPublicInquiryUrl } from "@/features/settings/utils";
import { requireSession } from "@/lib/auth/session";
import { getBusinessContextForMembershipSlug } from "@/lib/db/business-access";
import {
  getBusinessDashboardPath,
  getBusinessInquiryPageEditorPath,
  businessesHubPath,
} from "@/features/businesses/routes";

export default async function BusinessInquiryFormPreviewPage({
  params,
}: {
  params: Promise<{ slug: string; formSlug: string }>;
}) {
  const [session, { slug, formSlug }] = await Promise.all([
    requireSession(),
    params,
  ]);
  const [businessContext, business] = await Promise.all([
    getBusinessContextForMembershipSlug(session.user.id, slug),
    getInquiryBusinessPreviewByFormSlug({
      businessSlug: slug,
      formSlug,
    }),
  ]);

  if (!businessContext) {
    redirect(businessesHubPath);
  }

  if (businessContext.role !== "owner") {
    redirect(getBusinessDashboardPath(businessContext.business.slug));
  }

  if (!business) {
    notFound();
  }

  const settingsHref = getBusinessInquiryPageEditorPath(slug, formSlug);
  const publicInquiryHref = business.form.isDefault
    ? getBusinessPublicInquiryUrl(business.slug)
    : getBusinessPublicInquiryUrl(business.slug, business.form.slug);
  const submitPublicInquiry = submitPublicInquiryAction.bind(
    null,
    business.slug,
    business.form.slug,
  );

  return (
    <PublicInquiryPageRenderer
      business={business}
      action={submitPublicInquiry}
      previewMode
      beforeHero={
        <div className="rounded-none border-b border-primary/20 bg-primary/5 px-4 py-3 sm:px-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
              <Eye className="size-4" />
              Preview only
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:[&>*]:w-auto [&>*]:w-full">
              <Button asChild variant="outline">
                <Link href={settingsHref} prefetch={true}>
                  <ArrowLeft data-icon="inline-start" />
                  Back to editor
                </Link>
              </Button>
              {business.form.publicInquiryEnabled ? (
                <Button asChild variant="ghost">
                  <Link
                    href={publicInquiryHref}
                    prefetch={false}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ArrowUpRight data-icon="inline-start" />
                    Open live page
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      }
    />
  );
}
