import { CalendarDays, ExternalLink } from "lucide-react";
import { format } from "date-fns";

import {
  DashboardDetailFeed,
  DashboardDetailFeedItem,
  DashboardEmptyState,
  DashboardSection,
} from "@/components/shared/dashboard-layout";
import type { CalendarEventSummaryItem } from "@/features/calendar/types";

type CalendarEventSummaryProps = {
  events: CalendarEventSummaryItem[];
};

function formatEventDateTime(date: Date) {
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

/**
 * Displays linked calendar events on an inquiry or quote detail page.
 * Shows a compact list with event title, date, and Google Calendar link.
 */
export function CalendarEventSummary({ events }: CalendarEventSummaryProps) {
  return (
    <DashboardSection
      description="Events scheduled from this record."
      title="Calendar events"
    >
      {events.length ? (
        <DashboardDetailFeed>
          {events.map((event) => (
            <DashboardDetailFeedItem
              key={event.id}
              action={
                event.eventUrl ? (
                  <a
                    className="flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                    href={event.eventUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <ExternalLink className="size-3.5" />
                    <span className="sr-only">Open in Google Calendar</span>
                  </a>
                ) : null
              }
              meta={formatEventDateTime(event.startsAt)}
              title={event.title}
            />
          ))}
        </DashboardDetailFeed>
      ) : (
        <DashboardEmptyState
          description="Create a calendar event to schedule a call, visit, or follow-up."
          icon={CalendarDays}
          title="No events scheduled"
          variant="section"
        />
      )}
    </DashboardSection>
  );
}
