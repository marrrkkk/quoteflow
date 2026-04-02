import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-3 text-foreground", className)}
    >
      <span className="flex size-10 items-center justify-center rounded-2xl border bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
        QF
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-heading text-base font-semibold tracking-tight">
          QuoteFlow
        </span>
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
          Inquiry to quote
        </span>
      </span>
    </Link>
  );
}
