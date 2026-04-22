"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useActionStateWithSonner } from "@/hooks/use-action-state-with-sonner";
import type { WorkspaceMemberInviteAcceptActionState } from "@/features/workspace-members/types";

type WorkspaceMemberInviteAcceptFormProps = {
  acceptAction: (
    state: WorkspaceMemberInviteAcceptActionState,
    formData: FormData,
  ) => Promise<WorkspaceMemberInviteAcceptActionState>;
  declineAction?: (
    state: WorkspaceMemberInviteAcceptActionState,
    formData: FormData,
  ) => Promise<WorkspaceMemberInviteAcceptActionState>;
  submitLabel: string;
};

const initialState: WorkspaceMemberInviteAcceptActionState = {};

export function WorkspaceMemberInviteAcceptForm({
  acceptAction,
  declineAction,
  submitLabel,
}: WorkspaceMemberInviteAcceptFormProps) {
  const [, acceptFormAction, isAcceptPending] = useActionStateWithSonner(
    acceptAction,
    initialState,
  );

  const [, declineFormAction, isDeclinePending] = useActionStateWithSonner(
    declineAction || (async () => initialState),
    initialState,
  );

  const isPending = isAcceptPending || isDeclinePending;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={acceptFormAction}>
        <Button disabled={isPending} size="lg" type="submit">
          {isAcceptPending ? (
            <>
              <Spinner aria-hidden="true" data-icon="inline-start" />
              Joining...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </form>

      {declineAction && (
        <form action={declineFormAction}>
          <Button disabled={isPending} size="lg" type="submit" variant="outline">
            {isDeclinePending ? (
              <>
                <Spinner aria-hidden="true" data-icon="inline-start" />
                Declining...
              </>
            ) : (
              "Decline"
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
