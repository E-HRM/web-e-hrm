"use client";

import React, { useState, useMemo } from "react";
import { ConfigProvider, Input, Button, Table } from "antd";
import { SearchOutlined, FileTextOutlined, CalendarOutlined } from "@ant-design/icons";
import StatusComponent from "@/app/components/StatusComponent";

const GOLD = "#003A6F";

export default function TukarHariContent() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([
    {
      id: 1,
      nama: "I Gede Agung Pramana",
      jabatan: "Konsultan | Konsultan",
      hariIzin: "Senin, 27 Okt 2025",
      hariPengganti: "Sabtu, 1 Nov 2025",
      kategori: "Personal Matter",
      keperluan:
        "Menghadiri acara keluarga di luar kota, tidak memungkinkan untuk bekerja di hari izin.",
      bukti: "bukti1.pdf",
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
      hariIzin: "Rabu, 29 Okt 2025",
      hariPengganti: "Minggu, 2 Nov 2025",
      kategori: "Company Impact",
      keperluan:
        "Penyesuaian jadwal kerja untuk kegiatan promosi di luar kantor.",
      bukti: "bukti2.pdf",
      status: "Disetujui",
      alasan: "",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/women/47.jpg",
      tglPengajuan: "2025-10-21",
    },
    {
      id: 3,
      nama: "Kadek Rian Saputra",
      jabatan: "IDE | Social Media",
      hariIzin: "Jumat, 31 Okt 2025",
      hariPengganti: "Sabtu, 8 Nov 2025",
      kategori: "Personal Matter",
      keperluan:
        "Mengurus dokumen penting pribadi di instansi pemerintahan.",
      bukti: "bukti3.pdf",
      status: "Ditolak",
      alasan: "Belum melampirkan bukti pendukung.",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/men/46.jpg",
      tglPengajuan: "2025-10-19",
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
      title: "Hari Izin",
      dataIndex: "hariIzin",
      key: "hariIzin",
      render: (v) => <span className="text-slate-600">{v}</span>,
    },
    {
      title: "Hari Pengganti",
      dataIndex: "hariPengganti",
      key: "hariPengganti",
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
            Pengajuan Izin Tukar Hari
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
