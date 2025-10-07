"use client";

import Link from "next/link";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

export default function DivisionCard({
  name,
  count = 0,
  total,               // <<< NEW: total karyawan (opsional)
  align = "left",
  onEdit,
  onDelete,
  onPress,
  href,
  readonly = false,
}) {
  const alignCls = align === "right" ? "text-right items-end" : "text-left items-start";
  const showActions = !readonly && (onEdit || onDelete);
  const clickable = Boolean(onPress || href);

  const content = (
    <div
      onClick={onPress}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : -1}
      className={[
        "relative w-full h-56 md:h-60 lg:h-64",
        "rounded-xl bg-[#0E2A2E] ring-1 ring-black/10 shadow-md",
        "px-6 md:px-7 py-5 md:py-6 flex outline-none",
        clickable ? "cursor-pointer hover:brightness-[1.07] transition" : "",
        clickable ? "focus:ring-2 focus:ring-[#E7B97A]/50 focus:ring-offset-2 focus:ring-offset-[#0E2A2E]" : "",
      ].join(" ")}
    >
      {showActions && (
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              title="Edit"
              className="size-7 grid place-items-center rounded-full bg-[#1F6FD6] text-white hover:opacity-90 shadow"
            >
              <EditOutlined className="text-[13px]" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              title="Hapus"
              className="size-7 grid place-items-center rounded-full bg-[#E74C3C] text-white hover:opacity-90 shadow"
            >
              <DeleteOutlined className="text-[13px]" />
            </button>
          )}
        </div>
      )}

      <div className={`flex flex-col justify-center ${alignCls} w-full`}>
        <h3 className="text-xl md:text-2xl font-extrabold tracking-[0.22em] text-[#E7B97A]">
          {name?.toUpperCase()}
        </h3>
        <p className="text-xs md:text-sm text-[#E7B97A]/90 mt-2 tracking-wide">
          {typeof total === "number" ? `${count} / ${total} KARYAWAN` : `${count} KARYAWAN`}
        </p>
      </div>
    </div>
  );

  // Jika href ada, bungkus dengan Link agar navigasi di-handle Next.js
  return href ? <Link href={href}>{content}</Link> : content;
}
