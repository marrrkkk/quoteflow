import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function BusinessDashboardMembersLoading() {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageHeader
        title="Members"
        description="Members with access to this business."
      />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/50 shadow-sm">
          <div className="flex flex-col">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                className={cn(index > 0 && "border-t border-border/70")}
                key={index}
              >
                <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Skeleton className="h-4 w-28 rounded-md" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-12 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-40 rounded-md" />
                    </div>
                  </div>

                  <Skeleton className="size-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
