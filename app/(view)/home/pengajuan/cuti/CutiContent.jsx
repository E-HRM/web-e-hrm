"use client";

import React, { useState, useMemo } from "react";
import { ConfigProvider, Input, Button, Table } from "antd";
import { SearchOutlined, FileTextOutlined, CalendarOutlined, } from "@ant-design/icons";
import StatusComponent from "@/app/components/StatusComponent";

const GOLD = "#003A6F";

export default function CutiContent() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([
    {
      id: 1,
      nama: "I Gede Agung Pramana",
      jabatan: "Konsultan | Konsultan",
      jenisCuti: "Cuti Tahunan",
      tglMulai: "2025-10-25",
      tglMasuk: "2025-10-30",
      keterangan: "Cuti tahunan untuk berlibur ke luar kota.",
      handover:
        "Proyek konsultasi sementara dilanjutkan oleh Ni Luh Ayu Sari. Semua laporan harian tetap dikirimkan ke email supervisor.",
      bukti: "file1.pdf",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/men/45.jpg",
      tglPengajuan: "2025-10-23",
    },
    {
      id: 2,
      nama: "Ni Luh Ayu Sari",
      jabatan: " Admission | Admission",
      jenisCuti: "Cuti Menikah",
      tglMulai: "2025-10-27",
      tglMasuk: "2025-11-03",
      keterangan: "Persiapan dan pelaksanaan upacara pernikahan.",
      handover:
        "Seluruh pekerjaan administrasi pasien diteruskan kepada Gede Adi, termasuk verifikasi data dan pengarsipan dokumen.",
      bukti: "file2.pdf",
      status: "Disetujui",
      alasan: "",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/women/47.jpg",
      tglPengajuan: "2025-10-22",
    },
    {
      id: 3,
      nama: "Gede Adi Putra",
      jabatan: " IDE | IT",
      jenisCuti: "Cuti Kedukaan",
      tglMulai: "2025-10-20",
      tglMasuk: "2025-10-22",
      keterangan: "Menghadiri upacara pengabenan keluarga dekat.",
      handover:
        "Pekerjaan perancangan sistem sementara diambil alih oleh tim HR untuk memastikan proyek tetap berjalan.",
      bukti: "file3.pdf",
      status: "Ditolak",
      alasan: "Tidak melampirkan surat keterangan kedukaan.",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/men/51.jpg",
      tglPengajuan: "2025-10-21",
    },
    {
      id: 4,
      nama: "Kadek Rian Saputra",
      jabatan: " IDE | Social Media",
      jenisCuti: "Cuti Tahunan",
      tglMulai: "2025-10-24",
      tglMasuk: "2025-10-29",
      keterangan: "Mengambil waktu istirahat untuk berlibur.",
      handover:
        "Analisis data penjualan diteruskan ke Komang Dewi agar laporan kuartal dapat selesai tepat waktu.",
      bukti: "file4.pdf",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/men/46.jpg",
      tglPengajuan: "2025-10-20",
    },
  ]);

  // === Handler Status ===
  const handleStatusChange = (val, record) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === record.id
          ? { ...item, status: val, alasan: "", tempAlasan: "" }
          : item
      )
    );
  };

  const handleAlasanChange = (id, value) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, tempAlasan: value } : item
      )
    );
  };

  const handleSaveAlasan = (id) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, alasan: item.tempAlasan, tempAlasan: "" }
          : item
      )
    );
  };

  // === Sorting dan Filter ===
  const filteredData = useMemo(() => {
    return data
      .filter((item) =>
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort(
        (a, b) =>
          new Date(b.tglPengajuan).getTime() -
          new Date(a.tglPengajuan).getTime()
      );
  }, [search, data]);

  // === Kolom Tabel ===
  const columns = [
  {
  title: "Karyawan",
  dataIndex: "nama",
  key: "nama",
  width: 280,
  render: (_, record) => (
    <div className="flex items-center gap-3">
      <img
        src={record.foto}
        alt="foto"
        className="w-10 h-10 rounded-full object-cover"
      />
      <div>
        <div className="font-medium text-base text-slate-800">
          {record.nama}
        </div>
        <div className="text-sm text-slate-500">{record.jabatan}</div>

        {/* === Tambahan tanggal pengajuan di bawah jabatan === */}
        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
          <CalendarOutlined />
          <span>
            {new Date(record.tglPengajuan).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  ),
},
    {
      title: "Jenis Cuti",
      dataIndex: "jenisCuti",
      key: "jenisCuti",
      render: (v) => <span className="font-medium text-slate-700">{v}</span>,
    },
    {
      title: "Tgl Mulai Cuti",
      dataIndex: "tglMulai",
      key: "tglMulai",
      render: (v) => (
        <span className="text-slate-600">
          {new Date(v).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      title: "Tgl Masuk Kerja",
      dataIndex: "tglMasuk",
      key: "tglMasuk",
      render: (v) => (
        <span className="text-slate-600">
          {new Date(v).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      title: "Keterangan",
      dataIndex: "keterangan",
      key: "keterangan",
      render: (v) => <span className="text-slate-600">{v}</span>,
    },
    {
      title: "Handover Pekerjaan",
      dataIndex: "handover",
      key: "handover",
       width: 250,
      render: (v) => <span className="text-slate-600">{v}</span>,
    },
      {
      title: "Bukti",
      dataIndex: "bukti",
      key: "bukti",
      render: (_, record) => (
        <Button
          icon={<FileTextOutlined />}
          size="middle"
          className="!rounded-lg !border-none 
                 !bg-[#E8F6FF] !text-[#003A6F] 
                 hover:!bg-[#99D7FF]/40 hover:!text-[#184c81]
                 !font-reguler !text-sm shadow-sm transition-all duration-200"
          onClick={() => window.open(`/path/to/${record.bukti}`, "_blank")}
        >
          Lihat
        </Button>
      ),
    },
    {
      title: "Aksi",
      key: "aksi",
       width: 100,
      render: (_, record) => (
        <StatusComponent
          record={record}
          handleStatusChange={handleStatusChange}
          handleAlasanChange={handleAlasanChange}
          handleSaveAlasan={handleSaveAlasan}
        />
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: GOLD,
          borderRadius: 12,
        },
      }}
    >
      <div className="p-6">
        {/* HEADER */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900 flex-1">
            Pengajuan Cuti
          </h1>
          <div className="flex items-center gap-2">
            <Input
              allowClear
              placeholder="Cari..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-xl"
              size="large"
            />
            <Button
              type="default"
              size="large"
              className="rounded-xl !bg-white !text-slate-700 !border !border-slate-300 hover:!bg-slate-50"
            >
              Riwayat Cuti
            </Button>
          </div>
        </div>

        {/* TABLE */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
          <div className="p-4 min-w-[1000px]">
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              pagination={{
                pageSize: 5,
                showSizeChanger: false,
              }}
              className="!bg-transparent [&_.ant-table-container]:!bg-transparent
                         [&_.ant-table-thead>tr>th]:!bg-slate-50 [&_.ant-table-thead>tr>th]:!text-slate-600
                         [&_.ant-table-tbody>tr>td]:!bg-white"
            />
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
