import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { getWorkspaceSectionNavigation } from "@/features/settings/navigation";
import { requireCurrentWorkspaceContext } from "@/lib/db/workspace-access";

export default async function SettingsPage() {
  const { workspaceContext } = await requireCurrentWorkspaceContext();
  const workspaceSectionNavigation = getWorkspaceSectionNavigation(
    workspaceContext.workspace.slug,
  );

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Choose a section."
      />

      <section className="section-panel overflow-hidden">
        <div className="divide-y divide-border/70">
          {workspaceSectionNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className="group flex items-start gap-4 px-5 py-5 transition-colors hover:bg-accent/24 sm:px-6"
                href={item.href}
                key={item.href}
                prefetch={false}
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.36)]">
                  <Icon className="size-4 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold tracking-tight text-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
