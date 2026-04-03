import Link from "next/link";
import type { ReactNode } from "react";
import { Bot, Globe2, Mail, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { updateWorkspaceSettingsAction } from "@/features/settings/actions";
import { WorkspaceSettingsForm } from "@/features/settings/components/workspace-settings-form";
import { getWorkspaceSettingsForWorkspace } from "@/features/settings/queries";
import {
  formatWorkspaceAiToneLabel,
  getWorkspacePublicInquiryUrl,
} from "@/features/settings/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireOwnerWorkspaceContext } from "@/lib/db/workspace-access";

export default async function SettingsPage() {
  const { user, workspaceContext } = await requireOwnerWorkspaceContext();
  const settings = await getWorkspaceSettingsForWorkspace(
    workspaceContext.workspace.id,
  );

  if (!settings) {
    notFound();
  }

  const publicInquiryUrl = getWorkspacePublicInquiryUrl(settings.slug);
  const logoPreviewUrl = settings.logoStoragePath
    ? `/api/workspace/logo?v=${settings.updatedAt.getTime()}`
    : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Update identity, intake defaults, and preferences."
      />

      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <WorkspaceSettingsForm
          action={updateWorkspaceSettingsAction}
          fallbackContactEmail={user.email}
          logoPreviewUrl={logoPreviewUrl}
          settings={settings}
        />

        <div className="flex flex-col gap-6">
          <Card className="bg-background/70">
            <CardHeader className="gap-2">
              <CardTitle>Workspace snapshot</CardTitle>
              <CardDescription>Current live details.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <SnapshotItem
                icon={Globe2}
                label="Public inquiry page"
                value={publicInquiryUrl}
              >
                <Link
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  href={publicInquiryUrl}
                  prefetch={false}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open public page
                </Link>
              </SnapshotItem>
              <SnapshotItem
                icon={Mail}
                label="Contact email"
                value={settings.contactEmail ?? user.email}
              />
              <SnapshotItem
                icon={Bot}
                label="AI tone"
                value={formatWorkspaceAiToneLabel(settings.aiTonePreference)}
              />
              <SnapshotItem
                icon={ShieldCheck}
                label="Notifications"
                value={
                  settings.notifyOnNewInquiry || settings.notifyOnQuoteSent
                    ? "Email preferences enabled"
                    : "All notification scaffolding is off"
                }
              />
            </CardContent>
          </Card>

          <Card className="bg-background/70">
            <CardHeader className="gap-2">
              <CardTitle>What these settings affect</CardTitle>
              <CardDescription>Where the current values show up.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm leading-7 text-muted-foreground">
              <div className="rounded-3xl border bg-background/80 px-4 py-3">
                Public slug and intake settings shape the customer form.
              </div>
              <div className="rounded-3xl border bg-background/80 px-4 py-3">
                AI tone, signature, and quote notes feed internal drafting.
              </div>
              <div className="rounded-3xl border bg-background/80 px-4 py-3">
                Notification preferences stay lightweight for the MVP.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SnapshotItem({
  children,
  icon: Icon,
  label,
  value,
}: {
  children?: ReactNode;
  icon: typeof Globe2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.35rem] border bg-background/80 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-full border bg-secondary">
          <Icon className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="meta-label">{label}</p>
          <p className="break-all text-sm font-medium text-foreground">{value}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
