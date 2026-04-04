import { redirect } from "next/navigation";

import { getWorkspaceSettingsPath } from "@/features/workspaces/routes";
import { getWorkspaceOwnerPageContext } from "../_lib/page-context";

export default async function LegacyWorkspaceInquiryFormsRedirect() {
  const { workspaceContext } = await getWorkspaceOwnerPageContext();

  redirect(getWorkspaceSettingsPath(workspaceContext.workspace.slug, "inquiry"));
}
