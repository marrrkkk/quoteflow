import { notFound } from "next/navigation";

import { submitPublicInquiryAction } from "@/features/inquiries/actions";
import { PublicInquiryPageRenderer } from "@/features/inquiries/components/public-inquiry-page-renderer";
import { getPublicInquiryBusinessByFormSlug } from "@/features/inquiries/queries";

export default async function PublicInquiryFormPage({
  params,
}: {
  params: Promise<{ slug: string; formSlug: string }>;
}) {
  const { slug, formSlug } = await params;
  const business = await getPublicInquiryBusinessByFormSlug({
    businessSlug: slug,
    formSlug,
  });

  if (!business) {
    notFound();
  }

  const submitPublicInquiry = submitPublicInquiryAction.bind(
    null,
    business.slug,
    business.form.slug,
  );

  return (
    <PublicInquiryPageRenderer
      business={business}
      action={submitPublicInquiry}
    />
  );
}
