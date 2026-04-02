"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  InquiryListFilters,
  InquiryStatusFilterValue,
} from "@/features/inquiries/types";
import { getInquiryStatusLabel } from "@/features/inquiries/utils";

type InquiryListFiltersProps = {
  filters: InquiryListFilters;
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
  resultCount,
}: InquiryListFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q ?? "");
  const [status, setStatus] = useState<InquiryStatusFilterValue>(filters.status);

  function navigate(nextQuery: string, nextStatus: InquiryStatusFilterValue) {
    const params = new URLSearchParams();
    const trimmedQuery = nextQuery.trim();

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    if (nextStatus !== "all") {
      params.set("status", nextStatus);
    }

    const href = params.size ? `${pathname}?${params.toString()}` : pathname;

    startTransition(() => {
      router.replace(href);
    });
  }

  return (
    <div className="rounded-[1.7rem] border bg-background/75 p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="eyebrow">Inbox filters</span>
            <p className="text-sm leading-6 text-muted-foreground">
              Search by customer, email, category, or subject. Results always
              stay newest first.
            </p>
          </div>
          <p className="text-sm font-medium text-foreground">
            {resultCount} {resultCount === 1 ? "inquiry" : "inquiries"}
          </p>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            navigate(query, status);
          }}
        >
          <FieldGroup className="lg:flex-row lg:items-end">
            <Field className="lg:flex-1">
              <FieldLabel className="sr-only" htmlFor="inquiry-search">
                Search inquiries
              </FieldLabel>
              <FieldContent>
                <Input
                  id="inquiry-search"
                  value={query}
                  onChange={(event) => setQuery(event.currentTarget.value)}
                  placeholder="Search customer, email, category, or subject"
                  disabled={isPending}
                />
              </FieldContent>
            </Field>

            <Field className="lg:w-[13rem]">
              <FieldLabel className="sr-only" htmlFor="inquiry-status-filter">
                Filter by status
              </FieldLabel>
              <FieldContent>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as InquiryStatusFilterValue)
                  }
                >
                  <SelectTrigger
                    id="inquiry-status-filter"
                    className="w-full"
                    size="default"
                  >
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {statusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option === "all"
                            ? "All statuses"
                            : getInquiryStatusLabel(option)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button disabled={isPending} type="submit">
                <Search data-icon="inline-start" />
                {isPending ? "Applying..." : "Apply"}
              </Button>
              <Button
                disabled={isPending || (!query.trim() && status === "all")}
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  navigate("", "all");
                }}
                type="button"
                variant="outline"
              >
                <X data-icon="inline-start" />
                Clear
              </Button>
            </div>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}
