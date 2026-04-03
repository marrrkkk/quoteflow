CREATE TYPE "public"."quote_library_entry_kind" AS ENUM('block', 'package');--> statement-breakpoint
CREATE TABLE "quote_library_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"kind" "quote_library_entry_kind" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_library_entry_items" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"entry_id" text NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_in_cents" integer DEFAULT 0 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quote_library_entry_items_values_valid" CHECK ("quote_library_entry_items"."quantity" > 0 and "quote_library_entry_items"."unit_price_in_cents" >= 0 and "quote_library_entry_items"."position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "quote_library_entries" ADD CONSTRAINT "quote_library_entries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_library_entry_items" ADD CONSTRAINT "quote_library_entry_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_library_entry_items" ADD CONSTRAINT "quote_library_entry_items_entry_id_quote_library_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."quote_library_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quote_library_entries_workspace_id_idx" ON "quote_library_entries" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "quote_library_entries_workspace_kind_name_idx" ON "quote_library_entries" USING btree ("workspace_id","kind","name");--> statement-breakpoint
CREATE INDEX "quote_library_entries_workspace_created_at_idx" ON "quote_library_entries" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "quote_library_entry_items_workspace_id_idx" ON "quote_library_entry_items" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "quote_library_entry_items_entry_id_idx" ON "quote_library_entry_items" USING btree ("entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quote_library_entry_items_entry_position_unique" ON "quote_library_entry_items" USING btree ("entry_id","position");