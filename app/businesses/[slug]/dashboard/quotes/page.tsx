import Link from "next/link";
import { ArrowRight, ReceiptText } from "lucide-react";

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
import { QuoteListCards } from "@/features/quotes/components/quote-list-cards";
import { QuoteListFilters } from "@/features/quotes/components/quote-list-filters";
import { QuoteListTable } from "@/features/quotes/components/quote-list-table";
import { getQuoteListForBusiness } from "@/features/quotes/queries";
import { quoteListFiltersSchema } from "@/features/quotes/schemas";
import {
  getBusinessNewQuotePath,
  getBusinessQuotesPath,
} from "@/features/businesses/routes";
import { requireCurrentBusinessContext } from "@/lib/db/business-access";
import {
  calculatePaginationInfo,
  generatePaginationPages,
} from "@/lib/pagination";

type QuotesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ITEMS_PER_PAGE = 10;

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const [{ businessContext }, resolvedSearchParams] = await Promise.all([
    requireCurrentBusinessContext(),
    searchParams,
  ]);
  const parsedFilters = quoteListFiltersSchema.safeParse(resolvedSearchParams);
  const filters = parsedFilters.success
    ? parsedFilters.data
    : {
        q: undefined,
        status: "all" as const,
        sort: "newest" as const,
      };

  const currentPage = Math.max(
    1,
    Number(resolvedSearchParams.page) || 1,
  );

  const quoteList = await getQuoteListForBusiness({
    businessId: businessContext.business.id,
    filters,
  });
  const businessSlug = businessContext.business.slug;
  const hasFilters = Boolean(
    filters.q || filters.status !== "all" || filters.sort !== "newest",
  );

  const paginationInfo = calculatePaginationInfo({
    totalItems: quoteList.length,
    itemsPerPage: ITEMS_PER_PAGE,
    currentPage,
  });

  const paginatedQuotes = quoteList.slice(
    paginationInfo.offset,
    paginationInfo.offset + ITEMS_PER_PAGE,
  );

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.sort !== "newest") params.set("sort", filters.sort);
    if (page > 1) params.set("page", String(page));
    return `${getBusinessQuotesPath(businessSlug)}?${params.toString()}`;
  };

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Quotes"
        title="Quotes"
        actions={
          <Button asChild>
            <Link href={getBusinessNewQuotePath(businessSlug)} prefetch={true}>
              Create quote
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        }
      />

      <QuoteListFilters filters={filters} resultCount={quoteList.length} />

      {quoteList.length ? (
        <>
          <QuoteListTable
            quotes={paginatedQuotes}
            currency={businessContext.business.defaultCurrency}
            businessSlug={businessSlug}
          />
          <QuoteListCards
            quotes={paginatedQuotes}
            currency={businessContext.business.defaultCurrency}
            businessSlug={businessSlug}
          />
          {paginationInfo.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {paginationInfo.currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href={buildPageUrl(paginationInfo.currentPage - 1)}
                    />
                  </PaginationItem>
                )}
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
                        href={buildPageUrl(page as number)}
                        isActive={page === paginationInfo.currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                {paginationInfo.currentPage < paginationInfo.totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      href={buildPageUrl(paginationInfo.currentPage + 1)}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <DashboardEmptyState
          action={
            hasFilters ? (
              <Button asChild variant="outline">
                <Link href={getBusinessQuotesPath(businessSlug)} prefetch={true}>Clear filters</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href={getBusinessNewQuotePath(businessSlug)} prefetch={true}>
                  Create first quote
                </Link>
              </Button>
            )
          }
          description={
            hasFilters ? "Try another search or status." : "No quotes yet."
          }
          icon={ReceiptText}
          title={
            hasFilters
              ? "No quotes match these filters."
              : "Your quote business is still empty."
          }
          variant="list"
        />
      )}
    </DashboardPage>
  );
}
