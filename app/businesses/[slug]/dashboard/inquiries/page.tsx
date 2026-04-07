import Link from "next/link";
import { Inbox } from "lucide-react";

import {
  DashboardEmptyState,
  DashboardPage,
} from "@/components/shared/dashboard-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { InquiryListCards } from "@/features/inquiries/components/inquiry-list-cards";
import { InquiryListFilters as InquiryListToolbar } from "@/features/inquiries/components/inquiry-list-filters";
import { InquiryListTable } from "@/features/inquiries/components/inquiry-list-table";
import { inquiryListFiltersSchema } from "@/features/inquiries/schemas";
import {
  getInquiryListForBusiness,
  getBusinessInquiryFormOptionsForBusiness,
} from "@/features/inquiries/queries";
import { getBusinessPublicInquiryUrl } from "@/features/settings/utils";
import { getBusinessInquiriesPath } from "@/features/businesses/routes";
import { requireCurrentBusinessContext } from "@/lib/db/business-access";
import {
  calculatePaginationInfo,
  generatePaginationPages,
} from "@/lib/pagination";

type InquiriesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ITEMS_PER_PAGE = 10;

export default async function InquiriesPage({
  searchParams,
}: InquiriesPageProps) {
  const [{ businessContext }, resolvedSearchParams] = await Promise.all([
    requireCurrentBusinessContext(),
    searchParams,
  ]);
  const parsedFilters = inquiryListFiltersSchema.safeParse(resolvedSearchParams);
  const filters = parsedFilters.success
    ? parsedFilters.data
    : {
        q: undefined,
        status: "all" as const,
        form: "all",
        sort: "newest" as const,
      };

  const currentPage = Math.max(
    1,
    Number(resolvedSearchParams.page) || 1,
  );

  const [inquiryList, inquiryFormOptions] = await Promise.all([
    getInquiryListForBusiness({
      businessId: businessContext.business.id,
      filters,
    }),
    getBusinessInquiryFormOptionsForBusiness(businessContext.business.id),
  ]);
  const businessSlug = businessContext.business.slug;
  const hasFilters = Boolean(
    filters.q ||
      filters.status !== "all" ||
      filters.form !== "all" ||
      filters.sort !== "newest",
  );

  const paginationInfo = calculatePaginationInfo({
    totalItems: inquiryList.length,
    itemsPerPage: ITEMS_PER_PAGE,
    currentPage,
  });

  const paginatedInquiries = inquiryList.slice(
    paginationInfo.offset,
    paginationInfo.offset + ITEMS_PER_PAGE,
  );

  const publicInquiryUrl = getBusinessPublicInquiryUrl(businessSlug);

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.form !== "all") params.set("form", filters.form);
    if (filters.sort !== "newest") params.set("sort", filters.sort);
    if (page > 1) params.set("page", String(page));
    return `${getBusinessInquiriesPath(businessSlug)}?${params.toString()}`;
  };

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Requests"
        title="Customer requests"
      />

      <InquiryListToolbar
        key={`${filters.status}:${filters.form}:${filters.q ?? ""}:${filters.sort}`}
        filters={filters}
        formOptions={[
          {
            value: "all",
            label: "All forms",
          },
          ...inquiryFormOptions.map((form) => ({
            value: form.slug,
            label: form.isDefault ? `${form.name} (Default)` : form.name,
          })),
        ]}
        resultCount={inquiryList.length}
      />

      {inquiryList.length ? (
        <>
          <InquiryListTable inquiries={paginatedInquiries} businessSlug={businessSlug} />
          <InquiryListCards inquiries={paginatedInquiries} businessSlug={businessSlug} />
        </>
      ) : (
        <DashboardEmptyState
          action={
            hasFilters ? (
              <Button asChild variant="outline">
                <Link href={getBusinessInquiriesPath(businessSlug)} prefetch={true}>Clear filters</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link
                  href={publicInquiryUrl}
                  prefetch={false}
                >
                  Preview public inquiry page
                </Link>
              </Button>
            )
          }
          description={
            hasFilters
              ? "Try another search or status."
              : "Requests show up here."
          }
          icon={Inbox}
          title={
            hasFilters
              ? "No requests match these filters."
              : "Your request inbox is still empty."
          }
          variant="list"
        />
      )}

      {paginationInfo.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                asChild
                disabled={paginationInfo.currentPage === 1}
              >
                <Link
                  href={buildPageUrl(paginationInfo.currentPage - 1)}
                  prefetch={true}
                  aria-disabled={paginationInfo.currentPage === 1}
                  className={paginationInfo.currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationPrevious>
            </PaginationItem>

            {generatePaginationPages(
              paginationInfo.currentPage,
              paginationInfo.totalPages,
            ).map((page, index) =>
              page === "..." ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === paginationInfo.currentPage}
                    asChild
                  >
                    <Link
                      href={buildPageUrl(page as number)}
                      prefetch={true}
                    >
                      {page}
                    </Link>
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                asChild
                disabled={paginationInfo.currentPage >= paginationInfo.totalPages}
              >
                <Link
                  href={buildPageUrl(paginationInfo.currentPage + 1)}
                  prefetch={true}
                  aria-disabled={paginationInfo.currentPage >= paginationInfo.totalPages}
                  className={paginationInfo.currentPage >= paginationInfo.totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </DashboardPage>
  );
}
