import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InquiryListCards } from "@/features/inquiries/components/inquiry-list-cards";
import { InquiryListFilters as InquiryListToolbar } from "@/features/inquiries/components/inquiry-list-filters";
import { InquiryListTable } from "@/features/inquiries/components/inquiry-list-table";
import { inquiryListFiltersSchema } from "@/features/inquiries/schemas";
import { getInquiryListForWorkspace } from "@/features/inquiries/queries";
import { requireCurrentWorkspaceContext } from "@/lib/db/workspace-access";

type InquiriesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InquiriesPage({
  searchParams,
}: InquiriesPageProps) {
  const { workspaceContext } = await requireCurrentWorkspaceContext();
  const parsedFilters = inquiryListFiltersSchema.safeParse(await searchParams);
  const filters = parsedFilters.success
    ? parsedFilters.data
    : {
        q: undefined,
        status: "all" as const,
      };

  const inquiryList = await getInquiryListForWorkspace({
    workspaceId: workspaceContext.workspace.id,
    filters,
  });
  const hasFilters = Boolean(filters.q || filters.status !== "all");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl flex flex-col gap-2">
          <span className="eyebrow">Inquiry inbox</span>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Track customer requests from first message to quote.
          </h1>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            Search by customer, filter by workflow status, and open the full
            inquiry record without leaving the authenticated shell.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href={`/inquire/${workspaceContext.workspace.slug}`} prefetch={false}>
            Open public inquiry page
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>

      <InquiryListToolbar
        key={`${filters.status}:${filters.q ?? ""}`}
        filters={filters}
        resultCount={inquiryList.length}
      />

      {inquiryList.length ? (
        <>
          <InquiryListTable inquiries={inquiryList} />
          <InquiryListCards inquiries={inquiryList} />
        </>
      ) : (
        <div className="rounded-[1.7rem] border bg-background/75 p-4 shadow-sm">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>
                {hasFilters
                  ? "No inquiries match these filters."
                  : "Your inquiry inbox is still empty."}
              </EmptyTitle>
              <EmptyDescription>
                {hasFilters
                  ? "Try a different status or clear the search term to widen the inbox."
                  : "New public submissions will start appearing here once customers use your inquiry page."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {hasFilters ? (
                <Button asChild variant="outline">
                  <Link href="/dashboard/inquiries">Clear filters</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link
                    href={`/inquire/${workspaceContext.workspace.slug}`}
                    prefetch={false}
                  >
                    Preview public inquiry page
                  </Link>
                </Button>
              )}
            </EmptyContent>
          </Empty>
        </div>
      )}
    </div>
  );
}
