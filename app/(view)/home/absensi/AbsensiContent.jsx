"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Typography,
  DatePicker,
  Select,
  Input,
  Table,
  Tag,
  Button,
  Card,
  Space,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import useAbsensiViewModel from "./useAbsensiViewModel";

const { Title } = Typography;

// avatar default (siluet ?)
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
  if (key.includes("terlamb")) return <Tag color="red">Terlambat</Tag>;
  if (key.includes("lembur"))  return <Tag color="orange">Lembur</Tag>;
  if (key.includes("izin"))    return <Tag color="geekblue">Izin</Tag>;
  if (key.includes("sakit"))   return <Tag color="purple">Sakit</Tag>;
  return <Tag>{s || "-"}</Tag>;
};

function AttendanceCard({
  title,
  rows,
  divisiOptions,
  statusOptions,
  jamColumnTitle,
}) {
  // ====== FILTERS ======
  const [selectedDate, setSelectedDate] = useState(dayjs()); // default: hari ini
  const [divisi, setDivisi] = useState();
  const [status, setStatus] = useState();
  const [q, setQ] = useState("");

  // ====== (opsional) kerangka realtime: SSE/WebSocket ======
  // Nanti tinggal ganti URL sesuai backend (disable saja kalau belum ada)
  // const [liveRows, setLiveRows] = useState([]);
  // useEffect(() => {
  //   const dateKey = selectedDate?.format("YYYY-MM-DD");
  //   if (!dateKey) return;
  //   const es = new EventSource(`/api/attendance/stream?date=${dateKey}`);
  //   es.onmessage = (e) => {
  //     const delta = JSON.parse(e.data); // {id, ...baris baru/terupdate}
  //     setLiveRows((prev) => {
  //       const idx = prev.findIndex((x) => x.id === delta.id);
  //       if (idx >= 0) { const copy = prev.slice(); copy[idx] = delta; return copy; }
  //       return [delta, ...prev];
  //     });
  //   };
  //   es.onerror = () => es.close();
  //   return () => es.close();
  // }, [selectedDate]);

  const data = useMemo(() => {
    let out = rows || [];

    // tanggal (single day)
    if (selectedDate) {
      out = out.filter((r) => dayjs(r.tanggal).isSame(selectedDate, "day"));
    }

    // divisi
    if (divisi) {
      out = out.filter(
        (r) => String(r.divisi).toLowerCase() === String(divisi).toLowerCase()
      );
    }

    // status
    if (status) {
      const s = String(status).toLowerCase();
      out = out.filter((r) => String(r.status).toLowerCase().includes(s));
    }

    // search
    if (q.trim()) {
      const s = q.toLowerCase();
      out = out.filter(
        (r) =>
          String(r.nama).toLowerCase().includes(s) ||
          String(r.divisi).toLowerCase().includes(s)
      );
    }

    // // gabungkan realtime delta (opsional)
    // if (liveRows.length) {
    //   const byId = new Map(out.map((x) => [x.id, x]));
    //   liveRows.forEach((d) => byId.set(d.id, d));
    //   out = Array.from(byId.values());
    // }

    return out;
  }, [rows, selectedDate, divisi, status, q /*, liveRows*/]);

  const columns = [
    {
      title: "Tanggal",
      dataIndex: "tanggal",
      key: "tanggal",
      width: 130,
      render: (v) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Nama Karyawan",
      dataIndex: "nama",
      key: "nama",
      width: 320,
      render: (t, r) => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={r.avatar} alt={t} />
          <span className="font-medium whitespace-nowrap">{t}</span>
        </div>
      ),
    },
    { title: "Divisi", dataIndex: "divisi", key: "divisi", width: 180 },
    { title: jamColumnTitle, dataIndex: "jam", key: "jam", width: 140 },
    { title: "Status", dataIndex: "status", key: "status", width: 160, render: statusTag },
  ];

  const statOnTime = data.filter((r) => /tepat/i.test(r.status)).length;
  const statLate   = data.filter((r) => /lambat/i.test(r.status)).length;
  const statOver   = data.filter((r) => /lembur/i.test(r.status)).length;

  return (
    <Card className="surface-card p-0">
      {/* header */}
      <div className="px-4 md:px-5 pt-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <Title level={4} className="!m-0">{title}</Title>
            <div className="mt-1 text-sm text-slate-500">
              Tanggal:{" "}
              <span className="text-slate-700 font-medium">
                {selectedDate ? selectedDate.format("DD MMM YYYY") : "-"}
              </span>{" "}
              • Baris: <span className="text-slate-700 font-medium">{data.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 mr-2">
              <Tag color="green">Tepat: {statOnTime}</Tag>
              <Tag color="red">Terlambat: {statLate}</Tag>
              <Tag color="orange">Lembur: {statOver}</Tag>
            </div>
            <Button icon={<DownloadOutlined />} disabled>
              Export
            </Button>
          </div>
        </div>

        {/* toolbar filters */}
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-4 gap-2">
          <DatePicker
            className="w-full"
            value={selectedDate}
            onChange={setSelectedDate}
            placeholder="Pilih tanggal"
          />
          <Select
            allowClear
            placeholder="Divisi"
            className="w-full"
            value={divisi}
            onChange={setDivisi}
            options={divisiOptions}
          />
          <Select
            allowClear
            placeholder="Status"
            className="w-full"
            value={status}
            onChange={setStatus}
            options={statusOptions}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search nama/divisi"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* table */}
      <div className="px-2 md:px-3 pb-4 mt-2">
        <Table
          rowKey="id"
          size="small"
          tableLayout="auto"
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
        divisiOptions={vm.divisiOptions}
        statusOptions={vm.statusOptions}
        jamColumnTitle="Jam Kedatangan"
      />

      <AttendanceCard
        title="Absensi Kepulangan Karyawan"
        rows={vm.kepulangan}
        divisiOptions={vm.divisiOptions}
        statusOptions={vm.statusOptionsKepulangan}
        jamColumnTitle="Jam Kepulangan"
      />
    </div>
  );
}
