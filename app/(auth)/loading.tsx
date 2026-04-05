import { BrandMark } from "@/components/shared/brand-mark";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="auth-page">
      <div className="auth-shell-grid">
        <div className="auth-story-panel">
          <div className="flex items-center justify-between gap-4">
            <BrandMark />
            <span className="eyebrow">Owner business</span>
          </div>

          <div className="flex max-w-3xl flex-col gap-8">
            <div className="flex max-w-2xl flex-col gap-4">
              <Skeleton className="h-14 w-full max-w-2xl rounded-2xl" />
              <Skeleton className="h-8 w-full max-w-xl rounded-xl" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="auth-note" key={index}>
                  <Skeleton className="size-9 rounded-lg" />
                  <Skeleton className="mt-4 h-5 w-28 rounded-md" />
                  <Skeleton className="mt-2 h-16 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </div>

          <div className="soft-panel grid gap-4 p-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="flex items-start gap-3" key={index}>
                <Skeleton className="mt-0.5 size-6 rounded-md" />
                <Skeleton className="h-6 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>

        <div className="auth-form-shell">
          <Card className="auth-form-card gap-0">
            <CardHeader className="gap-5 border-b border-border/70 bg-background/34">
              <BrandMark className="xl:hidden" subtitle={null} />
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-10 w-56 rounded-lg" />
                <Skeleton className="h-6 w-full max-w-md rounded-md" />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-6">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-px w-full rounded-none" />
              <Skeleton className="h-5 w-28 rounded-md" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
