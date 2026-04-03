import { Skeleton } from "@/components/ui/skeleton";

export function DashboardPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-12 w-full max-w-sm rounded-[1.4rem]" />
        <Skeleton className="h-4 w-full max-w-xl rounded-full" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="rounded-[1.6rem] border bg-background/70 p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-5 w-40 rounded-full" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-[4.5rem] w-full rounded-2xl" />
              <Skeleton className="h-[4.5rem] w-full rounded-2xl" />
              <Skeleton className="h-[4.5rem] w-full rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="rounded-[1.6rem] border bg-background/70 p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-40 rounded-xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
