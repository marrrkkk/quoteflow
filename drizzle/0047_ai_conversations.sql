DO $$ BEGIN
 CREATE TYPE "public"."ai_conversation_surface" AS ENUM('inquiry', 'quote', 'dashboard');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 CREATE TYPE "public"."ai_message_role" AS ENUM('user', 'assistant', 'system');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 CREATE TYPE "public"."ai_message_status" AS ENUM('completed', 'generating', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 CREATE TYPE "public"."pending_action_status" AS ENUM('pending', 'confirmed', 'cancelled', 'executed', 'expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "ai_conversations" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "workspace_id" text NOT NULL,
  "surface" "ai_conversation_surface" NOT NULL,
  "entity_id" text NOT NULL,
  "title" text,
  "is_default" boolean DEFAULT false NOT NULL,
  "last_message_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "ai_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "conversation_id" text NOT NULL,
  "role" "ai_message_role" NOT NULL,
  "content" text NOT NULL,
  "provider" text,
  "model" text,
  "status" "ai_message_status" DEFAULT 'completed' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "pending_actions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "workspace_id" text NOT NULL,
  "conversation_id" text,
  "surface" "ai_conversation_surface" NOT NULL,
  "entity_id" text NOT NULL,
  "type" text NOT NULL,
  "payload" jsonb NOT NULL,
  "status" "pending_action_status" DEFAULT 'pending' NOT NULL,
  "result_id" text,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pending_actions" ADD CONSTRAINT "pending_actions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pending_actions" ADD CONSTRAINT "pending_actions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pending_actions" ADD CONSTRAINT "pending_actions_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "ai_conversations_user_workspace_idx" ON "ai_conversations" USING btree ("user_id","workspace_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_conversations_surface_entity_idx" ON "ai_conversations" USING btree ("surface","entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_conversations_dashboard_recent_idx" ON "ai_conversations" USING btree ("user_id","workspace_id","last_message_at") WHERE "surface" = 'dashboard';
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ai_conversations_default_entity_unique" ON "ai_conversations" USING btree ("user_id","workspace_id","surface","entity_id") WHERE "surface" in ('inquiry', 'quote') and "is_default" = true;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_messages_conversation_id_idx" ON "ai_messages" USING btree ("conversation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_messages_created_at_idx" ON "ai_messages" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_messages_conversation_created_at_idx" ON "ai_messages" USING btree ("conversation_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_messages_conversation_created_at_id_idx" ON "ai_messages" USING btree ("conversation_id","created_at","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_actions_user_status_idx" ON "pending_actions" USING btree ("user_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_actions_conversation_id_idx" ON "pending_actions" USING btree ("conversation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_actions_expires_at_idx" ON "pending_actions" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_actions_surface_entity_idx" ON "pending_actions" USING btree ("surface","entity_id");
--> statement-breakpoint

INSERT INTO "ai_conversations" (
  "id",
  "user_id",
  "workspace_id",
  "surface",
  "entity_id",
  "title",
  "is_default",
  "last_message_at",
  "created_at",
  "updated_at"
)
SELECT
  'aic_' || md5(w."owner_user_id" || ':' || b."workspace_id" || ':inquiry:' || i."id"),
  w."owner_user_id",
  b."workspace_id",
  'inquiry'::"ai_conversation_surface",
  i."id",
  coalesce(nullif(i."subject", ''), 'Inquiry Chat'),
  true,
  max(im."created_at"),
  min(im."created_at"),
  max(im."updated_at")
FROM "inquiry_messages" im
INNER JOIN "inquiries" i ON im."inquiry_id" = i."id"
INNER JOIN "businesses" b ON i."business_id" = b."id"
INNER JOIN "workspaces" w ON b."workspace_id" = w."id"
GROUP BY w."owner_user_id", b."workspace_id", i."id", i."subject"
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO "ai_messages" (
  "id",
  "conversation_id",
  "role",
  "content",
  "provider",
  "model",
  "status",
  "metadata",
  "created_at",
  "updated_at"
)
SELECT
  'aim_' || md5(im."id"),
  'aic_' || md5(w."owner_user_id" || ':' || b."workspace_id" || ':inquiry:' || i."id"),
  im."role"::text::"ai_message_role",
  im."content",
  im."provider",
  im."model",
  im."status"::text::"ai_message_status",
  coalesce(im."metadata", '{}'::jsonb) || jsonb_build_object('legacyInquiryMessageId', im."id"),
  im."created_at",
  im."updated_at"
FROM "inquiry_messages" im
INNER JOIN "inquiries" i ON im."inquiry_id" = i."id"
INNER JOIN "businesses" b ON i."business_id" = b."id"
INNER JOIN "workspaces" w ON b."workspace_id" = w."id"
ON CONFLICT DO NOTHING;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS ai_conversations_set_updated_at ON public.ai_conversations;
CREATE TRIGGER ai_conversations_set_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();
--> statement-breakpoint
DROP TRIGGER IF EXISTS ai_messages_set_updated_at ON public.ai_messages;
CREATE TRIGGER ai_messages_set_updated_at
BEFORE UPDATE ON public.ai_messages
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();
--> statement-breakpoint
DROP TRIGGER IF EXISTS pending_actions_set_updated_at ON public.pending_actions;
CREATE TRIGGER pending_actions_set_updated_at
BEFORE UPDATE ON public.pending_actions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();
