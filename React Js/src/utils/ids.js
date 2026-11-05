export function isSameId(a, b) {
  if (a == null || b == null) return false;
  const left = typeof a === "object" ? a._id || a.id : a;
  const right = typeof b === "object" ? b._id || b.id : b;
  return String(left) === String(right);
}

export function isSafeHttpUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(String(value));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
