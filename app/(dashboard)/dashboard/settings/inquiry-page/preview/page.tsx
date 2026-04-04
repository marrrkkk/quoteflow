import { redirect } from "next/navigation";

import { getDefaultWorkspaceInquiryFormForWorkspace } from "@/features/settings/queries";
import {
  getWorkspaceInquiryFormPreviewPath,
  getWorkspaceInquiryFormsPath,
} from "@/features/workspaces/routes";
import { getWorkspaceOwnerPageContext } from "../../_lib/page-context";

export default async function LegacyWorkspaceInquiryPagePreviewRedirect() {
  const { workspaceContext } = await getWorkspaceOwnerPageContext();

  const form = await getDefaultWorkspaceInquiryFormForWorkspace(
    workspaceContext.workspace.id,
  );

  if (!form) {
    redirect(getWorkspaceInquiryFormsPath(workspaceContext.workspace.slug));
  }

  redirect(
    getWorkspaceInquiryFormPreviewPath(
      workspaceContext.workspace.slug,
      form.slug,
    ),
  );
}
