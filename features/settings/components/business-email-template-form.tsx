"use client";

import { useEffect, useMemo, useState } from "react";

import {
  FloatingFormActions,
  useFloatingUnsavedChanges,
} from "@/components/shared/floating-form-actions";
import { FormSection } from "@/components/shared/form-layout";
import { useActionStateWithSonner } from "@/hooks/use-action-state-with-sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProgressRouter } from "@/hooks/use-progress-router";
import type {
  QuoteEmailTemplateConfig,
} from "@/features/settings/email-templates";
import {
  quoteEmailMergeTags,
  quoteEmailPresetKeys,
  quoteEmailPresets,
  quoteEmailSampleMergeValues,
  quoteEmailTemplateDefaults,
  resolveQuoteEmailTemplate,
  type QuoteEmailPresetKey,
} from "@/features/settings/email-templates";
import type {
  BusinessEmailTemplateActionState,
  BusinessSettingsView,
} from "@/features/settings/types";

type BusinessEmailTemplateFormProps = {
  action: (
    state: BusinessEmailTemplateActionState,
    formData: FormData,
  ) => Promise<BusinessEmailTemplateActionState>;
  settings: BusinessSettingsView;
};

const initialState: BusinessEmailTemplateActionState = {};

type DraftValues = {
  subject: string;
  greeting: string;
  introText: string;
  ctaLabel: string;
  closingText: string;
};

function configToDraft(
  config: QuoteEmailTemplateConfig | null | undefined,
): DraftValues {
  return {
    subject: config?.subject ?? "",
    greeting: config?.greeting ?? "",
    introText: config?.introText ?? "",
    ctaLabel: config?.ctaLabel ?? "",
    closingText: config?.closingText ?? "",
  };
}

function draftHasChanges(draft: DraftValues, saved: DraftValues) {
  return (
    draft.subject !== saved.subject ||
    draft.greeting !== saved.greeting ||
    draft.introText !== saved.introText ||
    draft.ctaLabel !== saved.ctaLabel ||
    draft.closingText !== saved.closingText
  );
}

export function BusinessEmailTemplateForm({
  action,
  settings,
}: BusinessEmailTemplateFormProps) {
  const router = useProgressRouter();
  const [state, formAction, isPending] = useActionStateWithSonner(
    action,
    initialState,
  );
  const initialDraft = useMemo(
    () => configToDraft(settings.quoteEmailTemplate),
    [settings.quoteEmailTemplate],
  );
  const [draft, setDraft] = useState(initialDraft);
  const [saved, setSaved] = useState(initialDraft);
  const hasUnsavedChanges = draftHasChanges(draft, saved);
  const { shouldRenderFloatingActions, floatingActionsState } =
    useFloatingUnsavedChanges(hasUnsavedChanges);

  const preview = useMemo(
    () =>
      resolveQuoteEmailTemplate(
        {
          subject: draft.subject || undefined,
          greeting: draft.greeting || undefined,
          introText: draft.introText || undefined,
          ctaLabel: draft.ctaLabel || undefined,
          closingText: draft.closingText || undefined,
        },
        quoteEmailSampleMergeValues,
      ),
    [draft],
  );

  useEffect(() => {
    if (!state.success) {
      return;
    }

    setSaved(draft);
    router.refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, state.success]);

  useEffect(() => {
    setDraft(initialDraft);
    setSaved(initialDraft);
  }, [initialDraft]);

  function updateDraft<Key extends keyof DraftValues>(
    key: Key,
    value: DraftValues[Key],
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleCancelChanges() {
    setDraft(saved);
  }

  function applyPreset(key: QuoteEmailPresetKey) {
    const preset = quoteEmailPresets[key];

    setDraft({
      subject: preset.config.subject ?? "",
      greeting: preset.config.greeting ?? "",
      introText: preset.config.introText ?? "",
      ctaLabel: preset.config.ctaLabel ?? "",
      closingText: preset.config.closingText ?? "",
    });
  }

  function resetToDefaults() {
    setDraft({
      subject: "",
      greeting: "",
      introText: "",
      ctaLabel: "",
      closingText: "",
    });
  }

  return (
    <form action={formAction} className="form-stack pb-28">
      <Card className="gap-0 border-border/75 bg-card/97">
        <CardHeader className="gap-2.5 pb-6">
          <CardTitle>Quote email template</CardTitle>
          <CardDescription>
            Customize the email your customers receive when you send a
            quote. Leave a field empty to use the built-in default.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-6">
            <FormSection
              className="soft-panel px-5 py-5 shadow-none sm:px-6"
              description="Start from a pre-written style and edit from there."
              title="Starter templates"
            >
              <div className="flex flex-wrap gap-2">
                {quoteEmailPresetKeys.map((key) => {
                  const preset = quoteEmailPresets[key];

                  return (
                    <Button
                      disabled={isPending}
                      key={key}
                      onClick={() => applyPreset(key)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {preset.label}
                    </Button>
                  );
                })}
                <Button
                  disabled={isPending}
                  onClick={resetToDefaults}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Reset to defaults
                </Button>
              </div>
            </FormSection>

            <FormSection
              className="soft-panel px-5 py-5 shadow-none sm:px-6"
              description="Edit each section of the quote email."
              title="Email content"
            >
              <Alert>
                <AlertTitle>Merge tags</AlertTitle>
                <AlertDescription>
                  Use these variables in your text — they&apos;ll be replaced
                  with real values when the email is sent:{" "}
                  {quoteEmailMergeTags.map((tag, index) => (
                    <span key={tag.tag}>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                        {tag.tag}
                      </code>
                      <span className="text-muted-foreground text-xs">
                        {" "}
                        ({tag.label})
                      </span>
                      {index < quoteEmailMergeTags.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </AlertDescription>
              </Alert>

              <div className="grid gap-5">
                <Field
                  data-invalid={
                    Boolean(state.fieldErrors?.subject) || undefined
                  }
                >
                  <FieldLabel htmlFor="email-template-subject">
                    Subject line
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      disabled={isPending}
                      id="email-template-subject"
                      maxLength={200}
                      name="subject"
                      onChange={(event) =>
                        updateDraft("subject", event.currentTarget.value)
                      }
                      placeholder={quoteEmailTemplateDefaults.subject}
                      value={draft.subject}
                    />
                    <FieldError
                      errors={
                        state.fieldErrors?.subject?.[0]
                          ? [{ message: state.fieldErrors.subject[0] }]
                          : undefined
                      }
                    />
                  </FieldContent>
                </Field>

                <Field
                  data-invalid={
                    Boolean(state.fieldErrors?.greeting) || undefined
                  }
                >
                  <FieldLabel htmlFor="email-template-greeting">
                    Greeting
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      disabled={isPending}
                      id="email-template-greeting"
                      maxLength={200}
                      name="greeting"
                      onChange={(event) =>
                        updateDraft("greeting", event.currentTarget.value)
                      }
                      placeholder={quoteEmailTemplateDefaults.greeting}
                      value={draft.greeting}
                    />
                    <FieldError
                      errors={
                        state.fieldErrors?.greeting?.[0]
                          ? [{ message: state.fieldErrors.greeting[0] }]
                          : undefined
                      }
                    />
                  </FieldContent>
                </Field>

                <Field
                  data-invalid={
                    Boolean(state.fieldErrors?.introText) || undefined
                  }
                >
                  <FieldLabel htmlFor="email-template-intro">
                    Intro text
                  </FieldLabel>
                  <FieldContent>
                    <Textarea
                      disabled={isPending}
                      id="email-template-intro"
                      maxLength={400}
                      name="introText"
                      onChange={(event) =>
                        updateDraft("introText", event.currentTarget.value)
                      }
                      placeholder={quoteEmailTemplateDefaults.introText}
                      rows={3}
                      value={draft.introText}
                    />
                    <FieldError
                      errors={
                        state.fieldErrors?.introText?.[0]
                          ? [{ message: state.fieldErrors.introText[0] }]
                          : undefined
                      }
                    />
                  </FieldContent>
                </Field>

                <Field
                  data-invalid={
                    Boolean(state.fieldErrors?.ctaLabel) || undefined
                  }
                >
                  <FieldLabel htmlFor="email-template-cta">
                    Button label
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      disabled={isPending}
                      id="email-template-cta"
                      maxLength={60}
                      name="ctaLabel"
                      onChange={(event) =>
                        updateDraft("ctaLabel", event.currentTarget.value)
                      }
                      placeholder={quoteEmailTemplateDefaults.ctaLabel}
                      value={draft.ctaLabel}
                    />
                    <FieldDescription>
                      The call-to-action button in the email.
                    </FieldDescription>
                    <FieldError
                      errors={
                        state.fieldErrors?.ctaLabel?.[0]
                          ? [{ message: state.fieldErrors.ctaLabel[0] }]
                          : undefined
                      }
                    />
                  </FieldContent>
                </Field>

                <Field
                  data-invalid={
                    Boolean(state.fieldErrors?.closingText) || undefined
                  }
                >
                  <FieldLabel htmlFor="email-template-closing">
                    Closing text
                  </FieldLabel>
                  <FieldContent>
                    <Textarea
                      disabled={isPending}
                      id="email-template-closing"
                      maxLength={400}
                      name="closingText"
                      onChange={(event) =>
                        updateDraft(
                          "closingText",
                          event.currentTarget.value,
                        )
                      }
                      placeholder={quoteEmailTemplateDefaults.closingText}
                      rows={3}
                      value={draft.closingText}
                    />
                    <FieldError
                      errors={
                        state.fieldErrors?.closingText?.[0]
                          ? [{ message: state.fieldErrors.closingText[0] }]
                          : undefined
                      }
                    />
                  </FieldContent>
                </Field>
              </div>
            </FormSection>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 border-border/75 bg-card/97">
        <CardHeader className="gap-2.5 pb-6">
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            How the email will look with sample data. The quote details,
            line items, totals, and signature are always included
            automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="soft-panel rounded-xl px-5 py-5 sm:px-6">
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Subject
              </p>
              <p className="text-sm font-medium text-foreground">
                {preview.subject}
              </p>
            </div>
            <hr className="my-4 border-border/50" />
            <div className="space-y-4 text-sm text-foreground">
              <p>{preview.greeting}</p>
              <p>{preview.introText}</p>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground italic">
                Quote details, line items, and totals appear here
              </div>
              <div>
                <span className="inline-block rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background">
                  {preview.ctaLabel}
                </span>
              </div>
              <p className="text-muted-foreground">{preview.closingText}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <FloatingFormActions
        disableSubmit={!hasUnsavedChanges}
        isPending={isPending}
        message="You have unsaved email template changes."
        onCancel={handleCancelChanges}
        state={floatingActionsState}
        submitLabel="Save email template"
        submitPendingLabel="Saving email template..."
        visible={shouldRenderFloatingActions}
      />
    </form>
  );
}
