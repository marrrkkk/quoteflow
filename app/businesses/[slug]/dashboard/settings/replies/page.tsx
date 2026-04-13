import { DashboardMetaPill } from "@/components/shared/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { LockedFeaturePage } from "@/components/shared/paywall";
import {
  createReplySnippetAction,
  deleteReplySnippetAction,
  updateReplySnippetAction,
} from "@/features/inquiries/reply-snippet-actions";
import { getReplySnippetsForBusiness } from "@/features/inquiries/reply-snippet-queries";
import { BusinessReplySnippetsManager } from "@/features/settings/components/business-reply-snippets-manager";
import { hasFeatureAccess } from "@/lib/plans";
import { getBusinessOperationalPageContext } from "../_lib/page-context";

export default async function BusinessSavedRepliesPage() {
  const { businessContext } = await getBusinessOperationalPageContext();

  if (!hasFeatureAccess(businessContext.business.plan, "replySnippets")) {
    return (
      <>
        <PageHeader
          eyebrow="Responses"
          title="Saved follow-up replies"
          description="Reusable reply snippets for faster lead follow-up."
        />
        <LockedFeaturePage
          feature="replySnippets"
          plan={businessContext.business.plan}
        />
      </>
    );
  }

  const replySnippets = await getReplySnippetsForBusiness(
    businessContext.business.id,
  );

  return (
    <>
      <PageHeader
        eyebrow="Responses"
        title="Saved follow-up replies"
        description="Reusable reply snippets for faster lead follow-up."
        actions={
          replySnippets.length ? (
            <DashboardMetaPill>{replySnippets.length} saved</DashboardMetaPill>
          ) : undefined
        }
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
