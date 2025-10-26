import {
  ConfigProvider,
  Input,
  Button,
  Table,
} from "antd";
import { SearchOutlined, FileTextOutlined, CalendarOutlined, } from "@ant-design/icons";
import { useState } from "react";
import StatusComponent from "@/app/components/StatusComponent";

const GOLD = "#003A6F";

export default function SakitContent() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([
    {
      id: 1,
      tanggal: "2025-10-23",
      nama: "I Gede Agung Pramana",
      jabatan: "Konsultan | Konsultan",
      kategori: "Demam",
      handover:
        "Tugas proyek minggu ini dilanjutkan oleh Ni Luh Ayu Sari, pastikan laporan harian tetap diperbarui setiap sore melalui sistem internal.",
      bukti: "file1.pdf",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/men/45.jpg",
    },
    {
      id: 2,
      tanggal: "2025-10-22",
      nama: "Ni Luh Ayu Sari",
      jabatan: "Admission | Admission",
      kategori: "Flu/Pilek",
      handover:
        "Seluruh pekerjaan administrasi pasien diteruskan kepada Gede Adi, termasuk rekap data mingguan dan verifikasi dokumen yang tertunda.",
      bukti: "file2.pdf",
      status: "Disetujui",
      alasan: "",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/women/47.jpg",
    },
    {
      id: 3,
      tanggal: "2025-10-20",
      nama: "Gede Adi Putra",
      jabatan: "IDE | Social Media",
      kategori: "Maag",
      handover:
        "Tanggung jawab perancangan sistem sementara diserahkan kepada tim HR untuk memastikan proyek tetap berjalan sesuai rencana kerja mingguan.",
      bukti: "file3.pdf",
      status: "Ditolak",
      alasan: "Tidak ada surat keterangan dokter",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/men/51.jpg",
    },
    {
      id: 4,
      tanggal: "2025-10-19",
      nama: "Kadek Rian Saputra",
      jabatan: "Admission | Admission",
      kategori: "Sakit Kepala",
      handover:
        "Analisis data penjualan diteruskan ke Komang Dewi agar laporan kuartal dapat selesai tepat waktu dan tidak ada kendala dalam input sistem.",
      bukti: "file4.pdf",
      status: "Menunggu",
      alasan: "",
      tempAlasan: "",
      foto: "https://randomuser.me/api/portraits/men/46.jpg",
    },
  ]);

  // === Urutkan berdasarkan tanggal terbaru ===
  const sortedData = [...data].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

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

  // === Filter pencarian ===
  const filteredData = sortedData.filter((item) =>
    Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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
            <div className="font-semibold text-base text-slate-800">
              {record.nama}
            </div>
            <div className="text-sm text-slate-500">{record.jabatan}</div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
              <CalendarOutlined />
              {new Date(record.tanggal).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Kategori Sakit",
      dataIndex: "kategori",
      key: "kategori",
      render: (v) => (
        <span className="font-medium text-base text-slate-700">{v}</span>
      ),
    },
    {
      title: "Handover",
      dataIndex: "handover",
      key: "handover",
      render: (v) => <span className="text-base text-slate-600">{v}</span>,
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
            Pengajuan Izin Sakit
          </h1>
          <div className="flex items-center gap-2">
            <Input
              allowClear
              placeholder="Cari …"
              prefix={<SearchOutlined className="text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-xl text-base"
              size="large"
            />
            <Button
              type="default"
              size="large"
              className="rounded-xl !bg-white !text-slate-700 
                         !border !border-slate-300 hover:!bg-slate-50 
                         !font-medium !text-base"
            >
              Riwayat Izin Sakit
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
