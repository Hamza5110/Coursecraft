import { sanitizeContent } from "./sanitize.js";

/** Build a plain-text excerpt from HTML content. */
export function buildExcerpt(html = "", maxLen = 160) {
  const clean = sanitizeContent(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen).trimEnd()}…`;
}
