import { SignupForm } from "@/features/auth/components/signup-form";
import { redirectIfAuthenticated } from "@/lib/auth/session";
import { AuthShell } from "@/components/shell/auth-shell";

export default async function SignupPage() {
  await redirectIfAuthenticated();

  return (
    <AuthShell
      badge="Signup"
      title="Create account"
      description="We will set up your first workspace automatically."
    >
      <SignupForm />
    </AuthShell>
  );
}
