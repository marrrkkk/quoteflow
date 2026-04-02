ALTER TABLE "inquiries" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "status" SET DEFAULT 'new'::text;--> statement-breakpoint
UPDATE "inquiries"
SET "status" = CASE
  WHEN "status" = 'reviewing' THEN 'waiting'
  WHEN "status" = 'booked' THEN 'won'
  WHEN "status" = 'closed' THEN 'lost'
  ELSE "status"
END;--> statement-breakpoint
DROP TYPE "public"."inquiry_status";--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('new', 'quoted', 'waiting', 'won', 'lost', 'archived');--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "status" SET DEFAULT 'new'::"public"."inquiry_status";--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "status" SET DATA TYPE "public"."inquiry_status" USING "status"::"public"."inquiry_status";
