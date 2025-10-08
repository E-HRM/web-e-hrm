"use client";

import {
  ConfigProvider,
  Button,
  Select,
  DatePicker,
  Tooltip,
  Tag,
  theme,
  // Import Table dan Grid dari antd
  Table,
  Grid,
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  DeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { useMemo } from "react";
import Link from "next/link"; // Menggunakan Link dari Next.js
import UseShiftScheduleViewModel from "./UseShiftScheduleViewModel";

dayjs.locale("id");

/** Palet dan Konstanta */
const BRAND_BLUE = "#004A9F";
const BRAND_BLUE_HOVER = "#0B63C7";
const BRAND_BLUE_ACTIVE = "#003A80";
const HEADER_BLUE_BG = "#F0F6FF";
const BRAND = "#003A6F"; // Menggunakan BRAND dari referensi

// --- Helper Functions dan Components dari Referensi ---

/** Ambil URL foto dari row dengan berbagai kemungkinan nama field */
function getPhotoUrl(row) {
  return (
    row?.foto_profil_user ||
    row?.avatarUrl ||
    row?.foto ||
    row?.foto_url ||
    row?.photoUrl ||
    row?.photo ||
    row?.avatar ||
    row?.gambar ||
    null
  );
}

/** Gambar bulat anti-gepeng (selalu crop center) */
function CircleImg({ src, size = 48, alt = "Foto" }) {
  const s = {
    width: size,
    height: size,
    borderRadius: "9999px",
    overflow: "hidden",
    border: `1px solid ${BRAND}22`,
    background: "#E6F0FA",
    flexShrink: 0,
    display: "inline-block",
  };
  return (
    <span style={s} className="shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || "/avatar-placeholder.jpg"}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onError={(e) => {
          e.currentTarget.src = "/avatar-placeholder.jpg";
          e.currentTarget.onerror = null;
        }}
      />
    </span>
  );
}

// --- Komponen Cell Jadwal ---

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

// --- Komponen Utama ShiftScheduleContent ---

export default function ShiftScheduleContent() {
  const vm = UseShiftScheduleViewModel();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.sm; // xs

  // 1. Definisikan Kolom Hari (dinamis)
  const dayColumns = vm.days.map((d) => ({
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
      return (
        <Cell
          cell={cell}
          polaMap={vm.polaMap}
          onAssign={vm.assignCell}
          onDelete={vm.deleteCell}
        />
      );
    },
  }));

  // 2. Definisikan Kolom Nama (sticky & linkable)
  const nameColumn = {
    title: <div className="text-left font-medium">Nama Karyawan</div>,
    dataIndex: "name",
    key: "name",
    fixed: "left", // Kunci kolom di kiri
    width: isMobile ? 220 : 380, // Lebih ramping di mobile, lebar di desktop
    render: (_, r) => {
      const photo = getPhotoUrl(r) || "/avatar-placeholder.jpg";
      
      return (
        <div className="p-1">
          {/* Detail Karyawan (Linkable) */}
          <Link
            href={`/home/kelola_karyawan/karyawan/${r.id}`}
            className="no-underline text-inherit hover:text-inherit"
          >
            <div className="flex items-center gap-3">
              <CircleImg src={photo} alt={r.name} size={48} /> {/* Menggunakan CircleImg */}

              <div className="min-w-0">
                {/* Nama */}
                <div
                  style={{ fontWeight: 600, color: "#0f172a" }}
                  className="truncate"
                >
                  {r.name}
                </div>
                {/* Jabatan dan Departemen (Email Dihapus) */}
                <div
                  style={{ fontSize: 12, color: "#475569" }}
                  className="truncate"
                >
                  {r.jabatan || "—"}
                  {r.jabatan && r.departemen && " "}
                  {r.departemen ? `| ${r.departemen}` : r.jabatan ? "" : "—"}
                </div>
              </div>
            </div>
          </Link>

          {/* Checkbox Ulang Jadwal (di luar Link) */}
          <label className="mt-3 flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              className="accent-[#004A9F]"
              onChange={(e) => vm.toggleRepeatSchedule(r.id, e.target.checked)}
            />
            Ulangi jadwal ini tiap minggu
          </label>

          {/* Ringkasan/Review Mingguan - DISIMPAN HANYA UNTUK DESKTOP/TABLET (sm:block) */}
          <div className="mt-3 space-y-1 text-xs hidden sm:block">
            <div className="font-semibold text-slate-600 mb-1">
              Ringkasan Minggu Ini:
            </div>
            {vm.days.map((d) => {
              const c = vm.getCell(r.id, d.dateStr);
              let label = "—";
              let color = "text-slate-500";
              if (c?.status === "LIBUR") {
                label = "Libur";
                color = "text-red-500";
              } else if (c?.polaId) {
                const p = vm.polaMap.get(c.polaId);
                label = p ? `${p.nama} ${p.jam}` : "Kerja";
                color = "text-blue-600";
              }
              return (
                <div
                  key={d.key}
                  className={`${color} flex justify-between`}
                >
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

  const columns = [nameColumn, ...dayColumns];

  // 3. Siapkan data source
  const dataSource = vm.rows.map((r) => ({
    ...r,
    key: r.id, 
  }));

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
          Table: {
            headerBg: HEADER_BLUE_BG,
            headerSortHoverBg: HEADER_BLUE_BG,
            headerSortActiveBg: HEADER_BLUE_BG,
            rowHoverBg: "#E6F3FF",
          },
        },
      }}
    >
      <div className="p-6">
        {/* Toolbar - Diatur dalam satu baris (1 row) */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {/* Filter Dept */}
          <Select
            value={vm.deptId || undefined}
            placeholder="Semua Tim/Divisi"
            options={vm.deptOptions}
            onChange={vm.setDeptId}
            className="min-w-[220px]"
            allowClear
          />
          {/* Filter Jabatan */}
          <Select
            allowClear
            showSearch
            placeholder="Filter Jabatan"
            optionFilterProp="label"
            value={vm.jabatanId || undefined}
            onChange={(v) => vm.setJabatanId(v ?? null)}
            options={vm.jabatanOptions}
            className="min-w-[220px]"
          />
          {/* Filter Bulan & Tahun */}
          <Select
            className="min-w-[160px]"
            value={vm.currentMonthIdx}
            onChange={(m) => vm.setMonthYear(vm.currentYear, m)}
            options={vm.monthOptions}
          />
          {/* <Select
            className="min-w-[120px]"
            value={vm.currentYear}
            onChange={(y) => vm.setMonthYear(y, vm.currentMonthIdx)}
            options={vm.yearOptions}
          /> */}
          
          <div className="flex-grow-0 ml-auto flex items-center gap-2">
            {/* Tombol navigasi minggu */}
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
          * Centang “Ulangi jadwal ini tiap minggu” → sistem menyalin pola minggu ini hingga akhir bulan.
        </div>

        {/* Tabel Utama menggunakan komponen Table Ant Design */}
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          loading={vm.loading}
          // Konfigurasi Scroll dan Sticky
          scroll={{ 
            x: "max-content", // Memastikan scroll horizontal jika lebar konten > container
            y: 640 // Mengunci tinggi tabel dan memungkinkan scroll vertikal di body tabel
          }}
          sticky 
          size="middle"
          bordered={false}
          className="rounded-2xl overflow-hidden shadow-xl border border-slate-200"
          rowClassName={(record, index) =>
            index % 2 === 0 ? "bg-white" : "bg-[#F8FAFF]"
          }
        />
      </div>
    </ConfigProvider>
  );
}