DO $$ BEGIN
  CREATE TYPE "public"."follow_up_status" AS ENUM ('pending', 'completed', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."follow_up_channel" AS ENUM ('email', 'phone', 'sms', 'whatsapp', 'messenger', 'instagram', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "follow_ups" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL,
  "business_id" text NOT NULL,
  "inquiry_id" text,
  "quote_id" text,
  "assigned_to_user_id" text,
  "title" text NOT NULL,
  "reason" text NOT NULL,
  "channel" "follow_up_channel" DEFAULT 'email' NOT NULL,
  "due_at" timestamp with time zone NOT NULL,
  "completed_at" timestamp with time zone,
  "skipped_at" timestamp with time zone,
  "status" "follow_up_status" DEFAULT 'pending' NOT NULL,
  "created_by_user_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_assigned_to_user_id_user_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_related_record_required" CHECK ("inquiry_id" is not null or "quote_id" is not null);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_ups_workspace_status_due_at_idx" ON "follow_ups" USING btree ("workspace_id","status","due_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_ups_business_status_due_at_idx" ON "follow_ups" USING btree ("business_id","status","due_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_ups_business_pending_due_at_idx" ON "follow_ups" USING btree ("business_id","due_at") WHERE "follow_ups"."status" = 'pending';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_ups_inquiry_id_idx" ON "follow_ups" USING btree ("inquiry_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_ups_quote_id_idx" ON "follow_ups" USING btree ("quote_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_ups_assigned_to_user_id_idx" ON "follow_ups" USING btree ("assigned_to_user_id");
--> statement-breakpoint
DROP TRIGGER IF EXISTS "follow_ups_set_updated_at" ON "follow_ups";
--> statement-breakpoint
CREATE TRIGGER "follow_ups_set_updated_at"
BEFORE UPDATE ON "follow_ups"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at_timestamp"();
