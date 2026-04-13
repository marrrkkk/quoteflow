/**
 * Minimum Google OAuth scopes for Calendar integration.
 *
 * - calendar.events: create, read, update events
 * - calendar.readonly: list available calendars for target selection
 * - userinfo.email & userinfo.profile: get user identity for storing against user record
 */
export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
] as const;

export const GOOGLE_CALENDAR_SCOPE_STRING = GOOGLE_CALENDAR_SCOPES.join(" ");
