"use client";

import { useMemo, useState } from "react";
import { message } from "antd";

/**
 * ViewModel Dummy – hanya untuk UI Cuti
 * Status: "Menunggu" | "Disetujui" | "Ditolak"
 */
export default function useCutiViewModel() {
  const initial = [
    // --- Menunggu ---
    {
      id: 1,
      nama: "I Gede Agung Pramana",
      jabatan: "Konsultan | Konsultan",
      foto: "https://randomuser.me/api/portraits/men/45.jpg",
      jenisCuti: "Cuti Tahunan",
      tglPengajuan: "2025-10-23T09:10:00+08:00",
      tglMulai: "2025-10-25",
      tglMasuk: "2025-10-30",
      keterangan: "Cuti tahunan untuk berlibur ke luar kota.",
      handover:
        "Proyek konsultasi sementara dilanjutkan oleh Ni Luh Ayu Sari. Laporan harian tetap dikirim ke supervisor.",
      buktiUrl: "/dummy/file1.pdf",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      tglKeputusan: null,
    },
    {
      id: 4,
      nama: "Kadek Rian Saputra",
      jabatan: "IDE | Social Media",
      foto: "https://randomuser.me/api/portraits/men/46.jpg",
      jenisCuti: "Cuti Tahunan",
      tglPengajuan: "2025-10-20T11:05:00+08:00",
      tglMulai: "2025-10-24",
      tglMasuk: "2025-10-29",
      keterangan: "Mengambil waktu istirahat untuk berlibur.",
      handover:
        "Konten minggu ini di-*schedule*. Monitoring harian dibantu Komang Dewi.",
      buktiUrl: "/dummy/file4.pdf",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      tglKeputusan: null,
    },
    // --- Disetujui ---
    {
      id: 2,
      nama: "Ni Luh Ayu Sari",
      jabatan: "Admission | Admission",
      foto: "https://randomuser.me/api/portraits/women/47.jpg",
      jenisCuti: "Cuti Menikah",
      tglPengajuan: "2025-10-22T14:20:00+08:00",
      tglMulai: "2025-10-27",
      tglMasuk: "2025-11-03",
      keterangan: "Persiapan dan pelaksanaan upacara pernikahan.",
      handover:
        "Seluruh pekerjaan administrasi diteruskan kepada Gede Adi, termasuk verifikasi data.",
      buktiUrl: "/dummy/file2.pdf",
      status: "Disetujui",
      alasan: "",
      tempAlasan: "",
      tglKeputusan: "2025-10-23T10:05:00+08:00",
    },
    // --- Ditolak ---
    {
      id: 3,
      nama: "Gede Adi Putra",
      jabatan: "IDE | IT",
      foto: "https://randomuser.me/api/portraits/men/51.jpg",
      jenisCuti: "Cuti Kedukaan",
      tglPengajuan: "2025-10-21T08:00:00+08:00",
      tglMulai: "2025-10-20",
      tglMasuk: "2025-10-22",
      keterangan: "Menghadiri upacara pengabenan keluarga dekat.",
      handover:
        "Tiket dukungan dialihkan ke tim helpdesk, prioritas insiden tetap dipantau.",
      buktiUrl: "/dummy/file3.pdf",
      status: "Ditolak",
      alasan: "Tidak melampirkan surat keterangan kedukaan.",
      tempAlasan: "",
      tglKeputusan: "2025-10-21T16:10:00+08:00",
    },
    // --- Tambahan: memperbanyak dummy (biar tabel panjang) ---
    {
      id: 5,
      nama: "Komang Dwi Yuliana",
      jabatan: "OPS | CS",
      foto: "https://randomuser.me/api/portraits/women/66.jpg",
      jenisCuti: "Cuti Tahunan",
      tglPengajuan: "2025-10-19T15:10:00+08:00",
      tglMulai: "2025-10-28",
      tglMasuk: "2025-11-01",
      keterangan: "Rehat sejenak bersama keluarga.",
      handover: "Shift sore ditukar dengan Putu Satria.",
      buktiUrl: "/dummy/file5.pdf",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      tglKeputusan: null,
    },
    {
      id: 6,
      nama: "I Made Dwi Santosa",
      jabatan: "Support | Helpdesk",
      foto: "https://randomuser.me/api/portraits/men/73.jpg",
      jenisCuti: "Cuti Sakit",
      tglPengajuan: "2025-10-18T09:00:00+08:00",
      tglMulai: "2025-10-19",
      tglMasuk: "2025-10-22",
      keterangan: "Pemulihan pasca perawatan.",
      handover: "Ticket akan di-*auto-assign* ke tim helpdesk lain.",
      buktiUrl: "/dummy/file6.pdf",
      status: "Disetujui",
      alasan: "Lampiran surat dokter lengkap.",
      tempAlasan: "",
      tglKeputusan: "2025-10-18T12:05:00+08:00",
    },
    {
      id: 7,
      nama: "Ni Komang Ayu Lestari",
      jabatan: "Sales | B2B",
      foto: "https://randomuser.me/api/portraits/women/21.jpg",
      jenisCuti: "Cuti Pribadi",
      tglPengajuan: "2025-10-17T10:30:00+08:00",
      tglMulai: "2025-10-26",
      tglMasuk: "2025-10-29",
      keterangan: "Keperluan keluarga mendesak.",
      handover: "Follow-up klien dipegang Satria.",
      buktiUrl: "/dummy/file7.pdf",
      status: "Ditolak",
      alasan: "Mendekati *quarter closing*, mohon atur ulang.",
      tempAlasan: "",
      tglKeputusan: "2025-10-17T17:00:00+08:00",
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
        d.jenisCuti,
        d.keterangan,
        d.handover,
        d.tglMulai,
        d.tglMasuk,
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
    message.success("Pengajuan cuti disetujui");
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
    message.success("Pengajuan cuti ditolak");
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
