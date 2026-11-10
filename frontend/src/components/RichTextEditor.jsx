import { useMemo } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { toEditorHtml } from "../utils/html";

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote", "code-block"],
  ["link"],
  [{ align: [] }],
  ["clean"],
];

const FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "blockquote",
  "code-block",
  "link",
  "align",
];

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Write something…",
  minHeightClass = "min-h-[180px]",
}) {
  const modules = useMemo(
    () => ({
      toolbar: TOOLBAR,
      clipboard: { matchVisual: false },
    }),
    [],
  );

  return (
    <div className={`quill-wrap mb-4 ${minHeightClass}`}>
      <ReactQuill
        theme="snow"
        value={toEditorHtml(value)}
        onChange={(html) => onChange?.(html)}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
      />
    </div>
  );
}
