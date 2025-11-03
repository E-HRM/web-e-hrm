"use client";

import { useMemo, useState } from "react";
import { message } from "antd";

/**
 * ViewModel Dummy – Izin Sakit
 * Status: "Menunggu" | "Disetujui" | "Ditolak"
 */
export default function useSakitViewModel() {
  const initial = [
    // --- Menunggu ---
    {
      id: 1,
      tanggal: "2025-10-23",
      nama: "I Gede Agung Pramana",
      jabatan: "Konsultan | Konsultan",
      kategori: "Demam",
      handover:
        "Tugas proyek minggu ini dilanjutkan oleh Ni Luh Ayu Sari, pastikan laporan harian tetap diperbarui setiap sore melalui sistem internal.",
      buktiUrl: "/dummy/file1.pdf",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/men/45.jpg",
      tglKeputusan: null,
    },
    {
      id: 4,
      tanggal: "2025-10-19",
      nama: "Kadek Rian Saputra",
      jabatan: "Admission | Admission",
      kategori: "Sakit Kepala",
      handover:
        "Analisis data penjualan diteruskan ke Komang Dewi agar laporan kuartal selesai tepat waktu dan tidak ada kendala input.",
      buktiUrl: "/dummy/file4.pdf",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/men/46.jpg",
      tglKeputusan: null,
    },

    // --- Disetujui ---
    {
      id: 2,
      tanggal: "2025-10-22",
      nama: "Ni Luh Ayu Sari",
      jabatan: "Admission | Admission",
      kategori: "Flu/Pilek",
      handover:
        "Administrasi pasien diteruskan kepada Gede Adi, termasuk rekap data mingguan dan verifikasi dokumen tertunda.",
      buktiUrl: "/dummy/file2.pdf",
      status: "Disetujui",
      alasan: "",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/women/47.jpg",
      tglKeputusan: "2025-10-22T10:00:00+08:00",
    },

    // --- Ditolak ---
    {
      id: 3,
      tanggal: "2025-10-20",
      nama: "Gede Adi Putra",
      jabatan: "IDE | Social Media",
      kategori: "Maag",
      handover:
        "Tanggung jawab perancangan sistem sementara diserahkan ke tim HR agar proyek tetap berjalan.",
      buktiUrl: "/dummy/file3.pdf",
      status: "Ditolak",
      alasan: "Tidak ada surat keterangan dokter.",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/men/51.jpg",
      tglKeputusan: "2025-10-20T16:30:00+08:00",
    },

    // --- Tambahan dummy ---
    {
      id: 5,
      tanggal: "2025-10-18",
      nama: "Komang Dwi Yuliana",
      jabatan: "OPS | CS",
      kategori: "Radang Tenggorokan",
      handover: "Shift sore ditukar dengan Putu Satria. SLA tetap dipenuhi.",
      buktiUrl: "/dummy/file5.pdf",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/women/66.jpg",
      tglKeputusan: null,
    },
    {
      id: 6,
      tanggal: "2025-10-17",
      nama: "I Made Dwi Santosa",
      jabatan: "Support | Helpdesk",
      kategori: "Sakit",
      handover: "Ticket akan di-*auto-assign* ke tim helpdesk lain.",
      buktiUrl: "/dummy/file6.pdf",
      status: "Disetujui",
      alasan: "Lampiran surat dokter lengkap.",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/men/73.jpg",
      tglKeputusan: "2025-10-17T12:05:00+08:00",
    },
    {
      id: 7,
      tanggal: "2025-10-16",
      nama: "Ni Komang Ayu Lestari",
      jabatan: "Sales | B2B",
      kategori: "Pusing",
      handover: "Follow-up klien dipegang Satria.",
      buktiUrl: "/dummy/file7.pdf",
      status: "Ditolak",
      alasan: "Mendekati *quarter closing*, mohon atur ulang.",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/women/21.jpg",
      tglKeputusan: "2025-10-16T17:00:00+08:00",
    },
  ];

  const [data, setData] = useState(initial);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pengajuan"); // 'pengajuan' | 'disetujui' | 'ditolak'

  const filteredData = useMemo(() => {
    // Urutkan terbaru dulu (tanggal)
    const sorted = [...data].sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
    );
    const term = search.toLowerCase();
    const byTab = sorted.filter((d) =>
      tab === "pengajuan"
        ? d.status === "Menunggu"
        : tab === "disetujui"
        ? d.status === "Disetujui"
        : d.status === "Ditolak"
    );
    return byTab.filter((d) =>
      [d.nama, d.jabatan, d.kategori, d.handover, d.tanggal]
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
    message.success("Izin sakit disetujui");
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
    message.success("Izin sakit ditolak");
  }

  function resetDummy() {
    setData(initial);
    setSearch("");
  }

  return {
    data,
    search,
    tab,
    filteredData,
    setSearch,
    setTab,
    handleAlasanChange,
    approve,
    reject,
    resetDummy,
  };
}
