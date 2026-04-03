import Link from "next/link";
import { SearchX } from "lucide-react";

import { StatePageCard } from "@/components/shared/state-page-card";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[28rem] items-center justify-center">
      <StatePageCard
        actions={
          <>
          <Button asChild variant="outline">
            <Link href="/dashboard/inquiries">Open inquiries</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Back to overview</Link>
          </Button>
          </>
        }
        description="It may belong to a different workspace, the link may be stale, or the record may no longer exist."
        eyebrow="Not found"
        media={
          <div className="flex size-12 items-center justify-center rounded-full border border-border/75 bg-accent/65 text-accent-foreground">
            <SearchX className="size-5" />
          </div>
        }
        title="That dashboard record could not be found."
      >
        <div className="state-card-note">
          Return to the overview or reopen the item from the dashboard lists.
        </div>
      </StatePageCard>
    </div>
  );
}
