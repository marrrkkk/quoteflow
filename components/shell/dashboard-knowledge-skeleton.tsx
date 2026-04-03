import {
  DashboardDetailLayout,
  DashboardPage,
  DashboardSection,
  DashboardStatsGrid,
} from "@/components/shared/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardKnowledgeSkeleton() {
  return (
    <DashboardPage>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-11 w-full max-w-lg rounded-2xl" />
        <Skeleton className="h-4 w-full max-w-xl rounded-md" />
      </div>

      <DashboardStatsGrid className="md:grid-cols-3 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="info-tile" key={index}>
            <div className="flex items-start gap-3.5">
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-3 w-36 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </DashboardStatsGrid>

      <DashboardDetailLayout className="xl:grid-cols-[1.1fr_0.9fr]">
        <div className="dashboard-side-stack">
          <DashboardSection
            description={<Skeleton className="h-4 w-56 rounded-md" />}
            title={<Skeleton className="h-6 w-44 rounded-md" />}
          >
            <div className="grid gap-5">
              <div className="grid gap-3">
                <Skeleton className="h-4 w-12 rounded-md" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
              <div className="grid gap-3">
                <Skeleton className="h-4 w-10 rounded-md" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
              <Skeleton className="h-10 w-40 rounded-xl" />
            </div>
          </DashboardSection>

          <DashboardSection
            description={<Skeleton className="h-4 w-28 rounded-md" />}
            title={<Skeleton className="h-6 w-36 rounded-md" />}
          >
            <div className="flex flex-col gap-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div className="soft-panel p-4" key={index}>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex flex-col gap-2">
                        <Skeleton className="h-5 w-40 rounded-md" />
                        <Skeleton className="h-4 w-32 rounded-md" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-7 w-20 rounded-md" />
                        <Skeleton className="h-7 w-24 rounded-md" />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
                      <div className="soft-panel bg-muted/20 p-4 shadow-none">
                        <Skeleton className="h-3 w-20 rounded-md" />
                        <div className="mt-3 flex flex-col gap-2">
                          <Skeleton className="h-4 w-full rounded-md" />
                          <Skeleton className="h-4 w-11/12 rounded-md" />
                          <Skeleton className="h-4 w-4/5 rounded-md" />
                        </div>
                      </div>
                      <div className="soft-panel flex flex-col gap-3 bg-muted/20 p-4 shadow-none">
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-3 w-20 rounded-md" />
                          <Skeleton className="h-4 w-24 rounded-md" />
                        </div>
                        <div className="border-t pt-3">
                          <Skeleton className="h-10 w-full rounded-xl" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DashboardSection>
        </div>

        <div className="dashboard-side-stack">
          <DashboardSection
            description={<Skeleton className="h-4 w-52 rounded-md" />}
            title={<Skeleton className="h-6 w-24 rounded-md" />}
          >
            <div className="grid gap-5">
              <div className="grid gap-3">
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
              <div className="grid gap-3">
                <Skeleton className="h-4 w-14 rounded-md" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </div>
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
          </DashboardSection>

          <DashboardSection
            description={<Skeleton className="h-4 w-44 rounded-md" />}
            title={<Skeleton className="h-6 w-36 rounded-md" />}
          >
            <div className="flex flex-col gap-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div className="soft-panel p-4" key={index}>
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-5 w-44 rounded-md" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <div className="dashboard-actions sm:justify-end">
                      <Skeleton className="h-10 w-24 rounded-xl" />
                      <Skeleton className="h-10 w-24 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DashboardSection>
        </div>
      </DashboardDetailLayout>
    </DashboardPage>
  );
}
