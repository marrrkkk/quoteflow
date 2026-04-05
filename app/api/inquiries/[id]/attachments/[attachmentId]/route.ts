import { NextResponse } from "next/server";

import { buildContentDisposition } from "@/lib/files";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessRequestContext } from "@/lib/db/business-access";
import {
  getInquiryAttachmentForBusiness,
} from "@/features/inquiries/queries";
import {
  inquiryAttachmentRouteParamsSchema,
  publicInquiryAttachmentBucket,
} from "@/features/inquiries/schemas";

type InquiryAttachmentRouteContext = {
  params: Promise<{
    id: string;
    attachmentId: string;
  }>;
};

export async function GET(_request: Request, context: InquiryAttachmentRouteContext) {
  const requestContext = await getCurrentBusinessRequestContext();

  if (!requestContext) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const parsedParams = inquiryAttachmentRouteParamsSchema.safeParse(
    await context.params,
  );

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const attachment = await getInquiryAttachmentForBusiness({
    businessId: requestContext.businessContext.business.id,
    inquiryId: parsedParams.data.id,
    attachmentId: parsedParams.data.attachmentId,
  });

  if (!attachment) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const supabaseAdminClient = createSupabaseAdminClient();
  const { data, error } = await supabaseAdminClient.storage
    .from(publicInquiryAttachmentBucket)
    .download(attachment.storagePath);

  if (error || !data) {
    console.error("Failed to download inquiry attachment from storage.", error);

    return NextResponse.json({ error: "Attachment download is unavailable right now." }, {
      status: 500,
      headers: {
        "cache-control": "no-store",
      },
    });
  }

  return new Response(data, {
    headers: {
      "cache-control": "private, no-store",
      "content-disposition": buildContentDisposition(attachment.fileName),
      "content-type": attachment.contentType || "application/octet-stream",
      "x-content-type-options": "nosniff",
    },
  });
}
