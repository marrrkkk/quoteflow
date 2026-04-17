"use client";

/**
 * Upgrade button that opens the checkout dialog.
 * Used in paywall components, workspace overview, and pricing pages.
 */

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CheckoutDialog } from "@/features/billing/components/checkout-dialog";
import type { WorkspacePlan } from "@/lib/plans/plans";
import type { BillingCurrency, BillingRegion } from "@/lib/billing/types";
import { cn } from "@/lib/utils";

type UpgradeButtonProps = {
  workspaceId: string;
  workspaceSlug: string;
  currentPlan: WorkspacePlan;
  targetPlan?: "pro" | "business";
  region?: BillingRegion;
  defaultCurrency?: BillingCurrency;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
};

export function UpgradeButton({
  workspaceId,
  workspaceSlug,
  currentPlan,
  targetPlan,
  region = "INTL",
  defaultCurrency = "USD",
  variant = "default",
  size = "sm",
  className,
  children,
}: UpgradeButtonProps) {
  const [open, setOpen] = useState(false);

  if (currentPlan === "business") {
    return null; // Already on highest plan
  }

  return (
    <>
      <Button
        className={cn(className)}
        onClick={() => setOpen(true)}
        size={size}
        variant={variant}
      >
        {children ?? (
          <>
            <ArrowUpRight data-icon="inline-start" />
            {currentPlan === "free" ? "Upgrade to Pro" : "Upgrade to Business"}
          </>
        )}
      </Button>
      <CheckoutDialog
        currentPlan={currentPlan}
        defaultCurrency={defaultCurrency}
        onOpenChange={setOpen}
        open={open}
        region={region}
        targetPlan={targetPlan}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
      />
    </>
  );
}
