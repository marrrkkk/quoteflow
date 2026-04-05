import { z } from "zod";

import {
  businessTypes,
  type BusinessType,
} from "@/features/inquiries/business-types";

function emptyToUndefined(value: unknown) {
  if (value == null) {
    return undefined;
  }

  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

function optionalText(maxLength: number) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().max(maxLength).optional(),
  );
}

export const inquiryCustomFieldTypes = [
  "short_text",
  "long_text",
  "select",
  "multi_select",
  "number",
  "date",
  "boolean",
] as const;

export type InquiryCustomFieldType = (typeof inquiryCustomFieldTypes)[number];

export const inquiryContactFieldKeys = [
  "customerName",
  "customerEmail",
  "customerPhone",
  "companyName",
] as const;

export type InquiryContactFieldKey = (typeof inquiryContactFieldKeys)[number];

export const inquiryProjectSystemFieldKeys = [
  "serviceCategory",
  "requestedDeadline",
  "budgetText",
  "details",
  "attachment",
] as const;

export type InquiryProjectSystemFieldKey =
  (typeof inquiryProjectSystemFieldKeys)[number];

export const inquiryCustomFieldTypeMeta: Record<
  InquiryCustomFieldType,
  { label: string }
> = {
  short_text: { label: "Short text" },
  long_text: { label: "Long text" },
  select: { label: "Select" },
  multi_select: { label: "Multi-select" },
  number: { label: "Number" },
  date: { label: "Date" },
  boolean: { label: "Yes / No" },
};

export type InquiryFieldOption = {
  id: string;
  label: string;
  value: string;
};

export type InquiryContactFieldConfig = {
  label: string;
  placeholder?: string;
  enabled: boolean;
  required: boolean;
};

export type InquiryFormSystemFieldDefinition = {
  kind: "system";
  key: InquiryProjectSystemFieldKey;
  label: string;
  placeholder?: string;
  enabled: boolean;
  required: boolean;
};

export type InquiryFormCustomFieldDefinition = {
  kind: "custom";
  id: string;
  fieldType: InquiryCustomFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: InquiryFieldOption[];
};

export type InquiryFormFieldDefinition =
  | InquiryFormSystemFieldDefinition
  | InquiryFormCustomFieldDefinition;

export type InquiryFormConfig = {
  version: 1;
  businessType: BusinessType;
  contactFields: Record<InquiryContactFieldKey, InquiryContactFieldConfig>;
  projectFields: InquiryFormFieldDefinition[];
};

export type InquirySubmittedFieldSnapshotField = {
  id: string;
  label: string;
  value: string | string[] | boolean | null;
  displayValue: string;
};

export type InquirySubmittedFieldSnapshot = {
  version: 1;
  businessType: BusinessType;
  fields: InquirySubmittedFieldSnapshotField[];
};

const inquiryFieldOptionSchema = z.object({
  id: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(80),
});

const inquiryContactFieldConfigSchema = z.object({
  label: z.string().trim().min(1).max(80),
  placeholder: optionalText(160),
  enabled: z.boolean(),
  required: z.boolean(),
});

export const inquiryFormSystemFieldSchema = z.object({
  kind: z.literal("system"),
  key: z.enum(inquiryProjectSystemFieldKeys),
  label: z.string().trim().min(1).max(80),
  placeholder: optionalText(160),
  enabled: z.boolean(),
  required: z.boolean(),
});

const inquiryFormCustomFieldBaseSchema = z.object({
  kind: z.literal("custom"),
  id: z.string().trim().min(1).max(120),
  fieldType: z.enum(inquiryCustomFieldTypes),
  label: z.string().trim().min(1).max(80),
  placeholder: optionalText(160),
  required: z.boolean(),
});

const inquiryFormCustomFieldOptionsSchema =
  inquiryFormCustomFieldBaseSchema.extend({
    fieldType: z.enum(["select", "multi_select"]),
    options: z.array(inquiryFieldOptionSchema).min(1).max(12),
  });

const inquiryFormCustomFieldSimpleSchema =
  inquiryFormCustomFieldBaseSchema.extend({
    fieldType: z.enum(["short_text", "long_text", "number", "date", "boolean"]),
    options: z.undefined().optional(),
  });

export const inquiryFormCustomFieldSchema = z.union([
  inquiryFormCustomFieldOptionsSchema,
  inquiryFormCustomFieldSimpleSchema,
]);

export const inquiryFormFieldSchema = z.union([
  inquiryFormSystemFieldSchema,
  inquiryFormCustomFieldSchema,
]);

export const inquirySubmittedFieldSnapshotFieldSchema = z.object({
  id: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(120),
  value: z.union([z.string(), z.array(z.string()), z.boolean(), z.null()]),
  displayValue: z.string().trim().min(1).max(2000),
});

export const inquirySubmittedFieldSnapshotSchema = z.object({
  version: z.literal(1),
  businessType: z.enum(businessTypes),
  fields: z.array(inquirySubmittedFieldSnapshotFieldSchema).max(40),
});

export const inquiryFormConfigSchema = z
  .object({
    version: z.literal(1),
    businessType: z.enum(businessTypes),
    contactFields: z.object({
      customerName: inquiryContactFieldConfigSchema,
      customerEmail: inquiryContactFieldConfigSchema,
      customerPhone: inquiryContactFieldConfigSchema,
      companyName: inquiryContactFieldConfigSchema,
    }),
    projectFields: z.array(inquiryFormFieldSchema).max(24),
  })
  .superRefine((value, context) => {
    const serviceCategoryFields = value.projectFields.filter(
      (field) => field.kind === "system" && field.key === "serviceCategory",
    );
    const detailsFields = value.projectFields.filter(
      (field) => field.kind === "system" && field.key === "details",
    );

    if (serviceCategoryFields.length !== 1) {
      context.addIssue({
        code: "custom",
        message: "Include exactly one service/category field.",
        path: ["projectFields"],
      });
    }

    if (detailsFields.length !== 1) {
      context.addIssue({
        code: "custom",
        message: "Include exactly one details field.",
        path: ["projectFields"],
      });
    }

    for (const contactKey of ["customerName", "customerEmail"] as const) {
      const field = value.contactFields[contactKey];

      if (!field.enabled || !field.required) {
        context.addIssue({
          code: "custom",
          message: "Name and email must stay enabled and required.",
          path: ["contactFields", contactKey],
        });
      }
    }

    const ids = new Set<string>();

    for (const field of value.projectFields) {
      const id = field.kind === "system" ? field.key : field.id;

      if (ids.has(id)) {
        context.addIssue({
          code: "custom",
          message: "Each inquiry field must be unique.",
          path: ["projectFields"],
        });
      }

      ids.add(id);

      if (field.kind === "system") {
        if (
          (field.key === "serviceCategory" || field.key === "details") &&
          (!field.enabled || !field.required)
        ) {
          context.addIssue({
            code: "custom",
            message: "Service/category and details must stay enabled and required.",
            path: ["projectFields"],
          });
        }

        if (field.key === "attachment" && field.required) {
          context.addIssue({
            code: "custom",
            message: "Attachment cannot be required.",
            path: ["projectFields"],
          });
        }
      }
    }
  });

type CreateInquiryFormConfigDefaultsInput = {
  businessType?: BusinessType;
};

type ContactFieldOverrides = Partial<
  Record<
    InquiryContactFieldKey,
    Partial<Omit<InquiryContactFieldConfig, "required" | "enabled">> &
      Pick<InquiryContactFieldConfig, "enabled" | "required">
  >
>;

function createOption(value: string, label?: string): InquiryFieldOption {
  return {
    id: value,
    label: label ?? value,
    value,
  };
}

function createSystemField(
  key: InquiryProjectSystemFieldKey,
  {
    label,
    placeholder,
    enabled = true,
    required = false,
  }: {
    label: string;
    placeholder?: string;
    enabled?: boolean;
    required?: boolean;
  },
): InquiryFormSystemFieldDefinition {
  return {
    kind: "system",
    key,
    label,
    placeholder,
    enabled,
    required,
  };
}

function createCustomField(
  id: string,
  fieldType: InquiryCustomFieldType,
  {
    label,
    placeholder,
    required = false,
    options,
  }: {
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: InquiryFieldOption[];
  },
): InquiryFormCustomFieldDefinition {
  return {
    kind: "custom",
    id,
    fieldType,
    label,
    placeholder,
    required,
    options,
  };
}

function createContactFieldConfig(
  overrides?: ContactFieldOverrides,
): Record<InquiryContactFieldKey, InquiryContactFieldConfig> {
  return {
    customerName: {
      label: overrides?.customerName?.label ?? "Your name",
      placeholder: overrides?.customerName?.placeholder ?? "Alicia Cruz",
      enabled: true,
      required: true,
    },
    customerEmail: {
      label: overrides?.customerEmail?.label ?? "Email address",
      placeholder: overrides?.customerEmail?.placeholder ?? "you@example.com",
      enabled: true,
      required: true,
    },
    customerPhone: {
      label: overrides?.customerPhone?.label ?? "Phone number",
      placeholder: overrides?.customerPhone?.placeholder ?? "Optional",
      enabled: overrides?.customerPhone?.enabled ?? true,
      required: false,
    },
    companyName: {
      label: overrides?.companyName?.label ?? "Company name",
      placeholder: overrides?.companyName?.placeholder ?? "Optional",
      enabled: overrides?.companyName?.enabled ?? false,
      required: false,
    },
  };
}

function createGeneralServicesFields() {
  return [
    createSystemField("serviceCategory", {
      label: "Service needed",
      placeholder: "Tell us what you need",
      required: true,
    }),
    createCustomField("site-location", "short_text", {
      label: "Location",
      placeholder: "City or site address",
    }),
    createSystemField("requestedDeadline", {
      label: "Needed by",
      enabled: true,
    }),
    createSystemField("budgetText", {
      label: "Budget",
      enabled: true,
    }),
    createSystemField("details", {
      label: "Project details",
      placeholder: "Share the scope, size, timing, or anything else that matters.",
      required: true,
    }),
    createSystemField("attachment", {
      label: "Reference file",
      enabled: true,
    }),
  ] satisfies InquiryFormFieldDefinition[];
}

function createPrintSignageFields() {
  return [
    createSystemField("serviceCategory", {
      label: "Project type",
      placeholder: "Signs, decals, banners, wraps",
      required: true,
    }),
    createCustomField("quantity", "number", {
      label: "Quantity",
      placeholder: "How many items?",
    }),
    createCustomField("size", "short_text", {
      label: "Size or dimensions",
      placeholder: "48 x 96 in, storefront window, vehicle side",
    }),
    createCustomField("material", "select", {
      label: "Material",
      options: [
        createOption("vinyl", "Vinyl"),
        createOption("banner", "Banner"),
        createOption("rigid", "Rigid board"),
        createOption("paper", "Paper"),
        createOption("not-sure", "Not sure"),
      ],
    }),
    createCustomField("installation", "boolean", {
      label: "Installation needed?",
    }),
    createSystemField("requestedDeadline", {
      label: "Needed by",
      enabled: true,
    }),
    createSystemField("budgetText", {
      label: "Budget",
      enabled: true,
    }),
    createSystemField("details", {
      label: "Project details",
      placeholder: "Share quantities, placement, artwork status, and site notes.",
      required: true,
    }),
    createSystemField("attachment", {
      label: "Artwork or reference file",
      enabled: true,
    }),
  ] satisfies InquiryFormFieldDefinition[];
}

function createHomeServicesFields() {
  return [
    createSystemField("serviceCategory", {
      label: "Service needed",
      placeholder: "Repair, install, inspection, maintenance",
      required: true,
    }),
    createCustomField("service-address", "short_text", {
      label: "Service address",
      placeholder: "Street, city, or area",
    }),
    createCustomField("property-type", "select", {
      label: "Property type",
      options: [
        createOption("house", "House"),
        createOption("condo", "Condo"),
        createOption("apartment", "Apartment"),
        createOption("commercial", "Commercial"),
      ],
    }),
    createCustomField("preferred-visit", "date", {
      label: "Preferred visit date",
    }),
    createCustomField("access-notes", "short_text", {
      label: "Access notes",
      placeholder: "Gate code, parking, unit number",
    }),
    createSystemField("requestedDeadline", {
      label: "Needed by",
      enabled: true,
    }),
    createSystemField("details", {
      label: "Job details",
      placeholder: "Describe the issue, scope, or work needed.",
      required: true,
    }),
    createSystemField("attachment", {
      label: "Photos or reference file",
      enabled: true,
    }),
  ] satisfies InquiryFormFieldDefinition[];
}

function createRepairServicesFields() {
  return [
    createSystemField("serviceCategory", {
      label: "Item or service",
      placeholder: "Phone repair, laptop repair, appliance repair",
      required: true,
    }),
    createCustomField("item-model", "short_text", {
      label: "Item model",
      placeholder: "Brand and model",
    }),
    createCustomField("issue-summary", "long_text", {
      label: "Issue summary",
      placeholder: "What is happening and when did it start?",
      required: true,
    }),
    createCustomField("urgent-repair", "boolean", {
      label: "Urgent request?",
    }),
    createSystemField("requestedDeadline", {
      label: "Needed by",
      enabled: true,
    }),
    createSystemField("budgetText", {
      label: "Budget",
      enabled: true,
    }),
    createSystemField("details", {
      label: "Extra details",
      placeholder: "Share symptoms, prior repairs, or important context.",
      required: true,
    }),
    createSystemField("attachment", {
      label: "Photos or diagnostic file",
      enabled: true,
    }),
  ] satisfies InquiryFormFieldDefinition[];
}

function createCleaningServicesFields() {
  return [
    createSystemField("serviceCategory", {
      label: "Cleaning service",
      placeholder: "Residential, move-out, office, deep clean",
      required: true,
    }),
    createCustomField("property-type", "select", {
      label: "Property type",
      options: [
        createOption("home", "Home"),
        createOption("office", "Office"),
        createOption("retail", "Retail"),
        createOption("short-term-rental", "Short-term rental"),
      ],
    }),
    createCustomField("property-size", "short_text", {
      label: "Property size",
      placeholder: "Bedrooms, bathrooms, square footage",
    }),
    createCustomField("frequency", "select", {
      label: "Frequency",
      options: [
        createOption("one-time", "One-time"),
        createOption("weekly", "Weekly"),
        createOption("bi-weekly", "Bi-weekly"),
        createOption("monthly", "Monthly"),
      ],
    }),
    createCustomField("supplies", "boolean", {
      label: "Need us to bring supplies?",
    }),
    createSystemField("requestedDeadline", {
      label: "Preferred date",
      enabled: true,
    }),
    createSystemField("details", {
      label: "Cleaning details",
      placeholder: "Share the rooms, priorities, and anything special to know.",
      required: true,
    }),
    createSystemField("attachment", {
      label: "Photos",
      enabled: true,
    }),
  ] satisfies InquiryFormFieldDefinition[];
}

function createLandscapingFields() {
  return [
    createSystemField("serviceCategory", {
      label: "Service needed",
      placeholder: "Lawn care, cleanup, planting, irrigation",
      required: true,
    }),
    createCustomField("property-address", "short_text", {
      label: "Property address",
      placeholder: "Street, city, or area",
    }),
    createCustomField("area-size", "short_text", {
      label: "Area size",
      placeholder: "Yard size or area to cover",
    }),
    createCustomField("service-frequency", "select", {
      label: "Service frequency",
      options: [
        createOption("one-time", "One-time"),
        createOption("weekly", "Weekly"),
        createOption("bi-weekly", "Bi-weekly"),
        createOption("monthly", "Monthly"),
      ],
    }),
    createCustomField("site-access", "short_text", {
      label: "Site access",
      placeholder: "Gate, parking, HOA, pets",
    }),
    createSystemField("requestedDeadline", {
      label: "Preferred start date",
      enabled: true,
    }),
    createSystemField("details", {
      label: "Project details",
      placeholder: "Share the site, goals, and current conditions.",
      required: true,
    }),
    createSystemField("attachment", {
      label: "Photos or plans",
      enabled: true,
    }),
  ] satisfies InquiryFormFieldDefinition[];
}

function createCreativeAgencyFields() {
  return [
    createSystemField("serviceCategory", {
      label: "Project type",
      placeholder: "Branding, design, campaign, content",
      required: true,
    }),
    createCustomField("deliverables", "long_text", {
      label: "Deliverables",
      placeholder: "What do you need produced?",
      required: true,
    }),
    createCustomField("launch-date", "date", {
      label: "Launch date",
    }),
    createCustomField("channels", "multi_select", {
      label: "Channels",
      options: [
        createOption("web", "Web"),
        createOption("social", "Social"),
        createOption("print", "Print"),
        createOption("email", "Email"),
        createOption("video", "Video"),
      ],
    }),
    createCustomField("brand-assets-ready", "boolean", {
      label: "Brand assets ready?",
    }),
    createSystemField("budgetText", {
      label: "Budget",
      enabled: true,
    }),
    createSystemField("details", {
      label: "Project brief",
      placeholder: "Share the goal, audience, and scope.",
      required: true,
    }),
    createSystemField("attachment", {
      label: "Brief or reference file",
      enabled: true,
    }),
  ] satisfies InquiryFormFieldDefinition[];
}

function createItWebServicesFields() {
  return [
    createSystemField("serviceCategory", {
      label: "Service needed",
      placeholder: "Website, support, automation, setup",
      required: true,
    }),
    createCustomField("site-or-system", "short_text", {
      label: "Website or system",
      placeholder: "URL, platform, or system name",
    }),
    createCustomField("platform", "short_text", {
      label: "Platform",
      placeholder: "WordPress, Shopify, Google Business",
    }),
    createCustomField("priority", "select", {
      label: "Priority",
      options: [
        createOption("low", "Low"),
        createOption("normal", "Normal"),
        createOption("high", "High"),
        createOption("urgent", "Urgent"),
      ],
    }),
    createCustomField("ongoing-support", "boolean", {
      label: "Need ongoing support?",
    }),
    createSystemField("requestedDeadline", {
      label: "Target date",
      enabled: true,
    }),
    createSystemField("details", {
      label: "Request details",
      placeholder: "Describe the issue, scope, or outcome you need.",
      required: true,
    }),
    createSystemField("attachment", {
      label: "Screenshots or files",
      enabled: true,
    }),
  ] satisfies InquiryFormFieldDefinition[];
}

function createPhotoVideoFields() {
  return [
    createSystemField("serviceCategory", {
      label: "Coverage needed",
      placeholder: "Photo, video, event coverage, edit",
      required: true,
    }),
    createCustomField("event-date", "date", {
      label: "Event date",
    }),
    createCustomField("location", "short_text", {
      label: "Location",
      placeholder: "Venue or city",
    }),
    createCustomField("guest-count", "number", {
      label: "Guest count",
    }),
    createCustomField("deliverables", "multi_select", {
      label: "Deliverables",
      options: [
        createOption("photos", "Photos"),
        createOption("highlight-video", "Highlight video"),
        createOption("full-edit", "Full edit"),
        createOption("reels", "Reels"),
      ],
    }),
    createSystemField("budgetText", {
      label: "Budget",
      enabled: true,
    }),
    createSystemField("details", {
      label: "Event details",
      placeholder: "Share the event, coverage needs, and schedule.",
      required: true,
    }),
    createSystemField("attachment", {
      label: "Schedule or reference file",
      enabled: true,
    }),
  ] satisfies InquiryFormFieldDefinition[];
}

function createCoachingConsultingFields() {
  return [
    createSystemField("serviceCategory", {
      label: "Service needed",
      placeholder: "Coaching, consulting, audit, training",
      required: true,
    }),
    createCustomField("goal", "long_text", {
      label: "Goal",
      placeholder: "What are you trying to solve or improve?",
      required: true,
    }),
    createCustomField("format", "select", {
      label: "Preferred format",
      options: [
        createOption("online", "Online"),
        createOption("in-person", "In person"),
        createOption("either", "Either"),
      ],
    }),
    createCustomField("participant-count", "number", {
      label: "Participant count",
    }),
    createCustomField("desired-start", "date", {
      label: "Desired start date",
    }),
    createSystemField("budgetText", {
      label: "Budget",
      enabled: true,
    }),
    createSystemField("details", {
      label: "Background",
      placeholder: "Share the context, goals, and current challenges.",
      required: true,
    }),
    createSystemField("attachment", {
      label: "Reference file",
      enabled: true,
    }),
  ] satisfies InquiryFormFieldDefinition[];
}

export function createInquiryFormConfigDefaults({
  businessType = "general_services",
}: CreateInquiryFormConfigDefaultsInput = {}): InquiryFormConfig {
  const contactFieldOverrides: ContactFieldOverrides = {
    companyName: {
      enabled: [
        "creative_studio_agency",
        "it_web_services",
        "coaching_consulting",
        "print_signage",
      ].includes(businessType),
      required: false,
    },
  };

  let projectFields: InquiryFormFieldDefinition[];

  switch (businessType) {
    case "print_signage":
      projectFields = createPrintSignageFields();
      break;
    case "home_services":
      projectFields = createHomeServicesFields();
      break;
    case "repair_services":
      projectFields = createRepairServicesFields();
      break;
    case "cleaning_services":
      projectFields = createCleaningServicesFields();
      break;
    case "landscaping_outdoor":
      projectFields = createLandscapingFields();
      break;
    case "creative_studio_agency":
      projectFields = createCreativeAgencyFields();
      break;
    case "it_web_services":
      projectFields = createItWebServicesFields();
      break;
    case "photo_video_events":
      projectFields = createPhotoVideoFields();
      break;
    case "coaching_consulting":
      projectFields = createCoachingConsultingFields();
      break;
    case "general_services":
    default:
      projectFields = createGeneralServicesFields();
      break;
  }

  return {
    version: 1,
    businessType,
    contactFields: createContactFieldConfig(contactFieldOverrides),
    projectFields,
  };
}

export function getNormalizedInquiryFormConfig(
  value: unknown,
  defaults?: CreateInquiryFormConfigDefaultsInput,
) {
  const fallback = createInquiryFormConfigDefaults(defaults);
  const parsed = inquiryFormConfigSchema.safeParse(value);

  if (!parsed.success) {
    return fallback;
  }

  return parsed.data;
}

export function getNormalizedInquirySubmittedFieldSnapshot(value: unknown) {
  const parsed = inquirySubmittedFieldSnapshotSchema.safeParse(value);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export function getInquiryFormFieldInputName(
  field: InquiryFormFieldDefinition | InquiryContactFieldKey,
) {
  if (typeof field === "string") {
    return field;
  }

  if (field.kind === "system") {
    return field.key;
  }

  return `custom_${field.id}`;
}

export function getInquirySubmittedFieldValueDisplay(
  value: string | string[] | boolean | null,
) {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "Not provided";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string") {
    return value.trim() || "Not provided";
  }

  return "Not provided";
}

export function getAdditionalInquirySubmittedFields(
  snapshot: InquirySubmittedFieldSnapshot | null | undefined,
) {
  if (!snapshot) {
    return [];
  }

  const primaryFieldIds = new Set([
    "customerName",
    "customerEmail",
    "customerPhone",
    "companyName",
    "serviceCategory",
    "requestedDeadline",
    "budgetText",
    "details",
    "attachment",
  ]);

  return snapshot.fields.filter((field) => !primaryFieldIds.has(field.id));
}
