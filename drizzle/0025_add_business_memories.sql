CREATE TABLE "business_memories" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL REFERENCES "public"."businesses"("id") ON DELETE CASCADE,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_memories_position_nonnegative" CHECK ("position" >= 0),
	CONSTRAINT "business_memories_title_length" CHECK (char_length("title") <= 200),
	CONSTRAINT "business_memories_content_length" CHECK (char_length("content") <= 4000)
);
--> statement-breakpoint
CREATE INDEX "business_memories_business_id_idx" ON "public"."business_memories" ("business_id");
--> statement-breakpoint
CREATE INDEX "business_memories_business_position_idx" ON "public"."business_memories" ("business_id", "position");
