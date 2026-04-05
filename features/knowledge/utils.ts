import {
  getFileExtension,
  resolveSafeContentType,
  sanitizeStorageFileName,
} from "@/lib/files";
import { knowledgeContextMaxCharacters } from "@/features/knowledge/schemas";
import type {
  KnowledgeContextFaq,
  KnowledgeContextFile,
} from "@/features/knowledge/types";

const extensionToMimeType: Record<string, string> = {
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".csv": "text/csv",
  ".json": "application/json",
};

export function formatKnowledgeDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export function formatKnowledgeDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function formatKnowledgeFileSize(fileSize: number) {
  if (fileSize < 1024) {
    return `${fileSize} B`;
  }

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

export function getKnowledgeFileExtension(fileName: string) {
  return getFileExtension(fileName);
}

export function inferKnowledgeFileContentType(file: File) {
  return resolveSafeContentType(file, {
    extensionToMimeType,
    fallback: "text/plain",
  });
}

export function sanitizeKnowledgeFileName(fileName: string) {
  return sanitizeStorageFileName(fileName, "knowledge-file");
}

export function deriveKnowledgeTitle(fileName: string) {
  const extension = getKnowledgeFileExtension(fileName);
  const withoutExtension =
    extension && fileName.toLowerCase().endsWith(extension)
      ? fileName.slice(0, -extension.length)
      : fileName;

  return withoutExtension
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function normalizeExtractedKnowledgeText(text: string) {
  return text.replace(/\r\n?/g, "\n").trim();
}

export function getKnowledgeTextPreview(text: string | null, maxLength = 220) {
  if (!text) {
    return null;
  }

  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export function buildBusinessKnowledgeCombinedText(
  faqs: KnowledgeContextFaq[],
  files: KnowledgeContextFile[],
  maxLength = knowledgeContextMaxCharacters,
) {
  const sections: string[] = [];

  if (faqs.length) {
    sections.push(
      [
        "Business FAQs",
        ...faqs.map(
          (faq) => `Q: ${faq.question}\nA: ${faq.answer}`,
        ),
      ].join("\n\n"),
    );
  }

  if (files.length) {
    sections.push(
      [
        "Business Files",
        ...files.map(
          (file) =>
            `${file.title} (${file.fileName})\n${file.extractedText}`,
        ),
      ].join("\n\n"),
    );
  }

  const combinedText = sections.join("\n\n").trim();

  if (!combinedText) {
    return "";
  }

  if (combinedText.length <= maxLength) {
    return combinedText;
  }

  return `${combinedText.slice(0, maxLength).trimEnd()}\n\n[Knowledge truncated]`;
}
