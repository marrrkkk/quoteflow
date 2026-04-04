"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { DataListToolbar } from "@/components/shared/data-list-toolbar";
import type {
  InquiryListFilters,
  InquiryStatusFilterValue,
} from "@/features/inquiries/types";
import { getInquiryStatusLabel } from "@/features/inquiries/utils";

type InquiryListFiltersProps = {
  filters: InquiryListFilters;
  formOptions: Array<{
    label: string;
    value: string;
  }>;
  resultCount: number;
};

const statusOptions: InquiryStatusFilterValue[] = [
  "all",
  "new",
  "quoted",
  "waiting",
  "won",
  "lost",
  "archived",
];

export function InquiryListFilters({
  filters,
  formOptions,
  resultCount,
}: InquiryListFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q ?? "");
  const [status, setStatus] = useState<InquiryStatusFilterValue>(filters.status);
  const [form, setForm] = useState(filters.form);

  function navigate(
    nextQuery: string,
    nextStatus: InquiryStatusFilterValue,
    nextForm: string,
  ) {
    const params = new URLSearchParams();
    const trimmedQuery = nextQuery.trim();

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    if (nextStatus !== "all") {
      params.set("status", nextStatus);
    }

    if (nextForm !== "all") {
      params.set("form", nextForm);
    }

    const href = params.size ? `${pathname}?${params.toString()}` : pathname;

    startTransition(() => {
      router.replace(href);
    });
  }

  return (
    <DataListToolbar
      description="Search by customer, email, or service category."
      resultLabel={`${resultCount} ${resultCount === 1 ? "inquiry" : "inquiries"}`}
      searchId="inquiry-search"
      searchLabel="Search inquiries"
      searchPlaceholder="Search customer, email, category, or subject"
      searchValue={query}
      onSearchChange={setQuery}
      filterId="inquiry-status-filter"
      filterLabel="Filter by status"
      filterValue={status}
      onFilterChange={(value) => setStatus(value as InquiryStatusFilterValue)}
      filterOptions={statusOptions.map((option) => ({
        value: option,
        label:
          option === "all" ? "All statuses" : getInquiryStatusLabel(option),
      }))}
      secondaryFilterId="inquiry-form-filter"
      secondaryFilterLabel="Form"
      secondaryFilterValue={form}
      onSecondaryFilterChange={setForm}
      secondaryFilterOptions={formOptions}
      isPending={isPending}
      onSubmit={() => navigate(query, status, form)}
      onClear={() => {
        setQuery("");
        setStatus("all");
        setForm("all");
        navigate("", "all", "all");
      }}
      canClear={Boolean(query.trim() || status !== "all" || form !== "all")}
    />
  );
}
