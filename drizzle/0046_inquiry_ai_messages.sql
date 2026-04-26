DO $$ BEGIN
 CREATE TYPE "public"."inquiry_message_role" AS ENUM('user', 'assistant', 'system');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 CREATE TYPE "public"."inquiry_message_status" AS ENUM('completed', 'generating', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "inquiry_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "inquiry_id" text NOT NULL,
  "role" "inquiry_message_role" NOT NULL,
  "content" text NOT NULL,
  "provider" text,
  "model" text,
  "status" "inquiry_message_status" DEFAULT 'completed' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "inquiry_messages" ADD CONSTRAINT "inquiry_messages_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "inquiry_messages_inquiry_id_idx" ON "inquiry_messages" USING btree ("inquiry_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inquiry_messages_created_at_idx" ON "inquiry_messages" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inquiry_messages_inquiry_created_at_idx" ON "inquiry_messages" USING btree ("inquiry_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inquiry_messages_inquiry_created_at_id_idx" ON "inquiry_messages" USING btree ("inquiry_id","created_at","id");
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

DROP TRIGGER IF EXISTS inquiry_messages_set_updated_at ON public.inquiry_messages;
CREATE TRIGGER inquiry_messages_set_updated_at
BEFORE UPDATE ON public.inquiry_messages
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();
