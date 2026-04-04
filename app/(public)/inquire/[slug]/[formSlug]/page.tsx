import { notFound } from "next/navigation";

import { submitPublicInquiryAction } from "@/features/inquiries/actions";
import { PublicInquiryPageRenderer } from "@/features/inquiries/components/public-inquiry-page-renderer";
import { getPublicInquiryWorkspaceByFormSlug } from "@/features/inquiries/queries";

export default async function PublicInquiryFormPage({
  params,
}: {
  params: Promise<{ slug: string; formSlug: string }>;
}) {
  const { slug, formSlug } = await params;
  const workspace = await getPublicInquiryWorkspaceByFormSlug({
    workspaceSlug: slug,
    formSlug,
  });

  if (!workspace) {
    notFound();
  }

  const submitPublicInquiry = submitPublicInquiryAction.bind(
    null,
    workspace.slug,
    workspace.form.slug,
  );

  return (
    <PublicInquiryPageRenderer
      workspace={workspace}
      action={submitPublicInquiry}
    />
  );
}
