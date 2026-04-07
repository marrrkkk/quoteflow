"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BusinessSettingsTabsProps = {
  items: Array<{
    href: string;
    label: string;
  }>;
};

export function BusinessSettingsTabs({ items }: BusinessSettingsTabsProps) {
  const pathname = usePathname();
  const activeItem = items.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  const activeValue = activeItem?.href ?? items[0]?.href ?? "";

  if (!items.length) {
    return null;
  }

  return (
    <Tabs className="gap-0" value={activeValue}>
      <TabsList
        className="h-auto w-full justify-start rounded-none border-b border-border/70 bg-transparent p-0"
        variant="line"
      >
        {items.map((item) => (
          <TabsTrigger
            asChild
            className="group-data-[variant=line]/tabs-list:data-active:border-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:text-primary group-data-[variant=line]/tabs-list:data-active:after:bg-primary"
            key={item.href}
            value={item.href}
          >
            <Link href={item.href} prefetch={true}>
              {item.label}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
