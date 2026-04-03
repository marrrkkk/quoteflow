import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { redirectIfAuthenticated } from "@/lib/auth/session";
import { AuthShell } from "@/components/shell/auth-shell";

export default async function ForgotPasswordPage() {
  await redirectIfAuthenticated();

  return (
    <AuthShell
      badge="Recovery"
      title="Reset password"
      description="Enter your email and we will send a reset link."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
