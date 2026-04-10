"use client";

import { useActionState } from "react";
import { toast } from "sonner";

type SonnerActionState = {
  error?: string;
  success?: unknown;
  fieldErrors?: Record<string, string[] | undefined>;
};

type UseActionStateWithSonnerOptions<State extends SonnerActionState> = {
  successToastId?: string;
  errorToastId?: string;
  getSuccessMessage?: (state: State) => string;
  getErrorMessage?: (state: State) => string | undefined;
};

function getFirstFieldError(fieldErrors: Record<string, string[] | undefined> | undefined) {
  if (!fieldErrors) {
    return undefined;
  }

  for (const key of Object.keys(fieldErrors)) {
    const message = fieldErrors[key]?.[0];

    if (message) {
      return message;
    }
  }

  return undefined;
}

export function useActionStateWithSonner<State extends SonnerActionState>(
  action: (
    state: Awaited<State>,
    formData: FormData,
  ) => State | Promise<State>,
  initialState: Awaited<State>,
  options?: UseActionStateWithSonnerOptions<State>,
) {
  return useActionState<State, FormData>(async (prevState, formData) => {
    const nextState = await action(prevState, formData);
    const errorMessage =
      options?.getErrorMessage?.(nextState) ??
      getFirstFieldError(nextState.fieldErrors) ??
      nextState.error;

    if (errorMessage) {
      toast.error(errorMessage, {
        id: options?.errorToastId,
      });
    } else if (typeof nextState.success === "string" && nextState.success) {
      toast.success(options?.getSuccessMessage?.(nextState) ?? nextState.success, {
        id: options?.successToastId,
      });
    }

    return nextState;
  }, initialState);
}
