"use client";

import Link from "next/link";
import { Input, Select } from "antd";

const BRAND = "#003A6F";

function getPhotoUrl(row) {
  return (
    row?.photo ||
    row?.foto_profil_user ||
    row?.avatarUrl ||
    row?.foto ||
    row?.foto_url ||
    row?.photoUrl ||
    row?.avatar ||
    row?.gambar ||
    null
  );
}

function CircleImg({ src, size = 36, alt = "Foto" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || "/avatar-placeholder.jpg"}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        objectFit: "cover",
        border: `1px solid ${BRAND}22`,
        background: "#E6F0FA",
        display: "inline-block",
      }}
      onError={(e) => {
        e.currentTarget.src = "/avatar-placeholder.jpg";
        e.currentTarget.onerror = null;
      }}
    />
  );
}

/** Item karyawan */
function PerfRow({ userId, name, division, jobTitle, photo, time }) {
  const photoUrl = getPhotoUrl({ photo });
  const subtitle =
    jobTitle && division ? `${jobTitle} | ${division}` : (jobTitle || division || "—");

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-none">
      <div className="flex items-center gap-3 min-w-0">
        <CircleImg src={photoUrl} alt={name || "Foto"} />
        <div className="min-w-0">
          <Link href={`/home/kelola_karyawan/karyawan/${userId}`} className="no-underline">
            <div className="text-sm font-medium text-slate-800 truncate">{name}</div>
          </Link>
          <div className="text-xs text-slate-500 truncate">{subtitle}</div>
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
  rows,
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
              tab === t.key ? "bg-[#003A6F] !text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
