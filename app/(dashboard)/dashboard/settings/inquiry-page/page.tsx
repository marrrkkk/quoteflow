import { redirect } from "next/navigation";

import { getDefaultWorkspaceInquiryFormForWorkspace } from "@/features/settings/queries";
import {
  getWorkspaceInquiryFormsPath,
  getWorkspaceInquiryPageEditorPath,
} from "@/features/workspaces/routes";
import { getWorkspaceOwnerPageContext } from "../_lib/page-context";

export default async function WorkspaceInquiryPageSettingsPage() {
  const { workspaceContext } = await getWorkspaceOwnerPageContext();
  const form = await getDefaultWorkspaceInquiryFormForWorkspace(
    workspaceContext.workspace.id,
  );

  if (!form) {
    redirect(getWorkspaceInquiryFormsPath(workspaceContext.workspace.slug));
  }

  redirect(
    getWorkspaceInquiryPageEditorPath(workspaceContext.workspace.slug, form.slug),
  );
}
