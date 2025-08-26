"use client";

import { useMemo } from "react";

export default function useDashboardViewModel() {
  const today = useMemo(
    () => new Date().toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }),
    []
  );

  const statSummary = [
    { key: "total", title: "Total Karyawan", value: 12, trend: "+2", tone: "primary" },
    { key: "hr", title: "HR", value: 5, tone: "neutral" },
    { key: "absen", title: "ABS", value: 8, tone: "neutral" },
    { key: "keuangan", title: "Keuangan", value: 7, tone: "neutral" },
  ];

  const miniStats = [
    { key: "divisi", label: "Total Divisi", value: 5 },
    { key: "cuti", label: "Karyawan Cuti", value: 5 },
  ];

  const leaveList = [
    { name: "Kadek Sri Mulyani, S.Pd", days: "2 Hari", avatar: "/profile.png" },
    { name: "I Putu Melky Arta, S.Pd", days: "1 Hari", avatar: "/profile.png" },
    { name: "Ni Putu Ayu S.", days: "5 Hari", avatar: "/profile.png" },
    { name: "I Kadek Wira", days: "3 Hari", avatar: "/profile.png" },
    { name: "..." , days: "", avatar: "/profile.png" },
  ];

  return {
    today,
    statSummary,
    miniStats,
    leaveList,
    userName: "HR",
  };
}
