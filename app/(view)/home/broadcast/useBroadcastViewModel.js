"use client";

import { useMemo, useState } from "react";

/** ===== Dummy data karyawan (avatar & nama) ===== */
const img = (id) => `https://i.pravatar.cc/100?img=${id}`;
export const EMPLOYEES = Array.from({ length: 28 }).map((_, i) => ({
  id: `EMP${i + 1}`,
  name: [
    "Ayu","Bima","Cahya","Dewi","Eka","Fajar","Gita","Hendra","Intan","Joko",
    "Kinan","Laras","Made","Nanda","Oki","Putri","Qori","Rama","Salsa","Tio",
    "Uti","Vino","Wulan","Xaver","Yoga","Zahra","Rafi","Niko",
  ][i % 28],
  avatar: img((i % 70) + 1),
}));

const pick = (n) => {
  const shuffled = [...EMPLOYEES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

export const STATUS_COLORS = {
  DRAFT: { color: "default", text: "Konsep" },
  SENDING: { color: "processing", text: "Mengirim" },
  DONE: { color: "success", text: "Selesai" },
  CANCELED: { color: "error", text: "Batal" },
  DELAYED: { color: "geekblue", text: "Ditunda" },
};

const INITIAL_DATA = [
  {
    id: "B1",
    title: "Lomba Tahunan",
    content: "Lomba olahraga antar divisi. Daftar ke bagian GA.",
    files: [{ name: "Rundown.pdf" }],
    recipients: pick(24),
    creator: { name: "E-HRM", when: "06 Jan 2024" },
    status: "DRAFT",
  },
  {
    id: "B2",
    title: "LIBUR AKHIR TAHUN",
    content: "Cuti bersama 29–31 Des. Operasional terbatas.",
    files: [],
    recipients: pick(12),
    creator: { name: "E-HRM", when: "27 Des 2023" },
    status: "DONE",
  },
  {
    id: "B3",
    title: "Meeting Bulanan",
    content: "Townhall & evaluasi OKR. Agenda di lampiran.",
    files: [{ name: "Agenda.docx" }],
    recipients: pick(20),
    creator: { name: "E-HRM", when: "19 Jan 2023" },
    status: "CANCELED",
  },
];

/** =========================================================
 *  ViewModel
 *  - rows: data broadcast
 *  - q / statusTab: filter
 *  - filteredRows, counts
 *  - actions: addBroadcast, sendNow, deleteBroadcast
 *  - employeeOptions: opsi untuk form penerima
 ========================================================= */
export default function useBroadcastViewModel() {
  const [rows, setRows] = useState(INITIAL_DATA);
  const [q, setQ] = useState("");
  const [statusTab, setStatusTab] = useState("ALL");

  // opsi penerima (untuk Select)
  const employeeOptions = useMemo(
    () =>
      EMPLOYEES.map((e) => ({
        value: e.id,
        label: e.name,
        avatar: e.avatar,
      })),
    []
  );

  // filter daftar
  const filteredRows = useMemo(() => {
    const byStatus =
      statusTab === "ALL" ? rows : rows.filter((r) => r.status === statusTab);
    const s = q.trim().toLowerCase();
    if (!s) return byStatus;
    return byStatus.filter(
      (r) =>
        r.title.toLowerCase().includes(s) ||
        r.content.toLowerCase().includes(s)
    );
  }, [rows, q, statusTab]);

  // hitung badge tiap status
  const counts = useMemo(() => {
    const c = { ALL: rows.length, DRAFT: 0, SENDING: 0, DONE: 0, CANCELED: 0, DELAYED: 0 };
    rows.forEach((r) => (c[r.status] = (c[r.status] || 0) + 1));
    return c;
  }, [rows]);

  // actions
  function addBroadcast({ title, content, files, recipientIds }) {
    const picked = EMPLOYEES.filter((e) => recipientIds.includes(e.id));
    const newRow = {
      id: `B${Math.random().toString(36).slice(2, 7)}`,
      title,
      content,
      files: files || [],
      recipients: picked,
      creator: { name: "E-HRM", when: new Date().toLocaleDateString("id-ID") },
      status: "DRAFT",
    };
    setRows((r) => [newRow, ...r]);
    return newRow;
  }

  function deleteBroadcast(id) {
    setRows((r) => r.filter((x) => x.id !== id));
  }

  function sendNow(id) {
    // simulasi kirim → done
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status: "SENDING" } : x)));
    return new Promise((resolve) => {
      setTimeout(() => {
        setRows((r) => r.map((x) => (x.id === id ? { ...x, status: "DONE" } : x)));
        resolve(true);
      }, 900);
    });
  }

  return {
    // data & filter
    rows,
    filteredRows,
    counts,
    q,
    setQ,
    statusTab,
    setStatusTab,

    // employees
    employeeOptions,
    employees: EMPLOYEES,

    // actions
    addBroadcast,
    sendNow,
    deleteBroadcast,

    // helpers
    statusToTag: (st) => STATUS_COLORS[st] || { color: "default", text: st },
  };
}
