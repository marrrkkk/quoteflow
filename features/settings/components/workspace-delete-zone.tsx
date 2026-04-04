"use client";

import { useActionState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { WorkspaceDeleteActionState } from "@/features/settings/types";

type WorkspaceDeleteZoneProps = {
  action: (
    state: WorkspaceDeleteActionState,
    formData: FormData,
  ) => Promise<WorkspaceDeleteActionState>;
  workspaceName: string;
};

const initialState: WorkspaceDeleteActionState = {};

export function WorkspaceDeleteZone({
  action,
  workspaceName,
}: WorkspaceDeleteZoneProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <Card className="gap-0 border-destructive/25 bg-card/97">
      <CardHeader className="gap-3 pb-5">
        <CardTitle>Danger zone</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-0">
        <Alert variant="destructive">
          <AlertTriangle data-icon="inline-start" />
          <AlertTitle>Delete workspace</AlertTitle>
          <AlertDescription>
            This permanently deletes the workspace, its inquiries, quotes, pricing,
            files, and settings.
          </AlertDescription>
        </Alert>

        {state.error ? (
          <Alert variant="destructive">
            <AlertTitle>We could not delete the workspace.</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        <form action={formAction} className="form-stack">
          <Field
            data-invalid={Boolean(state.fieldErrors?.confirmation) || undefined}
          >
            <FieldLabel htmlFor="workspace-delete-confirmation">
              Type <span className="font-semibold text-foreground">{workspaceName}</span> to confirm
            </FieldLabel>
            <FieldContent>
              <Input
                aria-invalid={Boolean(state.fieldErrors?.confirmation) || undefined}
                autoComplete="off"
                disabled={isPending}
                id="workspace-delete-confirmation"
                maxLength={120}
                name="confirmation"
                required
                spellCheck={false}
              />
              <FieldError
                errors={
                  state.fieldErrors?.confirmation?.[0]
                    ? [{ message: state.fieldErrors.confirmation[0] }]
                    : undefined
                }
              />
            </FieldContent>
          </Field>

          <div className="dashboard-actions">
            <Button disabled={isPending} type="submit" variant="destructive">
              <Trash2 data-icon="inline-start" />
              {isPending ? "Deleting..." : "Delete workspace"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
