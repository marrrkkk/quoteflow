import type { WorkspaceMemberAssignableRole } from "@/features/workspace-members/types";
import { workspaceMemberRoleMeta } from "@/features/workspace-members/types";
import { env } from "@/lib/env";

type WorkspaceMemberInviteTemplateInput = {
  workspaceName: string;
  inviterName: string;
  workspaceRole: WorkspaceMemberAssignableRole;
  inviteUrl: string;
};

export function renderWorkspaceMemberInviteEmail({
  workspaceName,
  inviterName,
  workspaceRole,
  inviteUrl,
}: WorkspaceMemberInviteTemplateInput) {
  const roleLabel = workspaceMemberRoleMeta[workspaceRole].label;
  const subject = `${inviterName} invited you to join ${workspaceName} on Requo`;
  const text = `Hi,

${inviterName} invited you to join ${workspaceName} on Requo as a ${roleLabel}.

Open your invite here:
${inviteUrl}

If you were not expecting this invite, you can ignore this email.`;

  const baseUrl = env.BETTER_AUTH_URL || "https://requo.com";
  const logoUrl = `${baseUrl}/logo.svg`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #172033; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${logoUrl}" alt="Requo" width="32" height="32" style="display: block; margin: 0 auto;" />
        <p style="font-size: 14px; font-weight: 600; color: #555; margin-top: 8px;">Requo</p>
      </div>
      <h1 style="font-size: 24px; margin-bottom: 16px; text-align: center; color: #111;">Join ${workspaceName}</h1>
      <p style="font-size: 16px; text-align: center;"><strong>${inviterName}</strong> invited you to join <strong>${workspaceName}</strong> as a ${roleLabel}.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteUrl}" style="display: inline-block; padding: 14px 24px; border-radius: 8px; background: #000000; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
          Open Invite
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 32px 0;" />
      <p style="font-size: 14px; color: #666; text-align: center; margin: 0;">If you were not expecting this invite, you can safely ignore this email.</p>
    </div>
  `;

  return {
    subject,
    text,
    html,
  };
}
