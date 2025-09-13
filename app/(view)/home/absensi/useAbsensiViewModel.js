"use client";

import dayjs from "dayjs";

const NAMES = [
  "Kadek Sri Meiyani, S.Pd",
  "Ni Putu Melly Antari, S.Pd",
  "Dewa Nyoman Aditya Yogantara",
  "Putri Karunia",
  "Febe",
  "Dewa Arsana",
];
const DIVISI = ["Divisi IDE", "Divisi IT", "Divisi HR", "Divisi Operasional"];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const makeRow = (id, type = "in") => {
  const name = pick(NAMES);
  const div  = pick(DIVISI);
  const d    = dayjs("2025-06-21").add(Math.floor(Math.random()*5), "day");
  const jam = type === "in"
    ? ["07:45","07:50","07:55","08:05","08:10","08:30"][Math.floor(Math.random()*6)]
    : ["17:00","17:30","18:00","18:30","19:00"][Math.floor(Math.random()*5)];

  let status = "Tepat Waktu";
  if (type === "in") {
    if (jam >= "08:05") status = "Terlambat";
  } else {
    if (jam >= "18:00") status = "Lembur";
  }

  return {
    id,
    tanggal: d.toISOString(),
    nama: name,
    divisi: div,
    jam,
    status,
    avatar: null, // taruh URL kalau ada
  };
};

export default function useAbsensiViewModel() {
  const kedatangan = Array.from({ length: 42 }, (_, i) => makeRow(i + 1, "in"));
  const kepulangan = Array.from({ length: 42 }, (_, i) => makeRow(i + 1, "out"));

  const divisiOptions = DIVISI.map((d) => ({ value: d, label: d }));
  const statusOptions = [
    { value: "Tepat Waktu", label: "Tepat Waktu" },
    { value: "Terlambat", label: "Terlambat" },
    { value: "Izin", label: "Izin" },
    { value: "Sakit", label: "Sakit" },
  ];
  const statusOptionsKepulangan = [
    { value: "Tepat Waktu", label: "Tepat Waktu" },
    { value: "Lembur", label: "Lembur" },
  ];

  return { kedatangan, kepulangan, divisiOptions, statusOptions, statusOptionsKepulangan };
}
