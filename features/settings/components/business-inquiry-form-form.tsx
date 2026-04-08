"use client";

import { useActionState, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  Plus,
  RefreshCcw,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import {
  FormSection,
} from "@/components/shared/form-layout";
import { useProgressRouter } from "@/hooks/use-progress-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
  inquiryContactFieldKeys,
  type InquiryContactFieldConfig,
  type InquiryContactFieldKey,
  type InquiryFormCustomFieldDefinition,
  type InquiryCustomFieldType,
  type InquiryFieldOption,
  type InquiryFormConfig,
  type InquiryFormFieldDefinition,
  type InquiryFormSystemFieldDefinition,
  getNormalizedInquiryFormConfig,
} from "@/features/inquiries/form-config";
import {
  businessTypeMeta,
  type BusinessType,
} from "@/features/inquiries/business-types";
import type {
  BusinessInquiryFormActionState,
  BusinessInquiryFormSettingsView,
} from "@/features/settings/types";
import { publicSlugMaxLength, publicSlugPattern } from "@/lib/slugs";
import { cn } from "@/lib/utils";

const MAX_CUSTOM_PROJECT_FIELDS = 12;
const MAX_CUSTOM_FIELD_OPTIONS = 12;

type BusinessInquiryFormFormProps = {
  applyPresetAction: (
    state: BusinessInquiryFormActionState,
    formData: FormData,
  ) => Promise<BusinessInquiryFormActionState>;
  saveAction: (
    state: BusinessInquiryFormActionState,
    formData: FormData,
  ) => Promise<BusinessInquiryFormActionState>;
  settings: BusinessInquiryFormSettingsView;
};

const initialState: BusinessInquiryFormActionState = {};

export function BusinessInquiryFormForm({
  applyPresetAction,
  saveAction,
  settings,
}: BusinessInquiryFormFormProps) {
  const normalizedSettingsConfig = useMemo(
    () =>
      getNormalizedInquiryFormConfig(settings.inquiryFormConfig, {
        businessType: settings.businessType,
      }),
    [settings.businessType, settings.inquiryFormConfig],
  );
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
    normalizedSettingsConfig.contactFields,
  );
  const [projectFields, setProjectFields] = useState(
    normalizedSettingsConfig.projectFields,
  );
  const [groupLabels, setGroupLabels] = useState(normalizedSettingsConfig.groupLabels);
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [selectedContactKey, setSelectedContactKey] =
    useState<InquiryContactFieldKey>("customerName");
  const [selectedProjectFieldId, setSelectedProjectFieldId] = useState<string>(() => {
    const first = normalizedSettingsConfig.projectFields[0];
    return first ? getFieldId(first) : "serviceCategory";
  });
  const [isAddFieldDialogOpen, setIsAddFieldDialogOpen] = useState(false);
  const [isEditingProjectGroupLabel, setIsEditingProjectGroupLabel] = useState(false);
  const [projectGroupLabelDraft, setProjectGroupLabelDraft] = useState(() => {
    return normalizedSettingsConfig.groupLabels.project;
  });
  const [newFieldType, setNewFieldType] = useState<InquiryCustomFieldType>("short_text");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [nameDraft, setNameDraft] = useState(settings.formName);
  const [slugDraft, setSlugDraft] = useState(settings.formSlug);

  useEffect(() => {
    if (!presetState.success) {
      return;
    }

    router.refresh();
  }, [presetState.success, router]);

  useEffect(() => {
    if (!saveState.success) {
      return;
    }

    // Refresh to pull normalized config from the server, so
    // "unsaved changes" clears and public form previews update.
    router.refresh();
  }, [router, saveState.success]);

  const serializedConfig = JSON.stringify({
    version: 1,
    businessType,
    groupLabels,
    contactFields,
    projectFields,
  } satisfies InquiryFormConfig);
  const initialSerializedConfig = useMemo(
    () =>
      JSON.stringify({
        version: 1,
        businessType: settings.businessType,
        groupLabels: normalizedSettingsConfig.groupLabels,
        contactFields: normalizedSettingsConfig.contactFields,
        projectFields: normalizedSettingsConfig.projectFields,
      } satisfies InquiryFormConfig),
    [
      settings.businessType,
      normalizedSettingsConfig.contactFields,
      normalizedSettingsConfig.groupLabels,
      normalizedSettingsConfig.projectFields,
    ],
  );

  const hasConfigChanges = serializedConfig !== initialSerializedConfig;
  const hasTextInputChanges =
    nameDraft !== settings.formName || slugDraft !== settings.formSlug;
  const hasUnsavedChanges = hasConfigChanges || hasTextInputChanges;
  const [shouldRenderFloatingActions, setShouldRenderFloatingActions] = useState(false);
  const [floatingActionsState, setFloatingActionsState] = useState<"open" | "closed">(
    "closed",
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setBusinessType(settings.businessType);
      setContactFields(normalizedSettingsConfig.contactFields);
      setProjectFields(normalizedSettingsConfig.projectFields);
      setGroupLabels(normalizedSettingsConfig.groupLabels);
      setProjectGroupLabelDraft(normalizedSettingsConfig.groupLabels.project);
      setIsEditingProjectGroupLabel(false);
      setNameDraft(settings.formName);
      setSlugDraft(settings.formSlug);
    });
  }, [
    normalizedSettingsConfig.contactFields,
    normalizedSettingsConfig.groupLabels,
    normalizedSettingsConfig.projectFields,
    settings.businessType,
    settings.formId,
    settings.formName,
    settings.formSlug,
  ]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (hasUnsavedChanges) {
      queueMicrotask(() => {
        setShouldRenderFloatingActions(true);
        setFloatingActionsState("open");
      });
      return;
    }

    queueMicrotask(() => {
      setFloatingActionsState("closed");
    });
    const timeout = window.setTimeout(
      () => setShouldRenderFloatingActions(false),
      prefersReducedMotion ? 0 : 180,
    );
    return () => window.clearTimeout(timeout);
  }, [hasUnsavedChanges, prefersReducedMotion]);

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedProjectFieldId((currentId) => {
        if (projectFields.some((field) => getFieldId(field) === currentId)) {
          return currentId;
        }

        const next = projectFields[0];
        return next ? getFieldId(next) : "serviceCategory";
      });
    });
  }, [projectFields]);

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

  function addCustomFieldFromDialog() {
    const trimmedLabel = newFieldLabel.trim();
    const placeholder = newFieldPlaceholder.trim();

    if (!trimmedLabel) {
      return;
    }

    const draft = createCustomFieldDraft({
      fieldType: newFieldType,
      label: trimmedLabel,
      placeholder: placeholder ? placeholder : undefined,
    });

    setProjectFields((currentFields) => [...currentFields, draft]);
    setSelectedProjectFieldId(getFieldId(draft));
    setIsAddFieldDialogOpen(false);
    setNewFieldType("short_text");
    setNewFieldLabel("");
    setNewFieldPlaceholder("");
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

  function handleCancelChanges() {
    formRef.current?.reset();
    setBusinessType(settings.businessType);
    setGroupLabels(normalizedSettingsConfig.groupLabels);
    setContactFields(normalizedSettingsConfig.contactFields);
    setProjectFields(normalizedSettingsConfig.projectFields);
    setIsEditingProjectGroupLabel(false);
    setNameDraft(settings.formName);
    setSlugDraft(settings.formSlug);
  }

  function startEditingProjectGroupLabel() {
    setProjectGroupLabelDraft(groupLabels.project);
    setIsEditingProjectGroupLabel(true);
  }

  function saveProjectGroupLabel() {
    const trimmed = projectGroupLabelDraft.trim();

    if (!trimmed) {
      return;
    }

    setGroupLabels((current) => ({ ...current, project: trimmed }));
    setProjectGroupLabelDraft(trimmed);
    setIsEditingProjectGroupLabel(false);
  }

  function cancelProjectGroupLabelEdit() {
    setProjectGroupLabelDraft(groupLabels.project);
    setIsEditingProjectGroupLabel(false);
  }

  const customProjectFieldCount = useMemo(
    () => projectFields.filter((field) => field.kind === "custom").length,
    [projectFields],
  );
  const hasReachedCustomFieldLimit = customProjectFieldCount >= MAX_CUSTOM_PROJECT_FIELDS;

  const selectedProjectField = useMemo(() => {
    return projectFields.find((field) => getFieldId(field) === selectedProjectFieldId) ?? null;
  }, [projectFields, selectedProjectFieldId]);

  return (
    <>
      <form
        action={saveFormAction}
        className="form-stack pb-28"
        ref={formRef}
      >
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
          <CardHeader className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Preset</CardTitle>
            <Button
              onClick={() => setIsPresetDialogOpen(true)}
              type="button"
              variant="outline"
            >
              <RefreshCcw data-icon="inline-start" />
              Apply defaults
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 pt-0">
            <FormSection
              title="Business type"
            >
              <div className="grid gap-5">
                <div className="grid gap-5 lg:grid-cols-2">
                  <Field>
                  <FieldLabel htmlFor="business-inquiry-form-name">
                    Form name
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      aria-invalid={Boolean(nameError) || undefined}
                      defaultValue={settings.formName}
                      disabled={isSavePending}
                      id="business-inquiry-form-name"
                      maxLength={80}
                      minLength={2}
                      name="name"
                      onChange={(event) => {
                        setNameDraft(event.currentTarget.value);
                      }}
                      required
                    />
                    <FieldError
                      errors={nameError ? [{ message: nameError }] : undefined}
                    />
                  </FieldContent>
                  </Field>

                  <Field data-invalid={Boolean(slugError) || undefined}>
                  <FieldLabel htmlFor="business-inquiry-form-slug">
                    Form slug
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      aria-invalid={Boolean(slugError) || undefined}
                      defaultValue={settings.formSlug}
                      disabled={isSavePending}
                      id="business-inquiry-form-slug"
                      maxLength={publicSlugMaxLength}
                      minLength={2}
                      name="slug"
                      onChange={(event) => {
                        setSlugDraft(event.currentTarget.value);
                      }}
                      pattern={publicSlugPattern}
                      required
                      spellCheck={false}
                    />
                    <FieldError
                      errors={slugError ? [{ message: slugError }] : undefined}
                    />
                  </FieldContent>
                  </Field>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Field data-invalid={Boolean(businessTypeError) || undefined}>
                    <FieldLabel htmlFor="business-inquiry-business-type">
                      Type
                    </FieldLabel>
                    <FieldContent>
                      <Select
                        onValueChange={(value) =>
                          setBusinessType(value as BusinessType)
                        }
                        value={businessType}
                      >
                        <SelectTrigger
                          className="w-full"
                          id="business-inquiry-business-type"
                        >
                          <SelectValue placeholder="Choose a business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Object.entries(businessTypeMeta).map(
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

                  <div className="soft-panel flex items-center px-4 py-4 shadow-none">
                    <p className="text-sm font-medium text-foreground">
                      {businessTypeMeta[businessType].label}
                    </p>
                  </div>
                </div>
              </div>
            </FormSection>

            {configError ? (
              <FieldError errors={[{ message: configError }]} />
            ) : null}
          </CardContent>
        </Card>

        <Card className="gap-0 border-border/75 bg-card/97">
          <CardHeader className="gap-2 pb-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-xl">
                      {groupLabels.contact}
                    </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Edit contact labels and placeholders inline.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <div className="min-w-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">Contact fields</p>
                    <span className="text-xs text-muted-foreground">
                      {inquiryContactFieldKeys.length} total
                    </span>
                  </div>

                  <FieldList>
                    {inquiryContactFieldKeys.map((key) => (
                      <ContactFieldListItem
                        contactKey={key}
                        field={contactFields[key]}
                        isPending={isSavePending}
                        isSelected={selectedContactKey === key}
                        key={key}
                        onSelect={() => setSelectedContactKey(key)}
                      />
                    ))}
                  </FieldList>

                  <p className="text-xs leading-5 text-muted-foreground">
                    Name and email always stay shown and required.
                  </p>
                </div>
              </div>

              <div className="min-w-0">
                <div className="soft-panel flex flex-col gap-4 px-4 py-4 shadow-none">
                  <ContactFieldDetails
                    contactKey={selectedContactKey}
                    field={contactFields[selectedContactKey]}
                    isPending={isSavePending}
                    onChange={updateContactField}
                  />
                </div>

                {!contactFields.customerPhone.enabled &&
                !contactFields.companyName.enabled ? (
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Only name and email will be shown in Contact.
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 border-border/75 bg-card/97">
          <CardHeader className="gap-2 pb-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {isEditingProjectGroupLabel ? (
                  <>
                    <Input
                      className="h-9 w-64"
                      autoFocus
                      maxLength={40}
                      onChange={(event) => setProjectGroupLabelDraft(event.currentTarget.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          saveProjectGroupLabel();
                        }

                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelProjectGroupLabelEdit();
                        }
                      }}
                      value={projectGroupLabelDraft}
                    />
                    <Button onClick={saveProjectGroupLabel} type="button" variant="outline">
                      Save
                    </Button>
                    <Button onClick={cancelProjectGroupLabelEdit} type="button" variant="ghost">
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <CardTitle className="text-xl">
                      {groupLabels.project}
                    </CardTitle>
                    <Button onClick={startEditingProjectGroupLabel} type="button" variant="outline">
                      Edit
                    </Button>
                  </>
                )}
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Add, reorder, and edit project fields inline.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Project fields</p>
                    <p className="text-xs text-muted-foreground">
                      {customProjectFieldCount}/{MAX_CUSTOM_PROJECT_FIELDS} custom fields
                    </p>
                  </div>

                  <Button
                    disabled={isSavePending || hasReachedCustomFieldLimit}
                    onClick={() => setIsAddFieldDialogOpen(true)}
                    type="button"
                    variant="outline"
                  >
                    <Plus data-icon="inline-start" />
                    Add field
                  </Button>
                </div>

                <FieldList>
                  {projectFields.map((field, index) => (
                    <ProjectFieldListItem
                      field={field}
                      index={index}
                      isPending={isSavePending}
                      isSelected={getFieldId(field) === selectedProjectFieldId}
                      key={getFieldId(field)}
                      onMove={moveProjectField}
                      onRemove={removeProjectField}
                      onSelect={() => setSelectedProjectFieldId(getFieldId(field))}
                      totalFields={projectFields.length}
                    />
                  ))}
                </FieldList>

                {hasReachedCustomFieldLimit ? (
                  <Alert>
                    <AlertTitle>Custom field limit reached</AlertTitle>
                    <AlertDescription>
                      You can add up to {MAX_CUSTOM_PROJECT_FIELDS} custom project fields.
                      Remove one to add another.
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>

              <div className="min-w-0">
                <div className="soft-panel flex flex-col gap-4 px-4 py-4 shadow-none">
                  <ProjectFieldDetails
                    field={selectedProjectField}
                    isPending={isSavePending}
                    maxOptions={MAX_CUSTOM_FIELD_OPTIONS}
                    onAddOption={addCustomFieldOption}
                    onChangeCustomType={changeCustomFieldType}
                    onRemoveOption={removeCustomFieldOption}
                    onUpdate={updateProjectField}
                    onUpdateOption={updateCustomFieldOption}
                  />
                </div>

                {projectFields.length <= 2 ? (
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Tip: Use Add field to collect details like location, quantity, or preferences.
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {shouldRenderFloatingActions ? (
          <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
            <div
              className="soft-panel motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:slide-in-from-bottom-2 motion-safe:data-[state=open]:zoom-in-95 motion-safe:data-[state=open]:duration-200 motion-safe:data-[state=open]:ease-(--motion-ease-emphasized) motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=closed]:slide-out-to-bottom-2 motion-safe:data-[state=closed]:zoom-out-95 motion-safe:data-[state=closed]:duration-150 motion-safe:data-[state=closed]:ease-(--motion-ease-standard) motion-reduce:animate-none flex w-full max-w-2xl items-center justify-between gap-3 border-border/80 bg-background/95 px-4 py-3 shadow-xl backdrop-blur"
              data-state={floatingActionsState}
            >
              <p className="text-sm text-muted-foreground">You have unsaved changes.</p>
              <div className="flex items-center gap-2">
                <Button
                  disabled={isSavePending || !hasUnsavedChanges}
                  onClick={handleCancelChanges}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button disabled={isSavePending} type="submit">
                  {isSavePending ? (
                    <>
                      <Spinner data-icon="inline-start" aria-hidden="true" />
                      Saving...
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </form>

      <Dialog open={isAddFieldDialogOpen} onOpenChange={setIsAddFieldDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a project field</DialogTitle>
            <DialogDescription>
              Create a new custom question for the Project group. You can add up to{" "}
              {MAX_CUSTOM_PROJECT_FIELDS} custom fields.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="new-project-field-type">Field type</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(value) => setNewFieldType(value as InquiryCustomFieldType)}
                  value={newFieldType}
                >
                  <SelectTrigger className="w-full" id="new-project-field-type">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="new-project-field-label">Label</FieldLabel>
                <FieldContent>
                  <Input
                    disabled={isSavePending}
                    id="new-project-field-label"
                    maxLength={80}
                    minLength={1}
                    onChange={(event) => setNewFieldLabel(event.currentTarget.value)}
                    placeholder="e.g. Location"
                    required
                    value={newFieldLabel}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="new-project-field-placeholder">Placeholder</FieldLabel>
                <FieldContent>
                  <Input
                    disabled={isSavePending}
                    id="new-project-field-placeholder"
                    maxLength={160}
                    onChange={(event) => setNewFieldPlaceholder(event.currentTarget.value)}
                    placeholder="Optional"
                    value={newFieldPlaceholder}
                  />
                </FieldContent>
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsAddFieldDialogOpen(false)}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              disabled={
                isSavePending || hasReachedCustomFieldLimit || !newFieldLabel.trim()
              }
              onClick={addCustomFieldFromDialog}
              type="button"
            >
              Add field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply preset defaults?</DialogTitle>
            <DialogDescription>
              This will replace the current inquiry form and inquiry page with the{" "}
              {businessTypeMeta[businessType].label} preset.
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

function FieldList({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/50 p-2">
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

function FieldListItemShell({
  children,
  isSelected,
  onSelect,
}: {
  children: ReactNode;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "soft-panel group flex w-full cursor-pointer items-start justify-between gap-3 px-3 py-3 text-left shadow-none transition-colors",
        isSelected
          ? "border border-border/90 bg-background/85"
          : "border border-transparent hover:border-border/70 hover:bg-background/70",
      )}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: "muted" | "success" | "warning";
  children: ReactNode;
}) {
  const className =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : tone === "warning"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "bg-muted text-muted-foreground";

  return (
    <span className={cn("rounded-md px-2 py-1 text-[0.72rem] font-medium", className)}>
      {children}
    </span>
  );
}

function ContactFieldListItem({
  field,
  contactKey,
  isPending,
  isSelected,
  onSelect,
}: {
  field: InquiryContactFieldConfig;
  contactKey: InquiryContactFieldKey;
  isPending: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const locked = contactKey === "customerName" || contactKey === "customerEmail";

  return (
    <FieldListItemShell isSelected={isSelected} onSelect={onSelect}>
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-medium text-foreground">
          {field.label || "Untitled"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="muted">Contact</Pill>
          {locked ? <Pill tone="warning">Locked</Pill> : null}
          {field.enabled ? <Pill tone="success">Shown</Pill> : <Pill tone="muted">Hidden</Pill>}
          {field.required ? (
            <Pill tone="success">Required</Pill>
          ) : (
            <Pill tone="muted">Optional</Pill>
          )}
        </div>
      </div>
      <span className={cn("text-xs text-muted-foreground", isPending && "opacity-70")}>
        {contactKey === "customerName"
          ? "Name"
          : contactKey === "customerEmail"
            ? "Email"
            : contactKey === "customerPhone"
              ? "Phone"
              : "Company"}
      </span>
    </FieldListItemShell>
  );
}

function ProjectFieldListItem({
  field,
  index,
  isPending,
  onMove,
  onRemove,
  totalFields,
  isSelected,
  onSelect,
}: {
  field: InquiryFormFieldDefinition;
  index: number;
  isPending: boolean;
  onMove: (fieldId: string, direction: "up" | "down") => void;
  onRemove: (fieldId: string) => void;
  totalFields: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const fieldId = getFieldId(field);
  const isSystem = field.kind === "system";
  const title = isSystem ? getSystemFieldTitle(field) : field.label || "New field";
  const kindLabel = isSystem ? "System" : "Custom";
  const typeLabel = isSystem
    ? getSystemFieldInputKindLabel(field)
    : inquiryCustomFieldTypeMeta[field.fieldType].label;

  return (
    <FieldListItemShell isSelected={isSelected} onSelect={onSelect}>
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="muted">{kindLabel}</Pill>
          <Pill tone="muted">{typeLabel}</Pill>
          {field.kind === "system" ? (
            field.enabled ? (
              <Pill tone="success">Shown</Pill>
            ) : (
              <Pill tone="muted">Hidden</Pill>
            )
          ) : null}
          {field.required ? (
            <Pill tone="success">Required</Pill>
          ) : (
            <Pill tone="muted">Optional</Pill>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          className="h-8 w-8"
          disabled={isPending || index === 0}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onMove(fieldId, "up");
          }}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronUp className="size-4" />
        </Button>
        <Button
          className="h-8 w-8"
          disabled={isPending || index === totalFields - 1}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onMove(fieldId, "down");
          }}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronDown className="size-4" />
        </Button>
        {!isSystem ? (
          <Button
            className="h-8 w-8"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRemove(fieldId);
            }}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
    </FieldListItemShell>
  );
}

function ContactFieldDetails({
  contactKey,
  field,
  isPending,
  onChange,
}: {
  contactKey: InquiryContactFieldKey;
  field: InquiryContactFieldConfig;
  isPending: boolean;
  onChange: (key: InquiryContactFieldKey, patch: Partial<InquiryContactFieldConfig>) => void;
}) {
  const locked = contactKey === "customerName" || contactKey === "customerEmail";
  const canBeRequired = !locked;

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold tracking-tight text-foreground">Contact field</p>
        <p className="text-sm text-muted-foreground">
          Edit the label and placeholder, and choose whether to show it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label
          className={cn(
            "flex items-center gap-3 px-1 py-1",
            locked && "opacity-70",
          )}
        >
          <Switch
            checked={field.enabled}
            disabled={locked || isPending}
            onCheckedChange={(checked) =>
              onChange(contactKey, {
                enabled: checked,
                required: checked ? field.required : false,
              })
            }
          />
          <span className="text-sm font-medium text-foreground">Show</span>
        </label>

        <label
          className={cn(
            "flex items-center gap-3 px-1 py-1",
            !canBeRequired && "opacity-70",
          )}
        >
          <Switch
            checked={field.required}
            disabled={!canBeRequired || !field.enabled || isPending}
            onCheckedChange={(checked) => onChange(contactKey, { required: checked })}
          />
          <span className="text-sm font-medium text-foreground">Required</span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`contact-${contactKey}-label`}>Label</FieldLabel>
          <FieldContent>
            <Input
              disabled={isPending}
              id={`contact-${contactKey}-label`}
              maxLength={80}
              minLength={1}
              onChange={(event) =>
                onChange(contactKey, { label: event.currentTarget.value })
              }
              required
              value={field.label}
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor={`contact-${contactKey}-placeholder`}>Placeholder</FieldLabel>
          <FieldContent>
            <Input
              disabled={isPending}
              id={`contact-${contactKey}-placeholder`}
              maxLength={160}
              onChange={(event) =>
                onChange(contactKey, { placeholder: event.currentTarget.value })
              }
              value={field.placeholder ?? ""}
            />
          </FieldContent>
        </Field>
      </div>
    </>
  );
}

function ProjectFieldDetails({
  field,
  isPending,
  maxOptions,
  onAddOption,
  onChangeCustomType,
  onRemoveOption,
  onUpdate,
  onUpdateOption,
}: {
  field: InquiryFormFieldDefinition | null;
  isPending: boolean;
  maxOptions: number;
  onAddOption: (fieldId: string) => void;
  onChangeCustomType: (fieldId: string, fieldType: InquiryCustomFieldType) => void;
  onRemoveOption: (fieldId: string, optionId: string) => void;
  onUpdate: (fieldId: string, patch: Partial<InquiryFormFieldDefinition>) => void;
  onUpdateOption: (fieldId: string, optionId: string, patch: Partial<InquiryFieldOption>) => void;
}) {
  if (!field) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold tracking-tight text-foreground">Project field</p>
        <p className="text-sm text-muted-foreground">Select a field to edit.</p>
      </div>
    );
  }

  const fieldId = getFieldId(field);
  const isSystem = field.kind === "system";
  const isLockedRequired =
    isSystem && (field.key === "serviceCategory" || field.key === "details");
  const canToggleEnabled = isSystem && !isLockedRequired;
  const canToggleRequired =
    field.kind === "custom" ? true : field.key !== "attachment" && !isLockedRequired;
  const optionCount = field.kind === "custom" ? (field.options?.length ?? 0) : 0;

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold tracking-tight text-foreground">Project field</p>
        <p className="text-sm text-muted-foreground">
          {isSystem ? "System field" : "Custom field"} — edits affect the public form.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label
          className={cn(
            "flex items-center gap-3 px-1 py-1",
            (field.kind === "system" ? !canToggleEnabled : false) && "opacity-70",
          )}
        >
          <Switch
            checked={field.kind === "system" ? field.enabled : true}
            disabled={field.kind === "system" ? !canToggleEnabled || isPending : true}
            onCheckedChange={(checked) => {
              if (field.kind !== "system") {
                return;
              }

              onUpdate(fieldId, {
                enabled: checked,
                required:
                  field.key === "attachment" ? false : checked ? field.required : false,
              });
            }}
          />
          <span className="text-sm font-medium text-foreground">Show</span>
        </label>

        <label
          className={cn(
            "flex items-center gap-3 px-1 py-1",
            !canToggleRequired && "opacity-70",
          )}
        >
          <Switch
            checked={field.required}
            disabled={!canToggleRequired || (isSystem && !field.enabled) || isPending}
            onCheckedChange={(checked) => onUpdate(fieldId, { required: checked })}
          />
          <span className="text-sm font-medium text-foreground">Required</span>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
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
          <Field>
            <FieldLabel>Field type</FieldLabel>
            <FieldContent>
              <Input disabled value={getSystemFieldInputKindLabel(field)} />
            </FieldContent>
          </Field>
        )}
      </div>

      <div className="grid gap-4">
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
      </div>

      {field.kind === "custom" &&
      (field.fieldType === "select" || field.fieldType === "multi_select") ? (
        <>
          <Separator />
          <FormSection
            action={
              <Button
                disabled={isPending || optionCount >= maxOptions}
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
                  className="grid gap-3 rounded-xl border border-border/70 bg-background/70 p-3 md:grid-cols-[minmax(0,1fr)_auto]"
                  key={option.id}
                >
                  <Input
                    disabled={isPending}
                    maxLength={80}
                    onChange={(event) =>
                      onUpdateOption(fieldId, option.id, {
                        label: event.currentTarget.value,
                        value: normalizeOptionValue(event.currentTarget.value),
                      })
                    }
                    placeholder="Label"
                    value={option.label}
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
              <p className="text-xs text-muted-foreground">
                {optionCount}/{maxOptions} options
              </p>
            </div>
          </FormSection>
        </>
      ) : null}
    </>
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

function normalizeOptionValue(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, "-");
}

function createCustomFieldDraft(
  overrides: Partial<
    Pick<InquiryFormCustomFieldDefinition, "label" | "placeholder" | "fieldType">
  > = {},
): InquiryFormCustomFieldDefinition {
  const fieldType = overrides.fieldType ?? "short_text";

  return {
    kind: "custom",
    id: `custom_${crypto.randomUUID().replace(/-/g, "")}`,
    fieldType,
    label: overrides.label ?? "",
    placeholder: overrides.placeholder ?? "",
    required: false,
    options:
      fieldType === "select" || fieldType === "multi_select"
        ? [createFieldOptionDraft()]
        : undefined,
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
