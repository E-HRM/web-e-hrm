"use client";

import { useMemo, useState } from "react";
import { message } from "antd";

/** ViewModel Izin Jam – konsisten dengan Cuti/Tukar Hari/Sakit
 * Status: "Menunggu" | "Disetujui" | "Ditolak"
 * Tabs  : "pengajuan" | "disetujui" | "ditolak"
 */
export default function useIzinJamViewModel() {
  const initial = [
    // --- Menunggu ---
    {
      id: 1,
      nama: "Dewa Ode",
      jabatan: "Manager | IDE",
      foto: "https://randomuser.me/api/portraits/women/65.jpg",

      tglPengajuan: "2025-07-19T16:28:00+08:00",

      // Izin jam
      tglIzin: "2025-07-23",
      jamMulai: "09:00",
      jamSelesai: "13:00",

      // Jam pengganti (boleh kosong)
      pgTglMulai: null,
      pgJamMulai: null,
      pgTglSelesai: null,
      pgJamSelesai: null,

      // Kategori hanya 2 opsi:
      // "Jam extra di hari sama" | "Mengganti dengan jam saat libur"
      kategori: "Jam extra di hari sama",
      keperluan: "Mengikuti rapat mendadak dengan klien proyek.",
      handover:
        "Tugas administrasi proyek diambil alih oleh Ni Luh Ayu Sari selama izin.",
      bukti: "izin1.pdf",

      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      tglKeputusan: null,
    },
    // --- Disetujui ---
    {
      id: 2,
      nama: "Kimartha Putri",
      jabatan: "Konsultan | Super Team OS… · WITA (UTC+8) | Gen Z",
      foto: "https://randomuser.me/api/portraits/women/66.jpg",

      tglPengajuan: "2025-05-25T07:37:00+08:00",

      tglIzin: "2025-05-31",
      jamMulai: "09:00",
      jamSelesai: "18:00",

      pgTglMulai: "2025-06-15",
      pgJamMulai: "08:30",
      pgTglSelesai: "2025-06-15",
      pgJamSelesai: "18:08",

      kategori: "Mengganti dengan jam saat libur",
      keperluan: "Mendampingi keluarga ke rumah sakit.",
      handover:
        "Pekerjaan CS dilanjutkan oleh tim shift sore. Laporan harian tetap diinput.",
      bukti: "izin2.pdf",

      status: "Disetujui",
      alasan: "",
      tempAlasan: "",
      tglKeputusan: "2025-06-01T10:10:00+08:00",
    },
    // --- Ditolak ---
    {
      id: 3,
      nama: "Kadek Rian Saputra",
      jabatan: "IDE | Social Media",
      foto: "https://randomuser.me/api/portraits/men/46.jpg",

      tglPengajuan: "2025-10-20T10:20:00+08:00",

      tglIzin: "2025-10-27",
      jamMulai: "09:00",
      jamSelesai: "11:30",

      pgTglMulai: null,
      pgJamMulai: null,
      pgTglSelesai: null,
      pgJamSelesai: null,

      kategori: "Jam extra di hari sama",
      keperluan: "Koordinasi konten promosi offline.",
      handover: "Postingan media sosial dipegang sementara oleh Gede Adi Putra.",
      bukti: "izin3.pdf",

      status: "Ditolak",
      alasan: "Tidak ada bukti pendukung.",
      tempAlasan: "",
      tglKeputusan: "2025-10-20T18:10:00+08:00",
    },
    // --- Menunggu ---
    {
      id: 4,
      nama: "I Gede Agus Mahendra",
      jabatan: "Developer | Web",
      foto: "https://randomuser.me/api/portraits/men/50.jpg",

      tglPengajuan: "2025-06-10T09:35:00+08:00",

      tglIzin: "2025-06-12",
      jamMulai: "14:00",
      jamSelesai: "17:00",

      pgTglMulai: "2025-06-20",
      pgJamMulai: "15:00",
      pgTglSelesai: "2025-06-20",
      pgJamSelesai: "16:00",

      kategori: "Mengganti dengan jam saat libur",
      keperluan: "Urus dokumen penting ke kantor pemerintahan.",
      handover:
        "Review PR diambil alih oleh tim backend, deploy ditunda ke malam.",
      bukti: "izin4.pdf",

      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      tglKeputusan: null,
    },
    // --- Menunggu ---
    {
      id: 5,
      nama: "Ni Luh Ayu Sari",
      jabatan: "Admission | Admission",
      foto: "https://randomuser.me/api/portraits/women/47.jpg",

      tglPengajuan: "2025-10-22T12:12:00+08:00",

      tglIzin: "2025-10-26",
      jamMulai: "13:00",
      jamSelesai: "16:00",

      pgTglMulai: null,
      pgJamMulai: null,
      pgTglSelesai: null,
      pgJamSelesai: null,

      kategori: "Jam extra di hari sama",
      keperluan: "Mengurus administrasi keluarga.",
      handover: "Aktivitas pelayanan front office diteruskan oleh Gede Adi.",
      bukti: "izin5.pdf",

      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      tglKeputusan: null,
    },
  ];

  const [data, setData] = useState(initial);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pengajuan"); // 'pengajuan' | 'disetujui' | 'ditolak'

  const filteredData = useMemo(() => {
    const term = search.toLowerCase();
    const byTab = data.filter((d) =>
      tab === "pengajuan"
        ? d.status === "Menunggu"
        : tab === "disetujui"
        ? d.status === "Disetujui"
        : d.status === "Ditolak"
    );
    return byTab.filter((d) =>
      [
        d.nama,
        d.jabatan,
        d.kategori,
        d.keperluan,
        d.handover,
        d.tglIzin,
        d.jamMulai,
        d.jamSelesai,
        d.pgTglMulai,
        d.pgTglSelesai,
        d.pgJamMulai,
        d.pgJamSelesai,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [data, search, tab]);

  function handleAlasanChange(id, value) {
    setData((prev) =>
      prev.map((it) => (it.id === id ? { ...it, tempAlasan: value } : it))
    );
  }

  // Setujui: tidak wajib alasan
  function approve(id) {
    setData((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              status: "Disetujui",
              alasan: it.tempAlasan || it.alasan,
              tempAlasan: "",
              tglKeputusan: new Date().toISOString(),
            }
          : it
      )
    );
    message.success("Pengajuan izin jam disetujui");
  }

  // Tolak: wajib alasan
  function reject(id) {
    const row = data.find((d) => d.id === id);
    if (!row?.tempAlasan && !row?.alasan) {
      message.error("Alasan wajib diisi saat menolak.");
      return;
    }
    setData((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              status: "Ditolak",
              alasan: it.tempAlasan || it.alasan,
              tempAlasan: "",
              tglKeputusan: new Date().toISOString(),
            }
          : it
      )
    );
    message.success("Pengajuan izin jam ditolak");
  }

  function resetDummy() {
    setData(initial);
    setSearch("");
  }

  const counts = useMemo(() => {
    const all = data ?? [];
    return {
      pengajuan: all.filter((d) => d.status === "Menunggu").length,
      disetujui: all.filter((d) => d.status === "Disetujui").length,
      ditolak: all.filter((d) => d.status === "Ditolak").length,
    };
  }, [data]);

  return {
    data,
    filteredData,
    search,
    setSearch,
    tab,
    setTab,
    counts,
    handleAlasanChange,
    approve,
    reject,
    resetDummy,
  };
}
