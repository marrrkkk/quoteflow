import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import type { WorkspaceBusinessType } from "@/features/inquiries/business-types";
import type { InquiryFormConfig } from "@/features/inquiries/form-config";
import type { InquiryPageConfig } from "@/features/inquiries/page-config";
import { user } from "@/lib/db/schema/auth";

export const workspaceMemberRoleEnum = pgEnum("workspace_member_role", [
  "owner",
  "member",
]);

export const workspaceAiTonePreferenceEnum = pgEnum(
  "workspace_ai_tone_preference",
  ["balanced", "warm", "direct", "formal"],
);

export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  jobTitle: text("job_title"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workspaces = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    businessType: text("business_type")
      .$type<WorkspaceBusinessType>()
      .notNull()
      .default("general_services"),
    shortDescription: text("short_description"),
    contactEmail: text("contact_email"),
    logoStoragePath: text("logo_storage_path"),
    logoContentType: text("logo_content_type"),
    publicInquiryEnabled: boolean("public_inquiry_enabled")
      .notNull()
      .default(true),
    inquiryHeadline: text("inquiry_headline"),
    inquiryFormConfig: jsonb("inquiry_form_config").$type<InquiryFormConfig>(),
    inquiryPageConfig: jsonb("inquiry_page_config").$type<InquiryPageConfig>(),
    defaultEmailSignature: text("default_email_signature"),
    defaultQuoteNotes: text("default_quote_notes"),
    defaultQuoteValidityDays: integer("default_quote_validity_days")
      .notNull()
      .default(14),
    aiTonePreference: workspaceAiTonePreferenceEnum("ai_tone_preference")
      .notNull()
      .default("balanced"),
    notifyOnNewInquiry: boolean("notify_on_new_inquiry")
      .notNull()
      .default(true),
    notifyOnQuoteSent: boolean("notify_on_quote_sent").notNull().default(true),
    defaultCurrency: text("default_currency").notNull().default("USD"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("workspaces_slug_unique").on(table.slug),
    index("workspaces_created_at_idx").on(table.createdAt),
    check("workspaces_slug_format", sql`${table.slug} ~ '^[a-z0-9-]+$'`),
    check(
      "workspaces_default_quote_validity_days_range",
      sql`${table.defaultQuoteValidityDays} between 1 and 365`,
    ),
  ],
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: workspaceMemberRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("workspace_members_workspace_user_unique").on(
      table.workspaceId,
      table.userId,
    ),
    index("workspace_members_user_id_idx").on(table.userId),
    index("workspace_members_workspace_role_idx").on(table.workspaceId, table.role),
  ],
);
