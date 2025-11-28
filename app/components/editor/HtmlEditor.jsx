"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <div style={{ padding: 8 }}>Memuat editor…</div>,
});

const TOOLBARS = {
  mini: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
  email: [
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["link", "blockquote"],
    ["clean"],
  ],
  full: [
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["link", "blockquote", "code-block"],
    ["clean"],
  ],
  agenda: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["link"],
    ["clean"],
  ],
};

export const normalizeRichText = (value) => {
  if (value === undefined || value === null) return "";
  const str = typeof value === "string" ? value : String(value);

  const trimmed = str.trim();
  if (!trimmed || trimmed === "<p><br></p>" || trimmed === "<p></p>") {
    return "";
  }

  // jangan sentuh <ul>/<ol>/<li>
  const cleanHtml = trimmed
    .replace(/<p>\s*<\/p>/g, "") // paragraf kosong
    .replace(/<br\s*\/?>\s*<br\s*\/?>/g, "<br>") // <br><br> -> <br>
    .trim();

  return cleanHtml || "";
};

export const isQuillEmpty = (html) => {
  if (!html) return true;

  const stripped = String(html)
    .replace(/<p><br><\/p>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();

  return stripped.length === 0;
};

export default function HtmlEditor({
  value,
  onChange,
  placeholder = "Tulis konten…",
  variant = "agenda",
  toolbar,
  readOnly = false,
  className = "",
  style,
  minHeight = 200,
}) {
  const modules = useMemo(
    () => ({
      toolbar: readOnly ? false : toolbar ?? TOOLBARS[variant] ?? TOOLBARS.agenda,
      clipboard: {
        matchVisual: false,
      },
      history: {
        delay: 1000,
        maxStack: 100,
        userOnly: true,
      },
    }),
    [toolbar, variant, readOnly]
  );

  const formats = [
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "indent",
    "link",
    "blockquote",
    "code-block",
    "align",
  ];

  // ❗ tidak dinormalisasi di sini, biar HTML asli tetap utuh
  const handleChange = (content /*, delta, source, editor */) => {
    onChange?.(content);
  };

  return (
    <div className={`html-editor-wrapper ${className}`} style={style}>
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{ minHeight }}
      />
    </div>
  );
}
