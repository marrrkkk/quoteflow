type FileLike = {
  name: string;
  type?: string | null;
};

type AcceptedFileTypeOptions = {
  allowedExtensions: readonly string[];
  allowedMimeTypes?: readonly string[];
};

type ResolveSafeContentTypeOptions = {
  extensionToMimeType?: Readonly<Record<string, string>>;
  allowedMimeTypes?: readonly string[];
  fallback?: string;
};

function normalizeMimeType(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function getFileExtension(fileName: string) {
  const normalizedFileName = fileName.toLowerCase();
  const lastDotIndex = normalizedFileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return normalizedFileName.slice(lastDotIndex);
}

export function sanitizeStorageFileName(fileName: string, fallback = "file") {
  const normalized = fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return normalized.slice(0, 120) || fallback;
}

export function isAcceptedFileType(
  file: FileLike,
  { allowedExtensions, allowedMimeTypes = [] }: AcceptedFileTypeOptions,
) {
  const extension = getFileExtension(file.name);

  if (!allowedExtensions.some((allowedExtension) => allowedExtension === extension)) {
    return false;
  }

  const normalizedMimeType = normalizeMimeType(file.type);

  if (!normalizedMimeType || normalizedMimeType === "application/octet-stream") {
    return true;
  }

  return allowedMimeTypes.some(
    (allowedMimeType) => normalizeMimeType(allowedMimeType) === normalizedMimeType,
  );
}

export function resolveSafeContentType(
  file: FileLike,
  {
    extensionToMimeType = {},
    allowedMimeTypes = [],
    fallback = "application/octet-stream",
  }: ResolveSafeContentTypeOptions = {},
) {
  const extension = getFileExtension(file.name);
  const mappedContentType = extensionToMimeType[extension];

  if (mappedContentType) {
    return mappedContentType;
  }

  const normalizedMimeType = normalizeMimeType(file.type);

  if (
    normalizedMimeType &&
    allowedMimeTypes.some(
      (allowedMimeType) => normalizeMimeType(allowedMimeType) === normalizedMimeType,
    )
  ) {
    return normalizedMimeType;
  }

  return fallback;
}

export function buildContentDisposition(
  fileName: string,
  dispositionType: "attachment" | "inline" = "attachment",
) {
  const fallbackFileName = sanitizeStorageFileName(fileName, "download");
  const encodedFileName = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  return `${dispositionType}; filename="${fallbackFileName}"; filename*=UTF-8''${encodedFileName}`;
}
