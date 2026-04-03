import type { ReactNode } from "react";

import { BrandMark } from "@/components/shared/brand-mark";
import { cn } from "@/lib/utils";

type PublicPageShellProps = {
  headerAction?: ReactNode;
  headerNav?: ReactNode;
  children: ReactNode;
  className?: string;
  brandSubtitle?: string | null;
  headerClassName?: string;
};

export function PublicPageShell({
  headerAction,
  headerNav,
  children,
  className,
  brandSubtitle = null,
  headerClassName,
}: PublicPageShellProps) {
  return (
    <div className={cn("public-page", className)}>
      <div className="public-page-stack">
        <header className={cn("public-page-header", headerClassName)}>
          <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <BrandMark subtitle={brandSubtitle} />
            {headerNav ? <div className="min-w-0">{headerNav}</div> : null}
          </div>
          {headerAction ? (
            <div className="flex w-full flex-col gap-3 [&>*]:w-full sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end sm:[&>*]:w-auto">
              {headerAction}
            </div>
          ) : null}
        </header>

        {children}
      </div>
    </div>
  );
}

type PublicHeroSurfaceProps = {
  children: ReactNode;
  className?: string;
};

export function PublicHeroSurface({
  children,
  className,
}: PublicHeroSurfaceProps) {
  return <section className={cn("public-hero-surface", className)}>{children}</section>;
}
