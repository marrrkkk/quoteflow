CREATE TABLE "public_action_events" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "public_token" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "public_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "customer_responded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "customer_response_message" text;--> statement-breakpoint
UPDATE "quotes"
SET "public_token" = md5("id" || ':' || clock_timestamp()::text || ':' || random()::text)
WHERE "public_token" IS NULL;--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "public_token" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "public_action_events_action_key_created_at_idx" ON "public_action_events" USING btree ("action","key","created_at");--> statement-breakpoint
CREATE INDEX "public_action_events_created_at_idx" ON "public_action_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_public_token_unique" ON "quotes" USING btree ("public_token");
