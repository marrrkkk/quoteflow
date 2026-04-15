"use client";

import * as React from "react";
import {
  Plus,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { type DashboardNavigationItem } from "@/components/shell/dashboard-navigation";
import { getBusinessQuotesPath } from "@/features/businesses/routes";

type CommandMenuProps = {
  navigation: DashboardNavigationItem[];
  businessSlug: string;
};

export function CommandMenu({ navigation, businessSlug }: CommandMenuProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/25 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/40 md:w-64 lg:w-80"
      >
        <div className="flex items-center gap-2">
          <Search className="size-4 shrink-0" />
          <span className="truncate">Search commands...</span>
        </div>
        <kbd className="pointer-events-none hidden select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="p-0 sm:max-w-[550px]"
          showCloseButton={false}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Command Menu</DialogTitle>
          <DialogDescription className="sr-only">
            Search for commands and navigate through the application.
          </DialogDescription>
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Navigation">
                {navigation.map((item) => (
                  <CommandItem
                    key={item.href}
                    onSelect={() => runCommand(() => router.push(item.href))}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Quick Actions">
                <CommandItem
                  onSelect={() =>
                    runCommand(() => router.push(`${getBusinessQuotesPath(businessSlug)}/new`))
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create new quote</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
