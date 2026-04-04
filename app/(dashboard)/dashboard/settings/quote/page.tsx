import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { updateWorkspaceQuoteSettingsAction } from "@/features/settings/actions";
import { WorkspaceQuoteSettingsForm } from "@/features/settings/components/workspace-quote-settings-form";
import { getWorkspaceSettingsForWorkspace } from "@/features/settings/queries";
import { getWorkspaceOwnerPageContext } from "../_lib/page-context";

export default async function WorkspaceQuoteSettingsPage() {
  const { workspaceContext } = await getWorkspaceOwnerPageContext();
  const settings = await getWorkspaceSettingsForWorkspace(
    workspaceContext.workspace.id,
  );

  if (!settings) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Quote"
        description="Set quote defaults, template copy, currency, and validity."
      />

      <WorkspaceQuoteSettingsForm
        action={updateWorkspaceQuoteSettingsAction}
        settings={settings}
      />
    </>
  );
}
