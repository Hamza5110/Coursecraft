import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
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
];

const ALLOWED_ATTRIBUTES = {
  a: ["href", "target", "rel", "name"],
  span: ["class"],
  code: ["class"],
  pre: ["class"],
};

/**
 * Sanitize rich-text HTML before persisting or returning to clients.
 */
export function sanitizeContent(html = "") {
  return sanitizeHtml(String(html), {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      }),
    },
  });
}
