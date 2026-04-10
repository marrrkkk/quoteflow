"use client";

import { useActionStateWithSonner } from "@/hooks/use-action-state-with-sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { KnowledgeFaqDeleteActionState } from "@/features/knowledge/types";

type KnowledgeFaqDeleteButtonProps = {
  action: (
    state: KnowledgeFaqDeleteActionState,
    formData: FormData,
  ) => Promise<KnowledgeFaqDeleteActionState>;
};

const initialState: KnowledgeFaqDeleteActionState = {};

export function KnowledgeFaqDeleteButton({
  action,
}: KnowledgeFaqDeleteButtonProps) {
  const [, formAction, isPending] = useActionStateWithSonner(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Button disabled={isPending} type="submit" variant="outline">
        <Trash2 data-icon="inline-start" />
        {isPending ? (
          <>
            <Spinner data-icon="inline-start" aria-hidden="true" />
            Deleting...
          </>
        ) : (
          "Delete"
        )}
      </Button>
    </form>
  );
}
