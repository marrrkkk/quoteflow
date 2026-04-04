import { FormInput, LayoutTemplate } from "lucide-react";
import { notFound } from "next/navigation";

import { DashboardMetaPill } from "@/components/shared/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { createWorkspaceInquiryFormAction } from "@/features/settings/actions";
import { WorkspaceInquiryFormsManager } from "@/features/settings/components/workspace-inquiry-forms-manager";
import { getWorkspaceInquiryFormsSettingsForWorkspace } from "@/features/settings/queries";
import { getWorkspaceOwnerPageContext } from "../_lib/page-context";

export default async function WorkspaceInquirySettingsPage() {
  const { workspaceContext } = await getWorkspaceOwnerPageContext();
  const settings = await getWorkspaceInquiryFormsSettingsForWorkspace(
    workspaceContext.workspace.id,
  );

  if (!settings) {
    notFound();
  }

  const activeForms = settings.forms.filter((form) => !form.archivedAt);

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Inquiry"
        description="Manage inquiry forms, public URLs, and page content."
        actions={
          <>
            <DashboardMetaPill>
              <FormInput className="size-3.5" />
              {activeForms.length} active
            </DashboardMetaPill>
            <DashboardMetaPill>
              <LayoutTemplate className="size-3.5" />
              {settings.forms.length} total
            </DashboardMetaPill>
          </>
        }
      />

      <WorkspaceInquiryFormsManager
        createAction={createWorkspaceInquiryFormAction}
        settings={settings}
      />
    </>
  );
}
