"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill/dist/quill.snow.css"; // style dasar Quill

// ReactQuill hanya dirender di client
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <div style={{ padding: 8 }}>Memuat editor…</div>,
});

/* ===== Preset toolbar praktis ===== */
const TOOLBARS = {
  mini: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
  email: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link", "blockquote", "code"],
    ["clean"],
  ],
  full: [
    [{ font: [] }, { header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike", "blockquote", "code-block"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    [{ align: [] }, { direction: "rtl" }],
    ["link", "image", "video"],
    ["clean"],
  ],
};

/* ===== Helper: normalisasi rich text kosong ===== */
// Dipakai di Form AntD: <Form.Item getValueFromEvent={normalizeRichText} />
export function normalizeRichText(value) {
  const str = typeof value === "string" ? value.trim() : "";
  if (!str) return "";
  if (str === "<p><br></p>") return "";
  return value || "";
}

/* ===== Helper opsional: cek kosong ===== */
export function isQuillEmpty(html) {
  if (!html) return true;
  const stripped = String(html)
    .replace(/<p><br><\/p>/gi, "")
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
  return stripped.length === 0;
}

/* ===== Komponen utama ===== */

export default function HtmlEditor({
  value,
  onChange,
  placeholder = "Tulis konten…",
  variant = "email", // "mini" | "email" | "full"
  toolbar, // override manual: array toolbar Quill
  readOnly = false,
  className,
  style,
  minHeight = 200,
}) {
  // modules / toolbar Quill
  const modules = useMemo(
  () => ({
    // kalau readOnly: hilangkan toolbar
    toolbar: readOnly
      ? false
      : toolbar ?? TOOLBARS[variant] ?? TOOLBARS.email,
    clipboard: { matchVisual: false },
  }),
  [toolbar, variant, readOnly]
);

  // format yang diizinkan
  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "code",
    "code-block",
    "color",
    "background",
    "script",
    "list",
    "bullet",
    "indent",
    "align",
    "direction",
    "link",
    "image",
    "video",
  ];

  return (
    <div className={className} style={style}>
      <ReactQuill
        theme="snow"
        value={value || ""} // selalu string
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{ minHeight }}
      />
    </div>
  );
}
