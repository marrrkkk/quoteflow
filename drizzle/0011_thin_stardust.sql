CREATE TABLE "workspace_inquiry_forms" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"business_type" text DEFAULT 'general_services' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"public_inquiry_enabled" boolean DEFAULT true NOT NULL,
	"inquiry_form_config" jsonb NOT NULL,
	"inquiry_page_config" jsonb NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_inquiry_forms_slug_format" CHECK ("workspace_inquiry_forms"."slug" ~ '^[a-z0-9-]+$')
);
--> statement-breakpoint
ALTER TABLE "workspace_inquiry_forms" ADD CONSTRAINT "workspace_inquiry_forms_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_inquiry_forms_workspace_slug_unique" ON "workspace_inquiry_forms" USING btree ("workspace_id","slug");
--> statement-breakpoint
CREATE INDEX "workspace_inquiry_forms_workspace_id_idx" ON "workspace_inquiry_forms" USING btree ("workspace_id");
--> statement-breakpoint
CREATE INDEX "workspace_inquiry_forms_workspace_default_idx" ON "workspace_inquiry_forms" USING btree ("workspace_id","is_default");
--> statement-breakpoint
CREATE INDEX "workspace_inquiry_forms_workspace_archived_idx" ON "workspace_inquiry_forms" USING btree ("workspace_id","archived_at");
--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "workspace_inquiry_form_id" text;
--> statement-breakpoint
UPDATE "workspaces"
SET "inquiry_form_config" = jsonb_build_object(
  'version',
  1,
  'businessType',
  coalesce("business_type", 'general_services'),
  'contactFields',
  jsonb_build_object(
    'customerName',
    jsonb_build_object(
      'label',
      'Your name',
      'placeholder',
      'Alicia Cruz',
      'enabled',
      true,
      'required',
      true
    ),
    'customerEmail',
    jsonb_build_object(
      'label',
      'Email address',
      'placeholder',
      'you@example.com',
      'enabled',
      true,
      'required',
      true
    ),
    'customerPhone',
    jsonb_build_object(
      'label',
      'Phone number',
      'placeholder',
      'Optional',
      'enabled',
      true,
      'required',
      false
    ),
    'companyName',
    jsonb_build_object(
      'label',
      'Company name',
      'placeholder',
      'Optional',
      'enabled',
      false,
      'required',
      false
    )
  ),
  'projectFields',
  jsonb_build_array(
    jsonb_build_object(
      'kind',
      'system',
      'key',
      'serviceCategory',
      'label',
      'Service needed',
      'placeholder',
      'Tell us what you need',
      'enabled',
      true,
      'required',
      true
    ),
    jsonb_build_object(
      'kind',
      'custom',
      'id',
      'site-location',
      'fieldType',
      'short_text',
      'label',
      'Location',
      'placeholder',
      'City or site address',
      'required',
      false
    ),
    jsonb_build_object(
      'kind',
      'system',
      'key',
      'requestedDeadline',
      'label',
      'Needed by',
      'enabled',
      true,
      'required',
      false
    ),
    jsonb_build_object(
      'kind',
      'system',
      'key',
      'budgetText',
      'label',
      'Budget',
      'enabled',
      true,
      'required',
      false
    ),
    jsonb_build_object(
      'kind',
      'system',
      'key',
      'details',
      'label',
      'Project details',
      'placeholder',
      'Share the scope, size, timing, or anything else that matters.',
      'enabled',
      true,
      'required',
      true
    ),
    jsonb_build_object(
      'kind',
      'system',
      'key',
      'attachment',
      'label',
      'Reference file',
      'enabled',
      true,
      'required',
      false
    )
  )
)
WHERE "inquiry_form_config" IS NULL;
--> statement-breakpoint
UPDATE "workspaces"
SET "inquiry_page_config" = jsonb_build_object(
  'template',
  'split',
  'eyebrow',
  'Inquiry',
  'headline',
  concat('Tell ', "name", ' what you need.'),
  'description',
  concat('Send a request directly to ', "name", '.'),
  'brandTagline',
  nullif(trim("short_description"), ''),
  'formTitle',
  'Send inquiry',
  'formDescription',
  concat('Your request goes straight to ', "name", '.'),
  'cards',
  jsonb_build_array(
    jsonb_build_object(
      'id',
      'details',
      'title',
      'Clear details',
      'description',
      'Share the service, timing, and scope.',
      'icon',
      'details'
    ),
    jsonb_build_object(
      'id',
      'upload',
      'title',
      'Reference file',
      'description',
      'Upload files, photos, or notes if helpful.',
      'icon',
      'upload'
    ),
    jsonb_build_object(
      'id',
      'owner',
      'title',
      'Direct review',
      'description',
      'Your inquiry goes straight to the owner.',
      'icon',
      'owner'
    )
  )
)
WHERE "inquiry_page_config" IS NULL;
--> statement-breakpoint
INSERT INTO "workspace_inquiry_forms" (
  "id",
  "workspace_id",
  "name",
  "slug",
  "business_type",
  "is_default",
  "public_inquiry_enabled",
  "inquiry_form_config",
  "inquiry_page_config",
  "created_at",
  "updated_at"
)
SELECT
  concat('ifm_', md5("workspaces"."id" || ':main')),
  "workspaces"."id",
  'Main inquiry',
  'main',
  coalesce("workspaces"."business_type", 'general_services'),
  true,
  "workspaces"."public_inquiry_enabled",
  "workspaces"."inquiry_form_config",
  "workspaces"."inquiry_page_config",
  "workspaces"."created_at",
  "workspaces"."updated_at"
FROM "workspaces"
WHERE NOT EXISTS (
  SELECT 1
  FROM "workspace_inquiry_forms"
  WHERE "workspace_inquiry_forms"."workspace_id" = "workspaces"."id"
);
--> statement-breakpoint
UPDATE "inquiries"
SET "workspace_inquiry_form_id" = "workspace_inquiry_forms"."id"
FROM "workspace_inquiry_forms"
WHERE "inquiries"."workspace_id" = "workspace_inquiry_forms"."workspace_id"
  AND "workspace_inquiry_forms"."is_default" = true
  AND "inquiries"."workspace_inquiry_form_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "workspace_inquiry_form_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_workspace_inquiry_form_id_workspace_inquiry_forms_id_fk" FOREIGN KEY ("workspace_inquiry_form_id") REFERENCES "public"."workspace_inquiry_forms"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "inquiries_workspace_inquiry_form_id_idx" ON "inquiries" USING btree ("workspace_inquiry_form_id");
