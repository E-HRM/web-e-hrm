"use client";

import { Select } from "antd";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  Cell,
} from "recharts";
import useDashboardViewModel from "./useDashboardViewModel";

/* ---------- Mini Avatar ---------- */
function Avatar({ name = "", bg = "#E5E7EB" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="h-9 w-9 flex items-center justify-center rounded-full text-xs font-semibold"
      style={{ background: bg }}
    >
      <span className="text-gray-700">{initials}</span>
    </div>
  );
}

/* ---------- Calendar (static) ---------- */
function MiniCalendar() {
  const year = 2025;
  const monthIndex = 8; // September
  const first = new Date(year, monthIndex, 1);
  const startOffset = (first.getDay() + 6) % 7; // Senin=0
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = Array.from({ length: startOffset + daysInMonth }, (_, i) =>
    i < startOffset ? null : i - startOffset + 1
  );
  const eventMap = {
    3: "bg-emerald-500",
    6: "bg-rose-500",
    7: "bg-fuchsia-500",
    14: "bg-rose-500",
    17: "bg-violet-500",
    18: "bg-emerald-500",
    19: "bg-emerald-500",
    20: "bg-violet-500",
    21: "bg-fuchsia-500",
    23: "bg-emerald-500",
  };

  return (
    <div className="rounded-2xl bg-[#F2F8FF] p-3 h-full">
      <div className="flex items-center justify-between">
        <button className="h-7 w-7 rounded-md hover:bg-white/70 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M15.4 7.4L14 6l-6 6 6 6 1.4-1.4L10.8 12z" />
          </svg>
        </button>
        <div className="text-sm font-semibold text-gray-800">September 2025</div>
        <button className="h-7 w-7 rounded-md hover:bg-white/70 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M8.6 16.6L10 18l6-6-6-6-1.4 1.4L13.2 12z" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-2 mt-2 text-[11px] font-medium">
        {["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"].map((d, i) => (
          <div
            key={d}
            className={`text-center ${i === 6 ? "text-rose-500" : "text-gray-500"}`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-y-3 text-sm">
        {cells.map((day, idx) => {
          const hasEvent = !!(day && eventMap[day]);
          const is17 = day === 17;
          return (
            <div key={idx} className="h-10 relative group">
              {day ? (
                <>
                  <div
                    className={`mx-auto h-7 w-7 flex items-center justify-center rounded-full ${
                      is17 ? "bg-violet-100 text-violet-700" : ""
                    } text-gray-700`}
                  >
                    {day}
                  </div>
                  {hasEvent && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-1 w-14">
                      <span className={`block h-1 rounded-full ${eventMap[day]}`} />
                    </div>
                  )}
                  {is17 && (
                    <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition">
                      <div className="rounded-md bg-black/80 text-white text-[10px] px-2 py-1">
                        1 Karyawan Cuti
                      </div>
                      <div className="mx-auto h-0 w-0 border-x-8 border-x-transparent border-t-8 border-t-black/80" />
                    </div>
                  )}
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardContent() {
  const vm = useDashboardViewModel();

  // palet bar mini (mirip desain)
  const miniColors = ["#D1D5DB", "#F5A524", "#E7B67E", "#E8C39B", "#EEE2CF"];

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-800">Hello, HR!</h1>
          <p className="text-xs text-gray-500">{vm.tanggalTampilan}</p>
        </div>

        {/* ===================== BARIS ATAS (2 CARD) ===================== */}
        <div className="grid grid-cols-12 gap-4">
          {/* === KIRI: Total Karyawan (FULL HEIGHT) === */}
          <div className="col-span-12 md:col-span-7 bg-white rounded-2xl shadow-sm p-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-700">Total Karyawan</p>
              <div className="h-8 w-8 rounded-full bg-[#F4F1FB] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#7C5CFF]" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2c0 .7.5 1.2 1.2 1.2h16.8c.7 0 1.2-.5 1.2-1.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>
            </div>

            {/* atur tinggi isi card, grafik pakai height 100% */}
            <div className="mt-1 grid grid-cols-12 gap-6 h-[260px]">
              {/* angka besar di kiri, dipusatkan vertikal */}
              <div className="col-span-3 flex">
                <div className="m-auto text-5xl font-semibold text-gray-800 leading-none">
                  {vm.totalKaryawan}
                </div>
              </div>

              {/* grafik mengambil seluruh tinggi kolom */}
              <div className="col-span-9">
                <div className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={vm.miniBars}
                      barCategoryGap={24}
                      barSize={28}
                      margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} stroke="#EFF2F6" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        interval={0}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 11, fill: "#6B7280" }}
                      />
                      <YAxis hide domain={[0, "dataMax + 20"]} />
                      <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                        {vm.miniBars.map((_, i) => (
                          <Cell key={i} fill={["#D1D5DB", "#F5A524", "#E7B67E", "#E8C39B", "#EEE2CF"][i % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>


          {/* === KANAN: Calendar Card === */}
          <div className="col-span-12 md:col-span-5 bg-white rounded-2xl shadow-sm p-4">
            <MiniCalendar />
          </div>

          {/* ====== STAT CARDS (8 kartu) ====== */}
          <div className="col-span-12 grid grid-cols-12 gap-4">
            {[
              // row 1
              {
                value: vm.totalKaryawan, label: "Karyawan",
                bg: "bg-indigo-50", ring: "ring-indigo-200/60", text: "text-indigo-600",
                icon: (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z"/>
                  </svg>
                ),
              },
              {
                value: vm.totalDivisi, label: "Divisi",
                bg: "bg-orange-50", ring: "ring-orange-200/60", text: "text-orange-500",
                icon: (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M12 2l8 4v6c0 5-3.5 8-8 10C7.5 20 4 17 4 12V6l8-4zm0 2.2L6 6.7v5.3c0 3.9 2.9 6.6 6 8 3.1-1.4 6-4.1 6-8V6.7l-6-2.5z"/>
                  </svg>
                ),
              },
              {
                value: 4, label: "Lokasi Kehadiran",
                bg: "bg-rose-50", ring: "ring-rose-200/60", text: "text-rose-500",
                icon: (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6zm6 0v12l6 2V8l-6-2z"/>
                  </svg>
                ),
              },
              {
                value: 721, label: "Presensi",
                bg: "bg-slate-50", ring: "ring-slate-200/60", text: "text-slate-600",
                icon: (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                  </svg>
                ),
              },

              // row 2
              {
                value: 2, label: "Admin",
                bg: "bg-emerald-50", ring: "ring-emerald-200/60", text: "text-emerald-600",
                icon: (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 7v-1c0-3 4-5 7-5s7 2 7 5v1H5z"/>
                  </svg>
                ),
              },
              {
                value: 5, label: "Pola Kerja",
                bg: "bg-green-50", ring: "ring-green-200/60", text: "text-green-600",
                icon: (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M7 3h10v2H7V3zm5 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm0 2v5l4 2-.8 1.8L11 13V7h1z"/>
                  </svg>
                ),
              },
              {
                value: 71, label: "Izin",
                bg: "bg-amber-50", ring: "ring-amber-200/60", text: "text-amber-500",
                icon: (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M4 15h6l2 3h8v2H11l-2-3H4v-2zm2-9a3 3 0 1 1 6 0v6H6V6zm9 3h5v7h-5V9z"/>
                  </svg>
                ),
              },
              {
                value: vm.onLeaveCount, label: "Cuti",
                bg: "bg-teal-50", ring: "ring-teal-200/60", text: "text-teal-600",
                icon: (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M3 17h2l2.2-4.4 2.8 4.4H21v2H9.5l-3.3-5.2L4.2 19H3v-2zm6.5-7.5l6-3 .9 1.8-6 3-.9-1.8zm4.3 4.5l4.7-2.3.9 1.8L14.7 16l-.9-1.9zM7 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
                  </svg>
                ),
              },
            ].map((s, idx) => (
              <div key={idx} className="col-span-6 md:col-span-3">
                <div className="h-full rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-4
                                flex items-center gap-3 hover:shadow-md transition">
                  <div className={`h-10 w-10 rounded-xl ring-1 flex items-center justify-center ${s.bg} ${s.ring} ${s.text}`}>
                    {s.icon}
                  </div>
                  <div className="leading-tight">
                    <div className="text-3xl font-semibold text-slate-800">{s.value}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>


          {/* === Chart akumulasi (tidak diubah) === */}
          <div className="col-span-12 bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-gray-700">Akumulasi Keterlambatan</p>
                <Select
                  size="small"
                  value={vm.division}
                  onChange={vm.setDivision}
                  options={vm.divisionOptions}
                  className="[&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-gray-200"
                  style={{ minWidth: 110 }}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>This Week</span>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                  <path d="M12 8l6 6H6l6-6z" />
                </svg>
              </div>
            </div>

            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vm.chartData} barCategoryGap={16}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6B7280" }}
                    tickMargin={8}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    label={{
                      value: "Menit",
                      angle: -90,
                      position: "insideLeft",
                      offset: 8,
                      style: { fill: "#9CA3AF", fontSize: 11 },
                    }}
                    tick={{ fontSize: 10, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RTooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: 8 }} />
                  <Bar dataKey="Kedatangan" name="Kedatangan" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Kepulangan"   name="Kepulangan"   fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            </div>

          {/* Daftar cuti di bawah – tetap */}
          <div className="col-span-12 bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#F4F1FB] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#7C5CFF]" fill="currentColor">
                    <path d="M20 6h-3V4a2 2 0 0 0-4 0v2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-5-2a1 1 0 0 1 2 0v2h-2V4zM7 8h13v2H7V8zm0 4h13v6H7v-6z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700 font-medium">Karyawan Cuti</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4338CA] font-medium">
                {vm.onLeaveCount}/{vm.totalKaryawan}
              </span>
            </div>

            <div className="grid grid-cols-12 text-[11px] text-gray-400 mb-2 px-2">
              <div className="col-span-9">Nama Karyawan</div>
              <div className="col-span-3 text-right">Waktu</div>
            </div>

            <div className="space-y-2">
              {vm.leaveList.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center px-2 py-2 rounded-xl bg-[#FAFAFB]">
                  <div className="col-span-9 flex items-center gap-3">
                    <Avatar name={row.name} bg={row.color} />
                    <span className="text-sm text-gray-700">{row.name}</span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="text-xs text-gray-600">{row.days} Hari</span>
                  </div>
                </div>
              ))}
              <div className="px-2 py-2 text-xs text-gray-400">...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
