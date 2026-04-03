import {
  DashboardDetailLayout,
  DashboardPage,
  DashboardSidebarStack,
  DashboardStatsGrid,
} from "@/components/shared/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardPageSkeleton() {
  return (
    <DashboardPage className="gap-8">
      <div className="hero-panel p-6 sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex max-w-3xl flex-col gap-4">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-12 w-full max-w-xl rounded-2xl" />
            <Skeleton className="h-4 w-full max-w-2xl rounded-md" />
            <Skeleton className="h-4 w-full max-w-lg rounded-md" />
          </div>

          <div className="dashboard-actions">
            <Skeleton className="h-11 w-full rounded-xl sm:w-40" />
            <Skeleton className="h-11 w-full rounded-xl sm:w-36" />
            <Skeleton className="h-11 w-full rounded-xl sm:w-40" />
          </div>
        </div>
      </div>

      <DashboardStatsGrid>
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="info-tile" key={index}>
            <div className="flex items-start gap-3.5">
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-3 w-full rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </DashboardStatsGrid>

      <DashboardDetailLayout className="xl:grid-cols-[minmax(0,1.35fr)_22rem] 2xl:grid-cols-[minmax(0,1.45fr)_24rem]">
        <DashboardSidebarStack>
          <div className="section-panel p-5">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-6 w-40 rounded-md" />
                  <Skeleton className="h-4 w-64 rounded-md" />
                </div>
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>

              <div className="divide-y divide-border/70 rounded-[1.15rem] border border-border/60 bg-background/70">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto]"
                    key={index}
                  >
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-32 rounded-md" />
                      <Skeleton className="h-3 w-48 rounded-md" />
                    </div>
                    <div className="flex items-center gap-2 lg:justify-end">
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-4 w-4 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="section-panel p-5">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-6 w-44 rounded-md" />
                  <Skeleton className="h-4 w-72 rounded-md" />
                </div>
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>

              <div className="divide-y divide-border/70 rounded-[1.15rem] border border-border/60 bg-background/70">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto]"
                    key={index}
                  >
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-44 rounded-md" />
                      <Skeleton className="h-3 w-36 rounded-md" />
                    </div>
                    <div className="flex items-center gap-2 lg:justify-end">
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-4 w-4 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DashboardSidebarStack>

        <DashboardSidebarStack>
          <div className="section-panel p-5">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-36 rounded-md" />
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="info-tile shadow-none" key={index}>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-24 rounded-md" />
                    <Skeleton className="h-5 w-full rounded-md" />
                    <Skeleton className="h-4 w-28 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section-panel p-5">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-28 rounded-md" />
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </DashboardSidebarStack>
      </DashboardDetailLayout>
    </DashboardPage>
  );
}
