import Link from "next/link";

import { Button } from "@/components/ui/button";
import { businessesHubPath } from "@/features/businesses/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 py-16">
      <p className="select-none text-[10rem] font-bold leading-none tracking-tighter text-muted-foreground/15 sm:text-[14rem]">
        404
      </p>

      <div className="-mt-6 flex flex-col items-center gap-2 text-center sm:-mt-8">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          Page not found
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild>
          <Link href={businessesHubPath}>Open businesses</Link>
        </Button>
      </div>
    </div>
  );
}
