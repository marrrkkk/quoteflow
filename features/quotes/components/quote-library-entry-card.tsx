"use client";

import { useState } from "react";
import { PencilLine } from "lucide-react";

import { DashboardMetaPill } from "@/components/shared/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QuoteLibraryEntryDeleteButton } from "@/features/quotes/components/quote-library-entry-delete-button";
import { QuoteLibraryEntryForm } from "@/features/quotes/components/quote-library-entry-form";
import type {
  DashboardQuoteLibraryEntry,
  QuoteLibraryActionState,
  QuoteLibraryDeleteActionState,
} from "@/features/quotes/types";
import {
  centsToMoneyInput,
  formatQuoteDateTime,
  formatQuoteMoney,
  getQuoteLibraryEntryKindLabel,
} from "@/features/quotes/utils";

type QuoteLibraryEntryCardProps = {
  action: (
    state: QuoteLibraryActionState,
    formData: FormData,
  ) => Promise<QuoteLibraryActionState>;
  currency: string;
  deleteAction: (
    state: QuoteLibraryDeleteActionState,
    formData: FormData,
  ) => Promise<QuoteLibraryDeleteActionState>;
  entry: DashboardQuoteLibraryEntry;
};

export function QuoteLibraryEntryCard({
  action,
  currency,
  deleteAction,
  entry,
}: QuoteLibraryEntryCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card className="gap-0 border-border/75 bg-card/97">
      <CardHeader className="gap-3 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl">{entry.name}</CardTitle>
              <DashboardMetaPill>{getQuoteLibraryEntryKindLabel(entry.kind)}</DashboardMetaPill>
              <DashboardMetaPill>
                {entry.itemCount} {entry.itemCount === 1 ? "item" : "items"}
              </DashboardMetaPill>
            </div>
            <CardDescription>
              Updated {formatQuoteDateTime(entry.updatedAt)}
            </CardDescription>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsEditing((current) => !current)}
          >
            <PencilLine data-icon="inline-start" />
            {isEditing ? "Close editor" : "Edit entry"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 pt-0">
        {entry.description ? (
          <div className="soft-panel p-4 shadow-none">
            <p className="text-sm leading-7 text-foreground">{entry.description}</p>
          </div>
        ) : null}

        <div className="soft-panel p-4 shadow-none">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-foreground">Saved items</p>
            <p className="text-sm font-semibold text-foreground">
              {formatQuoteMoney(entry.totalInCents, currency)}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {entry.items.map((item) => (
              <div
                className="flex items-start justify-between gap-4 rounded-lg border border-border/70 bg-background/80 px-4 py-3"
                key={item.id}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {item.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Qty {item.quantity} x {formatQuoteMoney(item.unitPriceInCents, currency)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium text-foreground">
                  {formatQuoteMoney(item.quantity * item.unitPriceInCents, currency)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {isEditing ? (
          <QuoteLibraryEntryForm
            action={action}
            currency={currency}
            initialValues={{
              kind: entry.kind,
              name: entry.name,
              description: entry.description ?? "",
              items: entry.items.map((item) => ({
                id: item.id,
                description: item.description,
                quantity: String(item.quantity),
                unitPrice: centsToMoneyInput(item.unitPriceInCents),
              })),
            }}
            submitLabel="Save entry"
            submitPendingLabel="Saving entry..."
            onSuccess={() => setIsEditing(false)}
            idPrefix={`quote-library-entry-${entry.id}`}
          />
        ) : null}
      </CardContent>

      <CardFooter className="justify-end">
        <QuoteLibraryEntryDeleteButton action={deleteAction} />
      </CardFooter>
    </Card>
  );
}
