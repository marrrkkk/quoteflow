import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import type { WorkspaceBusinessType } from "@/features/inquiries/business-types";
import type { InquiryFormConfig } from "@/features/inquiries/form-config";
import type { InquiryPageConfig } from "@/features/inquiries/page-config";
import { workspaces } from "@/lib/db/schema/workspaces";

export const workspaceInquiryForms = pgTable(
  "workspace_inquiry_forms",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    businessType: text("business_type")
      .$type<WorkspaceBusinessType>()
      .notNull()
      .default("general_services"),
    isDefault: boolean("is_default").notNull().default(false),
    publicInquiryEnabled: boolean("public_inquiry_enabled")
      .notNull()
      .default(true),
    inquiryFormConfig: jsonb("inquiry_form_config")
      .$type<InquiryFormConfig>()
      .notNull(),
    inquiryPageConfig: jsonb("inquiry_page_config")
      .$type<InquiryPageConfig>()
      .notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("workspace_inquiry_forms_workspace_slug_unique").on(
      table.workspaceId,
      table.slug,
    ),
    index("workspace_inquiry_forms_workspace_id_idx").on(table.workspaceId),
    index("workspace_inquiry_forms_workspace_default_idx").on(
      table.workspaceId,
      table.isDefault,
    ),
    index("workspace_inquiry_forms_workspace_archived_idx").on(
      table.workspaceId,
      table.archivedAt,
    ),
    check(
      "workspace_inquiry_forms_slug_format",
      sql`${table.slug} ~ '^[a-z0-9-]+$'`,
    ),
  ],
);
