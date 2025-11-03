"use client";

import { useMemo, useState } from "react";
import { message } from "antd";

/**
 * ViewModel Dummy – hanya untuk UI
 * Status: "Menunggu" | "Disetujui" | "Ditolak"
 */
export default function useTukarHariViewModel() {
  const initial = [
    // --- Menunggu ---
    {
      id: 1,
      nama: "I Dewa Gede Arsana Puncanganom",
      jabatan: "Konsultan | Divisi Konsultan",
      foto: "https://randomuser.me/api/portraits/men/41.jpg",
      tglPengajuan: "2025-08-05T06:55:00+08:00",
      hariIzin: "Jum, 15 Agt 2025",
      hariPengganti: "Sab, 16 Agt 2025",
      kategori: "Personal Matter",
      keperluan:
        "Tukar libur untuk kebutuhan Gladi Yudisium di Fakultas Teknik dan Kejuruan Undiksha",
      buktiUrl: "/dummy/IMG_5464.png",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      tglKeputusan: null,
    },
    {
      id: 2,
      nama: "Ni Luh Ayu Sari",
      jabatan: "Admission | Admission",
      foto: "https://randomuser.me/api/portraits/women/47.jpg",
      tglPengajuan: "2025-10-21T09:30:00+08:00",
      hariIzin: "Rab, 29 Okt 2025",
      hariPengganti: "Min, 02 Nov 2025",
      kategori: "Company Impact",
      keperluan:
        "Penyesuaian jadwal kerja untuk kegiatan promosi di luar kantor.",
      buktiUrl: "/dummy/bukti2.pdf",
      status: "Disetujui",
      tempAlasan: "",
      tglKeputusan: "2025-10-22T10:12:00+08:00",
    },
    {
      id: 3,
      nama: "Kadek Rian Saputra",
      jabatan: "IDE | Social Media",
      foto: "https://randomuser.me/api/portraits/men/46.jpg",
      tglPengajuan: "2025-10-19T14:00:00+08:00",
      hariIzin: "Jum, 31 Okt 2025",
      hariPengganti: "Sab, 08 Nov 2025",
      kategori: "Personal Matter",
      keperluan: "Mengurus dokumen penting di instansi pemerintahan.",
      buktiUrl: "/dummy/bukti3.pdf",
      status: "Ditolak",
      alasan: "Belum melampirkan bukti pendukung.",
      tempAlasan: "",
      tglKeputusan: "2025-10-20T16:36:00+08:00",
    },
    {
      id: 4,
      nama: "Putu Wira Mahendra",
      jabatan: "Finance | Accounting",
      foto: "https://randomuser.me/api/portraits/men/32.jpg",
      tglPengajuan: "2025-10-18T10:00:00+08:00",
      hariIzin: "Kam, 30 Okt 2025",
      hariPengganti: "Sab, 09 Nov 2025",
      kategori: "Personal Matter",
      keperluan: "Kondisi keluarga, diperlukan perjalanan ke luar kota.",
      buktiUrl: "/dummy/bukti4.pdf",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      tglKeputusan: null,
    },
    {
      id: 5,
      nama: "Made Ayu Kartika",
      jabatan: "HR | Recruitment",
      foto: "https://randomuser.me/api/portraits/women/25.jpg",
      tglPengajuan: "2025-10-18T11:35:00+08:00",
      hariIzin: "Sel, 28 Okt 2025",
      hariPengganti: "Sab, 01 Nov 2025",
      kategori: "Company Impact",
      keperluan:
        "Mengikuti job fair kampus sebagai perwakilan perusahaan.",
      buktiUrl: "/dummy/bukti5.pdf",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      tglKeputusan: null,
    },
    {
      id: 6,
      nama: "Gusti Ngurah Pradnyana",
      jabatan: "IT | Infra",
      foto: "https://randomuser.me/api/portraits/men/12.jpg",
      tglPengajuan: "2025-10-17T09:00:00+08:00",
      hariIzin: "Sen, 27 Okt 2025",
      hariPengganti: "Sab, 01 Nov 2025",
      kategori: "Personal Matter",
      keperluan:
        "Urus perpanjangan dokumen resmi yang hanya buka hari kerja.",
      buktiUrl: "/dummy/bukti6.pdf",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      tglKeputusan: null,
    },

    // --- Disetujui ---
    {
      id: 7,
      nama: "I Kadek Yoga Pramana",
      jabatan: "Marketing | Content",
      foto: "https://randomuser.me/api/portraits/men/14.jpg",
      tglPengajuan: "2025-10-10T08:40:00+08:00",
      hariIzin: "Sel, 21 Okt 2025",
      hariPengganti: "Sab, 25 Okt 2025",
      kategori: "Personal Matter",
      keperluan: "Kontrol kesehatan orang tua.",
      buktiUrl: "/dummy/bukti7.pdf",
      status: "Disetujui",
      tempAlasan: "",
      tglKeputusan: "2025-10-11T15:10:00+08:00",
    },
    {
      id: 8,
      nama: "Komang Dwi Yuliana",
      jabatan: "OPS | CS",
      foto: "https://randomuser.me/api/portraits/women/66.jpg",
      tglPengajuan: "2025-10-12T14:20:00+08:00",
      hariIzin: "Kam, 23 Okt 2025",
      hariPengganti: "Min, 26 Okt 2025",
      kategori: "Company Impact",
      keperluan: "Bantu event partner (stand perusahaan).",
      buktiUrl: "/dummy/bukti8.pdf",
      status: "Disetujui",
      tempAlasan: "",
      tglKeputusan: "2025-10-13T10:00:00+08:00",
    },
    {
      id: 9,
      nama: "I Gede Agus Mahendra",
      jabatan: "Developer | Web",
      foto: "https://randomuser.me/api/portraits/men/50.jpg",
      tglPengajuan: "2025-10-09T10:00:00+08:00",
      hariIzin: "Jum, 24 Okt 2025",
      hariPengganti: "Sab, 25 Okt 2025",
      kategori: "Personal Matter",
      keperluan: "Urus dokumen kendaraan.",
      buktiUrl: "/dummy/bukti9.pdf",
      status: "Disetujui",
      tempAlasan: "",
      tglKeputusan: "2025-10-10T09:35:00+08:00",
    },

    // --- Ditolak ---
    {
      id: 10,
      nama: "Ni Kadek Raras Pertiwi",
      jabatan: "Finance | Tax",
      foto: "https://randomuser.me/api/portraits/women/68.jpg",
      tglPengajuan: "2025-10-08T16:00:00+08:00",
      hariIzin: "Sen, 20 Okt 2025",
      hariPengganti: "Sab, 24 Okt 2025",
      kategori: "Personal Matter",
      keperluan: "Ada keperluan keluarga.",
      buktiUrl: "/dummy/bukti10.pdf",
      status: "Ditolak",
      alasan: "Periode closing, mohon jadwal ulang.",
      tempAlasan: "",
      tglKeputusan: "2025-10-09T11:10:00+08:00",
    },
    {
      id: 11,
      nama: "I Kadek Surya Dinata",
      jabatan: "OPS | Logistik",
      foto: "https://randomuser.me/api/portraits/men/71.jpg",
      tglPengajuan: "2025-10-07T12:30:00+08:00",
      hariIzin: "Rab, 22 Okt 2025",
      hariPengganti: "Sab, 01 Nov 2025",
      kategori: "Personal Matter",
      keperluan: "Mengurus pindah tempat tinggal.",
      buktiUrl: "/dummy/bukti11.pdf",
      status: "Ditolak",
      alasan: "Bukti alamat belum lengkap.",
      tempAlasan: "",
      tglKeputusan: "2025-10-08T09:20:00+08:00",
    },

    // --- Tambahan dummy agar list panjang ---
    {
      id: 12,
      nama: "Putu Satria Nugraha",
      jabatan: "Developer | Mobile",
      foto: "https://randomuser.me/api/portraits/men/21.jpg",
      tglPengajuan: "2025-10-06T09:15:00+08:00",
      hariIzin: "Kam, 16 Okt 2025",
      hariPengganti: "Sab, 18 Okt 2025",
      kategori: "Personal Matter",
      keperluan: "Urus SIM.",
      buktiUrl: "/dummy/bukti12.pdf",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      tglKeputusan: null,
    },
    {
      id: 13,
      nama: "Ni Komang Ayu Lestari",
      jabatan: "Sales | B2B",
      foto: "https://randomuser.me/api/portraits/women/21.jpg",
      tglPengajuan: "2025-10-05T10:00:00+08:00",
      hariIzin: "Sel, 14 Okt 2025",
      hariPengganti: "Sab, 17 Okt 2025",
      kategori: "Company Impact",
      keperluan: "Pra-presentasi ke calon klien.",
      buktiUrl: "/dummy/bukti13.pdf",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      tglKeputusan: null,
    },
    {
      id: 14,
      nama: "I Made Dwi Santosa",
      jabatan: "Support | Helpdesk",
      foto: "https://randomuser.me/api/portraits/men/73.jpg",
      tglPengajuan: "2025-10-04T15:20:00+08:00",
      hariIzin: "Jum, 17 Okt 2025",
      hariPengganti: "Sab, 25 Okt 2025",
      kategori: "Personal Matter",
      keperluan: "Kontrol kesehatan pribadi.",
      buktiUrl: "/dummy/bukti14.pdf",
      status: "Disetujui",
      tempAlasan: "",
      tglKeputusan: "2025-10-05T09:10:00+08:00",
    },
    {
      id: 15,
      nama: "Ni Luh Desi Paramita",
      jabatan: "Design | UI/UX",
      foto: "https://randomuser.me/api/portraits/women/12.jpg",
      tglPengajuan: "2025-10-03T08:45:00+08:00",
      hariIzin: "Sel, 21 Okt 2025",
      hariPengganti: "Sab, 31 Okt 2025",
      kategori: "Personal Matter",
      keperluan: "Acara keluarga.",
      buktiUrl: "/dummy/bukti15.pdf",
      status: "Ditolak",
      alasan: "Bertabrakan dengan usability test.",
      tempAlasan: "",
      tglKeputusan: "2025-10-04T13:00:00+08:00",
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
        d.hariIzin,
        d.hariPengganti,
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
              alasan: it.tempAlasan || it.alasan, // tetap simpan jika ada
              tempAlasan: "",
              tglKeputusan: new Date().toISOString(),
            }
          : it
      )
    );
    message.success("Pengajuan disetujui");
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
    message.success("Pengajuan ditolak");
  }

  function resetDummy() {
    setData(initial);
    setSearch("");
  }

  return {
    // state
    data,
    search,
    tab,
    filteredData,
    // setters
    setSearch,
    setTab,
    // actions
    handleAlasanChange,
    approve,
    reject,
    resetDummy,
  };
}
