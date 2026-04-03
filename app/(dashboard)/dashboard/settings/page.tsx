import Link from "next/link";
import {
  BookCopy,
  Bot,
  Globe2,
  Mail,
  ShieldCheck,
  Sparkles,
  TextQuote,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

import {
  DashboardDetailLayout,
  DashboardEmptyState,
  DashboardMetaPill,
  DashboardPage,
  DashboardSection,
  DashboardSidebarStack,
} from "@/components/shared/dashboard-layout";
import { InfoTile } from "@/components/shared/info-tile";
import { PageHeader } from "@/components/shared/page-header";
import {
  createKnowledgeFaqAction,
  deleteKnowledgeFaqAction,
  deleteKnowledgeFileAction,
  updateKnowledgeFaqAction,
  uploadKnowledgeFileAction,
} from "@/features/knowledge/actions";
import { KnowledgeFaqCard } from "@/features/knowledge/components/knowledge-faq-card";
import { KnowledgeFaqForm } from "@/features/knowledge/components/knowledge-faq-form";
import { KnowledgeFileDeleteButton } from "@/features/knowledge/components/knowledge-file-delete-button";
import { KnowledgeFileUploadForm } from "@/features/knowledge/components/knowledge-file-upload-form";
import { getKnowledgeDashboardData } from "@/features/knowledge/queries";
import {
  formatKnowledgeDate,
  formatKnowledgeFileSize,
  getKnowledgeTextPreview,
} from "@/features/knowledge/utils";
import { updateWorkspaceSettingsAction } from "@/features/settings/actions";
import { WorkspaceSettingsForm } from "@/features/settings/components/workspace-settings-form";
import { getWorkspaceSettingsForWorkspace } from "@/features/settings/queries";
import {
  formatWorkspaceAiToneLabel,
  getWorkspacePublicInquiryUrl,
} from "@/features/settings/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { requireCurrentWorkspaceContext } from "@/lib/db/workspace-access";

export default async function SettingsPage() {
  const { user, workspaceContext } = await requireCurrentWorkspaceContext();

  if (workspaceContext.role !== "owner") {
    redirect("/dashboard");
  }

  const [settings, knowledgeData] = await Promise.all([
    getWorkspaceSettingsForWorkspace(workspaceContext.workspace.id),
    getKnowledgeDashboardData(workspaceContext.workspace.id),
  ]);

  if (!settings) {
    notFound();
  }

  const publicInquiryUrl = getWorkspacePublicInquiryUrl(settings.slug);
  const logoPreviewUrl = settings.logoStoragePath
    ? `/api/workspace/logo?v=${settings.updatedAt.getTime()}`
    : null;
  const readyFileCount = knowledgeData.files.filter((file) =>
    Boolean(file.extractedText?.trim()),
  ).length;
  const contextSourceCount = readyFileCount + knowledgeData.faqs.length;

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Workspace"
        title="Workspace"
        description="Manage identity, intake defaults, and reusable business context."
      />

      <DashboardDetailLayout className="xl:grid-cols-[1.12fr_0.88fr]">
        <WorkspaceSettingsForm
          action={updateWorkspaceSettingsAction}
          fallbackContactEmail={user.email}
          logoPreviewUrl={logoPreviewUrl}
          settings={settings}
        />

        <DashboardSidebarStack className="xl:sticky xl:top-[5.5rem] xl:self-start">
          <DashboardSection
            contentClassName="flex flex-col gap-4"
            description="Current live details."
            title="Workspace snapshot"
          >
            <InfoTile
              icon={Globe2}
              label="Public inquiry page"
              value={publicInquiryUrl}
              description={
                <Link
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  href={publicInquiryUrl}
                  prefetch={false}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open public page
                </Link>
              }
              valueClassName="break-all"
            />
            <InfoTile
              icon={Mail}
              label="Contact email"
              value={settings.contactEmail ?? user.email}
            />
            <InfoTile
              icon={Bot}
              label="AI tone"
              value={formatWorkspaceAiToneLabel(settings.aiTonePreference)}
            />
            <InfoTile
              icon={Sparkles}
              label="Knowledge sources"
              value={`${contextSourceCount}`}
              description={
                <a
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  href="#knowledge"
                >
                  Manage files and FAQs
                </a>
              }
            />
            <InfoTile
              icon={ShieldCheck}
              label="Notifications"
              value={
                settings.notifyOnNewInquiry || settings.notifyOnQuoteSent
                  ? "Email preferences enabled"
                  : "All notification scaffolding is off"
              }
            />
          </DashboardSection>

          <DashboardSection
            contentClassName="flex flex-col gap-4 text-sm leading-7 text-muted-foreground"
            description="Where the current values show up."
            title="What this affects"
          >
            <div className="soft-panel px-4 py-3">
              Public slug and intake settings shape the customer form.
            </div>
            <div className="soft-panel px-4 py-3">
              AI tone, signature, and quote notes feed internal drafting.
            </div>
            <div className="soft-panel px-4 py-3">
              Knowledge files and FAQs support reply drafts and future context.
            </div>
          </DashboardSection>
        </DashboardSidebarStack>
      </DashboardDetailLayout>

      <div className="flex flex-col gap-5" id="knowledge">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="meta-label">Knowledge</p>
            <h2 className="mt-2 text-[1.65rem] font-semibold tracking-tight text-foreground">
              Files and FAQs
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Reference files and short answers the workspace can reuse in drafts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <DashboardMetaPill>{knowledgeData.files.length} files</DashboardMetaPill>
            <DashboardMetaPill>{knowledgeData.faqs.length} FAQs</DashboardMetaPill>
            <DashboardMetaPill>{contextSourceCount} ready sources</DashboardMetaPill>
          </div>
        </div>

        <DashboardDetailLayout className="xl:grid-cols-[1.1fr_0.9fr]">
          <div className="dashboard-side-stack">
            <DashboardSection
              description="Add a text-based reference file."
              title="Upload a knowledge file"
            >
              <KnowledgeFileUploadForm action={uploadKnowledgeFileAction} />
            </DashboardSection>

            <DashboardSection
              description="Newest files first."
              title="Uploaded files"
            >
              {knowledgeData.files.length ? (
                <div className="flex flex-col gap-4">
                  {knowledgeData.files.map((file) => (
                    <div
                      key={file.id}
                      className="soft-panel p-5"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex flex-col gap-1">
                            <p className="font-medium text-foreground">
                              {file.title}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">
                              {file.fileName}
                            </p>
                          </div>

                          <div className="flex flex-col items-start gap-2 sm:items-end">
                            <span className="dashboard-meta-pill min-h-0 px-3 py-1">
                              {formatKnowledgeFileSize(file.fileSize)}
                            </span>
                            <span className="dashboard-meta-pill min-h-0 px-3 py-1">
                              {formatKnowledgeDate(file.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
                          <div className="info-tile bg-muted/20 p-4 shadow-none">
                            <p className="meta-label">Text preview</p>
                            <p className="mt-3 text-sm leading-7 text-foreground">
                              {getKnowledgeTextPreview(file.extractedText) ??
                                "No extracted text was stored for this file."}
                            </p>
                          </div>

                          <div className="info-tile flex flex-col gap-3 bg-muted/20 p-4 shadow-none">
                            <div className="flex flex-col gap-1">
                              <p className="meta-label">Content type</p>
                              <p className="text-sm text-foreground">
                                {file.contentType}
                              </p>
                            </div>

                            <Separator />

                            <KnowledgeFileDeleteButton
                              action={deleteKnowledgeFileAction.bind(null, file.id)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState
                  action={
                    <Button asChild variant="outline">
                      <a href="#knowledge-file-upload">Upload a file</a>
                    </Button>
                  }
                  description="Upload a reference file to start building reusable workspace context."
                  icon={BookCopy}
                  title="No knowledge files yet"
                  variant="section"
                />
              )}
            </DashboardSection>
          </div>

          <div className="dashboard-side-stack">
            <DashboardSection
              description="Save a short reusable answer."
              title="Add an FAQ"
            >
              <KnowledgeFaqForm
                action={createKnowledgeFaqAction}
                submitLabel="Add FAQ"
                submitPendingLabel="Adding FAQ..."
                idPrefix="knowledge-faq-create"
              />
            </DashboardSection>

            <DashboardSection
              description="Edit or remove existing answers."
              title="Workspace FAQs"
            >
              {knowledgeData.faqs.length ? (
                <div className="flex flex-col gap-4">
                  {knowledgeData.faqs.map((faq) => (
                    <KnowledgeFaqCard
                      key={faq.id}
                      deleteAction={deleteKnowledgeFaqAction.bind(null, faq.id)}
                      faq={faq}
                      updateAction={updateKnowledgeFaqAction.bind(null, faq.id)}
                    />
                  ))}
                </div>
              ) : (
                <DashboardEmptyState
                  action={
                    <Button asChild variant="outline">
                      <a href="#knowledge-faq-create-question">Add an FAQ</a>
                    </Button>
                  }
                  description="Add a short internal answer for pricing rules, policies, or workflow defaults."
                  icon={TextQuote}
                  title="No FAQs yet"
                  variant="section"
                />
              )}
            </DashboardSection>
          </div>
        </DashboardDetailLayout>
      </div>
    </DashboardPage>
  );
}
