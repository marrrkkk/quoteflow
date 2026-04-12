import { PageHeader } from "@/components/shared/page-header";
import { GoogleCalendarSettings } from "@/features/calendar/components/google-calendar-settings";
import { getCalendarConnectionForUser } from "@/features/calendar/queries";
import { isGoogleCalendarConfigured } from "@/lib/env";
import { getBusinessSettingsPageContext } from "../_lib/page-context";

export default async function BusinessIntegrationsSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user } = await getBusinessSettingsPageContext(slug);
  const connection = await getCalendarConnectionForUser(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Integrations"
        title="Google Calendar"
        description="Connect external services to your workflow."
      />

      <GoogleCalendarSettings
        connection={connection}
        isConfigured={isGoogleCalendarConfigured}
      />
    </>
  );
}
