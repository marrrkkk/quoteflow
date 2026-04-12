

import { Button } from "@/components/ui/button";
import type { CalendarEventPrefill } from "@/features/calendar/types";
import { GoogleCalendarIcon } from "./google-calendar-icon";
import { CreateCalendarEventDialog } from "./create-calendar-event-dialog";

type AddToCalendarButtonProps = {
  prefill: CalendarEventPrefill;
  businessId: string;
  inquiryId?: string;
  quoteId?: string;
  /** True if the user has a Google Calendar connection */
  connected: boolean;
};

/**
 * Smart button: opens the event dialog if connected,
 * or links to the connect flow if not.
 */
export function AddToCalendarButton({
  prefill,
  businessId,
  inquiryId,
  quoteId,
  connected,
}: AddToCalendarButtonProps) {
  if (!connected) {
    return (
      <Button asChild variant="outline">
        <a href="/api/google-calendar/connect">
          <GoogleCalendarIcon />
          Connect Calendar
        </a>
      </Button>
    );
  }

  return (
    <CreateCalendarEventDialog
      businessId={businessId}
      inquiryId={inquiryId}
      prefill={prefill}
      quoteId={quoteId}
    />
  );
}
