/** Strip tags for plain-text previews / emptiness checks. */
export function stripHtml(html = "") {
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function isEmptyHtml(html = "") {
  return stripHtml(html).length === 0;
}

/** Legacy plain text → simple paragraph HTML for the editor. */
export function toEditorHtml(value = "") {
  const raw = String(value);
  if (!raw.trim()) return "";
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  return `<p>${raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")}</p>`;
}
