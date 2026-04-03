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
      <span className="flex size-10 items-center justify-center rounded-[1.1rem] border border-border/90 bg-card text-[0.72rem] font-semibold tracking-[0.18em] text-foreground shadow-[0_10px_24px_-18px_rgba(74,53,34,0.2)]">
        QF
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-heading text-[1.08rem] font-medium tracking-tight">
          QuoteFlow
        </span>
        <span className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-muted-foreground">
          Inquiry workspace
        </span>
      </span>
    </Link>
  );
}
