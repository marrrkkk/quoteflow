-- Drop the legacy business_member_invites table.
-- All invite data has been migrated to workspace_member_invites (migration 0040).
DROP TABLE IF EXISTS "business_member_invites";
