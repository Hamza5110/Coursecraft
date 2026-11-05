import { sanitizeHtml, toEditorHtml } from "../utils/html";

/** Renders stored HTML (or legacy plain text) for blog/lesson bodies. */
export default function RichTextContent({ html = "", className = "" }) {
  const content = sanitizeHtml(toEditorHtml(html));

  if (!content) {
    return <p className={`text-gray-500 ${className}`}>No content.</p>;
  }

  return (
    <div
      className={`rich-text leading-relaxed text-gray-700 ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
