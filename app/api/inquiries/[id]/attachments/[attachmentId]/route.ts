import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContextForUser } from "@/lib/db/workspace-access";
import {
  getInquiryAttachmentForWorkspace,
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
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const workspaceContext = await getWorkspaceContextForUser(session.user.id);

  if (!workspaceContext) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const parsedParams = inquiryAttachmentRouteParamsSchema.safeParse(
    await context.params,
  );

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const attachment = await getInquiryAttachmentForWorkspace({
    workspaceId: workspaceContext.workspace.id,
    inquiryId: parsedParams.data.id,
    attachmentId: parsedParams.data.attachmentId,
  });

  if (!attachment) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const supabaseAdminClient = createSupabaseAdminClient();
  const { data, error } = await supabaseAdminClient.storage
    .from(publicInquiryAttachmentBucket)
    .createSignedUrl(attachment.storagePath, 60, {
      download: attachment.fileName,
    });

  if (error || !data?.signedUrl) {
    console.error("Failed to create a signed inquiry attachment URL.", error);

    return NextResponse.json(
      { error: "Attachment download is unavailable right now." },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
