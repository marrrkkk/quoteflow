ALTER TABLE "quotes" DROP CONSTRAINT "quotes_totals_nonnegative";--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "quote_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "expires_at" SET DATA TYPE date USING "expires_at"::date;--> statement-breakpoint
UPDATE "quotes" SET "expires_at" = current_date + 14 WHERE "expires_at" IS NULL;--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "expires_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "title" text;--> statement-breakpoint
UPDATE "quotes" SET "title" = COALESCE(NULLIF(TRIM("quote_number"), ''), 'Quote') WHERE "title" IS NULL;--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_totals_valid" CHECK ("quotes"."subtotal_in_cents" >= 0 and "quotes"."tax_in_cents" >= 0 and "quotes"."total_in_cents" >= 0 and "quotes"."subtotal_in_cents" >= "quotes"."tax_in_cents" and "quotes"."total_in_cents" = "quotes"."subtotal_in_cents" - "quotes"."tax_in_cents");
