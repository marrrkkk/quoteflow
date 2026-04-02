import { z } from "zod";

export const knowledgeFilesBucket = "knowledge-files";
export const knowledgeMaxFileSize = 5 * 1024 * 1024;
export const knowledgeContextMaxCharacters = 16_000;

export const knowledgeAllowedExtensions = [
  ".txt",
  ".md",
  ".csv",
  ".json",
] as const;

export const knowledgeAllowedMimeTypes = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
];

export const knowledgeFileAccept = [
  ...knowledgeAllowedExtensions,
  ...knowledgeAllowedMimeTypes,
].join(",");

function emptyToUndefined(value: unknown) {
  if (value == null) {
    return undefined;
  }

  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

function getFileExtension(fileName: string) {
  const fileNameLower = fileName.toLowerCase();
  const lastDotIndex = fileNameLower.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return fileNameLower.slice(lastDotIndex);
}

const knowledgeFileSchema = z.preprocess(
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
    .instanceof(File, { message: "Choose a knowledge file to upload." })
    .refine(
      (file) => file.size <= knowledgeMaxFileSize,
      "Upload a file that is 5 MB or smaller.",
    )
    .refine((file) => {
      const extension = getFileExtension(file.name);

      return (
        knowledgeAllowedExtensions.some((allowed) => allowed === extension) ||
        knowledgeAllowedMimeTypes.some((allowed) => allowed === file.type)
      );
    }, "Upload a TXT, MD, CSV, or JSON file."),
);

export const knowledgeFileUploadSchema = z.object({
  title: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters.")
      .max(120, "Title must be 120 characters or fewer.")
      .optional(),
  ),
  file: knowledgeFileSchema,
});

export const knowledgeFileIdSchema = z.string().trim().min(1).max(128);

export const knowledgeFaqSchema = z.object({
  question: z
    .string()
    .trim()
    .min(4, "Question must be at least 4 characters.")
    .max(240, "Question must be 240 characters or fewer."),
  answer: z
    .string()
    .trim()
    .min(8, "Answer must be at least 8 characters.")
    .max(4000, "Answer must be 4,000 characters or fewer."),
});

export const knowledgeFaqIdSchema = z.string().trim().min(1).max(128);

export type KnowledgeFileUploadInput = z.infer<typeof knowledgeFileUploadSchema>;
export type KnowledgeFaqInput = z.infer<typeof knowledgeFaqSchema>;
