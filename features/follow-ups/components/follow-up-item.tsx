import Link from "next/link";
import { ArrowRight, Calendar, Mail, MessageSquare, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  completeFollowUpAction,
  deleteFollowUpAction,
  editFollowUpAction,
  reassignFollowUpAction,
  rescheduleFollowUpAction,
  skipFollowUpAction,
} from "@/features/follow-ups/actions";
import { FollowUpActions } from "@/features/follow-ups/components/follow-up-actions";
import { FollowUpAiMessageButton } from "@/features/follow-ups/components/follow-up-ai-message-button";
import { FollowUpDeleteDialog } from "@/features/follow-ups/components/follow-up-delete-dialog";
import { FollowUpEditDialog } from "@/features/follow-ups/components/follow-up-edit-dialog";
import { FollowUpMessageCopyButton } from "@/features/follow-ups/components/follow-up-message-copy-button";
import { FollowUpReassignDialog, type TeamMemberOption } from "@/features/follow-ups/components/follow-up-reassign-dialog";
import {
  FollowUpDueBadge,
  FollowUpStatusBadge,
} from "@/features/follow-ups/components/follow-up-status-badge";
import type { FollowUpChannel, FollowUpView } from "@/features/follow-ups/types";
import {
  formatFollowUpDate,
  getFollowUpChannelLabel,
} from "@/features/follow-ups/utils";
import {
  getBusinessInquiryPath,
  getBusinessQuotePath,
} from "@/features/businesses/routes";
import { cn } from "@/lib/utils";

export function getFollowUpRelatedHref(
  businessSlug: string,
  followUp: FollowUpView,
) {
  return followUp.related.kind === "quote"
    ? getBusinessQuotePath(businessSlug, followUp.related.id)
    : getBusinessInquiryPath(businessSlug, followUp.related.id);
}

function ChannelIcon({ channel }: { channel: FollowUpChannel }) {
  switch (channel) {
    case "email":
      return <Mail className="size-3.5" aria-hidden="true" />;
    case "phone":
      return <Phone className="size-3.5" aria-hidden="true" />;
    case "sms":
    case "whatsapp":
    case "messenger":
    case "instagram":
      return <MessageSquare className="size-3.5" aria-hidden="true" />;
    default:
      return <Mail className="size-3.5" aria-hidden="true" />;
  }
}

export function FollowUpItem({
  businessSlug,
  businessName,
  className,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  compact = false,
  followUp,
  members = [],
  showMessage = true,
  aiTone = "balanced",
}: {
  businessSlug: string;
  businessName?: string;
  className?: string;
  compact?: boolean;
  followUp: FollowUpView;
  members?: TeamMemberOption[];
  showMessage?: boolean;
  aiTone?: "balanced" | "warm" | "direct" | "formal";
}) {
  const relatedHref = getFollowUpRelatedHref(businessSlug, followUp);
  const completeAction = completeFollowUpAction.bind(null, followUp.id);
  const skipAction = skipFollowUpAction.bind(null, followUp.id);
  const rescheduleAction = rescheduleFollowUpAction.bind(null, followUp.id);
  const editAction = editFollowUpAction.bind(null, followUp.id);
  const deleteAction = deleteFollowUpAction.bind(null, followUp.id);
  const reassignAction = reassignFollowUpAction.bind(null, followUp.id);

  return (
    <div
      className={cn(
        "soft-panel flex flex-col gap-3.5 px-4 py-4 shadow-none",
        className,
      )}
    >
      {/* Header: title + badges + open link */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {followUp.title}
            </p>
            {followUp.status === "pending" ? (
              <FollowUpDueBadge bucket={followUp.dueBucket} />
            ) : (
              <FollowUpStatusBadge status={followUp.status} />
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {followUp.reason}
          </p>
        </div>

        <Button asChild size="sm" variant="ghost" className="shrink-0">
          <Link href={relatedHref} prefetch={true}>
            Open
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>

      {/* Meta row: customer, related record, date, channel */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">
          {followUp.customerName}
        </span>
        <span className="text-border">·</span>
        <Badge variant="outline" className="text-xs">
          {followUp.related.label}
        </Badge>
        <span className="text-border">·</span>
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="size-3" aria-hidden="true" />
          {formatFollowUpDate(followUp.dueAt)}
        </span>
        <span className="text-border">·</span>
        <span className="inline-flex items-center gap-1.5">
          <ChannelIcon channel={followUp.channel} />
          {getFollowUpChannelLabel(followUp.channel)}
        </span>
      </div>

      {/* Suggested message */}
      {showMessage && followUp.suggestedMessage ? (
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3.5 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            Suggested message
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {followUp.suggestedMessage}
          </p>
          <div className="mt-2.5">
            <FollowUpMessageCopyButton message={followUp.suggestedMessage} />
          </div>
        </div>
      ) : null}

      {/* AI message generation */}
      {showMessage && followUp.status === "pending" && businessName ? (
        <FollowUpAiMessageButton
          aiTone={aiTone}
          businessName={businessName}
          channel={followUp.channel}
          customerName={followUp.customerName}
          followUpReason={followUp.reason}
          followUpTitle={followUp.title}
          quoteUrl={followUp.quotePublicUrl}
          quoteViewed={Boolean(followUp.quoteViewedAt)}
          recordKind={followUp.related.kind}
        />
      ) : null}

      {/* Actions */}
      {followUp.status === "pending" ? (
        <FollowUpActions
          completeAction={completeAction}
          dueAt={followUp.dueAt}
          rescheduleAction={rescheduleAction}
          skipAction={skipAction}
        />
      ) : null}

      {/* Secondary actions: edit, reassign, delete */}
      {followUp.status === "pending" ? (
        <div className="flex flex-wrap items-center gap-1 border-t border-border/50 pt-3">
          <FollowUpEditDialog action={editAction} followUp={followUp} />
          {members.length > 1 ? (
            <FollowUpReassignDialog
              action={reassignAction}
              currentAssignedUserId={followUp.assignedToUserId}
              members={members}
            />
          ) : null}
          <FollowUpDeleteDialog action={deleteAction} followUpTitle={followUp.title} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-1 border-t border-border/50 pt-3">
          <FollowUpDeleteDialog action={deleteAction} followUpTitle={followUp.title} />
        </div>
      )}
    </div>
  );
}
