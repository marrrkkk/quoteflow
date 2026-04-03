import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "border-primary/80 bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(6,36,28,0.12),0_1px_1px_rgba(15,23,42,0.08),0_8px_14px_-12px_rgba(0,128,96,0.32)]",
        secondary:
          "border-border/80 bg-secondary/95 text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(23,43,36,0.03),0_1px_1px_rgba(15,23,42,0.04)]",
        destructive:
          "border-destructive/22 bg-destructive/10 text-destructive shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(95,24,18,0.06),0_1px_1px_rgba(201,55,44,0.08)] focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-border/85 bg-background/95 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.58),inset_0_-1px_0_rgba(23,43,36,0.03),0_1px_1px_rgba(15,23,42,0.04)]",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:border-border/55 hover:bg-muted/75 hover:text-foreground hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.34)] dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
