import { z } from "zod";

export const createCalendarEventSchema = z.object({
  title: z.string().min(1, "Title is required.").max(200),
  description: z.string().max(8000).optional().default(""),
  startDateTime: z.string().min(1, "Start date and time is required."),
  endDateTime: z.string().min(1, "End date and time is required."),
  location: z.string().max(500).optional().default(""),
  attendeeEmail: z.string().email("Enter a valid email.").optional().or(z.literal("")),
  calendarId: z.string().optional(),
  businessId: z.string().min(1),
  inquiryId: z.string().optional(),
  quoteId: z.string().optional(),
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;

export const updateSelectedCalendarSchema = z.object({
  calendarId: z.string().min(1, "Choose a calendar."),
});
