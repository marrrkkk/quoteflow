"use client";

import { useActionState, useState } from "react";

import { FormActions, FormSection } from "@/components/shared/form-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  workspaceBusinessTypeMeta,
  workspaceBusinessTypes,
  type WorkspaceBusinessType,
} from "@/features/inquiries/business-types";
import type { CreateWorkspaceActionState } from "@/features/workspaces/types";

type CreateWorkspaceFormProps = {
  action: (
    state: CreateWorkspaceActionState,
    formData: FormData,
  ) => Promise<CreateWorkspaceActionState>;
};

const initialState: CreateWorkspaceActionState = {};

export function CreateWorkspaceForm({
  action,
}: CreateWorkspaceFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [businessType, setBusinessType] = useState<WorkspaceBusinessType>(
    "general_services",
  );
  const nameError = state.fieldErrors?.name?.[0];
  const businessTypeError = state.fieldErrors?.businessType?.[0];

  return (
    <form action={formAction} className="form-stack">
      {state.error ? (
        <Alert variant="destructive">
          <AlertTitle>We could not create the workspace.</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <input name="businessType" type="hidden" value={businessType} />

      <FormSection title="New workspace">
        <FieldGroup>
          <Field data-invalid={Boolean(nameError) || undefined}>
            <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
            <FieldContent>
              <Input
                id="workspace-name"
                name="name"
                maxLength={80}
                minLength={2}
                placeholder="Northside Signs"
                required
                aria-invalid={Boolean(nameError) || undefined}
                disabled={isPending}
              />
              <FieldError
                errors={nameError ? [{ message: nameError }] : undefined}
              />
            </FieldContent>
          </Field>

          <Field data-invalid={Boolean(businessTypeError) || undefined}>
            <FieldLabel htmlFor="workspace-business-type">
              Business type
            </FieldLabel>
            <FieldContent>
              <Select onValueChange={(value) => setBusinessType(value as WorkspaceBusinessType)} value={businessType}>
                <SelectTrigger className="w-full" id="workspace-business-type">
                  <SelectValue placeholder="Choose a business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {workspaceBusinessTypes.map((option) => (
                      <SelectItem key={option} value={option}>
                        {workspaceBusinessTypeMeta[option].label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {workspaceBusinessTypeMeta[businessType].description}
              </p>
              <FieldError
                errors={
                  businessTypeError ? [{ message: businessTypeError }] : undefined
                }
              />
            </FieldContent>
          </Field>
        </FieldGroup>
      </FormSection>

      <FormActions align="start">
        <Button disabled={isPending} type="submit">
          {isPending ? "Creating workspace..." : "Create workspace"}
        </Button>
      </FormActions>
    </form>
  );
}
