ALTER TABLE "inquiries" ADD COLUMN "service_category" text;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "requested_deadline" date;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "budget_text" text;--> statement-breakpoint
UPDATE "inquiries"
SET "service_category" = COALESCE(NULLIF("subject", ''), 'General')
WHERE "service_category" IS NULL;--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "service_category" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "inquiries_workspace_service_category_idx" ON "inquiries" USING btree ("workspace_id","service_category");--> statement-breakpoint

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'inquiry-attachments',
  'inquiry-attachments',
  false,
  5242880,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
