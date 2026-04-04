ALTER TABLE "inquiries" ADD COLUMN "submitted_field_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "business_type" text DEFAULT 'general_services' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "inquiry_form_config" jsonb;