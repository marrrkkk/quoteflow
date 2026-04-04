"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Copy, Star } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkspaceInquiryFormsActionState } from "@/features/settings/types";

type WorkspaceInquiryFormManageCardProps = {
  duplicateAction: (
    state: WorkspaceInquiryFormsActionState,
    formData: FormData,
  ) => Promise<WorkspaceInquiryFormsActionState>;
  formId: string;
  isDefault: boolean;
  setDefaultAction: (
    state: WorkspaceInquiryFormsActionState,
    formData: FormData,
  ) => Promise<WorkspaceInquiryFormsActionState>;
};

const initialState: WorkspaceInquiryFormsActionState = {};

export function WorkspaceInquiryFormManageCard({
  duplicateAction,
  formId,
  isDefault,
  setDefaultAction,
}: WorkspaceInquiryFormManageCardProps) {
  const router = useRouter();
  const [duplicateState, duplicateFormAction, isDuplicatePending] =
    useActionState(duplicateAction, initialState);
  const [defaultState, defaultFormAction, isDefaultPending] = useActionState(
    setDefaultAction,
    initialState,
  );

  useEffect(() => {
    if (!defaultState.success) {
      return;
    }

    router.refresh();
  }, [defaultState.success, router]);

  return (
    <Card className="gap-0 border-border/75 bg-card/97">
      <CardHeader className="gap-3 pb-5">
        <CardTitle>Manage</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        {duplicateState.error ? (
          <Alert variant="destructive">
            <AlertTitle>We could not duplicate the form.</AlertTitle>
            <AlertDescription>{duplicateState.error}</AlertDescription>
          </Alert>
        ) : null}

        {defaultState.error ? (
          <Alert variant="destructive">
            <AlertTitle>We could not update the default form.</AlertTitle>
            <AlertDescription>{defaultState.error}</AlertDescription>
          </Alert>
        ) : null}

        <form action={duplicateFormAction}>
          <input name="targetFormId" type="hidden" value={formId} />
          <Button className="w-full" disabled={isDuplicatePending} type="submit" variant="outline">
            <Copy data-icon="inline-start" />
            {isDuplicatePending ? "Duplicating..." : "Duplicate form"}
          </Button>
        </form>

        {!isDefault ? (
          <form action={defaultFormAction}>
            <input name="targetFormId" type="hidden" value={formId} />
            <Button className="w-full" disabled={isDefaultPending} type="submit">
              <Star data-icon="inline-start" />
              {isDefaultPending ? "Saving..." : "Set as default"}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
