"use client";

import React, { useState, useMemo } from "react";
import { ConfigProvider, Input, Button, Table } from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import StatusComponent from "@/app/components/StatusComponent";

const GOLD = "#003A6F";

export default function IzinJamContent() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([
    {
      id: 1,
      nama: "I Gede Agung Pramana",
      jabatan: "Konsultan | Konsultan",
      tglIzin: "2025-10-25",
      jamMulai: "08:30",
      jamSelesai: "10:00",
      kategori: "Jam extra di hari sama",
      keperluan: "Mengikuti rapat mendadak dengan klien proyek.",
      handover:
        "Tugas administrasi proyek sementara diambil alih oleh Ni Luh Ayu Sari untuk menjaga kelancaran dokumen kerja.",
      bukti: "izin1.pdf",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/men/45.jpg",
      tglPengajuan: "2025-10-23",
    },
    {
      id: 2,
      nama: "Ni Luh Ayu Sari",
      jabatan: "Admission | Admission",
      tglIzin: "2025-10-26",
      jamMulai: "13:00",
      jamSelesai: "16:00",
      kategori: "Mengganti dengan jam saat libur",
      keperluan: "Mengurus keperluan administrasi keluarga.",
      handover:
        "Seluruh aktivitas pelayanan diteruskan kepada Gede Adi selama jam izin berlangsung agar tetap berjalan normal.",
      bukti: "izin2.pdf",
      status: "Disetujui",
      alasan: "",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/women/47.jpg",
      tglPengajuan: "2025-10-22",
    },
    {
      id: 3,
      nama: "Kadek Rian Saputra",
      jabatan: "IDE | Social Media",
      tglIzin: "2025-10-27",
      jamMulai: "09:00",
      jamSelesai: "11:30",
      kategori: "Jam extra di hari sama",
      keperluan: "Membuat konten promosi offline bersama tim marketing.",
      handover:
        "Postingan media sosial dikelola sementara oleh Gede Adi Putra agar jadwal unggahan tidak terganggu.",
      bukti: "izin3.pdf",
      status: "Ditolak",
      alasan: "Tidak ada bukti kehadiran di lokasi promosi.",
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

  // === Filter & Sort ===
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
      title: "Tgl Izin",
      dataIndex: "tglIzin",
      key: "tglIzin",
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
      title: "Jam Mulai",
      dataIndex: "jamMulai",
      key: "jamMulai",
      render: (v) => <span className="text-slate-600">{v}</span>,
    },
    {
      title: "Jam Selesai",
      dataIndex: "jamSelesai",
      key: "jamSelesai",
      render: (v) => <span className="text-slate-600">{v}</span>,
    },
    {
      title: "Kategori",
      dataIndex: "kategori",
      key: "kategori",
      render: (v) => <span className="font-medium text-slate-700">{v}</span>,
    },
    {
      title: "Keperluan",
      dataIndex: "keperluan",
      key: "keperluan",
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
                 !font-normal !text-sm shadow-sm transition-all duration-200"
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
            Pengajuan Izin Jam
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
              Riwayat Izin
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
