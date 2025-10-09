"use client";

import { Input, Select } from "antd";

/** Item kecil untuk setiap karyawan pada Performa Kehadiran */
function PerfRow({ name, division, time }) {
  const initials = (name || "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-none">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
          {initials}
        </div>
        <div>
          <div className="text-sm font-medium text-slate-800">{name}</div>
          <div className="text-xs text-slate-500">{division}</div>
        </div>
      </div>
      <span className="text-[11px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">
        {time ?? "—"}
      </span>
    </div>
  );
}

export default function PerformanceSection({
  tabs,
  tab, setTab,
  date, setDate,
  division, setDivision, divisionOptions,
  q, setQ,
  rows, // ← dari VM, bisa kosong ([])
}) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 px-2 text-sm"
        />
        <Select
          size="middle"
          value={division}
          onChange={(v) => setDivision(v)}
          options={divisionOptions}
          className="[&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-slate-200 min-w-[160px]"
        />
        <Input.Search
          placeholder="Cari"
          allowClear
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-[220px]"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 h-9 rounded-xl text-sm font-medium ${
              tab === t.key
                ? "bg-[#003A6F] !text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {safeRows.length === 0 ? (
          <div className="text-sm text-slate-500">Tidak ada data.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="divide-y divide-slate-100 bg-[#FAFAFB] rounded-xl p-3">
              {safeRows.slice(0, Math.ceil(safeRows.length / 2)).map((r, idx) => (
                <PerfRow key={r.id || `${r.userId}-${idx}`} {...r} />
              ))}
            </div>
            <div className="divide-y divide-slate-100 bg-[#FAFAFB] rounded-xl p-3">
              {safeRows.slice(Math.ceil(safeRows.length / 2)).map((r, idx) => (
                <PerfRow key={r.id || `${r.userId}-${idx}-2`} {...r} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
