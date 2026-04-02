"use server";

import { env } from "@/lib/env";
import { sendPublicInquiryNotificationEmail } from "@/lib/resend/client";
import { createPublicInquirySubmission } from "@/features/inquiries/mutations";
import { getPublicInquiryWorkspaceBySlug, getWorkspaceOwnerNotificationEmails } from "@/features/inquiries/queries";
import { publicInquirySchema } from "@/features/inquiries/schemas";
import type { PublicInquiryFormState } from "@/features/inquiries/types";

function getTextValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : null;
}

export async function submitPublicInquiryAction(
  slug: string,
  _prevState: PublicInquiryFormState,
  formData: FormData,
): Promise<PublicInquiryFormState> {
  const honeypotValue = getTextValue(formData, "website")?.trim();

  if (honeypotValue) {
    return {
      success: "Thanks. Your inquiry has been sent.",
    };
  }

  const workspace = await getPublicInquiryWorkspaceBySlug(slug);

  if (!workspace) {
    return {
      error: "This inquiry page is unavailable right now.",
    };
  }

  const validationResult = publicInquirySchema.safeParse({
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone"),
    serviceCategory: formData.get("serviceCategory"),
    deadline: formData.get("deadline"),
    budget: formData.get("budget"),
    details: formData.get("details"),
    attachment: formData.get("attachment"),
  });

  if (!validationResult.success) {
    return {
      error: "Check the highlighted fields and try again.",
      fieldErrors: validationResult.error.flatten().fieldErrors,
    };
  }

  try {
    const createdInquiry = await createPublicInquirySubmission({
      workspace,
      submission: validationResult.data,
    });

    const recipients = await getWorkspaceOwnerNotificationEmails(workspace.id);

    if (recipients.length) {
      try {
        await sendPublicInquiryNotificationEmail({
          inquiryId: createdInquiry.inquiryId,
          recipients,
          workspaceName: workspace.name,
          dashboardUrl: new URL(
            `/dashboard/inquiries/${createdInquiry.inquiryId}`,
            env.BETTER_AUTH_URL,
          ).toString(),
          customerName: validationResult.data.customerName,
          customerEmail: validationResult.data.customerEmail,
          customerPhone: validationResult.data.customerPhone,
          serviceCategory: validationResult.data.serviceCategory,
          deadline: validationResult.data.deadline,
          budget: validationResult.data.budget,
          details: validationResult.data.details,
          attachmentName: createdInquiry.attachmentName,
        });
      } catch (error) {
        console.error(
          "The public inquiry was saved but the owner notification email failed to send.",
          error,
        );
      }
    }

    return {
      success: "Thanks. Your inquiry has been sent.",
      inquiryId: createdInquiry.inquiryId,
    };
  } catch (error) {
    console.error("Failed to submit public inquiry.", error);

    return {
      error: "We couldn't submit your inquiry right now. Please try again.",
    };
  }
}
