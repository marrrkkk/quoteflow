import type { BusinessMemberRole } from "@/lib/business-members";

export type BusinessMemberView = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: BusinessMemberRole;
  joinedAt: Date;
  isCurrentUser: boolean;
};

export type BusinessMembersSettingsView = {
  businessId: string;
  businessName: string;
  businessSlug: string;
  currentUserId: string;
  members: BusinessMemberView[];
};
