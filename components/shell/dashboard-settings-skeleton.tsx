import {
  DashboardDetailLayout,
  DashboardPage,
  DashboardSection,
  DashboardSidebarStack,
} from "@/components/shared/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSettingsSkeleton() {
  return (
    <DashboardPage>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20 rounded-md" />
        <Skeleton className="h-11 w-full max-w-lg rounded-2xl" />
        <Skeleton className="h-4 w-full max-w-xl rounded-md" />
      </div>

      <DashboardDetailLayout className="xl:grid-cols-[1.12fr_0.88fr]">
        <div className="form-stack">
          {Array.from({ length: 3 }).map((_, index) => (
            <section className="section-panel p-6" key={index}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-6 w-48 rounded-md" />
                  <Skeleton className="h-4 w-56 rounded-md" />
                </div>

                <div className="grid gap-6">
                  {index === 0 ? (
                    <>
                      <div className="grid gap-5">
                        <div className="grid gap-3">
                          <Skeleton className="h-4 w-24 rounded-md" />
                          <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                        <div className="grid gap-5 lg:grid-cols-2">
                          <div className="grid gap-3">
                            <Skeleton className="h-4 w-20 rounded-md" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                          </div>
                          <div className="grid gap-3">
                            <Skeleton className="h-4 w-28 rounded-md" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                          </div>
                        </div>
                        <div className="grid gap-3">
                          <Skeleton className="h-4 w-28 rounded-md" />
                          <Skeleton className="h-28 w-full rounded-2xl" />
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
                          <div className="grid gap-4">
                            <div className="grid gap-3">
                              <Skeleton className="h-4 w-12 rounded-md" />
                              <Skeleton className="h-12 w-full rounded-xl" />
                            </div>
                            <Skeleton className="h-20 w-full rounded-2xl" />
                          </div>
                          <div className="soft-panel p-4">
                            <Skeleton className="h-3 w-24 rounded-md" />
                            <Skeleton className="mt-4 h-36 w-full rounded-2xl" />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : index === 1 ? (
                    <>
                      <Skeleton className="h-24 w-full rounded-2xl" />
                      <div className="grid gap-5 lg:grid-cols-2">
                        <div className="grid gap-3">
                          <Skeleton className="h-4 w-28 rounded-md" />
                          <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                        <div className="grid gap-3">
                          <Skeleton className="h-4 w-24 rounded-md" />
                          <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                      </div>
                      <div className="grid gap-3">
                        <Skeleton className="h-4 w-36 rounded-md" />
                        <Skeleton className="h-24 w-full rounded-2xl" />
                      </div>
                      <div className="grid gap-3">
                        <Skeleton className="h-4 w-32 rounded-md" />
                        <Skeleton className="h-28 w-full rounded-2xl" />
                      </div>
                    </>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Skeleton className="h-24 w-full rounded-2xl" />
                      <Skeleton className="h-24 w-full rounded-2xl" />
                    </div>
                  )}
                </div>
              </div>
            </section>
          ))}

          <div className="toolbar-panel">
            <div className="form-actions pt-0 sm:justify-between">
              <Skeleton className="h-4 w-64 rounded-md" />
              <Skeleton className="h-11 w-full rounded-xl sm:w-36" />
            </div>
          </div>
        </div>

        <DashboardSidebarStack className="xl:sticky xl:top-[5.5rem] xl:self-start">
          <DashboardSection
            description={<Skeleton className="h-4 w-32 rounded-md" />}
            title={<Skeleton className="h-6 w-36 rounded-md" />}
          >
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="info-tile" key={index}>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-24 rounded-md" />
                    <Skeleton className="h-5 w-full rounded-md" />
                    <Skeleton className="h-4 w-28 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </DashboardSection>

          <DashboardSection
            description={<Skeleton className="h-4 w-36 rounded-md" />}
            title={<Skeleton className="h-6 w-44 rounded-md" />}
          >
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="soft-panel px-4 py-3" key={index}>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-4/5 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </DashboardSection>
        </DashboardSidebarStack>
      </DashboardDetailLayout>
    </DashboardPage>
  );
}
