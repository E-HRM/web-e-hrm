"use client";

import { useMemo, useState } from "react";

/* ==================== DUMMY CHART ==================== */
const CHART_BY_DIVISION = {
  IT: [
    { name: "Dewa Ode", Kedatangan: 65, Kepulangan: 58 },
    { name: "Putri Indah", Kedatangan: 78, Kepulangan: 56 },
    { name: "Ngurah Manik", Kedatangan: 112, Kepulangan: 26 },
    { name: "Dewa Adi", Kedatangan: 75, Kepulangan: 30 },
    { name: "Febe Annika", Kedatangan: 62, Kepulangan: 52 },
    { name: "Kevin Pratama", Kedatangan: 72, Kepulangan: 60 },
    { name: "Ayu Maharani", Kedatangan: 102, Kepulangan: 50 },
  ],
  HR: [
    { name: "Dewa Ode", Kedatangan: 45, Kepulangan: 30 },
    { name: "Putri Indah", Kedatangan: 36, Kepulangan: 28 },
    { name: "Ngurah Manik", Kedatangan: 58, Kepulangan: 18 },
    { name: "Dewa Adi", Kedatangan: 42, Kepulangan: 22 },
    { name: "Febe Annika", Kedatangan: 35, Kepulangan: 20 },
    { name: "Kevin Pratama", Kedatangan: 40, Kepulangan: 30 },
    { name: "Ayu Maharani", Kedatangan: 60, Kepulangan: 26 },
  ],
  Admin: [
    { name: "Dewa Ode", Kedatangan: 55, Kepulangan: 38 },
    { name: "Putri Indah", Kedatangan: 66, Kepulangan: 30 },
    { name: "Ngurah Manik", Kedatangan: 84, Kepulangan: 25 },
    { name: "Dewa Adi", Kedatangan: 58, Kepulangan: 28 },
    { name: "Febe Annika", Kedatangan: 50, Kepulangan: 34 },
    { name: "Kevin Pratama", Kedatangan: 64, Kepulangan: 40 },
    { name: "Ayu Maharani", Kedatangan: 70, Kepulangan: 36 },
  ],
  IDE: [
    { name: "Dewa Ode", Kedatangan: 62, Kepulangan: 48 },
    { name: "Putri Indah", Kedatangan: 70, Kepulangan: 40 },
    { name: "Ngurah Manik", Kedatangan: 96, Kepulangan: 30 },
    { name: "Dewa Adi", Kedatangan: 60, Kepulangan: 32 },
    { name: "Febe Annika", Kedatangan: 72, Kepulangan: 44 },
    { name: "Kevin Pratama", Kedatangan: 80, Kepulangan: 50 },
    { name: "Ayu Maharani", Kedatangan: 92, Kepulangan: 42 },
  ],
  Konsultan: [
    { name: "Dewa Ode", Kedatangan: 40, Kepulangan: 35 },
    { name: "Putri Indah", Kedatangan: 44, Kepulangan: 28 },
    { name: "Ngurah Manik", Kedatangan: 60, Kepulangan: 20 },
    { name: "Dewa Adi", Kedatangan: 52, Kepulangan: 24 },
    { name: "Febe Annika", Kedatangan: 48, Kepulangan: 26 },
    { name: "Kevin Pratama", Kedatangan: 55, Kepulangan: 30 },
    { name: "Ayu Maharani", Kedatangan: 64, Kepulangan: 28 },
  ],
};

/* ==================== DUMMY PERFORMA & TOP5 ==================== */
const DIVISION_OPTIONS = [
  { label: "--Divisi--", value: "" },
  { label: "IT", value: "IT" },
  { label: "HR", value: "HR" },
  { label: "Admin", value: "Admin" },
  { label: "IDE", value: "IDE" },
  { label: "Konsultan", value: "Konsultan" },
];

const PERF_TABS = [
  { key: "onTime", label: "Tepat Waktu" },
  { key: "late", label: "Terlambat" },
  { key: "absent", label: "Tidak/belum hadir" },
  { key: "autoOut", label: "Presensi Keluar Otomatis" },
  { key: "leave", label: "Cuti" },
  { key: "permit", label: "Izin" },
];

const PERF_DATA_MAP = {
  onTime: [
    { id: "u1", name: "Ngurah Manik Mahardika", division: "IT", time: "07:59:12" },
    { id: "u2", name: "Robby Alan Prayogi", division: "IT", time: "08:00:03" },
  ],
  late: [
    { id: "u3", name: "I Kadek Dwi Hendra", division: "IT", time: "08:21:17" },
    { id: "u4", name: "Mesy Chintiya Sari", division: "Admin", time: "08:51:16" },
    { id: "u5", name: "I Dewa Gede Arsana Pucanganom", division: "IT", time: "08:30:30" },
    { id: "u6", name: "Kimartha Putri", division: "HR", time: "08:41:41" },
  ],
  absent: [{ id: "u7", name: "Made Rara", division: "IDE", time: "—" }],
  autoOut: [{ id: "u8", name: "Gede Agus", division: "Konsultan", time: "18:10:00" }],
  leave: [{ id: "u9", name: "Kadek Sri Meyani", division: "HR", time: "Cuti Tahunan" }],
  permit: [{ id: "u10", name: "Putu Diah", division: "Admin", time: "Izin Dokter" }],
};

const TOP5_LATE = [
  { rank: 1, name: "Ni Komang Ayu Tirta Utami", division: "Super Team OSS Bali", count: "2 hari", duration: "3 jam 7 menit 4 detik" },
  { rank: 2, name: "Yusuf Stefanus", division: "Super Team OSS Bali", count: "1 hari", duration: "5 menit 44 detik" },
  { rank: 3, name: "I Nyoman Bagus Sudarsana", division: "Super Team OSS Bali", count: "1 hari", duration: "3 menit" },
  { rank: 4, name: "Dewa Adi", division: "Super Team OSS Bali", count: "1 hari", duration: "2 menit" },
  { rank: 5, name: "Putri Indah", division: "Super Team OSS Bali", count: "1 hari", duration: "2 menit" },
];

const TOP5_DISCIPLINE = [
  { rank: 1, name: "Robby Alan Prayogi", division: "Super Team OSS Bali", score: "100%" },
  { rank: 2, name: "Ngurah Manik Mahardika", division: "Super Team OSS Bali", score: "98%" },
  { rank: 3, name: "Mesy Chintiya Sari", division: "Super Team OSS Bali", score: "96%" },
  { rank: 4, name: "I Kadek Dwi Hendra", division: "Super Team OSS Bali", score: "95%" },
  { rank: 5, name: "Kimartha Putri", division: "Super Team OSS Bali", score: "94%" },
];

export default function useDashboardViewModel() {
  /* ===== Header & mini stats ===== */
  const tanggalTampilan = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const totalKaryawan = 12;
  const totalDivisi = 5;

  const miniBars = [
    { label: "HR", value: 18 },
    { label: "IDE", value: 72 },
    { label: "Admin", value: 58 },
    { label: "IT", value: 55 },
    { label: "Konsultan", value: 42 },
  ];

  const leaveList = [
    { name: "Kadek Sri Meyani", days: 3, color: "#FDE68A" },
    { name: "Ni Putu Melli Antari", days: 2, color: "#BBF7D0" },
    { name: "Ni Putu Melli Antari", days: 1, color: "#BFDBFE" },
    { name: "Ni Putu Melli Antari", days: 1, color: "#FBCFE8" },
    { name: "Ni Putu Melli Antari", days: 1, color: "#FCA5A5" },
  ];
  const onLeaveCount = leaveList.length;

  /* ===== Chart ===== */
  const [division, setDivision] = useState("IT");
  const divisionOptions = Object.keys(CHART_BY_DIVISION).map((d) => ({
    label: `Divisi ${d}`,
    value: d,
  }));
  const chartData = useMemo(
    () => CHART_BY_DIVISION[division] ?? [],
    [division]
  );

  /* ===== Mini Calendar (DINAMIS) ===== */
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-11

  // Dummy event: peta hari->warna/tip, tetap dummy tapi mengikuti bulan aktif
  const calendarEvents = useMemo(() => {
    return {
      3:  { color: "bg-emerald-500", tip: "Cuti Tahunan" },
      6:  { color: "bg-rose-500",    tip: "Izin" },
      7:  { color: "bg-fuchsia-500", tip: "Dinas Luar" },
      14: { color: "bg-rose-500",    tip: "Izin Sakit" },
      17: { color: "bg-violet-500",  tip: "1 Karyawan Cuti" },
      18: { color: "bg-emerald-500", tip: "Cuti" },
      19: { color: "bg-emerald-500", tip: "Cuti" },
      20: { color: "bg-violet-500",  tip: "Training" },
      21: { color: "bg-fuchsia-500", tip: "Dinas Luar" },
      23: { color: "bg-emerald-500", tip: "Cuti" },
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calYear, calMonth]);

  const prevMonth = () => {
    setCalMonth((m) => {
      if (m === 0) {
        setCalYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const nextMonth = () => {
    setCalMonth((m) => {
      if (m === 11) {
        setCalYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  /* ===== Performa Kehadiran (dummy) ===== */
  const [perfDate, setPerfDate] = useState("2025-10-03");
  const [perfDivision, setPerfDivision] = useState("");
  const [perfTab, setPerfTab] = useState("late");
  const [perfQuery, setPerfQuery] = useState("");

  const perfDivisionOptions = DIVISION_OPTIONS;

  const perfRowsRaw = useMemo(() => PERF_DATA_MAP[perfTab] ?? [], [perfTab]);
  const perfRows = useMemo(() => {
    const q = perfQuery.trim().toLowerCase();
    return perfRowsRaw.filter((r) => {
      const okDiv = perfDivision ? r.division === perfDivision : true;
      const okQ =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.division.toLowerCase().includes(q);
      return okDiv && okQ;
    });
  }, [perfDivision, perfQuery, perfRowsRaw]);

  /* ===== Top 5 ===== */
  const top5Late = TOP5_LATE;
  const top5Discipline = TOP5_DISCIPLINE;

  return {
    // header
    tanggalTampilan,
    totalKaryawan,
    totalDivisi,

    // mini bars (Total Karyawan)
    miniBars,

    // chart
    division,
    setDivision,
    divisionOptions,
    chartData,

    // leave list
    leaveList,
    onLeaveCount,

    // calendar (baru)
    today,
    calYear,
    calMonth,
    prevMonth,
    nextMonth,
    calendarEvents,

    // performa
    perfTabs: PERF_TABS,
    perfDate, setPerfDate,
    perfDivision, setPerfDivision,
    perfDivisionOptions,
    perfTab, setPerfTab,
    perfQuery, setPerfQuery,
    perfRows,

    // top 5
    top5Late,
    top5Discipline,
  };
}
