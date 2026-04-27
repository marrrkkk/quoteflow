import "server-only";

import { asc, eq, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import type { BusinessMembersSettingsView } from "@/features/business-members/types";
import {
  getBusinessMembersCacheTags,
  settingsBusinessCacheLife,
} from "@/lib/cache/business-tags";
import { db } from "@/lib/db/client";
import { businessMembers, businesses, user } from "@/lib/db/schema";

function getMemberRoleSortExpression() {
  return sql`case
    when ${businessMembers.role} = 'owner' then 0
    when ${businessMembers.role} = 'manager' then 1
    else 2
  end`;
}

export async function getBusinessMembersSettingsForBusiness(
  businessId: string,
  currentUserId: string,
): Promise<BusinessMembersSettingsView | null> {
  "use cache";

  cacheLife(settingsBusinessCacheLife);
  cacheTag(...getBusinessMembersCacheTags(businessId));

  const [businessRow, memberRows] = await Promise.all([
    db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1),
    db
      .select({
        membershipId: businessMembers.id,
        userId: businessMembers.userId,
        role: businessMembers.role,
        joinedAt: businessMembers.createdAt,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(businessMembers)
      .innerJoin(user, eq(businessMembers.userId, user.id))
      .where(eq(businessMembers.businessId, businessId))
      .orderBy(
        getMemberRoleSortExpression(),
        asc(user.name),
        asc(user.email),
        asc(businessMembers.createdAt),
      ),
  ]);

  const business = businessRow[0];

  if (!business) {
    return null;
  }

  return {
    businessId: business.id,
    businessName: business.name,
    businessSlug: business.slug,
    currentUserId,
    members: memberRows.map((member) => ({
      membershipId: member.membershipId,
      userId: member.userId,
      name: member.name,
      email: member.email,
      image: member.image ?? null,
      role: member.role,
      joinedAt: member.joinedAt,
      isCurrentUser: member.userId === currentUserId,
    })),
  };
}
