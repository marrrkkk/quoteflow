import { z } from "zod";

import { businessMemberAssignableRoles } from "@/lib/business-members";
import { workspaceMemberAssignableRoles } from "@/features/workspace-members/types";

function normalizeEmailAddress(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

const businessAssignmentSchema = z.object({
  businessId: z.string().trim().min(1),
  role: z.enum(businessMemberAssignableRoles),
});

export const workspaceMemberInviteSchema = z.object({
  email: z.preprocess(
    normalizeEmailAddress,
    z.email("Enter a valid email address."),
  ),
  workspaceRole: z.enum(workspaceMemberAssignableRoles, {
    error: "Choose a workspace role.",
  }),
  businessAssignments: z
    .array(businessAssignmentSchema)
    .optional()
    .default([]),
});

export const workspaceMemberRoleUpdateSchema = z.object({
  role: z.enum(workspaceMemberAssignableRoles, {
    error: "Choose a member role.",
  }),
});

export const workspaceMemberIdSchema = z.string().trim().min(1);
export const workspaceMemberInviteIdSchema = z.string().trim().min(1);
export const workspaceMemberInviteTokenSchema = z.string().trim().min(1).max(512);
