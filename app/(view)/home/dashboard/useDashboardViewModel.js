"use client";

import { useMemo, useState } from "react";

// --- ANGKAT KE LUAR HOOK: stabil, tidak jadi dependency ---
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

export default function useDashboardViewModel() {
  const tanggalTampilan = "Selasa, 16 Juni 2025";
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
    { name: "Kadek Sri Meyani, S.Pd", days: 3, color: "#FDE68A" },
    { name: "Ni Putu Melli Antari, S.Pd", days: 2, color: "#BBF7D0" },
    { name: "Ni Putu Melli Antari, S.Pd", days: 1, color: "#BFDBFE" },
    { name: "Ni Putu Melli Antari, S.Pd", days: 1, color: "#FBCFE8" },
    { name: "Ni Putu Melli Antari, S.Pd", days: 1, color: "#FCA5A5" },
  ];
  const onLeaveCount = leaveList.length;

  const [division, setDivision] = useState("IT");
  const [range, setRange] = useState("This Week");

  const divisionOptions = Object.keys(CHART_BY_DIVISION).map((d) => ({
    label: `Divisi ${d}`,
    value: d,
  }));

  // Sekarang dependency cukup 'division' saja (CHART_BY_DIVISION stabil)
  const chartData = useMemo(
    () => CHART_BY_DIVISION[division] ?? [],
    [division]
  );

  return {
    tanggalTampilan,
    totalKaryawan,
    totalDivisi,
    miniBars,
    leaveList,
    onLeaveCount,
    division,
    setDivision,
    divisionOptions,
    range,
    setRange,
    chartData,
  };
}
