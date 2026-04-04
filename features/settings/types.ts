import type { WorkspaceBusinessType } from "@/features/inquiries/business-types";
import type {
  InquiryFormConfig,
  InquiryFormFieldDefinition,
} from "@/features/inquiries/form-config";
import type { InquiryPageConfig } from "@/features/inquiries/page-config";
import type { WorkspaceInquiryFormSummary } from "@/features/inquiries/types";

export const workspaceAiTonePreferences = [
  "balanced",
  "warm",
  "direct",
  "formal",
] as const;

export type WorkspaceAiTonePreference =
  (typeof workspaceAiTonePreferences)[number];

export type WorkspaceSettingsView = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  contactEmail: string | null;
  logoStoragePath: string | null;
  logoContentType: string | null;
  defaultEmailSignature: string | null;
  defaultQuoteNotes: string | null;
  defaultQuoteValidityDays: number;
  aiTonePreference: WorkspaceAiTonePreference;
  notifyOnNewInquiry: boolean;
  notifyOnQuoteSent: boolean;
  defaultCurrency: string;
  updatedAt: Date;
};

export type WorkspaceGeneralSettingsFieldName =
  | "name"
  | "slug"
  | "shortDescription"
  | "contactEmail"
  | "defaultEmailSignature"
  | "aiTonePreference"
  | "logo";

export type WorkspaceSettingsFieldErrors = Partial<
  Record<WorkspaceGeneralSettingsFieldName, string[] | undefined>
>;

export type WorkspaceSettingsActionState = {
  error?: string;
  success?: string;
  fieldErrors?: WorkspaceSettingsFieldErrors;
};

export type WorkspaceQuoteSettingsFieldName =
  | "defaultQuoteNotes"
  | "defaultQuoteValidityDays"
  | "notifyOnQuoteSent"
  | "defaultCurrency";

export type WorkspaceQuoteSettingsFieldErrors = Partial<
  Record<WorkspaceQuoteSettingsFieldName, string[] | undefined>
>;

export type WorkspaceQuoteSettingsActionState = {
  error?: string;
  success?: string;
  fieldErrors?: WorkspaceQuoteSettingsFieldErrors;
};

export type WorkspaceDeleteFieldErrors = Partial<
  Record<"confirmation", string[] | undefined>
>;

export type WorkspaceDeleteActionState = {
  error?: string;
  success?: string;
  fieldErrors?: WorkspaceDeleteFieldErrors;
};

export type WorkspaceInquiryFormsSettingsView = {
  id: string;
  name: string;
  slug: string;
  businessType: WorkspaceBusinessType;
  forms: Array<
    WorkspaceInquiryFormSummary & {
      submittedInquiryCount: number;
      inquiryFormConfig: InquiryFormConfig;
      inquiryPageConfig: InquiryPageConfig;
    }
  >;
};

export type WorkspaceInquiryPageSettingsView = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  logoStoragePath: string | null;
  formId: string;
  formName: string;
  formSlug: string;
  businessType: WorkspaceBusinessType;
  publicInquiryEnabled: boolean;
  isDefault: boolean;
  inquiryFormConfig: InquiryFormConfig;
  inquiryPageConfig: InquiryPageConfig;
  updatedAt: Date;
};

export type WorkspaceInquiryPageFieldName =
  | "formId"
  | "publicInquiryEnabled"
  | "template"
  | "eyebrow"
  | "headline"
  | "description"
  | "brandTagline"
  | "formTitle"
  | "formDescription"
  | "cards";

export type WorkspaceInquiryPageFieldErrors = Partial<
  Record<WorkspaceInquiryPageFieldName, string[] | undefined>
>;

export type WorkspaceInquiryPageActionState = {
  error?: string;
  success?: string;
  fieldErrors?: WorkspaceInquiryPageFieldErrors;
};

export type WorkspaceInquiryFormSettingsView = {
  id: string;
  name: string;
  slug: string;
  formId: string;
  formName: string;
  formSlug: string;
  businessType: WorkspaceBusinessType;
  publicInquiryEnabled: boolean;
  isDefault: boolean;
  inquiryFormConfig: InquiryFormConfig;
  inquiryPageConfig: InquiryPageConfig;
  updatedAt: Date;
};

export type WorkspaceInquiryFormEditorView = WorkspaceInquiryFormSettingsView & {
  shortDescription: string | null;
  logoStoragePath: string | null;
  activeFormCount: number;
  submittedInquiryCount: number;
};

export type WorkspaceInquiryFormFieldName =
  | "name"
  | "slug"
  | "businessType"
  | "inquiryFormConfig";

export type WorkspaceInquiryFormFieldErrors = Partial<
  Record<WorkspaceInquiryFormFieldName, string[] | undefined>
>;

export type WorkspaceInquiryFormActionState = {
  error?: string;
  success?: string;
  fieldErrors?: WorkspaceInquiryFormFieldErrors;
};

export type WorkspaceInquiryFormsActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<
    Record<"name" | "businessType" | "formId" | "targetFormId", string[] | undefined>
  >;
};

export type WorkspaceInquiryFormDangerActionState = {
  error?: string;
  success?: string;
};

export type WorkspaceInquiryFieldDraft = InquiryFormFieldDefinition;
