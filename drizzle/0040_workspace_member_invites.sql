-- Workspace-first invite architecture
-- Creates workspace_member_invites table and migrates existing business_member_invites data

CREATE TABLE IF NOT EXISTS "workspace_member_invites" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "inviter_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "workspace_role" "workspace_member_role" NOT NULL DEFAULT 'member',
  "business_assignments" jsonb,
  "token" text,
  "token_hash" text,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "workspace_member_invites_workspace_email_unique"
  ON "workspace_member_invites" ("workspace_id", "email");

CREATE UNIQUE INDEX IF NOT EXISTS "workspace_member_invites_token_hash_unique"
  ON "workspace_member_invites" ("token_hash");

CREATE INDEX IF NOT EXISTS "workspace_member_invites_workspace_id_idx"
  ON "workspace_member_invites" ("workspace_id");

CREATE INDEX IF NOT EXISTS "workspace_member_invites_email_idx"
  ON "workspace_member_invites" ("email");

CREATE INDEX IF NOT EXISTS "workspace_member_invites_token_hash_idx"
  ON "workspace_member_invites" ("token_hash");

CREATE INDEX IF NOT EXISTS "workspace_member_invites_expires_at_idx"
  ON "workspace_member_invites" ("expires_at");

-- Migrate existing business_member_invites to workspace_member_invites
-- Each business invite becomes a workspace invite with a single business assignment.
INSERT INTO "workspace_member_invites" (
  "id", "workspace_id", "inviter_user_id", "email",
  "workspace_role", "business_assignments",
  "token", "token_hash", "expires_at", "created_at", "updated_at"
)
SELECT
  'wmi_' || substring(bmi."id" from 5),
  b."workspace_id",
  bmi."inviter_user_id",
  bmi."email",
  'member',
  jsonb_build_array(jsonb_build_object('businessId', bmi."business_id", 'role', bmi."role"::text)),
  bmi."token",
  bmi."token_hash",
  bmi."expires_at",
  bmi."created_at",
  bmi."updated_at"
FROM "business_member_invites" bmi
JOIN "businesses" b ON b."id" = bmi."business_id"
ON CONFLICT ("workspace_id", "email") DO NOTHING;

-- Backfill: ensure business_members who lack a workspace_members row get one.
-- This fixes the gap where old invite acceptance created business_members but not workspace_members.
INSERT INTO "workspace_members" ("id", "workspace_id", "user_id", "role", "created_at", "updated_at")
SELECT
  'wm_' || replace(gen_random_uuid()::text, '-', ''),
  b."workspace_id",
  bm."user_id",
  'member',
  bm."created_at",
  bm."updated_at"
FROM "business_members" bm
JOIN "businesses" b ON b."id" = bm."business_id"
WHERE NOT EXISTS (
  SELECT 1 FROM "workspace_members" wm
  WHERE wm."workspace_id" = b."workspace_id"
    AND wm."user_id" = bm."user_id"
)
ON CONFLICT ("workspace_id", "user_id") DO NOTHING;
