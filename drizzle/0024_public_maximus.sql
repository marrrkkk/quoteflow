DO $$ BEGIN
 CREATE TYPE "public"."business_notification_type" AS ENUM('public_inquiry_submitted', 'quote_customer_accepted', 'quote_customer_rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."business_ai_tone_preference" AS ENUM('balanced', 'warm', 'direct', 'formal');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."business_member_role" AS ENUM('owner', 'manager', 'staff');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."workspace_member_role" ADD VALUE IF NOT EXISTS 'admin';--> statement-breakpoint
CREATE TABLE "business_notification_states" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"user_id" text NOT NULL,
	"last_read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"inquiry_id" text,
	"quote_id" text,
	"type" "business_notification_type" NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_inquiry_forms" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"business_type" text DEFAULT 'general_project_services' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"public_inquiry_enabled" boolean DEFAULT true NOT NULL,
	"inquiry_form_config" jsonb NOT NULL,
	"inquiry_page_config" jsonb NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_inquiry_forms_slug_format" CHECK ("business_inquiry_forms"."slug" ~ '^[a-z0-9-]+$')
);
--> statement-breakpoint
CREATE TABLE "business_member_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"inviter_user_id" text NOT NULL,
	"email" text NOT NULL,
	"role" "business_member_role" DEFAULT 'staff' NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_members" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "business_member_role" DEFAULT 'staff' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"business_type" text DEFAULT 'general_project_services' NOT NULL,
	"country_code" text,
	"short_description" text,
	"contact_email" text,
	"logo_storage_path" text,
	"logo_content_type" text,
	"public_inquiry_enabled" boolean DEFAULT true NOT NULL,
	"inquiry_headline" text,
	"inquiry_form_config" jsonb,
	"inquiry_page_config" jsonb,
	"default_email_signature" text,
	"default_quote_notes" text,
	"quote_email_template" jsonb,
	"default_quote_validity_days" integer DEFAULT 14 NOT NULL,
	"ai_tone_preference" "business_ai_tone_preference" DEFAULT 'balanced' NOT NULL,
	"notify_on_new_inquiry" boolean DEFAULT true NOT NULL,
	"notify_on_quote_sent" boolean DEFAULT true NOT NULL,
	"notify_on_quote_response" boolean DEFAULT true NOT NULL,
	"notify_in_app_on_new_inquiry" boolean DEFAULT true NOT NULL,
	"notify_in_app_on_quote_response" boolean DEFAULT true NOT NULL,
	"default_currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_slug_format" CHECK ("businesses"."slug" ~ '^[a-z0-9-]+$'),
	CONSTRAINT "businesses_country_code_format" CHECK ("businesses"."country_code" is null or "businesses"."country_code" ~ '^[A-Z]{2}$'),
	CONSTRAINT "businesses_default_quote_validity_days_range" CHECK ("businesses"."default_quote_validity_days" between 1 and 365)
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"user_id" text NOT NULL,
	"inquiry_id" text,
	"quote_id" text,
	"google_event_id" text NOT NULL,
	"google_calendar_id" text NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"event_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_calendar_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"google_account_id" text NOT NULL,
	"google_email" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"access_token_expires_at" timestamp with time zone NOT NULL,
	"scope" text NOT NULL,
	"selected_calendar_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_memories" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_memories_position_nonnegative" CHECK ("business_memories"."position" >= 0),
	CONSTRAINT "business_memories_title_length" CHECK (char_length("business_memories"."title") <= 200),
	CONSTRAINT "business_memories_content_length" CHECK (char_length("business_memories"."content") <= 4000)
);
--> statement-breakpoint
ALTER TABLE "knowledge_faqs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge_files" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace_inquiry_forms" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "knowledge_faqs" CASCADE;--> statement-breakpoint
DROP TABLE "knowledge_files" CASCADE;--> statement-breakpoint
DROP TABLE "workspace_inquiry_forms" CASCADE;--> statement-breakpoint
ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_default_quote_validity_days_range";--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "inquiries" DROP CONSTRAINT "inquiries_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "inquiries" DROP CONSTRAINT "inquiries_workspace_inquiry_form_id_workspace_inquiry_forms_id_fk";
--> statement-breakpoint
ALTER TABLE "inquiry_attachments" DROP CONSTRAINT "inquiry_attachments_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "inquiry_notes" DROP CONSTRAINT "inquiry_notes_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "quote_library_entries" DROP CONSTRAINT "quote_library_entries_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "quote_library_entry_items" DROP CONSTRAINT "quote_library_entry_items_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "quote_items" DROP CONSTRAINT "quote_items_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "reply_snippets" DROP CONSTRAINT "reply_snippets_workspace_id_workspaces_id_fk";
--> statement-breakpoint
DROP INDEX "activity_logs_workspace_id_idx";--> statement-breakpoint
DROP INDEX "activity_logs_workspace_created_at_idx";--> statement-breakpoint
DROP INDEX "activity_logs_workspace_type_idx";--> statement-breakpoint
DROP INDEX "inquiries_workspace_id_idx";--> statement-breakpoint
DROP INDEX "inquiries_workspace_inquiry_form_id_idx";--> statement-breakpoint
DROP INDEX "inquiries_workspace_status_idx";--> statement-breakpoint
DROP INDEX "inquiries_workspace_submitted_at_idx";--> statement-breakpoint
DROP INDEX "inquiries_workspace_service_category_idx";--> statement-breakpoint
DROP INDEX "inquiry_attachments_workspace_id_idx";--> statement-breakpoint
DROP INDEX "inquiry_attachments_workspace_inquiry_idx";--> statement-breakpoint
DROP INDEX "inquiry_notes_workspace_id_idx";--> statement-breakpoint
DROP INDEX "inquiry_notes_workspace_inquiry_idx";--> statement-breakpoint
DROP INDEX "quote_library_entries_workspace_id_idx";--> statement-breakpoint
DROP INDEX "quote_library_entries_workspace_kind_name_idx";--> statement-breakpoint
DROP INDEX "quote_library_entries_workspace_created_at_idx";--> statement-breakpoint
DROP INDEX "quote_library_entry_items_workspace_id_idx";--> statement-breakpoint
DROP INDEX "quote_items_workspace_id_idx";--> statement-breakpoint
DROP INDEX "quotes_workspace_id_idx";--> statement-breakpoint
DROP INDEX "quotes_workspace_status_idx";--> statement-breakpoint
DROP INDEX "quotes_workspace_created_at_idx";--> statement-breakpoint
DROP INDEX "quotes_workspace_quote_number_unique";--> statement-breakpoint
DROP INDEX "reply_snippets_workspace_id_idx";--> statement-breakpoint
DROP INDEX "reply_snippets_workspace_created_at_idx";--> statement-breakpoint
DROP INDEX "workspace_members_workspace_role_idx";--> statement-breakpoint
DROP INDEX "workspaces_created_at_idx";--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "business_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "business_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "business_inquiry_form_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "inquiry_attachments" ADD COLUMN "business_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "inquiry_notes" ADD COLUMN "business_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_library_entries" ADD COLUMN "business_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_library_entries" ADD COLUMN "currency" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_library_entry_items" ADD COLUMN "business_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_items" ADD COLUMN "business_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "business_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "reply_snippets" ADD COLUMN "business_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "referral_source" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "avatar_storage_path" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "avatar_content_type" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "onboarding_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "plan" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "owner_user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "business_notification_states" ADD CONSTRAINT "business_notification_states_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_notification_states" ADD CONSTRAINT "business_notification_states_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_notifications" ADD CONSTRAINT "business_notifications_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_notifications" ADD CONSTRAINT "business_notifications_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_notifications" ADD CONSTRAINT "business_notifications_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_inquiry_forms" ADD CONSTRAINT "business_inquiry_forms_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_member_invites" ADD CONSTRAINT "business_member_invites_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_member_invites" ADD CONSTRAINT "business_member_invites_inviter_user_id_user_id_fk" FOREIGN KEY ("inviter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_calendar_connections" ADD CONSTRAINT "google_calendar_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_memories" ADD CONSTRAINT "business_memories_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "business_notification_states_business_user_unique" ON "business_notification_states" USING btree ("business_id","user_id");--> statement-breakpoint
CREATE INDEX "business_notification_states_user_business_idx" ON "business_notification_states" USING btree ("user_id","business_id");--> statement-breakpoint
CREATE INDEX "business_notifications_business_created_at_idx" ON "business_notifications" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "business_notifications_business_type_created_at_idx" ON "business_notifications" USING btree ("business_id","type","created_at");--> statement-breakpoint
CREATE INDEX "business_notifications_inquiry_id_idx" ON "business_notifications" USING btree ("inquiry_id");--> statement-breakpoint
CREATE INDEX "business_notifications_quote_id_idx" ON "business_notifications" USING btree ("quote_id");--> statement-breakpoint
CREATE UNIQUE INDEX "business_inquiry_forms_business_slug_unique" ON "business_inquiry_forms" USING btree ("business_id","slug");--> statement-breakpoint
CREATE INDEX "business_inquiry_forms_business_id_idx" ON "business_inquiry_forms" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "business_inquiry_forms_business_default_idx" ON "business_inquiry_forms" USING btree ("business_id","is_default");--> statement-breakpoint
CREATE INDEX "business_inquiry_forms_business_archived_idx" ON "business_inquiry_forms" USING btree ("business_id","archived_at");--> statement-breakpoint
CREATE UNIQUE INDEX "business_member_invites_token_unique" ON "business_member_invites" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "business_member_invites_business_email_unique" ON "business_member_invites" USING btree ("business_id","email");--> statement-breakpoint
CREATE INDEX "business_member_invites_business_id_idx" ON "business_member_invites" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "business_member_invites_email_idx" ON "business_member_invites" USING btree ("email");--> statement-breakpoint
CREATE INDEX "business_member_invites_expires_at_idx" ON "business_member_invites" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "business_members_business_user_unique" ON "business_members" USING btree ("business_id","user_id");--> statement-breakpoint
CREATE INDEX "business_members_user_id_idx" ON "business_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "business_members_business_role_idx" ON "business_members" USING btree ("business_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "businesses_slug_unique" ON "businesses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "businesses_created_at_idx" ON "businesses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "businesses_workspace_id_idx" ON "businesses" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "calendar_events_business_id_idx" ON "calendar_events" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "calendar_events_user_id_idx" ON "calendar_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "calendar_events_inquiry_id_idx" ON "calendar_events" USING btree ("inquiry_id");--> statement-breakpoint
CREATE INDEX "calendar_events_quote_id_idx" ON "calendar_events" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "calendar_events_business_starts_at_idx" ON "calendar_events" USING btree ("business_id","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "google_calendar_connections_user_id_unique" ON "google_calendar_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "business_memories_business_id_idx" ON "business_memories" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "business_memories_business_position_idx" ON "business_memories" USING btree ("business_id","position");--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_business_inquiry_form_id_business_inquiry_forms_id_fk" FOREIGN KEY ("business_inquiry_form_id") REFERENCES "public"."business_inquiry_forms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry_attachments" ADD CONSTRAINT "inquiry_attachments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry_notes" ADD CONSTRAINT "inquiry_notes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_library_entries" ADD CONSTRAINT "quote_library_entries_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_library_entry_items" ADD CONSTRAINT "quote_library_entry_items_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_snippets" ADD CONSTRAINT "reply_snippets_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_business_id_idx" ON "activity_logs" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "activity_logs_business_created_at_idx" ON "activity_logs" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "activity_logs_business_type_idx" ON "activity_logs" USING btree ("business_id","type");--> statement-breakpoint
CREATE INDEX "inquiries_business_id_idx" ON "inquiries" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "inquiries_business_inquiry_form_id_idx" ON "inquiries" USING btree ("business_inquiry_form_id");--> statement-breakpoint
CREATE INDEX "inquiries_business_status_idx" ON "inquiries" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "inquiries_business_submitted_at_idx" ON "inquiries" USING btree ("business_id","submitted_at");--> statement-breakpoint
CREATE INDEX "inquiries_business_service_category_idx" ON "inquiries" USING btree ("business_id","service_category");--> statement-breakpoint
CREATE INDEX "inquiry_attachments_business_id_idx" ON "inquiry_attachments" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "inquiry_attachments_business_inquiry_idx" ON "inquiry_attachments" USING btree ("business_id","inquiry_id");--> statement-breakpoint
CREATE INDEX "inquiry_notes_business_id_idx" ON "inquiry_notes" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "inquiry_notes_business_inquiry_idx" ON "inquiry_notes" USING btree ("business_id","inquiry_id");--> statement-breakpoint
CREATE INDEX "quote_library_entries_business_id_idx" ON "quote_library_entries" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "quote_library_entries_business_kind_name_idx" ON "quote_library_entries" USING btree ("business_id","kind","name");--> statement-breakpoint
CREATE INDEX "quote_library_entries_business_created_at_idx" ON "quote_library_entries" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "quote_library_entry_items_business_id_idx" ON "quote_library_entry_items" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "quote_items_business_id_idx" ON "quote_items" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "quotes_business_id_idx" ON "quotes" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "quotes_business_status_idx" ON "quotes" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "quotes_business_created_at_idx" ON "quotes" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_business_quote_number_unique" ON "quotes" USING btree ("business_id","quote_number");--> statement-breakpoint
CREATE INDEX "reply_snippets_business_id_idx" ON "reply_snippets" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "reply_snippets_business_created_at_idx" ON "reply_snippets" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "workspace_members_workspace_id_idx" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspaces_owner_user_id_idx" ON "workspaces" USING btree ("owner_user_id");--> statement-breakpoint
ALTER TABLE "activity_logs" DROP COLUMN "workspace_id";--> statement-breakpoint
ALTER TABLE "inquiries" DROP COLUMN "workspace_id";--> statement-breakpoint
ALTER TABLE "inquiries" DROP COLUMN "workspace_inquiry_form_id";--> statement-breakpoint
ALTER TABLE "inquiry_attachments" DROP COLUMN "workspace_id";--> statement-breakpoint
ALTER TABLE "inquiry_notes" DROP COLUMN "workspace_id";--> statement-breakpoint
ALTER TABLE "quote_library_entries" DROP COLUMN "workspace_id";--> statement-breakpoint
ALTER TABLE "quote_library_entry_items" DROP COLUMN "workspace_id";--> statement-breakpoint
ALTER TABLE "quote_items" DROP COLUMN "workspace_id";--> statement-breakpoint
ALTER TABLE "quotes" DROP COLUMN "workspace_id";--> statement-breakpoint
ALTER TABLE "reply_snippets" DROP COLUMN "workspace_id";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "business_type";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "short_description";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "contact_email";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "logo_storage_path";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "logo_content_type";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "public_inquiry_enabled";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "inquiry_headline";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "inquiry_form_config";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "inquiry_page_config";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "default_email_signature";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "default_quote_notes";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "default_quote_validity_days";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "ai_tone_preference";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "notify_on_new_inquiry";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "notify_on_quote_sent";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "default_currency";--> statement-breakpoint
ALTER TABLE "quote_library_entries" ADD CONSTRAINT "quote_library_entries_currency_format" CHECK ("quote_library_entries"."currency" ~ '^[A-Z]{3}$');--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_plan_valid" CHECK ("workspaces"."plan" in ('free', 'pro', 'business'));--> statement-breakpoint
DROP TYPE "public"."workspace_ai_tone_preference";