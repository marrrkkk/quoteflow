import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "group/alert relative grid w-full gap-1 rounded-xl border px-4 py-3.5 text-left text-sm shadow-[0_1px_2px_rgba(15,23,42,0.03),inset_0_1px_0_rgba(255,255,255,0.42)] has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3.5 *:[svg]:row-span-2 *:[svg]:mt-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4.5",
  {
    variants: {
      variant: {
        default:
          "border-primary/12 bg-accent/70 text-foreground *:[svg]:text-primary *:data-[slot=alert-description]:text-foreground/75",
        destructive:
          "border-destructive/18 bg-destructive/6 text-destructive shadow-[0_1px_2px_rgba(201,55,44,0.08),inset_0_1px_0_rgba(255,255,255,0.3)] *:data-[slot=alert-description]:text-destructive/88 *:[svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-heading text-[0.95rem] font-semibold leading-6 group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm leading-6 text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
