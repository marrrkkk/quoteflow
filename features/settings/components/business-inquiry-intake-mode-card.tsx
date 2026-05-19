"use client";

import { startTransition, useEffect } from "react";
import { Bot, CheckCircle2, FileText, Sparkles } from "lucide-react";

import { useProgressRouter } from "@/hooks/use-progress-router";
import { useActionStateWithSonner } from "@/hooks/use-action-state-with-sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { hasFeatureAccess } from "@/lib/plans/entitlements";
import type { BusinessPlan } from "@/lib/plans/plans";
import type { BusinessInquiryFormsActionState } from "@/features/settings/types";
import { LockedAction } from "@/features/paywall";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Intake Mode Selector Card
//
// Displayed at the top of the Fields tab. Lets the business owner choose
// between static form mode and AI conversational chat mode.
// ---------------------------------------------------------------------------

type BusinessInquiryIntakeModeCardProps = {
  conversationalModeEnabled: boolean;
  formId: string;
  plan: BusinessPlan;
  toggleConversationalAction: (
    state: BusinessInquiryFormsActionState,
    formData: FormData,
  ) => Promise<BusinessInquiryFormsActionState>;
};

const initialState: BusinessInquiryFormsActionState = {};

export function BusinessInquiryIntakeModeCard({
  conversationalModeEnabled,
  formId,
  plan,
  toggleConversationalAction,
}: BusinessInquiryIntakeModeCardProps) {
  const router = useProgressRouter();
  const hasAiAccess = hasFeatureAccess(plan, "aiAssistant");
  const [actionState, formAction, isPending] = useActionStateWithSonner(
    toggleConversationalAction,
    initialState,
  );

  useEffect(() => {
    if (!actionState.success) return;
    router.refresh();
  }, [actionState.success, router]);

  function handleSelect(mode: "form" | "chat") {
    if (isPending) return;

    const wantChat = mode === "chat";

    if (wantChat === conversationalModeEnabled) return;

    const formData = new FormData();
    formData.set("targetFormId", formId);
    formData.set("conversationalModeEnabled", wantChat ? "true" : "false");
    startTransition(() => formAction(formData));
  }

  return (
    <Card className="border-border/75 bg-card/96">
      <CardHeader className="gap-1.5">
        <CardTitle className="text-base">Intake mode</CardTitle>
        <CardDescription>
          Choose how customers submit inquiries through this form.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Standard form option */}
          <IntakeModeOption
            active={!conversationalModeEnabled}
            disabled={isPending}
            icon={<FileText className="size-4" />}
            iconClassName="bg-secondary text-secondary-foreground"
            label="Standard Form"
            description="Structured fields that customers fill out directly. Works for every plan."
            loading={!conversationalModeEnabled && isPending}
            onClick={() => handleSelect("form")}
          />

          {/* AI Chat option */}
          {hasAiAccess ? (
            <IntakeModeOption
              active={conversationalModeEnabled}
              disabled={isPending}
              icon={<Sparkles className="size-4" />}
              iconClassName="bg-primary/10 text-primary"
              label="AI Chat"
              description="An AI assistant that guides customers through the inquiry in a natural conversation."
              loading={conversationalModeEnabled && isPending}
              onClick={() => handleSelect("chat")}
            />
          ) : (
            <LockedAction feature="aiAssistant" plan={plan}>
              <IntakeModeOption
                active={false}
                disabled
                icon={<Sparkles className="size-4" />}
                iconClassName="bg-primary/10 text-primary"
                label="AI Chat"
                description="An AI assistant that guides customers through the inquiry in a natural conversation."
                locked
                onClick={() => {}}
              />
            </LockedAction>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Intake mode option tile
// ---------------------------------------------------------------------------

function IntakeModeOption({
  active,
  disabled,
  icon,
  iconClassName,
  label,
  description,
  loading,
  locked,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  iconClassName?: string;
  label: string;
  description: string;
  loading?: boolean;
  locked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all",
        active
          ? "border-primary bg-primary/[0.03] shadow-sm shadow-primary/5"
          : "border-border/60 bg-transparent hover:border-border hover:bg-accent/30",
        disabled && "pointer-events-none opacity-60",
        locked && "cursor-not-allowed opacity-55",
      )}
      disabled={disabled || locked}
      onClick={onClick}
      type="button"
    >
      {/* Top row: icon + label + status */}
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg transition-colors",
            iconClassName,
          )}
        >
          {icon}
        </div>
        <span className="text-sm font-semibold text-foreground">
          {label}
        </span>

        {/* Status indicator */}
        <span className="ml-auto flex items-center">
          {loading ? (
            <Spinner className="size-4" />
          ) : active ? (
            <CheckCircle2 className="size-4 text-primary" />
          ) : locked ? (
            <span className="rounded-md border border-border/80 bg-secondary/60 px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
              Pro
            </span>
          ) : null}
        </span>
      </div>

      {/* Description */}
      <p className="text-[0.8rem] leading-snug text-muted-foreground">
        {description}
      </p>

      {/* Active indicator dot */}
      {active ? (
        <span className="absolute -top-px -right-px size-2 rounded-full bg-primary" />
      ) : null}
    </button>
  );
}
