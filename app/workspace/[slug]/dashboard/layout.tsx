import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/shell/dashboard-shell";
import { getThemePreferenceForUser } from "@/features/theme/queries";
import { workspaceHubPath } from "@/features/workspaces/routes";
import { requireSession } from "@/lib/auth/session";
import {
  getWorkspaceContextForMembershipSlug,
  getWorkspaceMembershipsForUser,
} from "@/lib/db/workspace-access";

export const unstable_instant = false;

type WorkspaceDashboardLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}>;

export default async function WorkspaceDashboardLayout({
  children,
  params,
}: WorkspaceDashboardLayoutProps) {
  const [session, { slug }] = await Promise.all([requireSession(), params]);
  const [themePreference, workspaceContext, workspaceMemberships] = await Promise.all([
    getThemePreferenceForUser(session.user.id),
    getWorkspaceContextForMembershipSlug(session.user.id, slug),
    getWorkspaceMembershipsForUser(session.user.id),
  ]);

  if (!workspaceContext) {
    redirect(workspaceHubPath);
  }

  return (
    <DashboardShell
      themePreference={themePreference}
      user={session.user}
      workspaceContext={workspaceContext}
      workspaceMemberships={workspaceMemberships}
    >
      {children}
    </DashboardShell>
  );
}
