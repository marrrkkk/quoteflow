import { Skeleton } from "@/components/ui/skeleton";

/**
 * Billing settings loading skeleton.
 *
 * Mirrors the AccountBillingPage layout: a max-w-5xl container with:
 * 1. BillingStatusCard — two side-by-side Card components (plan + payment details)
 * 2. "Order history" heading + PaymentHistoryTable (5 columns)
 */
export default function AccountBillingLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-col gap-10">
        {/* BillingStatusCard skeleton */}
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,1fr)] lg:grid-cols-[1fr_1fr] items-stretch">
            {/* Plan Card */}
            <div className="flex flex-col rounded-xl border border-border/75 bg-card p-6">
              <div className="pb-4">
                <Skeleton className="h-4 w-44 rounded-md" />
              </div>
              <div className="flex flex-1 flex-col gap-6">
                <Skeleton className="h-12 w-28 rounded-lg" />
                <Skeleton className="h-4 w-full max-w-[34ch] rounded-md" />
                <div className="mt-auto flex flex-col items-start gap-3 pt-2">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Payment Details Card */}
            <div className="flex flex-col rounded-xl border border-border/75 bg-card p-6">
              <div className="pb-4">
                <Skeleton className="h-5 w-32 rounded-md" />
              </div>
              <div className="flex flex-1 flex-col gap-6">
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-11 w-16 rounded-lg" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-24 rounded-md" />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <Skeleton className="ml-auto h-3 w-14 rounded-md" />
                    <Skeleton className="ml-auto h-4 w-20 rounded-md" />
                  </div>
                </div>
                <div className="mt-auto flex flex-col gap-2 pt-2">
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-3 w-64 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order history */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-28 rounded-md" />
          <div className="overflow-hidden rounded-xl border border-border/75 bg-card/97">
            {/* Table header */}
            <div className="grid grid-cols-[180px_1fr_1fr_1fr_1fr] gap-4 bg-muted/30 px-4 py-3">
              <Skeleton className="h-4 w-10 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-14 rounded-md" />
              <Skeleton className="h-4 w-12 rounded-md" />
            </div>
            {/* Table rows */}
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                className="grid grid-cols-[180px_1fr_1fr_1fr_1fr] items-center gap-4 border-t border-border/60 px-4 py-4"
                key={index}
              >
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-12 rounded-md" />
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
