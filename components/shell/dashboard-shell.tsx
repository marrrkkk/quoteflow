"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { BrandMark } from "@/components/shared/brand-mark";
import {
  dashboardNavigation,
  getActiveDashboardNavigationItem,
  isDashboardNavigationItemActive,
} from "@/components/shell/dashboard-navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: ReactNode;
  user: {
    email: string;
    name: string;
  };
  workspaceContext: {
    role: "owner" | "member";
    workspace: {
      id: string;
      name: string;
      slug: string;
      defaultCurrency: string;
      publicInquiryEnabled: boolean;
    };
  };
};

export function DashboardShell({
  children,
  user,
  workspaceContext,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeItem = getActiveDashboardNavigationItem(pathname);
  const workspace = workspaceContext.workspace;
  const membershipLabel = workspaceContext.role === "owner" ? "Owner" : "Member";

  return (
    <div className="page-wrap py-4 sm:py-5 lg:py-6">
      <div className="grid min-h-[calc(100vh-2rem)] gap-4 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="section-panel hidden self-start lg:sticky lg:top-6 lg:flex lg:min-h-[calc(100vh-3rem)] lg:flex-col lg:p-4">
          <BrandMark />

          <div className="mt-6 rounded-[1.4rem] border bg-background/75 px-4 py-4">
            <p className="meta-label">{membershipLabel}</p>
            <p className="mt-3 font-heading text-[1.5rem] leading-none text-foreground">
              {workspace.name}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">/{workspace.slug}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground">
                {workspace.defaultCurrency}
              </span>
              <span className="rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground">
                {workspace.publicInquiryEnabled ? "Public form on" : "Public form off"}
              </span>
            </div>
          </div>

          <nav aria-label="Dashboard navigation" className="mt-6 flex flex-1 flex-col gap-1.5">
            {dashboardNavigation.map((item) => (
              <DashboardNavigationButton
                key={item.href}
                isActive={isDashboardNavigationItemActive(pathname, item.href)}
                item={item}
              />
            ))}
          </nav>

          <div className="mt-6 rounded-[1.4rem] border bg-background/75 px-4 py-4">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
            <LogoutButton className="mt-4 w-full" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <header className="section-panel flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    className="lg:hidden"
                    size="icon-sm"
                    type="button"
                    variant="outline"
                  >
                    <Menu data-icon="inline-start" />
                    <span className="sr-only">Open dashboard navigation</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  className="w-[88vw] max-w-sm border-r p-0"
                  showCloseButton={false}
                  side="left"
                >
                  <SheetHeader className="border-b bg-background/95 px-5 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <BrandMark />
                      <SheetClose asChild>
                        <Button size="icon-sm" type="button" variant="ghost">
                          <X data-icon="inline-start" />
                          <span className="sr-only">Close navigation</span>
                        </Button>
                      </SheetClose>
                    </div>
                    <div className="mt-5 rounded-[1.35rem] border bg-card px-4 py-4 text-left">
                      <p className="meta-label">{membershipLabel}</p>
                      <p className="mt-3 font-heading text-[1.35rem] leading-none text-foreground">
                        {workspace.name}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">/{workspace.slug}</p>
                    </div>
                  </SheetHeader>
                  <div className="flex h-full flex-col">
                    <div className="flex flex-col gap-2 p-4">
                      <nav aria-label="Mobile dashboard navigation">
                        <div className="flex flex-col gap-1.5">
                          {dashboardNavigation.map((item) => (
                            <DashboardNavigationButton
                              key={item.href}
                              isActive={isDashboardNavigationItemActive(
                                pathname,
                                item.href,
                              )}
                              item={item}
                              onNavigate={() => setIsMobileMenuOpen(false)}
                            />
                          ))}
                        </div>
                      </nav>
                    </div>
                    <div className="mt-auto border-t p-4">
                      <div className="mb-4 flex flex-col gap-1 text-sm">
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="truncate text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <LogoutButton className="w-full" />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="min-w-0">
                <p className="meta-label">{activeItem.label}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {workspace.name}
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                /{workspace.slug}
              </span>
              <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                {workspace.defaultCurrency}
              </span>
            </div>
          </header>

          <main className="section-panel flex min-w-0 flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

type DashboardNavigationButtonProps = {
  isActive: boolean;
  item: (typeof dashboardNavigation)[number];
  onNavigate?: () => void;
};

function DashboardNavigationButton({
  isActive,
  item,
  onNavigate,
}: DashboardNavigationButtonProps) {
  const Icon = item.icon;

  return (
    <Button
      asChild
      className={cn(
        "h-auto w-full justify-start rounded-[1.15rem] px-3.5 py-3 text-left",
        isActive &&
          "shadow-[0_14px_28px_-24px_rgba(74,53,34,0.45)]",
      )}
      size="lg"
      variant={isActive ? "secondary" : "ghost"}
    >
      <Link href={item.href} onClick={onNavigate}>
        <Icon data-icon="inline-start" />
        <span className="truncate font-medium">{item.label}</span>
      </Link>
    </Button>
  );
}
