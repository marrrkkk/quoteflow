import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import type { BusinessMemberAssignableRole } from "@/lib/business-members";
import { user } from "@/lib/db/schema/auth";
import { workspaceMemberRoleEnum, workspaces } from "@/lib/db/schema/workspaces";

/**
 * Business assignment embedded in a workspace invite.
 * Stored as a JSONB array on each invite row.
 */
export type WorkspaceInviteBusinessAssignment = {
  businessId: string;
  role: BusinessMemberAssignableRole;
};

export const workspaceMemberInvites = pgTable(
  "workspace_member_invites",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    inviterUserId: text("inviter_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    workspaceRole: workspaceMemberRoleEnum("workspace_role")
      .notNull()
      .default("member"),
    businessAssignments:
      jsonb("business_assignments").$type<WorkspaceInviteBusinessAssignment[]>(),
    token: text("token"),
    tokenHash: text("token_hash"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("workspace_member_invites_workspace_email_unique").on(
      table.workspaceId,
      table.email,
    ),
    uniqueIndex("workspace_member_invites_token_hash_unique").on(
      table.tokenHash,
    ),
    index("workspace_member_invites_workspace_id_idx").on(table.workspaceId),
    index("workspace_member_invites_email_idx").on(table.email),
    index("workspace_member_invites_token_hash_idx").on(table.tokenHash),
    index("workspace_member_invites_expires_at_idx").on(table.expiresAt),
  ],
);
