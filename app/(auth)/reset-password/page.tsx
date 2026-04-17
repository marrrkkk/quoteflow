import type { Metadata } from "next";

import { AuthShell } from "@/components/shell/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { redirectIfAuthenticated } from "@/lib/auth/session";
import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  description: "Set a new password for your Requo account.",
  noIndex: true,
  title: "Choose a new password",
});

export default async function ResetPasswordPage() {
  await redirectIfAuthenticated();

  return (
    <AuthShell
      badge="New password"
      title="Choose a new password"
      layout="centered"
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
