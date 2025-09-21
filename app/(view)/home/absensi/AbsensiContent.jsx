"use client";

import { useMemo } from "react";
import {
  Typography,
  DatePicker,
  Select,
  Input,
  Table,
  Tag,
  Button,
  Card,
  Empty,
} from "antd";
import { SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import useAbsensiViewModel from "./useAbsensiViewModel";

const { Title } = Typography;

function Avatar({ src, alt }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt || ""} className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200" />;
  }
  return (
    <div className="w-7 h-7 rounded-full ring-1 ring-gray-300 bg-slate-200 grid place-items-center">
      <span className="text-[11px] leading-none text-slate-600 font-semibold">?</span>
    </div>
  );
}

const statusTag = (s) => {
  const key = String(s || "").toLowerCase();
  if (key.includes("tepat"))   return <Tag color="green">Tepat Waktu</Tag>;
  if (key.includes("lambat"))  return <Tag color="red">Terlambat</Tag>;
  if (key.includes("lembur"))  return <Tag color="orange">Lembur</Tag>;
  if (key.includes("izin"))    return <Tag color="geekblue">Izin</Tag>;
  if (key.includes("sakit"))   return <Tag color="purple">Sakit</Tag>;
  return <Tag>{s || "-"}</Tag>;
};

function AttendanceCard({
  title,
  rows,
  loading,
  divisiOptions,
  statusOptions,
  filters,
  setFilters,
  dateValue,
  setDateValue,
  jamColumnTitle,
}) {
  const columns = [
    {
      title: "Tanggal",
      dataIndex: "tanggal",
      width: 130,
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Nama Karyawan",
      dataIndex: ["user", "nama_pengguna"],
      width: 320,
      render: (t, r) => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={r.user?.foto_profil_user} alt={t} />
          <span className="font-medium whitespace-nowrap">{t || r.nama || "-"}</span>
        </div>
      ),
    },
    {
      title: "Divisi",
      dataIndex: ["user", "departement", "nama_departement"],
      width: 200,
      render: (v) => v || "-",
    },
    { title: jamColumnTitle, dataIndex: "jam", width: 140, render: (v) => v || "-" },
    { title: "Status", dataIndex: "status_label", width: 160, render: statusTag },
  ];

  const data = useMemo(() => {
    // Sesuaikan mapping dengan payload backend /api/absensi/records
    return (rows || []).map((r) => ({
      ...r,
      jam: r.jam ?? r.jam_masuk ?? r.jam_pulang ?? null,
      status_label: r.status_label ?? r.status ?? null,
    }));
  }, [rows]);

  const statOnTime = data.filter((r) => /tepat/i.test(r.status_label)).length;
  const statLate   = data.filter((r) => /lambat/i.test(r.status_label)).length;
  const statOver   = data.filter((r) => /lembur/i.test(r.status_label)).length;

  return (
    <Card className="surface-card p-0">
      <div className="px-4 md:px-5 pt-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <Title level={4} className="!m-0">{title}</Title>
            <div className="mt-1 text-sm text-slate-500">
              Tanggal:{" "}
              <span className="text-slate-700 font-medium">
                {dateValue ? dayjs(dateValue).format("DD MMM YYYY") : "-"}
              </span>{" "}
              • Baris: <span className="text-slate-700 font-medium">{data.length}</span>
            </div>
          </div>
          <Button icon={<DownloadOutlined />} disabled>Export</Button>
        </div>

        <div className="mt-3 grid grid-cols-1 lg:grid-cols-4 gap-2">
          <DatePicker className="w-full" value={dateValue} onChange={setDateValue} placeholder="Pilih tanggal" />
          <Select
            allowClear
            placeholder="Divisi"
            className="w-full"
            value={filters.divisi}
            onChange={(v) => setFilters((p) => ({ ...p, divisi: v }))}
            options={divisiOptions}
          />
          <Select
            allowClear
            placeholder="Status"
            className="w-full"
            value={filters.status}
            onChange={(v) => setFilters((p) => ({ ...p, status: v }))}
            options={statusOptions}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search nama/divisi"
            value={filters.q}
            onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
          />
        </div>
      </div>

      <div className="px-2 md:px-3 pb-4 mt-2">
        <Table
          rowKey={(r) => r.id_absensi || r.id || `${r.user?.id_user}-${r.tanggal}`}
          size="small"
          loading={loading}
          locale={{ emptyText: <Empty description="Belum ada data" /> }}
          scroll={{ x: "max-content" }}
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          className="
            [&_.ant-table-container]:!rounded-2xl
            [&_.ant-table]:!border [&_.ant-table]:!border-slate-200
            [&_.ant-table-thead_th]:!bg-slate-50
            [&_.ant-table-thead_th]:!font-semibold
            [&_.ant-table-thead_th]:!text-slate-600
            [&_.ant-table-thead_th]:!py-2
            [&_.ant-table-tbody_td]:!py-2
            [&_.ant-table-tbody_tr:hover_td]:!bg-slate-50
          "
        />
      </div>
    </Card>
  );
}

export default function AbsensiContent() {
  const vm = useAbsensiViewModel();

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 space-y-6">
      <AttendanceCard
        title="Absensi Kedatangan Karyawan"
        rows={vm.kedatangan}
        loading={vm.loadingIn}
        divisiOptions={vm.divisiOptions}
        statusOptions={vm.statusOptionsIn}
        filters={vm.filterIn}
        setFilters={vm.setFilterIn}
        dateValue={vm.dateIn}
        setDateValue={vm.setDateIn}
        jamColumnTitle="Jam Kedatangan"
      />

      <AttendanceCard
        title="Absensi Kepulangan Karyawan"
        rows={vm.kepulangan}
        loading={vm.loadingOut}
        divisiOptions={vm.divisiOptions}
        statusOptions={vm.statusOptionsOut}
        filters={vm.filterOut}
        setFilters={vm.setFilterOut}
        dateValue={vm.dateOut}
        setDateValue={vm.setDateOut}
        jamColumnTitle="Jam Kepulangan"
      />
    </div>
  );
}
