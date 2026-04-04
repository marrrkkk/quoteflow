export const publicSlugMaxLength = 64;
export const generatedPublicSlugMaxLength = 48;
export const publicSlugPattern = "[a-z0-9-]+";
export const publicSlugRegex = /^[a-z0-9-]+$/;

const slugAlphabet = "abcdefghijklmnopqrstuvwxyz0123456789";

export function normalizePublicSlugInput(value: string) {
  return value.trim().toLowerCase();
}

export function slugifyPublicName(
  value: string,
  {
    fallback = "item",
    maxLength = generatedPublicSlugMaxLength,
  }: {
    fallback?: string;
    maxLength?: number;
  } = {},
) {
  const normalized = normalizePublicSlugInput(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

export function createRandomSlugSuffix(length = 5) {
  const values = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(values, (value) => slugAlphabet[value % slugAlphabet.length]).join(
    "",
  );
}

export function appendRandomSlugSuffix(
  baseSlug: string,
  {
    fallback = "item",
    maxLength = publicSlugMaxLength,
    suffixLength = 5,
  }: {
    fallback?: string;
    maxLength?: number;
    suffixLength?: number;
  } = {},
) {
  const suffix = createRandomSlugSuffix(suffixLength);
  const maxBaseLength = Math.max(1, maxLength - suffix.length - 1);
  const trimmedBase = baseSlug
    .slice(0, maxBaseLength)
    .replace(/^-+|-+$/g, "");

  return `${trimmedBase || fallback}-${suffix}`;
}
