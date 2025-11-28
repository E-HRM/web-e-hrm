'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef, useEffect } from 'react';
// Pindahkan import CSS ke layout.jsx jika memungkinkan, tapi tidak apa di sini
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill');
    return ({ forwardedRef, ...props }) => (
      <RQ
        ref={forwardedRef}
        {...props}
      />
    );
  },
  {
    ssr: false,
    loading: () => (
      <div className="p-4 bg-slate-50 text-slate-400">Memuat editor...</div>
    ),
  }
);

/* --- TOOLBARS CONFIG (Sama seperti sebelumnya) --- */
const TOOLBARS = {
  mini: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
  email: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link', 'blockquote'],
    ['clean'],
  ],
  full: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['link', 'blockquote', 'code-block'],
    ['clean'],
  ],
  agenda: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link'],
    ['clean'],
  ],
};

export const normalizeRichText = (value) => {
  if (value === undefined || value === null) return '';
  const str = typeof value === 'string' ? value : String(value);
  const trimmed = str.trim();
  if (!trimmed || trimmed === '<p><br></p>' || trimmed === '<p></p>') return '';
  return trimmed
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<br\s*\/?>\s*<br\s*\/?>/g, '<br>')
    .trim();
};

export const isQuillEmpty = (html) => {
  if (!html) return true;
  const stripped = String(html)
    .replace(/<p><br><\/p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
  return stripped.length === 0;
};

export default function HtmlEditor({
  value,
  onChange,
  placeholder = 'Tulis konten…',
  variant = 'agenda',
  toolbar,
  readOnly = false,
  className = '',
  style,
  minHeight = 200,
}) {
  const quillRef = useRef(null);

  // 1. Memoize modules agar tidak re-render toolbar setiap ketikan
  const modules = useMemo(
    () => ({
      toolbar: readOnly ? false : toolbar ?? TOOLBARS[variant] ?? TOOLBARS.agenda,
      clipboard: { matchVisual: false },
      history: { delay: 1000, maxStack: 100, userOnly: true },
    }),
    [toolbar, variant, readOnly]
  );

  const formats = [
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'indent',
    'link',
    'blockquote',
    'code-block',
    'align',
  ];

  // 2. Cegah loop update yang tidak perlu
  // React Quill kadang "cerewet" jika parent mengirim ulang value yang sama persis
  const safeValue = useMemo(() => {
    return value || '';
  }, [value]);

  return (
    <div
      className={`html-editor-wrapper ${className}`}
      style={style}
    >
      <ReactQuill
        forwardedRef={quillRef}
        theme="snow"
        value={safeValue} // KEMBALI KE CONTROLLED VALUE
        onChange={(content, delta, source, editor) => {
          // Hanya trigger onChange jika user yang mengetik
          if (source === 'user') {
            onChange?.(content);
          }
        }}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{ minHeight }}
      />

      <style
        jsx
        global
      >{`
        .html-editor-wrapper .ql-container {
          min-height: ${minHeight}px;
          font-size: 14px;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        .html-editor-wrapper .ql-toolbar {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          background-color: #f8fafc;
        }
        .html-editor-wrapper .ql-editor {
          min-height: ${minHeight}px;
        }
      `}</style>
    </div>
  );
}
