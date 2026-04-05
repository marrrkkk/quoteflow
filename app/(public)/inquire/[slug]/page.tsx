import { notFound } from "next/navigation";

import { submitPublicInquiryAction } from "@/features/inquiries/actions";
import { PublicInquiryPageRenderer } from "@/features/inquiries/components/public-inquiry-page-renderer";
import { getPublicInquiryBusinessBySlug } from "@/features/inquiries/queries";

export default async function PublicInquiryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getPublicInquiryBusinessBySlug(slug);

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
