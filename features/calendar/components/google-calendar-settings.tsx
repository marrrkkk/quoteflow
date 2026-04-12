"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  DashboardSection,
} from "@/components/shared/dashboard-layout";
import { GoogleCalendarIcon } from "./google-calendar-icon";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { CalendarConnectionStatus } from "@/features/calendar/types";

type GoogleCalendarSettingsProps = {
  connection: CalendarConnectionStatus;
  isConfigured: boolean;
};

export function GoogleCalendarSettings({
  connection,
  isConfigured,
}: GoogleCalendarSettingsProps) {
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  async function handleDisconnect() {
    setIsDisconnecting(true);

    try {
      const response = await fetch("/api/google-calendar/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Disconnect failed.");
      }

      toast.success("Google Calendar disconnected.");
      router.refresh();
    } catch {
      toast.error("We couldn't disconnect Google Calendar right now.");
    } finally {
      setIsDisconnecting(false);
    }
  }

  if (!isConfigured) {
    return (
      <DashboardSection
        description="Google Calendar integration is not configured. Ask your administrator to set up Google OAuth credentials."
        title="Google Calendar"
      >
        <div className="soft-panel flex items-center gap-3 px-4 py-4 shadow-none">
          <XCircle className="size-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Not configured
          </p>
        </div>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection
      description="Create calendar events from inquiries and quotes."
      title="Google Calendar"
      footer={
        connection.connected ? (
          <Button
            disabled={isDisconnecting}
            onClick={handleDisconnect}
            variant="outline"
          >
            {isDisconnecting ? (
              <>
                <Spinner data-icon="inline-start" aria-hidden="true" />
                Disconnecting...
              </>
            ) : (
              "Disconnect"
            )}
          </Button>
        ) : (
          <Button asChild>
            <a href="/api/google-calendar/connect">
              <GoogleCalendarIcon />
              Connect Google Calendar
            </a>
          </Button>
        )
      }
    >
      {connection.connected ? (
        <div className="soft-panel flex items-center gap-3 px-4 py-4 shadow-none">
          <CheckCircle2 className="size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              Connected
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {connection.googleEmail}
            </p>
          </div>
        </div>
      ) : (
        <div className="soft-panel flex items-center gap-3 px-4 py-4 shadow-none">
          <GoogleCalendarIcon className="size-5" />
          <p className="text-sm text-muted-foreground">
            Connect your Google account to create calendar events from Requo.
          </p>
        </div>
      )}
    </DashboardSection>
  );
}
