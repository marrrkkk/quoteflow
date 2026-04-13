import Image from "next/image";

import { cn } from "@/lib/utils";

type GoogleCalendarIconProps = {
  className?: string;
};

/**
 * Google Calendar brand icon using the static asset from /public/calendar.svg.
 */
export function GoogleCalendarIcon({ className }: GoogleCalendarIconProps) {
  return (
    <Image
      alt=""
      aria-hidden
      className={cn("size-5 shrink-0", className)}
      height={20}
      src="/calendar.svg"
      width={20}
    />
  );
}
