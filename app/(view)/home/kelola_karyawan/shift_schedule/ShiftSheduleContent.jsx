"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/id";
import UseShiftScheduleViewModel from "./UseShiftScheduleViewModel";

import { LeftOutlined, RightOutlined, DeleteOutlined } from "@ant-design/icons";

import AppSelect from "../../../component_shared/AppSelect";
import AppDatePicker from "../../../component_shared/AppDatePicker";
import AppTooltip from "../../../component_shared/AppTooltip";
import AppTable from "../../../component_shared/AppTable";
import AppButton from "../../../component_shared/AppButton";
import AppAvatar from "../../../component_shared/AppAvatar";
import AppTypography from "../../../component_shared/AppTypography";

dayjs.locale("id");

function useIsMobile(maxWidth = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const apply = () => setIsMobile(!!mq.matches);

    apply();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }

    mq.addListener(apply);
    return () => mq.removeListener(apply);
  }, [maxWidth]);

  return isMobile;
}

function getPhotoUrl(row) {
  return (
    (row &&
      (row.foto_profil_user ||
        row.avatarUrl ||
        row.foto ||
        row.foto_url ||
        row.photoUrl ||
        row.photo ||
        row.avatar ||
        row.gambar)) ||
    null
  );
}

function isPastDate(dateStr) {
  return dayjs(dateStr).isBefore(dayjs().startOf("day"), "day");
}

const Cell = React.memo(function Cell({
  cell,
  polaMap,
  onAssign,
  onDelete,
  disabled,
  story,
  onToggleStory,
}) {
  const value = cell
    ? cell.status === "LIBUR"
      ? "LIBUR"
      : cell.polaId || undefined
    : undefined;

  const options = useMemo(() => {
    const arr = [{ value: "LIBUR", label: "Libur — (tidak bekerja)" }];
    polaMap.forEach((p, id) => {
      arr.push({ value: String(id), label: `${p.nama} (${p.jam})` });
    });
    return arr;
  }, [polaMap]);

  const safeAssign = (val) => {
    if (disabled) return;
    onAssign(cell.userId, cell.date, val === "LIBUR" ? "LIBUR" : String(val));
  };

  const safeDelete = () => {
    if (disabled) return;
    onDelete(cell.userId, cell.date);
  };

  const checkedStory = !!story;

  return (
    <div className="p-2">
      <div
        className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
        style={disabled ? { opacity: 0.6, pointerEvents: "none" } : undefined}
      >
        <div className="text-xs mb-1 text-slate-500">
          {disabled ? "Jadwal (riwayat)" : "Pilih jadwal"}
        </div>

        <AppSelect
          className="w-full"
          placeholder="— Pilih jadwal —"
          value={value}
          options={options}
          onChange={safeAssign}
          allowClear
          onClear={safeDelete}
          popupMatchSelectWidth={320}
          showSearch
          optionFilterProp="label"
          disabled={disabled}
        />

        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <div>
            {value === "LIBUR"
              ? "Libur"
              : value
              ? (() => {
                  const p = polaMap.get(String(value));
                  return p ? `${p.nama} • ${p.jam}` : "Kerja";
                })()
              : "Belum diatur"}
          </div>

          {cell && cell.rawId && !disabled && (
            <AppTooltip title="Hapus jadwal tanggal ini">
              <span className="inline-flex">
                <AppButton
                  variant="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={safeDelete}
                />
              </span>
            </AppTooltip>
          )}
        </div>

        <label className="mt-2 flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            className="accent-[#004A9F]"
            disabled={disabled}
            checked={checkedStory}
            onChange={(e) => {
              if (!onToggleStory) return;
              onToggleStory(e.target.checked);
            }}
          />
          Story Planner
        </label>
      </div>
    </div>
  );
});

export default function ShiftScheduleContent() {
  const vm = UseShiftScheduleViewModel();
  const isMobile = useIsMobile(640);

  const dataSource = useMemo(
    () => (vm.rows || []).map((r) => ({ ...r, key: r.id })),
    [vm.rows]
  );

  // ============================================================
  // Preserve scroll Y + X untuk AntD Table body (scroll y: 640)
  // ============================================================
  const tableWrapRef = useRef(null);
  const lastScrollRef = useRef({ top: 0, left: 0 });

  const getTableBodyEl = useCallback(() => {
    const root = tableWrapRef.current;
    if (!root) return null;
    return root.querySelector(".ant-table-body");
  }, []);

  const captureTableScroll = useCallback(() => {
    const body = getTableBodyEl();
    if (!body) return;
    lastScrollRef.current = {
      top: body.scrollTop || 0,
      left: body.scrollLeft || 0,
    };
  }, [getTableBodyEl]);

  const restoreTableScroll = useCallback(() => {
    const { top, left } = lastScrollRef.current || { top: 0, left: 0 };

    const apply = () => {
      const body = getTableBodyEl();
      if (!body) return;
      body.scrollTop = top;
      body.scrollLeft = left;
    };

    // AntD kadang reset setelah paint/layout → tembak beberapa kali
    requestAnimationFrame(apply);
    setTimeout(apply, 0);
    setTimeout(apply, 60);
    setTimeout(apply, 200);
    setTimeout(apply, 400);
  }, [getTableBodyEl]);

  // update ref saat user scroll manual
  useEffect(() => {
    const body = getTableBodyEl();
    if (!body) return;

    const onScroll = () => {
      lastScrollRef.current = {
        top: body.scrollTop || 0,
        left: body.scrollLeft || 0,
      };
    };

    body.addEventListener("scroll", onScroll, { passive: true });
    return () => body.removeEventListener("scroll", onScroll);
  }, [getTableBodyEl]);

  // wrappers: restore setelah optimistic rerender & setelah API selesai
  const assignCellPreserveScroll = useCallback(
    async (userId, dateKey, value) => {
      captureTableScroll();

      const p = vm.assignCell(userId, dateKey, value);
      restoreTableScroll();

      await p;
      restoreTableScroll();
    },
    [vm, captureTableScroll, restoreTableScroll]
  );

  const deleteCellPreserveScroll = useCallback(
    async (userId, dateKey) => {
      captureTableScroll();

      const p = vm.deleteCell(userId, dateKey);
      restoreTableScroll();

      await p;
      restoreTableScroll();
    },
    [vm, captureTableScroll, restoreTableScroll]
  );

  const toggleStoryPreserveScroll = useCallback(
    async (userId, dateKey, checked) => {
      captureTableScroll();

      const p = vm.toggleStoryForDay(userId, dateKey, checked);
      restoreTableScroll();

      await p;
      restoreTableScroll();
    },
    [vm, captureTableScroll, restoreTableScroll]
  );

  const dayColumns = useMemo(() => {
    return vm.days.map((d) => ({
      title: (
        <div className="font-semibold text-slate-800 text-center">
          {d.labelDay}, {d.labelDate}
        </div>
      ),
      dataIndex: d.key,
      key: d.key,
      width: 280,
      render: (_, record) => {
        const cell = vm.getCell(record.id, d.dateStr) || {
          userId: record.id,
          date: d.dateStr,
        };
        const story = vm.getStoryCell(record.id, d.dateStr);
        const disabled = isPastDate(d.dateStr);

        return (
          <Cell
            cell={cell}
            polaMap={vm.polaMap}
            onAssign={assignCellPreserveScroll}
            onDelete={deleteCellPreserveScroll}
            disabled={disabled}
            story={story}
            onToggleStory={(checked) =>
              toggleStoryPreserveScroll(record.id, d.dateStr, checked)
            }
          />
        );
      },
    }));
  }, [
    vm.days,
    vm.getCell,
    vm.getStoryCell,
    vm.polaMap,
    assignCellPreserveScroll,
    deleteCellPreserveScroll,
    toggleStoryPreserveScroll,
  ]);

  const nameColumn = useMemo(() => {
    return {
      title: <div className="text-left font-medium">Nama Karyawan</div>,
      dataIndex: "name",
      key: "name",
      fixed: "left",
      width: isMobile ? 220 : 360,
      render: (_, r) => {
        const photo = getPhotoUrl(r) || "/avatar-placeholder.jpg";
        return (
          <div className="p-1">
            <Link
              href={`/home/kelola_karyawan/karyawan/${r.id}`}
              className="no-underline text-inherit hover:text-inherit"
            >
              <div className="flex items-center gap-3">
                <AppAvatar src={photo} name={r.name || ""} size={44} />
                <div className="min-w-0">
                  <div
                    style={{ fontWeight: 600, color: "#0f172a" }}
                    className="truncate"
                  >
                    {r.name}
                  </div>
                  <div
                    style={{ fontSize: 12, color: "#475569" }}
                    className="truncate"
                  >
                    {r.jabatan || "—"}
                    {r.departemen ? ` | ${r.departemen}` : r.jabatan ? "" : "—"}
                  </div>
                </div>
              </div>
            </Link>

            <label className="mt-3 flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                className="accent-[#004A9F]"
                checked={vm.isRepeatVisualOn(r.id)}
                onChange={(e) => vm.toggleRepeatSchedule(r.id, e.target.checked)}
              />
              Ulangi minggu ini sampai akhir bulan
            </label>

            <div className="mt-3 space-y-1 text-xs hidden sm:block">
              <div className="font-semibold text-slate-600 mb-1">
                Ringkasan Minggu Ini:
              </div>
              {vm.days.map((d) => {
                const c = vm.getCell(r.id, d.dateStr);
                let label = "—";
                let color = "text-slate-500";

                if (c && c.status === "LIBUR") {
                  label = "Libur";
                  color = "text-red-500";
                } else if (c && c.polaId) {
                  const p = vm.polaMap.get(String(c.polaId));
                  label = p ? `${p.nama} ${p.jam}` : "Kerja";
                  color = "text-blue-600";
                }

                return (
                  <div key={d.key} className={`${color} flex justify-between`}>
                    <span className="w-16">{d.short}:</span>
                    <span className="font-medium truncate">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      },
    };
  }, [
    isMobile,
    vm.days,
    vm.getCell,
    vm.isRepeatVisualOn,
    vm.toggleRepeatSchedule,
    vm.polaMap,
  ]);

  const columns = useMemo(() => [nameColumn, ...dayColumns], [nameColumn, dayColumns]);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap lg:flex-nowrap items-center gap-3">
        <div className="w-[240px] shrink-0">
          <AppSelect
            value={vm.deptId || undefined}
            placeholder="Semua Tim/Divisi"
            options={vm.deptOptions}
            onChange={vm.setDeptId}
            allowClear
            className="w-full"
            size="middle"
          />
        </div>

        <div className="w-[220px] shrink-0">
          <AppSelect
            allowClear
            showSearch
            placeholder="Filter Jabatan"
            optionFilterProp="label"
            value={vm.jabatanId || undefined}
            onChange={(v) => vm.setJabatanId(v || null)}
            options={vm.jabatanOptions}
            className="w-full"
            size="middle"
          />
        </div>

        <div className="w-[160px] shrink-0">
          <AppSelect
            value={vm.currentMonthIdx}
            onChange={(m) => vm.setMonthYear(vm.currentYear, m)}
            options={vm.monthOptions}
            className="w-full"
            size="middle"
          />
        </div>

        <div className="ml-0 lg:ml-auto flex items-center gap-3 flex-wrap lg:flex-nowrap">
          <AppButton
            variant="primary"
            icon={<LeftOutlined />}
            onClick={vm.prevWeek}
            size="middle"
            className="!px-3 shrink-0"
          >
            Minggu sebelumnya
          </AppButton>

          <AppButton
            variant="primary"
            icon={<RightOutlined />}
            onClick={vm.nextWeek}
            size="middle"
            className="!px-3 shrink-0"
          >
            Minggu berikutnya
          </AppButton>

          <div className="w-[140px] shrink-0">
            <AppDatePicker
              picker="month"
              className="w-full"
              value={dayjs(vm.weekStart)}
              onChange={(d) => {
                if (!d) return;
                vm.setMonthYear(d.year(), d.month());
              }}
              size="middle"
            />
          </div>
        </div>
      </div>

      <AppTypography.Text className="block text-xs text-slate-500 mb-3">
        * Centang “Ulangi minggu ini sampai akhir bulan” → sistem menyalin pola minggu ini.
        Hari kosong di minggu sumber akan menghapus jadwal di minggu target.
      </AppTypography.Text>

      <div ref={tableWrapRef}>
        <AppTable
          rowKey="id"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          loading={vm.loading}
          scroll={{ x: "max-content", y: 640 }}
          sticky
          size="middle"
          bordered={false}
          className="rounded-2xl overflow-hidden shadow-xl border border-slate-200"
          rowClassName={(_, index) => (index % 2 === 0 ? "bg-white" : "bg-[#F8FAFF]")}
          scrollToFirstRowOnChange={false}
        />
      </div>
    </div>
  );
}
