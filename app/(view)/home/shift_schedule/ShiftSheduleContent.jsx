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
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { useMemo, useState } from "react";
import UseShiftScheduleViewModel from "./UseShiftScheduleViewModel";

const GOLD = "#D9A96F";

/* ====================== CELL ====================== */
function Cell({ cell, polaMap, selectedShift, onAssign, onDelete }) {
  const assigned =
    cell?.status === "LIBUR"
      ? { label: "Libur", jam: "" }
      : cell?.polaId
      ? polaMap.get(cell.polaId)
      : null;

  return (
    <div className="p-2">
      {assigned ? (
        <div
          className={`rounded-xl border ${
            cell.status === "LIBUR"
              ? "border-rose-300 bg-rose-50"
              : "border-sky-200 bg-sky-50"
          } p-2`}
        >
          <div className="text-sm font-medium">
            {cell.status === "LIBUR" ? "Libur" : assigned?.nama || "Kerja"}
          </div>
          <div className="text-xs text-slate-500">
            {cell.status === "LIBUR" ? "" : assigned?.jam || ""}
          </div>
          <div className="mt-2 flex gap-1">
            <Tooltip title="Terapkan pilihan jadwal (di atas)">
              <Button
                size="small"
                icon={<EditOutlined />}
                disabled={!selectedShift}
                onClick={() =>
                  selectedShift &&
                  onAssign(cell.userId, cell.date, selectedShift)
                }
              />
            </Tooltip>
            <Tooltip title="Hapus">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(cell.userId, cell.date)}
              />
            </Tooltip>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-3 text-center">
          <Button
            size="small"
            type="primary"
            className="!text-white"
            style={{ backgroundColor: GOLD, borderColor: GOLD }}
            disabled={!selectedShift}
            onClick={() =>
              selectedShift && onAssign(cell.userId, cell.date, selectedShift)
            }
          >
            Terapkan
          </Button>
          <div className="mt-1 text-xs text-slate-500">
            {selectedShift ? "Gunakan pilihan di atas" : "Pilih jadwal di atas"}
          </div>
        </div>
      )}
    </div>
  );
}

/* ====================== PAGE ====================== */
export default function ShiftScheduleContent() {
  const vm = UseShiftScheduleViewModel();
  const [selectedShift, setSelectedShift] = useState(null);

  // opsi jadwal untuk SELECT di toolbar
  const shiftOptions = useMemo(() => {
    const arr = [{ value: "LIBUR", label: "Jadwal Libur" }];
    vm.polaMap.forEach((p, id) => {
      arr.push({ value: id, label: `${p.nama} (${p.jam})` });
    });
    return arr;
  }, [vm.polaMap]);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: GOLD,
          borderRadius: 12,
        },
        components: {
          Button: { borderRadius: 12 },
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

          {/* >>> Pilihan Jadwal dipindahkan ke ATAS tabel <<< */}
          <Select
            value={selectedShift || undefined}
            placeholder="Pilih Jadwal"
            options={shiftOptions}
            onChange={setSelectedShift}
            className="min-w-[240px]"
            allowClear
          />

          <div className="ml-auto flex items-center gap-2">
            <Button
              icon={<ReloadOutlined />}
              onClick={vm.refresh}
              className="hidden md:inline-flex"
            >
              Muat Ulang
            </Button>
            <Button
              icon={<LeftOutlined />}
              onClick={vm.prevWeek}
              className="!bg-emerald-600 !text-white hover:!bg-emerald-700"
            >
              Minggu sebelumnya
            </Button>
            <Button
              icon={<RightOutlined />}
              onClick={vm.nextWeek}
              className="!bg-emerald-600 !text-white hover:!bg-emerald-700"
            >
              Minggu berikutnya
            </Button>

            <DatePicker
              picker="month"
              value={dayjs(vm.weekStart)}
              onChange={(d) => d && vm.setMonthYear(d.year(), d.month())}
            />
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-slate-500 mb-3">
          * Jadwal mengisi tanggal per hari pada rentang minggu{" "}
          {dayjs(vm.weekStart).format("DD MMM")} -{" "}
          {dayjs(vm.weekEnd).format("DD MMM YYYY")}. Centang
          <span className="mx-1 font-semibold">“Ulang tiap minggu”</span>
          untuk menduplikasi ke minggu berikutnya.
        </div>

        {/* Grid */}
        <div className="overflow-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-[1200px] w-full">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr>
                <th className="text-left px-4 py-3 w-[320px]">Nama</th>
                {vm.days.map((d) => (
                  <th key={d.key} className="text-left px-3 py-3 w-[220px]">
                    <div className="font-semibold">
                      {d.labelDay}, {d.labelDate}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vm.rows.map((r) => (
                <tr key={r.id} className="border-t">
                  {/* left user column */}
                  <td className="align-top">
                    <div className="p-3">
                      <div className="font-semibold text-slate-800">
                        {r.name}
                      </div>
                      <div className="text-xs text-slate-500">{r.email}</div>

                      <label className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          className="accent-emerald-600"
                          checked={!!vm.repeatFlags[r.id]}
                          onChange={(e) =>
                            vm.setRepeatFlag(r.id, e.target.checked)
                          }
                        />
                        Ulang jadwal ini tiap minggu
                      </label>
                      {vm.repeatFlags[r.id] && (
                        <div className="mt-2 flex items-center gap-2">
                          <DatePicker
                            placeholder="Sampai tanggal"
                            value={
                              vm.repeatUntil[r.id]
                                ? dayjs(vm.repeatUntil[r.id])
                                : null
                            }
                            onChange={(d) =>
                              vm.setRepeatUntil(r.id, d ? d.toDate() : null)
                            }
                          />
                          <Button
                            size="small"
                            type="primary"
                            className="!text-white"
                            style={{ backgroundColor: GOLD, borderColor: GOLD }}
                            onClick={() => vm.applyRepeat(r.id)}
                          >
                            Terapkan
                          </Button>
                        </div>
                      )}

                      {/* ringkas minggu ini */}
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
                    <td key={d.key} className="align-top p-2" style={{ verticalAlign: 'top' }}>
                      <Cell
                        cell={cell}
                        polaMap={vm.polaMap}
                        selectedShift={selectedShift}
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

        {/* Legend */}
        <div className="mt-3 flex items-center gap-2">
          <Tag color="green">KERJA</Tag>
          <Tag color="magenta">LIBUR</Tag>
        </div>

        {/* Mass actions (placeholder) */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button icon={<PlusOutlined />}>Ulang Jadwal Massal</Button>
          <Button>Impor Excel</Button>
          <Button>Ekspor Excel</Button>
        </div>
      </div>
    </ConfigProvider>
  );
}
