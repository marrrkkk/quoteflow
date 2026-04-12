import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import {
  cancelBusinessMemberInviteAction,
  createBusinessMemberInviteAction,
  removeBusinessMemberAction,
  updateBusinessMemberRoleAction,
} from "@/features/business-members/actions";
import { BusinessMembersManager } from "@/features/business-members/components/business-members-manager";
import { getBusinessMembersSettingsForBusiness } from "@/features/business-members/queries";
import { getBusinessOwnerPageContext } from "../_lib/page-context";

export default async function BusinessMembersSettingsPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;
  const { user, businessContext } = await getBusinessOwnerPageContext(slug);
  const view = await getBusinessMembersSettingsForBusiness(
    businessContext.business.id,
    user.id,
  );

  if (!view) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Members"
        description="Invite the people who help manage inquiries, quotes, and follow-up for this business."
      />

      <BusinessMembersManager
        businessSlug={businessContext.business.slug}
        cancelInviteAction={cancelBusinessMemberInviteAction}
        createInviteAction={createBusinessMemberInviteAction}
        removeMemberAction={removeBusinessMemberAction}
        updateRoleAction={updateBusinessMemberRoleAction}
        view={view}
      />
    </>
  );
}
