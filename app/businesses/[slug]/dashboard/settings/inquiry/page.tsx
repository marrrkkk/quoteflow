import { FormInput, LayoutTemplate } from "lucide-react";
import { notFound } from "next/navigation";

import { DashboardMetaPill } from "@/components/shared/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import {
  createReplySnippetAction,
  deleteReplySnippetAction,
  updateReplySnippetAction,
} from "@/features/inquiries/reply-snippet-actions";
import { getReplySnippetsForBusiness } from "@/features/inquiries/reply-snippet-queries";
import { createBusinessInquiryFormAction } from "@/features/settings/actions";
import { BusinessInquiryFormsManager } from "@/features/settings/components/business-inquiry-forms-manager";
import { BusinessReplySnippetsManager } from "@/features/settings/components/business-reply-snippets-manager";
import { getBusinessInquiryFormsSettingsForBusiness } from "@/features/settings/queries";
import { getBusinessOwnerPageContext } from "../_lib/page-context";

export default async function BusinessInquirySettingsPage() {
  const { businessContext } = await getBusinessOwnerPageContext();
  const [settings, replySnippets] = await Promise.all([
    getBusinessInquiryFormsSettingsForBusiness(businessContext.business.id),
    getReplySnippetsForBusiness(businessContext.business.id),
  ]);

  if (!settings) {
    notFound();
  }

  const activeForms = settings.forms.filter((form) => !form.archivedAt);

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Inquiry"
        description="Manage inquiry forms, public URLs, and saved reply snippets."
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

      <BusinessInquiryFormsManager
        createAction={createBusinessInquiryFormAction}
        settings={settings}
      />
      <BusinessReplySnippetsManager
        snippets={replySnippets}
        createAction={createReplySnippetAction}
        updateAction={updateReplySnippetAction}
        deleteAction={deleteReplySnippetAction}
      />
    </>
  );
}
