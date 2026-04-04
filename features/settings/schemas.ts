import { z } from "zod";

import { workspaceBusinessTypes } from "@/features/inquiries/business-types";
import { inquiryFormConfigSchema } from "@/features/inquiries/form-config";
import { inquiryPageCardSchema, inquiryPageTemplates } from "@/features/inquiries/page-config";
import { isAcceptedFileType } from "@/lib/files";
import {
  normalizePublicSlugInput,
  publicSlugMaxLength,
  publicSlugRegex,
} from "@/lib/slugs";
import { workspaceAiTonePreferences } from "@/features/settings/types";
import {
  workspaceCurrencyOptions,
  workspaceLogoAllowedExtensions,
  normalizeWorkspaceSlug,
  workspaceLogoAllowedMimeTypes,
  workspaceLogoMaxSize,
} from "@/features/settings/utils";

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

function optionalEmail(maxLength = 320) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().max(maxLength).email().optional(),
  );
}

function formBoolean() {
  return z.preprocess(
    (value) => value === true || value === "true" || value === "on",
    z.boolean(),
  );
}

function jsonField<T extends z.ZodTypeAny>(schema: T, emptyFallback: unknown) {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return emptyFallback;
    }

    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return emptyFallback;
    }

    try {
      return JSON.parse(trimmedValue);
    } catch {
      return Symbol.for("invalid-json-field");
    }
  }, schema);
}

const workspaceLogoSchema = z.preprocess(
  (value) => {
    if (!(value instanceof File)) {
      return undefined;
    }

    if (value.size === 0 || value.name.trim() === "") {
      return undefined;
    }

    return value;
  },
  z
    .instanceof(File)
    .refine(
      (file) => file.size <= workspaceLogoMaxSize,
      "Upload a logo that is 2 MB or smaller.",
    )
    .refine(
      (file) =>
        isAcceptedFileType(file, {
          allowedExtensions: workspaceLogoAllowedExtensions,
          allowedMimeTypes: workspaceLogoAllowedMimeTypes,
        }),
      "Upload a JPG, PNG, or WEBP logo.",
    )
    .optional(),
);

export const workspaceGeneralSettingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(publicSlugMaxLength)
    .transform(normalizeWorkspaceSlug)
    .refine(
      (value) => publicSlugRegex.test(value),
      "Use lowercase letters, numbers, and hyphens only.",
  ),
  shortDescription: optionalText(280),
  contactEmail: optionalEmail(),
  defaultEmailSignature: optionalText(1200),
  aiTonePreference: z.enum(workspaceAiTonePreferences),
  notifyOnNewInquiry: formBoolean(),
  logo: workspaceLogoSchema,
  removeLogo: formBoolean().default(false),
});

export type WorkspaceGeneralSettingsInput = z.infer<
  typeof workspaceGeneralSettingsSchema
>;

export const workspaceQuoteSettingsSchema = z.object({
  defaultQuoteNotes: optionalText(1600),
  defaultQuoteValidityDays: z.preprocess(
    (value) => {
      if (typeof value === "number") {
        return value;
      }

      if (typeof value !== "string") {
        return value;
      }

      const normalized = value.trim();

      if (!normalized) {
        return Number.NaN;
      }

      return Number(normalized);
    },
    z.number().int().min(1).max(365),
  ),
  notifyOnQuoteSent: formBoolean(),
  defaultCurrency: z.enum(workspaceCurrencyOptions).default("USD"),
});

export type WorkspaceQuoteSettingsInput = z.infer<
  typeof workspaceQuoteSettingsSchema
>;

export const workspaceDeleteSchema = z.object({
  confirmation: z.string().trim().min(1).max(120),
});

export type WorkspaceDeleteInput = z.infer<typeof workspaceDeleteSchema>;

export const workspaceInquiryPageSettingsSchema = z.object({
  formId: z.string().trim().min(1).max(128),
  publicInquiryEnabled: formBoolean(),
  template: z.enum(inquiryPageTemplates),
  eyebrow: optionalText(48),
  headline: z.string().trim().min(1).max(120),
  description: optionalText(280),
  brandTagline: optionalText(120),
  formTitle: z.string().trim().min(1).max(80),
  formDescription: optionalText(200),
  cards: jsonField(z.array(inquiryPageCardSchema).max(8), []),
});

export type WorkspaceInquiryPageSettingsInput = z.infer<
  typeof workspaceInquiryPageSettingsSchema
>;

export const workspaceInquiryFormSettingsSchema = z.object({
  formId: z.string().trim().min(1).max(128),
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(publicSlugMaxLength)
    .transform(normalizePublicSlugInput)
    .refine(
      (value) => publicSlugRegex.test(value),
      "Use lowercase letters, numbers, and hyphens only.",
    ),
  businessType: z.enum(workspaceBusinessTypes),
  inquiryFormConfig: jsonField(inquiryFormConfigSchema, Symbol.for("invalid-json-field")),
});

export type WorkspaceInquiryFormSettingsInput = z.infer<
  typeof workspaceInquiryFormSettingsSchema
>;

export const workspaceInquiryFormPresetSchema = z.object({
  formId: z.string().trim().min(1).max(128),
  businessType: z.enum(workspaceBusinessTypes),
});

export type WorkspaceInquiryFormPresetInput = z.infer<
  typeof workspaceInquiryFormPresetSchema
>;

export const workspaceInquiryFormCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  businessType: z.enum(workspaceBusinessTypes),
});

export type WorkspaceInquiryFormCreateInput = z.infer<
  typeof workspaceInquiryFormCreateSchema
>;

export const workspaceInquiryFormTargetSchema = z.object({
  targetFormId: z.string().trim().min(1).max(128),
});

export type WorkspaceInquiryFormTargetInput = z.infer<
  typeof workspaceInquiryFormTargetSchema
>;
