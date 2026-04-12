export type CalendarEventContext = "inquiry" | "quote";

export type CalendarEventPrefill = {
  title: string;
  description: string;
  location: string;
  attendeeEmail: string;
  attendeeName: string;
};

export type CalendarEventFieldErrors = Partial<
  Record<
    | "title"
    | "description"
    | "startDateTime"
    | "endDateTime"
    | "location"
    | "attendeeEmail",
    string[] | undefined
  >
>;

export type CalendarEventActionState = {
  error?: string;
  success?: string;
  fieldErrors?: CalendarEventFieldErrors;
  eventUrl?: string;
};

export type CalendarConnectionStatus = {
  connected: boolean;
  googleEmail: string | null;
  selectedCalendarId: string | null;
};

export type CalendarEventSummaryItem = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  eventUrl: string | null;
};

export type UpdateCalendarActionState = {
  error?: string;
  success?: string;
};

export type DisconnectCalendarActionState = {
  error?: string;
  success?: string;
};
