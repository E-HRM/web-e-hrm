"use client";

import { useMemo } from "react";
import dayjs from "dayjs";
import { Tag } from "antd";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

/* ---------- Helpers dummy ---------- */
const NAMES = ["Adi", "Budi", "Citra", "Dewi", "Eka", "Fajar", "Gita", "Hadi"];
const CLIENTS = ["PT Maju", "CV Sejahtera", "UD Makmur", "PT Surya", "CV Kencana"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const int = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const fmt = (d, withTime = true) =>
  dayjs(d).format(withTime ? "DD MMM YYYY HH:mm" : "DD MMM YYYY");

export default function useOpsDashboardViewModel() {
  /* ====== Dummy: chart kunjungan 7 hari ====== */
  const chartKunjungan7Hari = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = dayjs().subtract(6 - i, "day");
      return {
        label: d.format("DD/MM"),
        diproses: int(1, 8),
        selesai: int(2, 10),
      };
    });
  }, []);

  /* ====== Dummy: status agenda (pie) ====== */
  const pieAgendaStatus = useMemo(() => {
    const selesai = int(20, 45);
    const diproses = int(10, 25);
    const ditunda = int(2, 10);
    return [
      { name: "Selesai", value: selesai },
      { name: "Diproses", value: diproses },
      { name: "Ditunda", value: ditunda },
    ];
  }, []);

  /* ====== Dummy: lists ====== */
  const recentVisits = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => {
      const when = dayjs().subtract(i, "hour");
      const status = i % 3 === 0 ? "selesai" : i % 3 === 1 ? "diproses" : "ditunda";
      return {
        id: `V${1000 + i}`,
        petugas: pick(NAMES),
        klien: pick(CLIENTS),
        waktu: fmt(when),
        status,
      };
    });
  }, []);

  const upcomingAgendas = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => {
      const start = dayjs().add(i + 1, "day").hour(9).minute(0);
      const end = start.add(int(1, 3), "hour");
      const status = i % 4 === 0 ? "diproses" : i % 4 === 1 ? "ditunda" : "terjadwal";
      return {
        id: `A${2000 + i}`,
        judul: `Agenda ${i + 1} · ${pick(CLIENTS)}`,
        tanggal: fmt(start, false),
        jam: `${start.format("HH:mm")}–${end.format("HH:mm")}`,
        pic: pick(NAMES),
        status,
      };
    });
  }, []);

  /* ====== KPIs derived ====== */
  const kpi = useMemo(() => {
    const kunjunganHariIni = int(6, 16);
    const kunjunganMingguIni = chartKunjungan7Hari
      .reduce((acc, d) => acc + d.diproses + d.selesai, 0);

    const totalAgenda = pieAgendaStatus.reduce((a, b) => a + b.value, 0);
    const agendaAktif = pieAgendaStatus.find((x) => x.name === "Diproses")?.value ?? 0
                      + pieAgendaStatus.find((x) => x.name === "Ditunda")?.value ?? 0;
    const selesai = pieAgendaStatus.find((x) => x.name === "Selesai")?.value ?? 0;
    const completionRate = totalAgenda ? Math.round((selesai / totalAgenda) * 100) : 0;

    return {
      kunjunganHariIni,
      kunjunganMingguIni,
      agendaAktif,
      completionRate,
    };
  }, [chartKunjungan7Hari, pieAgendaStatus]);

  /* ====== Tables columns ====== */
  const columnsRecentVisits = useMemo(() => [
    { title: "Petugas", dataIndex: "petugas", key: "petugas" },
    { title: "Klien", dataIndex: "klien", key: "klien" },
    { title: "Waktu", dataIndex: "waktu", key: "waktu" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => {
        const color = v === "selesai" ? "green" : v === "diproses" ? "blue" : "orange";
        return <Tag color={color}>{v}</Tag>;
      },
    },
  ], []);

  const columnsUpcomingAgendas = useMemo(() => [
    { title: "Judul", dataIndex: "judul", key: "judul" },
    { title: "Tanggal", dataIndex: "tanggal", key: "tanggal" },
    { title: "Jam", dataIndex: "jam", key: "jam" },
    { title: "PIC", dataIndex: "pic", key: "pic" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => {
        const color = v === "terjadwal" ? "geekblue" : v === "diproses" ? "blue" : "orange";
        return <Tag color={color}>{v}</Tag>;
      },
    },
  ], []);

  return {
    kpi,
    chartKunjungan7Hari,
    pieAgendaStatus,
    recentVisits,
    upcomingAgendas,
    columnsRecentVisits,
    columnsUpcomingAgendas,
  };
}
