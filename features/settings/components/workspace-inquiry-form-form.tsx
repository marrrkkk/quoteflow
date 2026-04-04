"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Plus,
  RefreshCcw,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import {
  FormActions,
  FormSection,
} from "@/components/shared/form-layout";
import { useProgressRouter } from "@/hooks/use-progress-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  inquiryCustomFieldTypeMeta,
  type InquiryContactFieldConfig,
  type InquiryContactFieldKey,
  type InquiryFormCustomFieldDefinition,
  type InquiryCustomFieldType,
  type InquiryFieldOption,
  type InquiryFormConfig,
  type InquiryFormFieldDefinition,
  type InquiryFormSystemFieldDefinition,
} from "@/features/inquiries/form-config";
import {
  workspaceBusinessTypeMeta,
  type WorkspaceBusinessType,
} from "@/features/inquiries/business-types";
import type {
  WorkspaceInquiryFormActionState,
  WorkspaceInquiryFormSettingsView,
} from "@/features/settings/types";
import { publicSlugMaxLength, publicSlugPattern } from "@/lib/slugs";
import { cn } from "@/lib/utils";

type WorkspaceInquiryFormFormProps = {
  applyPresetAction: (
    state: WorkspaceInquiryFormActionState,
    formData: FormData,
  ) => Promise<WorkspaceInquiryFormActionState>;
  saveAction: (
    state: WorkspaceInquiryFormActionState,
    formData: FormData,
  ) => Promise<WorkspaceInquiryFormActionState>;
  settings: WorkspaceInquiryFormSettingsView;
};

const initialState: WorkspaceInquiryFormActionState = {};

export function WorkspaceInquiryFormForm({
  applyPresetAction,
  saveAction,
  settings,
}: WorkspaceInquiryFormFormProps) {
  const router = useProgressRouter();
  const [saveState, saveFormAction, isSavePending] = useActionState(
    saveAction,
    initialState,
  );
  const [presetState, presetFormAction, isPresetPending] = useActionState(
    applyPresetAction,
    initialState,
  );
  const [businessType, setBusinessType] = useState(settings.businessType);
  const [contactFields, setContactFields] = useState(
    settings.inquiryFormConfig.contactFields,
  );
  const [projectFields, setProjectFields] = useState(
    settings.inquiryFormConfig.projectFields,
  );
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);

  useEffect(() => {
    if (!presetState.success) {
      return;
    }

    router.refresh();
  }, [presetState.success, router]);

  const serializedConfig = JSON.stringify({
    version: 1,
    businessType,
    contactFields,
    projectFields,
  } satisfies InquiryFormConfig);

  const activeFieldCount = useMemo(
    () =>
      Object.values(contactFields).filter((field) => field.enabled).length +
      projectFields.filter(
        (field) => field.kind === "custom" || field.enabled,
      ).length,
    [contactFields, projectFields],
  );

  function updateContactField(
    key: InquiryContactFieldKey,
    patch: Partial<InquiryContactFieldConfig>,
  ) {
    setContactFields((currentFields) => ({
      ...currentFields,
      [key]: {
        ...currentFields[key],
        ...patch,
      },
    }));
  }

  function updateProjectField(
    fieldId: string,
    patch: Partial<InquiryFormFieldDefinition>,
  ) {
    setProjectFields((currentFields) =>
      currentFields.map((field) =>
        getFieldId(field) === fieldId ? ({ ...field, ...patch } as InquiryFormFieldDefinition) : field,
      ),
    );
  }

  function moveProjectField(fieldId: string, direction: "up" | "down") {
    setProjectFields((currentFields) => {
      const index = currentFields.findIndex((field) => getFieldId(field) === fieldId);

      if (index < 0) {
        return currentFields;
      }

      const nextIndex = direction === "up" ? index - 1 : index + 1;

      if (nextIndex < 0 || nextIndex >= currentFields.length) {
        return currentFields;
      }

      const nextFields = [...currentFields];
      const [movedField] = nextFields.splice(index, 1);
      nextFields.splice(nextIndex, 0, movedField);

      return nextFields;
    });
  }

  function removeProjectField(fieldId: string) {
    setProjectFields((currentFields) =>
      currentFields.filter((field) => getFieldId(field) !== fieldId),
    );
  }

  function addCustomField() {
    setProjectFields((currentFields) => [
      ...currentFields,
      createCustomFieldDraft(),
    ]);
  }

  function changeCustomFieldType(
    fieldId: string,
    fieldType: InquiryCustomFieldType,
  ) {
    setProjectFields((currentFields) =>
      currentFields.map((field) => {
        if (getFieldId(field) !== fieldId || field.kind !== "custom") {
          return field;
        }

        if (fieldType === "select" || fieldType === "multi_select") {
          return {
            ...field,
            fieldType,
            options:
              field.options?.length ? field.options : [createFieldOptionDraft()],
          };
        }

        return {
          ...field,
          fieldType,
          options: undefined,
        };
      }),
    );
  }

  function updateCustomFieldOption(
    fieldId: string,
    optionId: string,
    patch: Partial<InquiryFieldOption>,
  ) {
    setProjectFields((currentFields) =>
      currentFields.map((field) => {
        if (
          getFieldId(field) !== fieldId ||
          field.kind !== "custom" ||
          !field.options
        ) {
          return field;
        }

        return {
          ...field,
          options: field.options.map((option) =>
            option.id === optionId ? { ...option, ...patch } : option,
          ),
        };
      }),
    );
  }

  function addCustomFieldOption(fieldId: string) {
    setProjectFields((currentFields) =>
      currentFields.map((field) => {
        if (
          getFieldId(field) !== fieldId ||
          field.kind !== "custom" ||
          (field.fieldType !== "select" && field.fieldType !== "multi_select")
        ) {
          return field;
        }

        return {
          ...field,
          options: [...(field.options ?? []), createFieldOptionDraft()],
        };
      }),
    );
  }

  function removeCustomFieldOption(fieldId: string, optionId: string) {
    setProjectFields((currentFields) =>
      currentFields.map((field) => {
        if (
          getFieldId(field) !== fieldId ||
          field.kind !== "custom" ||
          !field.options
        ) {
          return field;
        }

        return {
          ...field,
          options:
            field.options.length === 1
              ? field.options
              : field.options.filter((option) => option.id !== optionId),
        };
      }),
    );
  }

  const configError = saveState.fieldErrors?.inquiryFormConfig?.[0];
  const businessTypeError = saveState.fieldErrors?.businessType?.[0];
  const nameError = saveState.fieldErrors?.name?.[0];
  const slugError = saveState.fieldErrors?.slug?.[0];

  return (
    <>
      <form action={saveFormAction} className="form-stack">
        {saveState.error ? (
          <Alert variant="destructive">
            <AlertTitle>We could not save the inquiry form.</AlertTitle>
            <AlertDescription>{saveState.error}</AlertDescription>
          </Alert>
        ) : null}

        {saveState.success ? (
          <Alert>
            <CheckCircle2 data-icon="inline-start" />
            <AlertTitle>Inquiry form saved</AlertTitle>
            <AlertDescription>{saveState.success}</AlertDescription>
          </Alert>
        ) : null}

        {presetState.error ? (
          <Alert variant="destructive">
            <AlertTitle>We could not apply the preset.</AlertTitle>
            <AlertDescription>{presetState.error}</AlertDescription>
          </Alert>
        ) : null}

        {presetState.success ? (
          <Alert>
            <CheckCircle2 data-icon="inline-start" />
            <AlertTitle>Preset applied</AlertTitle>
            <AlertDescription>{presetState.success}</AlertDescription>
          </Alert>
        ) : null}

        <input name="formId" type="hidden" value={settings.formId} />
        <input name="businessType" type="hidden" value={businessType} />
        <input name="inquiryFormConfig" type="hidden" value={serializedConfig} />

        <Card className="gap-0 border-border/75 bg-card/97">
          <CardHeader className="gap-3 pb-5">
            <CardTitle>Preset</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 pt-0">
            <FormSection
              title="Business type"
            >
              <div className="grid gap-5">
                <Field>
                  <FieldLabel htmlFor="workspace-inquiry-form-name">
                    Form name
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      aria-invalid={Boolean(nameError) || undefined}
                      defaultValue={settings.formName}
                      disabled={isSavePending}
                      id="workspace-inquiry-form-name"
                      maxLength={80}
                      minLength={2}
                      name="name"
                      required
                    />
                    <FieldError
                      errors={nameError ? [{ message: nameError }] : undefined}
                    />
                  </FieldContent>
                </Field>

                <Field data-invalid={Boolean(slugError) || undefined}>
                  <FieldLabel htmlFor="workspace-inquiry-form-slug">
                    Form slug
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      aria-invalid={Boolean(slugError) || undefined}
                      defaultValue={settings.formSlug}
                      disabled={isSavePending}
                      id="workspace-inquiry-form-slug"
                      maxLength={publicSlugMaxLength}
                      minLength={2}
                      name="slug"
                      pattern={publicSlugPattern}
                      required
                      spellCheck={false}
                    />
                    <FieldError
                      errors={slugError ? [{ message: slugError }] : undefined}
                    />
                  </FieldContent>
                </Field>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <Field data-invalid={Boolean(businessTypeError) || undefined}>
                    <FieldLabel htmlFor="workspace-inquiry-business-type">
                      Type
                    </FieldLabel>
                    <FieldContent>
                      <Select
                        onValueChange={(value) =>
                          setBusinessType(value as WorkspaceBusinessType)
                        }
                        value={businessType}
                      >
                        <SelectTrigger
                          className="w-full"
                          id="workspace-inquiry-business-type"
                        >
                          <SelectValue placeholder="Choose a business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Object.entries(workspaceBusinessTypeMeta).map(
                              ([value, meta]) => (
                                <SelectItem key={value} value={value}>
                                  {meta.label}
                                </SelectItem>
                              ),
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldError
                        errors={
                          businessTypeError
                            ? [{ message: businessTypeError }]
                            : undefined
                        }
                      />
                    </FieldContent>
                  </Field>

                  <div className="soft-panel flex flex-col justify-between gap-3 px-4 py-4 shadow-none">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {workspaceBusinessTypeMeta[businessType].label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {workspaceBusinessTypeMeta[businessType].description}
                      </p>
                    </div>
                    <div className="dashboard-meta-row">
                      <span className="dashboard-meta-pill">{activeFieldCount} fields</span>
                      <span className="dashboard-meta-pill">
                        {projectFields.filter((field) => field.kind === "custom").length} custom
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </FormSection>

            <Separator />

            <FormSection
              action={
                <Button
                  onClick={() => setIsPresetDialogOpen(true)}
                  type="button"
                  variant="outline"
                >
                  <RefreshCcw data-icon="inline-start" />
                  Apply preset defaults
                </Button>
              }
              title="Reset"
            >
              <div className="soft-panel px-4 py-4 shadow-none">
                <p className="text-sm leading-6 text-muted-foreground">
                  This resets the inquiry form and inquiry page to the selected preset.
                </p>
              </div>
            </FormSection>

            {configError ? (
              <FieldError errors={[{ message: configError }]} />
            ) : null}
          </CardContent>
        </Card>

        <Card className="gap-0 border-border/75 bg-card/97">
          <CardHeader className="gap-3 pb-5">
            <CardTitle>Contact fields</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-4">
              {(
                Object.entries(contactFields) as Array<
                  [InquiryContactFieldKey, InquiryContactFieldConfig]
                >
              ).map(([key, field]) => (
                <ContactFieldCard
                  field={field}
                  fieldKey={key}
                  isPending={isSavePending}
                  onChange={updateContactField}
                  key={key}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 border-border/75 bg-card/97">
          <CardHeader className="gap-3 pb-5">
            <CardTitle>Project fields</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 pt-0">
            <div className="grid gap-4">
              {projectFields.map((field, index) => (
                <ProjectFieldCard
                  field={field}
                  index={index}
                  isPending={isSavePending}
                  key={getFieldId(field)}
                  onAddOption={addCustomFieldOption}
                  onChangeCustomType={changeCustomFieldType}
                  onMove={moveProjectField}
                  onRemove={removeProjectField}
                  onRemoveOption={removeCustomFieldOption}
                  onUpdate={updateProjectField}
                  onUpdateOption={updateCustomFieldOption}
                  totalFields={projectFields.length}
                />
              ))}
            </div>

            <Button
              disabled={isSavePending}
              onClick={addCustomField}
              type="button"
              variant="outline"
            >
              <Plus data-icon="inline-start" />
              Add custom field
            </Button>
          </CardContent>
        </Card>

        <FormActions align="between">
          <div className="text-sm text-muted-foreground">
            Saved changes update the live and preview inquiry forms.
          </div>
          <Button disabled={isSavePending} type="submit">
            {isSavePending ? "Saving..." : "Save inquiry form"}
          </Button>
        </FormActions>
      </form>

      <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply preset defaults?</DialogTitle>
            <DialogDescription>
              This will replace the current inquiry form and inquiry page with the{" "}
              {workspaceBusinessTypeMeta[businessType].label} preset.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setIsPresetDialogOpen(false)}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <form action={presetFormAction}>
              <input name="formId" type="hidden" value={settings.formId} />
              <input name="businessType" type="hidden" value={businessType} />
              <Button
                disabled={isPresetPending}
                onClick={() => setIsPresetDialogOpen(false)}
                type="submit"
              >
                {isPresetPending ? "Applying..." : "Apply preset"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ContactFieldCard({
  field,
  fieldKey,
  isPending,
  onChange,
}: {
  field: InquiryContactFieldConfig;
  fieldKey: InquiryContactFieldKey;
  isPending: boolean;
  onChange: (
    key: InquiryContactFieldKey,
    patch: Partial<InquiryContactFieldConfig>,
  ) => void;
}) {
  const locked = fieldKey === "customerName" || fieldKey === "customerEmail";
  const canBeRequired = !locked;

  return (
    <div className="soft-panel flex flex-col gap-5 px-4 py-4 shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-tight text-foreground">
            {field.label}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {locked ? "Always shown" : "Optional contact field"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Switch
              checked={field.enabled}
              disabled={locked || isPending}
              onCheckedChange={(checked) =>
                onChange(fieldKey, { enabled: checked, required: checked ? field.required : false })
              }
            />
            Show
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Switch
              checked={field.required}
              disabled={!canBeRequired || !field.enabled || isPending}
              onCheckedChange={(checked) =>
                onChange(fieldKey, { required: checked })
              }
            />
            Required
          </label>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`contact-${fieldKey}-label`}>Label</FieldLabel>
          <FieldContent>
            <Input
              disabled={isPending}
              id={`contact-${fieldKey}-label`}
              maxLength={80}
              minLength={1}
              onChange={(event) =>
                onChange(fieldKey, { label: event.currentTarget.value })
              }
              required
              value={field.label}
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel htmlFor={`contact-${fieldKey}-placeholder`}>
            Placeholder
          </FieldLabel>
          <FieldContent>
            <Input
              disabled={isPending}
              id={`contact-${fieldKey}-placeholder`}
              maxLength={160}
              onChange={(event) =>
                onChange(fieldKey, { placeholder: event.currentTarget.value })
              }
              value={field.placeholder ?? ""}
            />
          </FieldContent>
        </Field>
      </div>
    </div>
  );
}

function ProjectFieldCard({
  field,
  index,
  isPending,
  onAddOption,
  onChangeCustomType,
  onMove,
  onRemove,
  onRemoveOption,
  onUpdate,
  onUpdateOption,
  totalFields,
}: {
  field: InquiryFormFieldDefinition;
  index: number;
  isPending: boolean;
  onAddOption: (fieldId: string) => void;
  onChangeCustomType: (fieldId: string, fieldType: InquiryCustomFieldType) => void;
  onMove: (fieldId: string, direction: "up" | "down") => void;
  onRemove: (fieldId: string) => void;
  onRemoveOption: (fieldId: string, optionId: string) => void;
  onUpdate: (
    fieldId: string,
    patch: Partial<InquiryFormFieldDefinition>,
  ) => void;
  onUpdateOption: (
    fieldId: string,
    optionId: string,
    patch: Partial<InquiryFieldOption>,
  ) => void;
  totalFields: number;
}) {
  const fieldId = getFieldId(field);
  const isSystem = field.kind === "system";
  const isLockedRequired =
    isSystem && (field.key === "serviceCategory" || field.key === "details");
  const canToggleEnabled = isSystem && !isLockedRequired;
  const canToggleRequired =
    field.kind === "custom"
      ? true
      : field.key !== "attachment" && !isLockedRequired;

  return (
    <div className="soft-panel flex flex-col gap-5 px-4 py-4 shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-tight text-foreground">
            {isSystem ? getSystemFieldTitle(field) : field.label || "New custom field"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSystem ? "System field" : "Custom field"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isPending || index === 0}
            onClick={() => onMove(fieldId, "up")}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            disabled={isPending || index === totalFields - 1}
            onClick={() => onMove(fieldId, "down")}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronDown className="size-4" />
          </Button>
          {!isSystem ? (
            <Button
              disabled={isPending}
              onClick={() => onRemove(fieldId)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_14rem]">
        <Field>
          <FieldLabel htmlFor={`${fieldId}-label`}>Label</FieldLabel>
          <FieldContent>
            <Input
              disabled={isPending}
              id={`${fieldId}-label`}
              maxLength={80}
              minLength={1}
              onChange={(event) =>
                onUpdate(fieldId, { label: event.currentTarget.value })
              }
              required
              value={field.label}
            />
          </FieldContent>
        </Field>

        {field.kind === "custom" ? (
          <Field>
            <FieldLabel htmlFor={`${fieldId}-type`}>Field type</FieldLabel>
            <FieldContent>
              <Select
                onValueChange={(value) =>
                  onChangeCustomType(fieldId, value as InquiryCustomFieldType)
                }
                value={field.fieldType}
              >
                <SelectTrigger className="w-full" id={`${fieldId}-type`}>
                  <SelectValue placeholder="Choose a field type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Object.entries(inquiryCustomFieldTypeMeta).map(([value, meta]) => (
                      <SelectItem key={value} value={value}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        ) : (
          <div className="soft-panel flex items-center gap-3 px-4 py-4 shadow-none">
            <span className="text-sm font-medium text-foreground">
              {getSystemFieldInputKindLabel(field)}
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
        <Field>
          <FieldLabel htmlFor={`${fieldId}-placeholder`}>Placeholder</FieldLabel>
          <FieldContent>
            {isTextareaField(field) ? (
              <Textarea
                disabled={isPending}
                id={`${fieldId}-placeholder`}
                maxLength={160}
                onChange={(event) =>
                  onUpdate(fieldId, { placeholder: event.currentTarget.value })
                }
                rows={3}
                value={field.placeholder ?? ""}
              />
            ) : (
              <Input
                disabled={isPending}
                id={`${fieldId}-placeholder`}
                maxLength={160}
                onChange={(event) =>
                  onUpdate(fieldId, { placeholder: event.currentTarget.value })
                }
                value={field.placeholder ?? ""}
              />
            )}
          </FieldContent>
        </Field>

        {field.kind === "system" ? (
          <label
            className={cn(
              "soft-panel flex items-center gap-3 px-4 py-4 shadow-none",
              !canToggleEnabled && "opacity-70",
            )}
          >
            <Switch
              checked={field.enabled}
              disabled={!canToggleEnabled || isPending}
              onCheckedChange={(checked) =>
                onUpdate(fieldId, {
                  enabled: checked,
                  required:
                    field.key === "attachment" ? false : checked ? field.required : false,
                })
              }
            />
            <span className="text-sm text-foreground">Show</span>
          </label>
        ) : (
          <div className="soft-panel flex items-center px-4 py-4 text-sm text-muted-foreground shadow-none">
            Remove the field to hide it.
          </div>
        )}

        <label
          className={cn(
            "soft-panel flex items-center gap-3 px-4 py-4 shadow-none",
            !canToggleRequired && "opacity-70",
          )}
        >
          <Switch
            checked={field.required}
            disabled={!canToggleRequired || (isSystem && !field.enabled) || isPending}
            onCheckedChange={(checked) =>
              onUpdate(fieldId, { required: checked })
            }
          />
          <span className="text-sm text-foreground">Required</span>
        </label>
      </div>

      {field.kind === "custom" &&
      (field.fieldType === "select" || field.fieldType === "multi_select") ? (
        <>
          <Separator />
          <FormSection
            action={
              <Button
                disabled={isPending}
                onClick={() => onAddOption(fieldId)}
                type="button"
                variant="outline"
              >
                <Plus data-icon="inline-start" />
                Add option
              </Button>
            }
            title="Options"
          >
            <div className="grid gap-3">
              {(field.options ?? []).map((option) => (
                <div
                  className="grid gap-3 rounded-xl border border-border/70 bg-background/70 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                  key={option.id}
                >
                  <Input
                    disabled={isPending}
                    maxLength={80}
                    onChange={(event) =>
                      onUpdateOption(fieldId, option.id, {
                        label: event.currentTarget.value,
                      })
                    }
                    placeholder="Label"
                    value={option.label}
                  />
                  <Input
                    disabled={isPending}
                    maxLength={80}
                    onChange={(event) =>
                      onUpdateOption(fieldId, option.id, {
                        value: event.currentTarget.value,
                      })
                    }
                    placeholder="Value"
                    value={option.value}
                  />
                  <Button
                    disabled={isPending || (field.options?.length ?? 0) === 1}
                    onClick={() => onRemoveOption(fieldId, option.id)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </FormSection>
        </>
      ) : null}
    </div>
  );
}

function getFieldId(field: InquiryFormFieldDefinition) {
  return field.kind === "system" ? field.key : field.id;
}

function isTextareaField(field: InquiryFormFieldDefinition) {
  return (
    (field.kind === "system" && field.key === "details") ||
    (field.kind === "custom" && field.fieldType === "long_text")
  );
}

function getSystemFieldTitle(field: InquiryFormSystemFieldDefinition) {
  switch (field.key) {
    case "serviceCategory":
      return "Service/category";
    case "requestedDeadline":
      return "Requested deadline";
    case "budgetText":
      return "Budget";
    case "details":
      return "Details";
    case "attachment":
      return "Attachment";
  }
}

function getSystemFieldInputKindLabel(field: InquiryFormSystemFieldDefinition) {
  switch (field.key) {
    case "requestedDeadline":
      return "Date";
    case "details":
      return "Long text";
    case "attachment":
      return "File upload";
    default:
      return "Text";
  }
}

function createCustomFieldDraft(): InquiryFormCustomFieldDefinition {
  return {
    kind: "custom",
    id: `custom_${crypto.randomUUID().replace(/-/g, "")}`,
    fieldType: "short_text",
    label: "",
    placeholder: "",
    required: false,
  };
}

function createFieldOptionDraft(): InquiryFieldOption {
  const id = `option_${crypto.randomUUID().replace(/-/g, "")}`;

  return {
    id,
    label: "",
    value: "",
  };
}
