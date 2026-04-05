import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { businesses } from "@/lib/db/schema/businesses";

export const replySnippets = pgTable(
  "reply_snippets",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("reply_snippets_business_id_idx").on(table.businessId),
    index("reply_snippets_business_created_at_idx").on(
      table.businessId,
      table.createdAt,
    ),
  ],
);
