import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-primary/85 bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(6,36,28,0.16),0_1px_2px_rgba(15,23,42,0.08),0_10px_18px_-14px_rgba(0,128,96,0.38)] enabled:hover:-translate-y-px enabled:hover:bg-primary/95 enabled:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(6,36,28,0.2),0_1px_2px_rgba(15,23,42,0.08),0_14px_24px_-16px_rgba(0,128,96,0.42)]",
        outline:
          "border-border/85 bg-background/95 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.58),inset_0_-1px_0_rgba(23,43,36,0.04),0_1px_2px_rgba(15,23,42,0.04)] enabled:hover:border-border enabled:hover:bg-accent/75 enabled:hover:text-accent-foreground enabled:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_6px_14px_-12px_rgba(15,23,42,0.16)] aria-expanded:bg-accent/75",
        secondary:
          "border-border/55 bg-secondary/95 text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(23,43,36,0.03),0_1px_2px_rgba(15,23,42,0.04)] enabled:hover:bg-secondary enabled:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_6px_14px_-12px_rgba(15,23,42,0.14)] aria-expanded:bg-secondary",
        ghost:
          "border-transparent bg-transparent text-muted-foreground enabled:hover:border-border/60 enabled:hover:bg-accent/70 enabled:hover:text-foreground enabled:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] aria-expanded:border-border/60 aria-expanded:bg-accent/70 aria-expanded:text-foreground",
        destructive:
          "border-destructive/85 bg-destructive text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(95,24,18,0.18),0_1px_2px_rgba(201,55,44,0.14),0_10px_18px_-14px_rgba(201,55,44,0.38)] enabled:hover:-translate-y-px enabled:hover:bg-destructive/95 enabled:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(95,24,18,0.2),0_1px_2px_rgba(201,55,44,0.14),0_14px_24px_-16px_rgba(201,55,44,0.42)] focus-visible:border-destructive focus-visible:ring-destructive/20 dark:text-white",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-sm px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-md px-3.5 text-[0.82rem] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-7 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 rounded-md",
        "icon-lg": "size-11 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
