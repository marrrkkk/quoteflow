"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { FormActions } from "@/components/shared/form-layout";
import { GoogleCalendarIcon } from "./google-calendar-icon";
import { useActionStateWithSonner } from "@/hooks/use-action-state-with-sonner";
import { createCalendarEventAction } from "@/features/calendar/actions";
import type {
  CalendarEventActionState,
  CalendarEventPrefill,
} from "@/features/calendar/types";

type CreateCalendarEventDialogProps = {
  prefill: CalendarEventPrefill;
  businessId: string;
  inquiryId?: string;
  quoteId?: string;
  trigger?: React.ReactNode;
};

function getDefaultStartDateTime(): string {
  const now = new Date();
  // Round up to the next hour
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  return toLocalDateTimeString(now);
}

function getDefaultEndDateTime(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 2);
  return toLocalDateTimeString(now);
}

function toLocalDateTimeString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const initialState: CalendarEventActionState = {};

export function CreateCalendarEventDialog({
  prefill,
  businessId,
  inquiryId,
  quoteId,
  trigger,
}: CreateCalendarEventDialogProps) {
  const [open, setOpen] = useState(false);
  const wrappedAction = async (
    prevState: CalendarEventActionState,
    formData: FormData,
  ) => {
    const result = await createCalendarEventAction(prevState, formData);

    if (result.success) {
      setOpen(false);
    }

    return result;
  };

  const [state, formAction, isPending] = useActionStateWithSonner(
    wrappedAction,
    initialState,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <GoogleCalendarIcon />
            Add to Calendar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create calendar event</DialogTitle>
          <DialogDescription>
            Add an event to your Google Calendar with details from this{" "}
            {quoteId ? "quote" : "inquiry"}.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-5">
          <input type="hidden" name="businessId" value={businessId} />
          {inquiryId ? (
            <input type="hidden" name="inquiryId" value={inquiryId} />
          ) : null}
          {quoteId ? (
            <input type="hidden" name="quoteId" value={quoteId} />
          ) : null}

          <FieldGroup>
            <Field data-invalid={Boolean(state.fieldErrors?.title) || undefined}>
              <FieldLabel htmlFor="cal-event-title">Title</FieldLabel>
              <FieldContent>
                <Input
                  aria-invalid={Boolean(state.fieldErrors?.title) || undefined}
                  defaultValue={prefill.title}
                  id="cal-event-title"
                  name="title"
                  required
                />
                <FieldError
                  errors={
                    state.fieldErrors?.title?.[0]
                      ? [{ message: state.fieldErrors.title[0] }]
                      : undefined
                  }
                />
              </FieldContent>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                data-invalid={
                  Boolean(state.fieldErrors?.startDateTime) || undefined
                }
              >
                <FieldLabel htmlFor="cal-event-start">Start</FieldLabel>
                <FieldContent>
                  <Input
                    aria-invalid={
                      Boolean(state.fieldErrors?.startDateTime) || undefined
                    }
                    defaultValue={getDefaultStartDateTime()}
                    id="cal-event-start"
                    name="startDateTime"
                    required
                    type="datetime-local"
                  />
                  <FieldError
                    errors={
                      state.fieldErrors?.startDateTime?.[0]
                        ? [{ message: state.fieldErrors.startDateTime[0] }]
                        : undefined
                    }
                  />
                </FieldContent>
              </Field>

              <Field
                data-invalid={
                  Boolean(state.fieldErrors?.endDateTime) || undefined
                }
              >
                <FieldLabel htmlFor="cal-event-end">End</FieldLabel>
                <FieldContent>
                  <Input
                    aria-invalid={
                      Boolean(state.fieldErrors?.endDateTime) || undefined
                    }
                    defaultValue={getDefaultEndDateTime()}
                    id="cal-event-end"
                    name="endDateTime"
                    required
                    type="datetime-local"
                  />
                  <FieldError
                    errors={
                      state.fieldErrors?.endDateTime?.[0]
                        ? [{ message: state.fieldErrors.endDateTime[0] }]
                        : undefined
                    }
                  />
                </FieldContent>
              </Field>
            </div>

            <Field
              data-invalid={
                Boolean(state.fieldErrors?.attendeeEmail) || undefined
              }
            >
              <FieldLabel htmlFor="cal-event-attendee">
                Attendee email
              </FieldLabel>
              <FieldContent>
                <Input
                  aria-invalid={
                    Boolean(state.fieldErrors?.attendeeEmail) || undefined
                  }
                  defaultValue={prefill.attendeeEmail}
                  id="cal-event-attendee"
                  name="attendeeEmail"
                  type="email"
                />
                <FieldError
                  errors={
                    state.fieldErrors?.attendeeEmail?.[0]
                      ? [{ message: state.fieldErrors.attendeeEmail[0] }]
                      : undefined
                  }
                />
              </FieldContent>
            </Field>

            <Field
              data-invalid={Boolean(state.fieldErrors?.location) || undefined}
            >
              <FieldLabel htmlFor="cal-event-location">Location</FieldLabel>
              <FieldContent>
                <Input
                  defaultValue={prefill.location}
                  id="cal-event-location"
                  name="location"
                />
              </FieldContent>
            </Field>

            <Field
              data-invalid={
                Boolean(state.fieldErrors?.description) || undefined
              }
            >
              <FieldLabel htmlFor="cal-event-description">
                Description
              </FieldLabel>
              <FieldContent>
                <Textarea
                  defaultValue={prefill.description}
                  id="cal-event-description"
                  name="description"
                  rows={4}
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          {state.eventUrl ? (
            <div className="soft-panel flex items-center gap-3 px-4 py-3 shadow-none">
              <ExternalLink className="size-4 shrink-0 text-primary" />
              <a
                className="truncate text-sm text-primary underline-offset-4 hover:underline"
                href={state.eventUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open in Google Calendar
              </a>
            </div>
          ) : null}

          <FormActions>
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                "Create event"
              )}
            </Button>
          </FormActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
