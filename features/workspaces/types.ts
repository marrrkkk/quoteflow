export const workspaceMemberRoles = ["owner", "member"] as const;

export type WorkspaceMemberRole = (typeof workspaceMemberRoles)[number];
