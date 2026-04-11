"use client";

import { useEffect } from "react";
import { Trash2 } from "lucide-react";

import { useProgressRouter } from "@/hooks/use-progress-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useActionStateWithSonner } from "@/hooks/use-action-state-with-sonner";
import type { QuoteLibraryDeleteActionState } from "@/features/quotes/types";

type QuoteLibraryEntryDeleteButtonProps = {
  action: (
    state: QuoteLibraryDeleteActionState,
    formData: FormData,
  ) => Promise<QuoteLibraryDeleteActionState>;
  label?: string;
};

const initialState: QuoteLibraryDeleteActionState = {};

export function QuoteLibraryEntryDeleteButton({
  action,
  label = "Delete entry",
}: QuoteLibraryEntryDeleteButtonProps) {
  const router = useProgressRouter();
  const [state, formAction, isPending] = useActionStateWithSonner(
    action,
    initialState,
  );

  useEffect(() => {
    if (!state.success) {
      return;
    }

    router.refresh();
  }, [router, state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Button disabled={isPending} type="submit" variant="destructive">
        <Trash2 data-icon="inline-start" />
        {isPending ? (
          <>
            <Spinner data-icon="inline-start" aria-hidden="true" />
            Deleting...
          </>
        ) : (
          label
        )}
      </Button>
    </form>
  );
}
