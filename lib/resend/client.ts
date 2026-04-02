import "server-only";

import { Resend } from "resend";

import { renderPasswordResetEmail } from "@/emails/templates/password-reset";
import { env, isResendConfigured } from "@/lib/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

type SendPasswordResetEmailInput = {
  userId: string;
  email: string;
  name: string;
  url: string;
  token: string;
};

export async function sendPasswordResetEmail({
  userId,
  email,
  name,
  url,
  token,
}: SendPasswordResetEmailInput) {
  if (!resend || !isResendConfigured || !env.RESEND_FROM_EMAIL) {
    console.warn(
      "Resend is not configured yet. Password reset email delivery was skipped.",
    );
    return;
  }

  const template = renderPasswordResetEmail({
    name,
    resetUrl: url,
  });

  const { error } = await resend.emails.send(
    {
      from: env.RESEND_FROM_EMAIL,
      to: [email],
      replyTo: env.RESEND_REPLY_TO_EMAIL ? [env.RESEND_REPLY_TO_EMAIL] : undefined,
      subject: template.subject,
      html: template.html,
      text: template.text,
    },
    {
      idempotencyKey: `password-reset/${userId}/${token}`,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}
