"use client";

import React from "react";

const BRAND = "#003A6F";

function RowLate({ r }) {
  return (
    <div className="grid grid-cols-12 items-center py-3 border-b last:border-none border-slate-100">
      <div className="col-span-1 text-sm text-slate-500">{r.rank}</div>
      <div className="col-span-6">
        <div className="text-sm font-medium text-slate-800">{r.name}</div>
        <div className="text-xs text-slate-500">{r.division}</div>
      </div>
      <div className="col-span-2 text-sm font-semibold">{r.count}</div>
      <div className="col-span-3 text-right text-sm">{r.duration}</div>
    </div>
  );
}

function RowDiscipline({ r }) {
  return (
    <div className="grid grid-cols-12 items-center py-3 border-b last:border-none border-slate-100">
      <div className="col-span-1 text-sm text-slate-500">{r.rank}</div>
      <div className="col-span-8">
        <div className="text-sm font-medium text-slate-800">{r.name}</div>
        <div className="text-xs text-slate-500">{r.division}</div>
      </div>
      <div className="col-span-3 text-right text-sm font-semibold">{r.score}</div>
    </div>
  );
}

/**
 * props:
 * - period: "this" | "last"
 * - setPeriod: fn
 * - leftRows: array
 * - rightRows: array
 */
export default function Top5Section({
  period = "this",
  setPeriod = () => {},
  leftRows = [],
  rightRows = [],
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      {/* Toolbar: Satu filter untuk dua kartu */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setPeriod("last")}
          className="px-4 py-2 rounded-md border text-sm"
          style={{
            borderColor: period === "last" ? BRAND : "#e2e8f0",
            background: period === "last" ? `${BRAND}10` : "#f8fafc",
            color: period === "last" ? BRAND : "#0f172a",
          }}
        >
          Bulan Lalu
        </button>

        <button
          onClick={() => setPeriod("this")}
          className="px-4 py-2 rounded-md text-sm"
          style={{
            background: period === "this" ? BRAND : "#f8fafc",
            color: period === "this" ? "#fff" : "#0f172a",
            border: `1px solid ${period === "this" ? BRAND : "#e2e8f0"}`,
          }}
        >
          Bulan Ini
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Kartu Kiri */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl shadow-sm p-4">
          <div className="text-sm font-medium text-slate-800 mb-3">
            Top 5 Karyawan Paling Sering Terlambat
          </div>

          <div className="grid grid-cols-12 text-[11px] text-slate-400 px-1 mb-2">
            <div className="col-span-1">No</div>
            <div className="col-span-6">Nama Karyawan</div>
            <div className="col-span-2">Jumlah Terlambat</div>
            <div className="col-span-3 text-right">Total Durasi Terlambat</div>
          </div>

          <div className="bg-[#FAFAFB] rounded-xl p-2">
            {leftRows.map((r) => (
              <RowLate key={`late-${r.rank}-${r.userId || r.name}`} r={r} />
            ))}
          </div>
        </div>

        {/* Kartu Kanan */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl shadow-sm p-4">
          <div className="text-sm font-medium text-slate-800 mb-3">
            Top 5 Karyawan Paling Disiplin
          </div>

          <div className="grid grid-cols-12 text-[11px] text-slate-400 px-1 mb-2">
            <div className="col-span-1">No</div>
            <div className="col-span-8">Nama Karyawan</div>
            <div className="col-span-3 text-right">Skor</div>
          </div>

          <div className="bg-[#FAFAFB] rounded-xl p-2">
            {rightRows.map((r) => (
              <RowDiscipline key={`disc-${r.rank}-${r.userId || r.name}`} r={r} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
