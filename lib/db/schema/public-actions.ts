import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const publicActionEvents = pgTable(
  "public_action_events",
  {
    id: text("id").primaryKey(),
    action: text("action").notNull(),
    key: text("key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("public_action_events_action_key_created_at_idx").on(
      table.action,
      table.key,
      table.createdAt,
    ),
    index("public_action_events_created_at_idx").on(table.createdAt),
  ],
);
