import type { Metadata } from "next";

import { AuthShell } from "@/components/shell/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { redirectIfAuthenticated } from "@/lib/auth/session";
import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  description: "Request a password reset link for your Requo account.",
  noIndex: true,
  title: "Reset your password",
});

export default async function ForgotPasswordPage() {
  await redirectIfAuthenticated();

  return (
    <AuthShell badge="Recovery" title="Reset password" layout="centered">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
