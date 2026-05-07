import type { BusinessMemberRole } from "@/lib/business-members";
import { businessMemberRoleMeta } from "@/lib/business-members";
import {
  emailBrand,
  escapeHtml,
  renderDetailsCard,
  renderEmailLayout,
} from "./shared";

type WorkspaceMemberInviteTemplateInput = {
  workspaceName: string;
  inviterName: string;
  workspaceRole: BusinessMemberRole;
  inviteUrl: string;
};

export function renderWorkspaceMemberInviteEmail({
  workspaceName,
  inviterName,
  workspaceRole,
  inviteUrl,
}: WorkspaceMemberInviteTemplateInput) {
  const roleLabel = businessMemberRoleMeta[workspaceRole].label;
  const subject = `${inviterName} invited you to join ${workspaceName} on Requo`;
  const text = `Hi,

${inviterName} invited you to join ${workspaceName} on Requo as a ${roleLabel}.

Open your invite here:
${inviteUrl}

If you were not expecting this invite, you can ignore this email.`;

  const html = renderEmailLayout({
    label: "Invite",
    title: `Join ${workspaceName}`,
    preheader: `${inviterName} invited you to join ${workspaceName} on Requo.`,
    footerContext: workspaceName,
    cta: {
      href: inviteUrl,
      label: "Open invite",
    },
    children: `
      <p style="margin: 0; color: ${emailBrand.foregroundColor}; font-size: 15px; line-height: 24px;">
        <strong>${escapeHtml(inviterName)}</strong> invited you to join <strong>${escapeHtml(workspaceName)}</strong> on Requo.
      </p>
      ${renderDetailsCard("Invite details", [
        { label: "Workspace", value: workspaceName },
        { label: "Role", value: roleLabel },
      ])}
      <p style="margin: 18px 0 0; color: ${emailBrand.mutedTextColor}; font-size: 13px; line-height: 20px;">If you were not expecting this invite, you can ignore this email.</p>
    `,
  });

  return {
    subject,
    text,
    html,
  };
}
