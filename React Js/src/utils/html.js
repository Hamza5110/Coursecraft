import DOMPurify from "isomorphic-dompurify";

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "blockquote",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "a",
    "pre",
    "code",
    "span",
    "sub",
    "sup",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "class", "name"],
  ALLOW_DATA_ATTR: false,
};

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

export function sanitizeHtml(value = "") {
  return DOMPurify.sanitize(String(value), PURIFY_CONFIG);
}

/** Legacy plain text → simple paragraph HTML for the editor. */
export function toEditorHtml(value = "") {
  const raw = String(value);
  if (!raw.trim()) return "";
  if (/<[a-z][\s\S]*>/i.test(raw)) return sanitizeHtml(raw);
  return sanitizeHtml(
    `<p>${raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>")}</p>`,
  );
}
