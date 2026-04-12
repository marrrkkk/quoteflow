import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/lib/db/client";
import {
  calendarEvents,
  googleCalendarConnections,
} from "@/lib/db/schema";
import type {
  CalendarConnectionStatus,
  CalendarEventSummaryItem,
} from "./types";

/**
 * Get the user's Google Calendar connection status.
 */
export const getCalendarConnectionForUser = cache(
  async (userId: string): Promise<CalendarConnectionStatus> => {
    const [connection] = await db
      .select({
        googleEmail: googleCalendarConnections.googleEmail,
        selectedCalendarId: googleCalendarConnections.selectedCalendarId,
      })
      .from(googleCalendarConnections)
      .where(eq(googleCalendarConnections.userId, userId))
      .limit(1);

    if (!connection) {
      return {
        connected: false,
        googleEmail: null,
        selectedCalendarId: null,
      };
    }

    return {
      connected: true,
      googleEmail: connection.googleEmail,
      selectedCalendarId: connection.selectedCalendarId,
    };
  },
);

/**
 * Get the full connection record for token access (server-only).
 */
export async function getCalendarConnectionRecord(userId: string) {
  const [connection] = await db
    .select()
    .from(googleCalendarConnections)
    .where(eq(googleCalendarConnections.userId, userId))
    .limit(1);

  return connection ?? null;
}

/**
 * Get calendar events linked to a specific inquiry.
 */
export const getCalendarEventsForInquiry = cache(
  async (
    businessId: string,
    inquiryId: string,
  ): Promise<CalendarEventSummaryItem[]> => {
    return db
      .select({
        id: calendarEvents.id,
        title: calendarEvents.title,
        startsAt: calendarEvents.startsAt,
        endsAt: calendarEvents.endsAt,
        eventUrl: calendarEvents.eventUrl,
      })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.businessId, businessId),
          eq(calendarEvents.inquiryId, inquiryId),
        ),
      )
      .orderBy(desc(calendarEvents.startsAt));
  },
);

/**
 * Get calendar events linked to a specific quote.
 */
export const getCalendarEventsForQuote = cache(
  async (
    businessId: string,
    quoteId: string,
  ): Promise<CalendarEventSummaryItem[]> => {
    return db
      .select({
        id: calendarEvents.id,
        title: calendarEvents.title,
        startsAt: calendarEvents.startsAt,
        endsAt: calendarEvents.endsAt,
        eventUrl: calendarEvents.eventUrl,
      })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.businessId, businessId),
          eq(calendarEvents.quoteId, quoteId),
        ),
      )
      .orderBy(desc(calendarEvents.startsAt));
  },
);
