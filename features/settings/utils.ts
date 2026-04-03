import type { WorkspaceAiTonePreference } from "@/features/settings/types";
import { sanitizeStorageFileName } from "@/lib/files";

export const workspaceLogoBucket = "workspace-assets";
export const workspaceLogoMaxSize = 2 * 1024 * 1024;
export const workspaceCurrencyOptions = [
  "USD",
  "CAD",
  "EUR",
  "GBP",
  "AUD",
] as const;
export const workspaceLogoAllowedExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const;
export const workspaceLogoAllowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const workspaceLogoExtensionToMimeType: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
export const workspaceLogoAccept = [
  ...workspaceLogoAllowedExtensions,
  ...workspaceLogoAllowedMimeTypes,
].join(",");

export function normalizeWorkspaceSlug(value: string) {
  return value.trim().toLowerCase();
}

export function sanitizeWorkspaceLogoFileName(fileName: string) {
  return sanitizeStorageFileName(fileName, "workspace-logo");
}

export function formatWorkspaceAiToneLabel(value: WorkspaceAiTonePreference) {
  switch (value) {
    case "balanced":
      return "Balanced";
    case "warm":
      return "Warm";
    case "direct":
      return "Direct";
    case "formal":
      return "Formal";
  }
}

export function getWorkspacePublicInquiryUrl(slug: string) {
  return `/inquire/${slug}`;
}
