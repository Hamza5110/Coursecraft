/**
 * Allow only http(s) absolute URLs or paths under /uploads/.
 */
export function isSafeMediaUrl(value) {
  if (value == null || value === "") return true;
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return true;

  if (trimmed.startsWith("/uploads/")) {
    return !trimmed.includes("..") && !trimmed.includes("\\");
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isSafeVideoUrl(value) {
  return isSafeMediaUrl(value);
}

export function assertSafeMediaUrl(value, fieldName = "URL") {
  if (!isSafeMediaUrl(value)) {
    const err = new Error(`${fieldName} must be http(s) or an /uploads/ path`);
    err.statusCode = 400;
    throw err;
  }
  return typeof value === "string" ? value.trim() : "";
}
