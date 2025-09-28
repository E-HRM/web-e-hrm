"use client";

import {
  ConfigProvider,
  Button,
  Select,
  DatePicker,
  Tooltip,
  Tag,
  theme,
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { useMemo } from "react";
import UseShiftScheduleViewModel from "./UseShiftScheduleViewModel";

dayjs.locale("id");

/** Palet biru konsisten dengan sidebar */
const BRAND_BLUE = "#004A9F";
const BRAND_BLUE_HOVER = "#0B63C7";   // hover lebih terang
const BRAND_BLUE_ACTIVE = "#003A80";  // active lebih gelap
const HEADER_BLUE_BG = "#F0F6FF";     // header table lembut

/* ===== CELL ===== */
function Cell({ cell, polaMap, onAssign, onDelete }) {
  const value = cell
    ? cell.status === "LIBUR"
      ? "LIBUR"
      : cell.polaId || undefined
    : undefined;

  const options = useMemo(() => {
    const arr = [{ value: "LIBUR", label: "Libur — (tidak bekerja)" }];
    polaMap.forEach((p, id) => {
      arr.push({ value: id, label: `${p.nama} (${p.jam})` });
    });
    return arr;
  }, [polaMap]);

  return (
    <div className="p-2">
      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="text-xs mb-1 text-slate-500">Pilih jadwal</div>
        <Select
          className="w-full"
          placeholder="— Pilih jadwal —"
          value={value}
          options={options}
          onChange={(val) => onAssign(cell.userId, cell.date, val)}
          allowClear
          onClear={() => onDelete(cell.userId, cell.date)}
          dropdownMatchSelectWidth={320}
          showSearch
          optionFilterProp="label"
        />
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <div>
            {value === "LIBUR"
              ? "Libur"
              : value
              ? (() => {
                  const p = polaMap.get(value);
                  return p ? `${p.nama} • ${p.jam}` : "Kerja";
                })()
              : "Belum diatur"}
          </div>
          {cell?.rawId && (
            <Tooltip title="Hapus jadwal tanggal ini">
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(cell.userId, cell.date)}
              />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== PAGE ===== */
export default function ShiftScheduleContent() {
  const vm = UseShiftScheduleViewModel();

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: BRAND_BLUE,
          colorPrimaryHover: BRAND_BLUE_HOVER,
          colorPrimaryActive: BRAND_BLUE_ACTIVE,
          borderRadius: 12,
          colorLink: BRAND_BLUE,
          colorLinkHover: BRAND_BLUE_HOVER,
          colorLinkActive: BRAND_BLUE_ACTIVE,
        },
        components: {
          Button: {
            borderRadius: 12,
            primaryShadow: "0 0 0 2px rgba(0,74,159,0.15)",
            colorPrimary: BRAND_BLUE,
            colorPrimaryHover: BRAND_BLUE_HOVER,
            colorPrimaryActive: BRAND_BLUE_ACTIVE,
          },
          Select: {
            activeBorderColor: BRAND_BLUE,
            hoverBorderColor: BRAND_BLUE,
            optionSelectedBg: "#E6F3FF",
            optionSelectedColor: BRAND_BLUE_ACTIVE,
          },
          DatePicker: {
            activeBorderColor: BRAND_BLUE,
            hoverBorderColor: BRAND_BLUE,
          },
        },
      }}
    >
      <div className="p-6">
        {/* Toolbar */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Select
            value={vm.deptId || undefined}
            placeholder="Semua Tim/Divisi"
            options={vm.deptOptions}
            onChange={vm.setDeptId}
            className="min-w-[220px]"
            allowClear
          />

          {/* Filter Bulan & Tahun */}
          <Select
            className="min-w-[160px]"
            value={vm.currentMonthIdx}
            onChange={(m) => vm.setMonthYear(vm.currentYear, m)}
            options={vm.monthOptions}
          />
          <Select
            className="min-w-[120px]"
            value={vm.currentYear}
            onChange={(y) => vm.setMonthYear(y, vm.currentMonthIdx)}
            options={vm.yearOptions}
          />

          <div className="ml-auto flex items-center gap-2">
            <Button icon={<ReloadOutlined />} onClick={vm.refresh} className="hidden md:inline-flex">
              Muat Ulang
            </Button>

            {/* Tombol navigasi minggu sekarang pakai primary biru */}
            <Button type="primary" icon={<LeftOutlined />} onClick={vm.prevWeek}>
              Minggu sebelumnya
            </Button>
            <Button type="primary" icon={<RightOutlined />} onClick={vm.nextWeek}>
              Minggu berikutnya
            </Button>

            <DatePicker
              picker="month"
              value={dayjs(vm.weekStart)}
              onChange={(d) => d && vm.setMonthYear(d.year(), d.month())}
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 mb-3">
          * Centang “Ulang jadwal ini tiap minggu” → sistem menyalin pola minggu ini hingga akhir bulan.
        </div>

        {/* Card pembungkus tabel */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl">
          {/* Scroll container */}
          <div className="overflow-auto">
            <table className="min-w-[1200px] w-full">
              <thead className="sticky top-0 z-10" style={{ background: HEADER_BLUE_BG }}>
                <tr>
                  {/* Sticky kolom nama — tanpa shadow, pakai border-right agar sejajar dengan body */}
                  <th
                    className="text-left px-4 py-3 w-[320px] sticky left-0 z-20 border-r border-slate-200 bg-[--tbl-header-bg]"
                    style={{ background: HEADER_BLUE_BG }}
                  >
                    Nama
                  </th>
                  {vm.days.map((d) => (
                    <th key={d.key} className="text-left px-3 py-3 w-[240px]">
                      <div className="font-semibold text-slate-800">
                        {d.labelDay}, {d.labelDate}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {vm.rows.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-[#F8FAFF]"} hover:bg-[#E6F3FF] transition-colors`}
                    style={{ transitionDuration: "150ms" }}
                  >
                    {/* Sticky cell nama — border-right yang sama dengan header */}
                    <td className="align-top sticky left-0 bg-inherit z-10 border-r border-slate-200">
                      <div className="p-3">
                        <div className="font-semibold text-slate-800">{r.name}</div>
                        <div className="text-xs text-slate-500">{r.email}</div>

                        <label className="mt-3 flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            className="accent-[#004A9F]"
                            onChange={(e) => vm.toggleRepeatSchedule(r.id, e.target.checked)}
                          />
                          Ulang jadwal ini tiap minggu (sampai akhir bulan)
                        </label>

                        {/* Ringkasan kecil */}
                        <div className="mt-3 space-y-1">
                          {vm.days.map((d) => {
                            const c = vm.getCell(r.id, d.dateStr);
                            let label = "—";
                            if (c?.status === "LIBUR") label = "Libur";
                            else if (c?.polaId) {
                              const p = vm.polaMap.get(c.polaId);
                              label = p ? `${p.nama} ${p.jam}` : "Kerja";
                            }
                            return (
                              <div key={d.key} className="text-xs text-slate-500">
                                {d.short}: {label}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>

                    {vm.days.map((d) => {
                      const cell = vm.getCell(r.id, d.dateStr) || { userId: r.id, date: d.dateStr };
                      return (
                        <td key={d.key} className="align-top p-2">
                          <Cell
                            cell={cell}
                            polaMap={vm.polaMap}
                            onAssign={vm.assignCell}
                            onDelete={vm.deleteCell}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* legend + padding bawah */}
          <div className="px-4 py-3 border-t rounded-b-2xl flex items-center gap-2" style={{ background: HEADER_BLUE_BG }}>
            <Tag color="blue">KERJA</Tag>
            <Tag color="geekblue">LIBUR</Tag>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
