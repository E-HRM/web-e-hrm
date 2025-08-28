"use client";

import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

export default function DivisionCard({ name, count = 0, align = "left", onEdit, onDelete }) {
  const alignCls = align === "right" ? "text-right items-end" : "text-left items-start";

  return (
    <div
      className={[
        "relative w-full h-56 md:h-60 lg:h-64",
        "rounded-xl bg-[#0E2A2E] ring-1 ring-black/10 shadow-md",
        "px-6 md:px-7 py-5 md:py-6",
        "flex",
      ].join(" ")}
    >
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <button
          onClick={onEdit}
          title="Edit"
          className="size-7 grid place-items-center rounded-full bg-[#1F6FD6] text-white hover:opacity-90 shadow"
        >
          <EditOutlined className="text-[13px]" />
        </button>
        <button
          onClick={onDelete}
          title="Hapus"
          className="size-7 grid place-items-center rounded-full bg-[#E74C3C] text-white hover:opacity-90 shadow"
        >
          <DeleteOutlined className="text-[13px]" />
        </button>
      </div>

      <div className={`flex flex-col justify-center ${alignCls} w-full`}>
        <h3 className="text-xl md:text-2xl font-extrabold tracking-[0.22em] text-[#E7B97A]">
          {name?.toUpperCase()}
        </h3>
        <p className="text-xs md:text-sm text-[#E7B97A]/90 mt-2 tracking-wide">
          {count} KARYAWAN
        </p>
      </div>
    </div>
  );
}
