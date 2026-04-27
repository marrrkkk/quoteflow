import "server-only";

import { eq, or } from "drizzle-orm";

import { workspaceMemberInvites } from "@/lib/db/schema";
import { hashOpaqueToken } from "@/lib/security/tokens";

export function createWorkspaceMemberInviteToken() {
  const rawToken = `wmit_${crypto.randomUUID().replace(/-/g, "")}`;

  return {
    rawToken,
    tokenHash: hashOpaqueToken(rawToken),
  };
}

export function getWorkspaceMemberInviteLookupCondition(token: string) {
  return or(
    eq(workspaceMemberInvites.tokenHash, hashOpaqueToken(token)),
  )!;
}
