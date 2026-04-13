import { PageHeader } from "@/components/shared/page-header";
import { LockedFeaturePage } from "@/components/shared/paywall";
import {
  createKnowledgeFaqAction,
  deleteKnowledgeFaqAction,
  deleteKnowledgeFileAction,
  updateKnowledgeFaqAction,
  uploadKnowledgeFileAction,
} from "@/features/knowledge/actions";
import { getKnowledgeDashboardData } from "@/features/knowledge/queries";
import { BusinessKnowledgeManager } from "@/features/settings/components/business-knowledge-manager";
import { hasFeatureAccess } from "@/lib/plans";
import { getBusinessOperationalPageContext } from "../_lib/page-context";

export default async function BusinessKnowledgePage() {
  const { businessContext } = await getBusinessOperationalPageContext();

  if (!hasFeatureAccess(businessContext.business.plan, "knowledgeBase")) {
    return (
      <>
        <PageHeader
          eyebrow="Responses"
          title="Knowledge base"
          description="Files and FAQs used in drafts and replies."
        />
        <LockedFeaturePage
          feature="knowledgeBase"
          plan={businessContext.business.plan}
        />
      </>
    );
  }

  const knowledgeData = await getKnowledgeDashboardData(businessContext.business.id);

  return (
    <>
      <PageHeader
        eyebrow="Responses"
        title="Knowledge base"
        description="Files and FAQs used in drafts and replies."
      />

      <BusinessKnowledgeManager
        createFaqAction={createKnowledgeFaqAction}
        deleteFaqAction={deleteKnowledgeFaqAction}
        deleteFileAction={deleteKnowledgeFileAction}
        knowledgeData={knowledgeData}
        updateFaqAction={updateKnowledgeFaqAction}
        uploadFileAction={uploadKnowledgeFileAction}
      />
    </>
  );
}
