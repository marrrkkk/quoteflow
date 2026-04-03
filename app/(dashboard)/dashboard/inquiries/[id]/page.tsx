import Link from "next/link";
import { FileText, Mail, Phone, ReceiptText } from "lucide-react";
import { notFound } from "next/navigation";

import {
  DashboardDetailLayout,
  DashboardEmptyState,
  DashboardPage,
  DashboardSection,
  DashboardSidebarStack,
} from "@/components/shared/dashboard-layout";
import { InfoTile } from "@/components/shared/info-tile";
import { PageHeader } from "@/components/shared/page-header";
import { generateInquiryAssistantAction } from "@/features/ai/actions";
import { InquiryAiPanel } from "@/features/ai/components/inquiry-ai-panel";
import {
  addInquiryNoteAction,
  changeInquiryStatusAction,
} from "@/features/inquiries/actions";
import { CopyEmailButton } from "@/features/inquiries/components/copy-email-button";
import { InquiryNoteForm } from "@/features/inquiries/components/inquiry-note-form";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import { InquiryStatusForm } from "@/features/inquiries/components/inquiry-status-form";
import { getInquiryDetailForWorkspace } from "@/features/inquiries/queries";
import { inquiryRouteParamsSchema } from "@/features/inquiries/schemas";
import {
  formatFileSize,
  formatInquiryBudget,
  formatInquiryDate,
  formatInquiryDateTime,
} from "@/features/inquiries/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { requireCurrentWorkspaceContext } from "@/lib/db/workspace-access";

type InquiryDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function InquiryDetailPage({
  params,
}: InquiryDetailPageProps) {
  const parsedParams = inquiryRouteParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    notFound();
  }

  const { workspaceContext } = await requireCurrentWorkspaceContext();
  const inquiry = await getInquiryDetailForWorkspace({
    workspaceId: workspaceContext.workspace.id,
    inquiryId: parsedParams.data.id,
  });

  if (!inquiry) {
    notFound();
  }

  const noteAction = addInquiryNoteAction.bind(null, inquiry.id);
  const statusAction = changeInquiryStatusAction.bind(null, inquiry.id);
  const aiAction = generateInquiryAssistantAction.bind(null, inquiry.id);

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Inquiry detail"
        title={inquiry.customerName}
        description={`${inquiry.serviceCategory} submitted ${formatInquiryDate(
          inquiry.submittedAt,
        )}.`}
        actions={
          <>
            <InquiryStatusBadge status={inquiry.status} />
            <span className="rounded-md border border-border/80 bg-background px-3 py-1 text-xs text-muted-foreground">
              Ref {inquiry.id}
            </span>
            <Button asChild>
              <Link
                href={`/dashboard/quotes/new?inquiryId=${inquiry.id}`}
                prefetch={false}
              >
                <ReceiptText data-icon="inline-start" />
                Generate quote
              </Link>
            </Button>
          </>
        }
      />

      <DashboardDetailLayout className="xl:grid-cols-[1.45fr_0.95fr]">
        <div className="dashboard-side-stack">
          <DashboardSection
            contentClassName="flex flex-col gap-6"
            description="Submitted through the public form."
            title="Inquiry details"
          >
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InfoTile label="Category" value={inquiry.serviceCategory} />
                <InfoTile
                  label="Budget"
                  value={formatInquiryBudget(inquiry.budgetText)}
                />
                <InfoTile
                  label="Deadline"
                  value={inquiry.requestedDeadline ?? "Not provided"}
                />
                <InfoTile
                  label="Source"
                  value={
                    inquiry.source ? inquiry.source.replace(/[-_]/g, " ") : "Unknown"
                  }
                />
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-medium text-foreground">Message</h2>
                <div className="soft-panel bg-muted/25 px-5 py-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                    {inquiry.details}
                  </p>
                </div>
              </div>
          </DashboardSection>

          <DashboardSection
            description="Files included with the inquiry."
            title="Attachments"
          >
              {inquiry.attachments.length ? (
                <div className="flex flex-col gap-3">
                  {inquiry.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="soft-panel flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex flex-col gap-1">
                        <p className="truncate font-medium text-foreground">
                          {attachment.fileName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(attachment.fileSize)} | {attachment.contentType}
                        </p>
                      </div>
                      <Button asChild variant="outline">
                        <a
                          href={`/api/inquiries/${inquiry.id}/attachments/${attachment.id}`}
                        >
                          Download
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState
                  description="This inquiry has no uploaded files."
                  icon={FileText}
                  title="No attachments"
                  variant="section"
                />
              )}
          </DashboardSection>

          <DashboardSection
            contentClassName="flex flex-col gap-5"
            description="Private workspace notes."
            title="Internal notes"
          >
              <InquiryNoteForm action={noteAction} />
              <Separator />
              {inquiry.notes.length ? (
                <div className="flex flex-col gap-3">
                  {inquiry.notes.map((note) => (
                    <div
                      key={note.id}
                      className="soft-panel p-4"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {note.authorName ?? "Workspace owner"}
                          </span>
                          <span>|</span>
                          <span>{formatInquiryDateTime(note.createdAt)}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                          {note.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState
                  description="Add a note for follow-up context."
                  title="No internal notes yet"
                  variant="section"
                />
              )}
          </DashboardSection>

          <DashboardSection
            description="Submission and owner actions."
            title="Activity log"
          >
              {inquiry.activities.length ? (
                <div className="flex flex-col gap-3">
                  {inquiry.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="soft-panel p-4"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-foreground">
                          {activity.summary}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.actorName ?? "QuoteFlow"} |{" "}
                          {formatInquiryDateTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState
                  description="Actions will appear here as work progresses."
                  title="No activity yet"
                  variant="section"
                />
              )}
          </DashboardSection>
        </div>

        <DashboardSidebarStack>
          <DashboardSection
            contentClassName="flex flex-col gap-4"
            description="Email or call from here."
            footer={
              <>
                <Button asChild variant="outline">
                  <a href={`mailto:${inquiry.customerEmail}`}>Email customer</a>
                </Button>
                <CopyEmailButton email={inquiry.customerEmail} />
              </>
            }
            title="Customer contact"
          >
              <InfoTile
                icon={Mail}
                label="Email"
                value={
                  <a
                    className="truncate underline-offset-4 hover:underline"
                    href={`mailto:${inquiry.customerEmail}`}
                  >
                    {inquiry.customerEmail}
                  </a>
                }
              />

              <InfoTile
                icon={Phone}
                label="Phone"
                value={
                  inquiry.customerPhone ? (
                    <a
                      className="underline-offset-4 hover:underline"
                      href={`tel:${inquiry.customerPhone}`}
                    >
                      {inquiry.customerPhone}
                    </a>
                  ) : (
                    "Not provided"
                  )
                }
              />
          </DashboardSection>

          <DashboardSection
            contentClassName="flex flex-col gap-4"
            description="Open the linked quote or create one."
            footer={
              <>
                {inquiry.relatedQuote ? (
                  <Button asChild variant="outline">
                    <Link
                      href={`/dashboard/quotes/${inquiry.relatedQuote.id}`}
                      prefetch={false}
                    >
                      View quote
                    </Link>
                  </Button>
                ) : null}
                <Button asChild>
                  <Link href={`/dashboard/quotes/new?inquiryId=${inquiry.id}`} prefetch={false}>
                    Generate quote
                  </Link>
                </Button>
              </>
            }
            title="Related quote"
          >
              {inquiry.relatedQuote ? (
                <div className="soft-panel p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-border/80 bg-secondary px-3 py-1 text-xs font-medium capitalize text-foreground">
                        {inquiry.relatedQuote.status}
                      </span>
                      <span className="rounded-md border border-border/80 bg-secondary px-3 py-1 text-xs text-muted-foreground">
                        {inquiry.relatedQuote.quoteNumber ?? inquiry.relatedQuote.id}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoTile
                        label="Quote status"
                        value={inquiry.relatedQuote.status}
                      />
                      <InfoTile
                        label="Total"
                        value={`$${(inquiry.relatedQuote.totalInCents / 100).toFixed(2)}`}
                      />
                      <InfoTile
                        label="Created"
                        value={formatInquiryDate(inquiry.relatedQuote.createdAt)}
                      />
                      <InfoTile
                        label="Linked quotes"
                        value={`${inquiry.relatedQuote.quoteCount}`}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <DashboardEmptyState
                  description="Create a quote from this inquiry."
                  icon={ReceiptText}
                  title="No related quote yet"
                  variant="section"
                />
              )}
          </DashboardSection>

          <DashboardSection
            description="Move the inquiry forward."
            title="Status"
          >
              <InquiryStatusForm
                key={inquiry.status}
                action={statusAction}
                currentStatus={inquiry.status}
              />
          </DashboardSection>

          <InquiryAiPanel action={aiAction} />
        </DashboardSidebarStack>
      </DashboardDetailLayout>
    </DashboardPage>
  );
}
