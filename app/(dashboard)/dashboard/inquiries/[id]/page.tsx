import Link from "next/link";
import { FileText, Mail, Phone, ReceiptText } from "lucide-react";
import { notFound } from "next/navigation";

import { addInquiryNoteAction, changeInquiryStatusAction } from "@/features/inquiries/actions";
import { CopyEmailButton } from "@/features/inquiries/components/copy-email-button";
import { InquiryAiPlaceholder } from "@/features/inquiries/components/inquiry-ai-placeholder";
import { InquiryNoteForm } from "@/features/inquiries/components/inquiry-note-form";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import { InquiryStatusForm } from "@/features/inquiries/components/inquiry-status-form";
import { inquiryRouteParamsSchema } from "@/features/inquiries/schemas";
import { getInquiryDetailForWorkspace } from "@/features/inquiries/queries";
import {
  formatFileSize,
  formatInquiryBudget,
  formatInquiryDate,
  formatInquiryDateTime,
} from "@/features/inquiries/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl flex flex-col gap-3">
          <span className="eyebrow">Inquiry detail</span>
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {inquiry.customerName}
            </h1>
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
              {inquiry.serviceCategory} inquiry submitted on{" "}
              {formatInquiryDate(inquiry.submittedAt)}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <InquiryStatusBadge status={inquiry.status} />
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              Ref {inquiry.id}
            </span>
          </div>
        </div>

        <Button asChild>
          <Link href={`/dashboard/quotes/new?inquiryId=${inquiry.id}`} prefetch={false}>
            <ReceiptText data-icon="inline-start" />
            Generate quote
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="flex flex-col gap-6">
          <Card className="bg-background/75">
            <CardHeader className="gap-2">
              <CardTitle>Inquiry details</CardTitle>
              <CardDescription>
                Shared directly by the customer through the public inquiry page.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <DetailStat
                  label="Category"
                  value={inquiry.serviceCategory}
                />
                <DetailStat
                  label="Budget"
                  value={formatInquiryBudget(inquiry.budgetText)}
                />
                <DetailStat
                  label="Deadline"
                  value={inquiry.requestedDeadline ?? "Not provided"}
                />
                <DetailStat
                  label="Source"
                  value={
                    inquiry.source
                      ? inquiry.source.replace(/[-_]/g, " ")
                      : "Unknown"
                  }
                />
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-medium text-foreground">
                  Message and scope
                </h2>
                <div className="rounded-3xl border bg-muted/25 px-4 py-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                    {inquiry.details}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/75">
            <CardHeader className="gap-2">
              <CardTitle>Attachments</CardTitle>
              <CardDescription>
                Files attached during the inquiry submission.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inquiry.attachments.length ? (
                <div className="flex flex-col gap-3">
                  {inquiry.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex flex-col gap-3 rounded-3xl border bg-background/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex flex-col gap-1">
                        <p className="truncate font-medium text-foreground">
                          {attachment.fileName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(attachment.fileSize)} •{" "}
                          {attachment.contentType}
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
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileText />
                    </EmptyMedia>
                    <EmptyTitle>No attachments</EmptyTitle>
                    <EmptyDescription>
                      This inquiry did not include any uploaded files.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>

          <Card className="bg-background/75">
            <CardHeader className="gap-2">
              <CardTitle>Internal notes</CardTitle>
              <CardDescription>
                Keep private context and follow-up details tied to this inquiry.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <InquiryNoteForm action={noteAction} />
              <Separator />
              {inquiry.notes.length ? (
                <div className="flex flex-col gap-3">
                  {inquiry.notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-3xl border bg-background/80 p-4"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {note.authorName ?? "Workspace owner"}
                          </span>
                          <span>•</span>
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
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyTitle>No internal notes yet</EmptyTitle>
                    <EmptyDescription>
                      Add the first note to capture follow-up context for this
                      inquiry.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>

          <Card className="bg-background/75">
            <CardHeader className="gap-2">
              <CardTitle>Activity log</CardTitle>
              <CardDescription>
                Workspace-visible timeline for public submissions and owner
                actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inquiry.activities.length ? (
                <div className="flex flex-col gap-3">
                  {inquiry.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-3xl border bg-background/80 p-4"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-foreground">
                          {activity.summary}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.actorName ?? "QuoteFlow"} •{" "}
                          {formatInquiryDateTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyTitle>No activity yet</EmptyTitle>
                    <EmptyDescription>
                      Public submission and owner actions will appear here as
                      the inquiry progresses.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="bg-background/75">
            <CardHeader className="gap-2">
              <CardTitle>Customer contact</CardTitle>
              <CardDescription>
                Reach back out without leaving the inquiry detail page.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-3xl border bg-background/80 p-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5" />
                  <div className="min-w-0 flex flex-1 flex-col gap-1">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Email
                    </p>
                    <a
                      className="truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
                      href={`mailto:${inquiry.customerEmail}`}
                    >
                      {inquiry.customerEmail}
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border bg-background/80 p-4">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5" />
                  <div className="min-w-0 flex flex-1 flex-col gap-1">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Phone
                    </p>
                    {inquiry.customerPhone ? (
                      <a
                        className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                        href={`tel:${inquiry.customerPhone}`}
                      >
                        {inquiry.customerPhone}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not provided
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-end">
              <Button asChild variant="outline">
                <a href={`mailto:${inquiry.customerEmail}`}>Email customer</a>
              </Button>
              <CopyEmailButton email={inquiry.customerEmail} />
            </CardFooter>
          </Card>

          <Card className="bg-background/75">
            <CardHeader className="gap-2">
              <CardTitle>Related quote</CardTitle>
              <CardDescription>
                Jump from the inquiry into quote creation or open the latest
                linked quote.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {inquiry.relatedQuote ? (
                <div className="rounded-3xl border bg-background/80 p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border bg-muted/35 px-3 py-1 text-xs font-medium capitalize text-foreground">
                          {inquiry.relatedQuote.status}
                        </span>
                        <span className="rounded-full border bg-muted/35 px-3 py-1 text-xs text-muted-foreground">
                          {inquiry.relatedQuote.quoteNumber ?? inquiry.relatedQuote.id}
                        </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailStat
                        label="Quote status"
                        value={inquiry.relatedQuote.status}
                      />
                      <DetailStat
                        label="Total"
                        value={`$${(inquiry.relatedQuote.totalInCents / 100).toFixed(2)}`}
                      />
                      <DetailStat
                        label="Created"
                        value={formatInquiryDate(inquiry.relatedQuote.createdAt)}
                      />
                      <DetailStat
                        label="Linked quotes"
                        value={`${inquiry.relatedQuote.quoteCount}`}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ReceiptText />
                    </EmptyMedia>
                    <EmptyTitle>No related quote yet</EmptyTitle>
                    <EmptyDescription>
                      Start a quote from this inquiry to carry customer context
                      into the quote builder entry point.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-end">
              {inquiry.relatedQuote ? (
                <Button asChild variant="outline">
                  <Link href={`/dashboard/quotes/${inquiry.relatedQuote.id}`} prefetch={false}>
                    View quote
                  </Link>
                </Button>
              ) : null}
              <Button asChild>
                <Link href={`/dashboard/quotes/new?inquiryId=${inquiry.id}`} prefetch={false}>
                  Generate quote
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-background/75">
            <CardHeader className="gap-2">
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Move the inquiry through the owner workflow without leaving this
                detail view.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InquiryStatusForm
                key={inquiry.status}
                action={statusAction}
                currentStatus={inquiry.status}
              />
            </CardContent>
          </Card>

          <InquiryAiPlaceholder />
        </div>
      </div>
    </div>
  );
}

type DetailStatProps = {
  label: string;
  value: string;
};

function DetailStat({ label, value }: DetailStatProps) {
  return (
    <div className="rounded-3xl border bg-background/80 p-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
