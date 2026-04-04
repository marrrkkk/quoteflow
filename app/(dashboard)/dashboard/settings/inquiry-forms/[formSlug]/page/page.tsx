import { redirect } from "next/navigation";

import { getWorkspaceInquiryFormEditorPath } from "@/features/workspaces/routes";
import { getWorkspaceOwnerPageContext } from "../../../_lib/page-context";

export default async function LegacyWorkspaceInquiryPageEditorRedirect({
  params,
}: {
  params: Promise<{ formSlug: string }>;
}) {
  const { workspaceContext } = await getWorkspaceOwnerPageContext();
  const { formSlug } = await params;

  redirect(
    getWorkspaceInquiryFormEditorPath(workspaceContext.workspace.slug, formSlug),
  );
}
