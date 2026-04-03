import { z } from "zod";

import { isAcceptedFileType } from "@/lib/files";
import {
  inquiryStatusFilterValues,
  inquiryStatuses,
} from "@/features/inquiries/types";

export const publicInquiryAttachmentBucket = "inquiry-attachments";
export const publicInquiryMaxAttachmentSize = 5 * 1024 * 1024;
export const publicInquiryAllowedExtensions = [
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".txt",
] as const;
export const publicInquiryAllowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
] as const;
export const publicInquiryExtensionToMimeType: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".txt": "text/plain",
};
export const publicInquiryAttachmentAccept = [
  ...publicInquiryAllowedExtensions,
  ...publicInquiryAllowedMimeTypes,
].join(",");
export const publicInquiryAttachmentLabel =
  "PDF, DOC, DOCX, JPG, PNG, WEBP, or TXT up to 5 MB";

function emptyToUndefined(value: unknown) {
  if (value == null) {
    return undefined;
  }

  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

function firstString(value: unknown) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function optionalText(maxLength: number) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().max(maxLength).optional(),
  );
}

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

const publicInquiryAttachmentSchema = z.preprocess(
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
      (file) => file.size <= publicInquiryMaxAttachmentSize,
      "Upload a file that is 5 MB or smaller.",
    )
    .refine(
      (file) =>
        isAcceptedFileType(file, {
          allowedExtensions: publicInquiryAllowedExtensions,
          allowedMimeTypes: publicInquiryAllowedMimeTypes,
        }),
      "Upload a PDF, common document file, or image.",
    )
    .optional(),
);

export const publicInquirySchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Enter your name.")
    .max(120, "Name must be 120 characters or fewer."),
  customerEmail: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
  customerPhone: optionalText(40),
  serviceCategory: z
    .string()
    .trim()
    .min(2, "Tell us what service or category you need.")
    .max(120, "Service or category must be 120 characters or fewer."),
  deadline: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .refine(isValidDateInput, "Enter a valid deadline.")
      .optional(),
  ),
  budget: optionalText(120),
  details: z
    .string()
    .trim()
    .min(10, "Share a few details so the business can quote accurately.")
    .max(4000, "Details must be 4,000 characters or fewer."),
  attachment: publicInquiryAttachmentSchema,
});

export type PublicInquirySubmissionInput = z.infer<typeof publicInquirySchema>;

export const inquiryIdSchema = z.string().trim().min(1).max(128);

export const inquiryRouteParamsSchema = z.object({
  id: inquiryIdSchema,
});

export const inquiryAttachmentRouteParamsSchema = z.object({
  id: inquiryIdSchema,
  attachmentId: z.string().trim().min(1).max(128),
});

export const inquiryListFiltersSchema = z.object({
  q: z
    .preprocess(
      (value) => emptyToUndefined(firstString(value)),
      z.string().trim().max(120).optional(),
    )
    .catch(undefined),
  status: z
    .preprocess(
      (value) => firstString(value) ?? "all",
      z.enum(inquiryStatusFilterValues),
    )
    .catch("all"),
});

export const inquiryNoteSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Enter an internal note.")
    .max(2000, "Notes must be 2,000 characters or fewer."),
});

export const inquiryStatusChangeSchema = z.object({
  status: z.enum(inquiryStatuses),
});
