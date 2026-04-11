"use client";

import {
  getStarterTemplateDefinition,
  starterTemplateOptions,
} from "@/features/businesses/starter-templates";
import type { BusinessType } from "@/features/inquiries/business-types";
import { cn } from "@/lib/utils";

type StarterTemplateChoiceGridProps = {
  ariaLabel?: string;
  disabled?: boolean;
  inputName: string;
  onChange: (value: BusinessType) => void;
  value: BusinessType | "";
  showHelperText?: boolean;
  showStatusSummary?: boolean;
};

export function StarterTemplateChoiceGrid({
  ariaLabel = "Starter template",
  disabled = false,
  inputName,
  onChange,
  value,
  showHelperText = false,
  showStatusSummary = true,
}: StarterTemplateChoiceGridProps) {
  return (
    <div
      aria-label={ariaLabel}
      className="grid gap-3 sm:grid-cols-2"
      role="radiogroup"
    >
      {starterTemplateOptions.map((option) => {
        const template = getStarterTemplateDefinition(option.value);
        const isSelected = value === option.value;

        return (
          <label
            className={cn(
              "group rounded-2xl border border-border/80 bg-background/90 p-4 transition-colors",
              "hover:border-foreground/20 hover:bg-accent/10",
              "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15",
              isSelected &&
                "border-primary/45 bg-primary/[0.06] shadow-[var(--surface-shadow-sm)]",
              disabled && "cursor-not-allowed opacity-75",
            )}
            key={option.value}
          >
            <input
              checked={isSelected}
              className="sr-only"
              disabled={disabled}
              name={inputName}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {option.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {option.description}
                </p>
              </div>
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1 flex size-4 shrink-0 rounded-full border border-border/80 bg-background",
                  isSelected && "border-primary bg-primary",
                )}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {template.recommendedFields.map((field) => (
                <span
                  className="rounded-full border border-border/75 bg-muted/20 px-2.5 py-1 text-[0.72rem] font-medium text-muted-foreground"
                  key={field}
                >
                  {field}
                </span>
              ))}
            </div>
            {showHelperText ? (
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {template.helperText}
              </p>
            ) : null}
            {showStatusSummary ? (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {template.statusSummary}
              </p>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}
