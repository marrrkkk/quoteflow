"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import {
  dispatchRouteProgressStart,
  getCurrentRouteProgressKey,
  getRouteProgressKeyFromHref,
} from "@/lib/navigation/route-progress";

export function useProgressRouter() {
  const router = useRouter();

  return useMemo(
    () => ({
      ...router,
      push: (...args: Parameters<typeof router.push>) => {
        const [href] = args;
        const nextRoute = getRouteProgressKeyFromHref(href);

        if (nextRoute) {
          dispatchRouteProgressStart({ route: nextRoute });
        }

        router.push(...args);
      },
      replace: (...args: Parameters<typeof router.replace>) => {
        const [href] = args;
        const nextRoute = getRouteProgressKeyFromHref(href);

        if (nextRoute) {
          dispatchRouteProgressStart({ route: nextRoute });
        }

        router.replace(...args);
      },
      back: () => {
        router.back();
      },
      forward: () => {
        router.forward();
      },
      refresh: (...args: Parameters<typeof router.refresh>) => {
        dispatchRouteProgressStart({
          force: true,
          route: getCurrentRouteProgressKey(),
        });
        router.refresh(...args);
      },
    }),
    [router],
  );
}
