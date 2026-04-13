-- Google Calendar integration tables

CREATE TABLE IF NOT EXISTS "google_calendar_connections" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "google_account_id" text NOT NULL,
  "google_email" text NOT NULL,
  "access_token" text NOT NULL,
  "refresh_token" text NOT NULL,
  "access_token_expires_at" timestamp with time zone NOT NULL,
  "scope" text NOT NULL,
  "selected_calendar_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "google_calendar_connections_user_id_unique"
  ON "google_calendar_connections" ("user_id");

CREATE TABLE IF NOT EXISTS "calendar_events" (
  "id" text PRIMARY KEY NOT NULL,
  "business_id" text NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "inquiry_id" text REFERENCES "inquiries"("id") ON DELETE SET NULL,
  "quote_id" text REFERENCES "quotes"("id") ON DELETE SET NULL,
  "google_event_id" text NOT NULL,
  "google_calendar_id" text NOT NULL,
  "title" text NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "event_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "calendar_events_business_id_idx"
  ON "calendar_events" ("business_id");
CREATE INDEX IF NOT EXISTS "calendar_events_user_id_idx"
  ON "calendar_events" ("user_id");
CREATE INDEX IF NOT EXISTS "calendar_events_inquiry_id_idx"
  ON "calendar_events" ("inquiry_id");
CREATE INDEX IF NOT EXISTS "calendar_events_quote_id_idx"
  ON "calendar_events" ("quote_id");
CREATE INDEX IF NOT EXISTS "calendar_events_business_starts_at_idx"
  ON "calendar_events" ("business_id", "starts_at");
