"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Typography,
  Select,
  DatePicker,
  Input,
  Table,
  Tag,
  Button,
  Card,
  Empty,
  Statistic,
  Row,
  Col,
  Divider,
  Tooltip,
  Avatar as AntAvatar,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  TeamOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import useAbsensiViewModel from "./useAbsensiViewModel";

dayjs.extend(customParseFormat);

/* ====================== UTIL ====================== */
function onlyHHmm(v) {
  if (!v) return "-";
  if (typeof v === "string") {
    const m = v.match(/^(\d{2}):(\d{2})/);
    if (m) return `${m[1]}:${m[2]}`;
    const parsed = dayjs(v);
    return parsed.isValid() ? parsed.format("HH:mm") : v;
  }
  const d = dayjs(v);
  return d.isValid() ? d.format("HH:mm") : "-";
}

/* ====================== AVATAR ====================== */
function Avatar({ src, alt, name }) {
  if (src) {
    return (
      <AntAvatar
        src={src}
        alt={alt || ""}
        className="ring-2 ring-white shadow-sm"
      />
    );
  }
  return (
    <AntAvatar
      className="bg-blue-100 text-blue-600 ring-2 ring-white shadow-sm"
      icon={<UserOutlined />}
    >
      {name ? name.charAt(0).toUpperCase() : "U"}
    </AntAvatar>
  );
}

/* ====================== STATUS TAG ====================== */
const statusTag = (s) => {
  const key = String(s || "").toLowerCase();
  if (key.includes("tepat"))
    return (
      <Tag
        icon={<CheckCircleOutlined />}
        color="green"
        className="px-2 py-1 rounded-md flex items-center gap-1"
      >
        Tepat Waktu
      </Tag>
    );
  if (key.includes("lambat"))
    return (
      <Tag
        icon={<WarningOutlined />}
        color="orange"
        className="px-2 py-1 rounded-md flex items-center gap-1"
      >
        Terlambat
      </Tag>
    );
  if (key.includes("lembur"))
    return (
      <Tag
        icon={<ClockCircleOutlined />}
        color="blue"
        className="px-2 py-1 rounded-md flex items-center gap-1"
      >
        Lembur
      </Tag>
    );
  if (key.includes("izin")) return <Tag color="geekblue">Izin</Tag>;
  if (key.includes("sakit")) return <Tag color="purple">Sakit</Tag>;
  return <Tag>{s || "-"}</Tag>;
};

/* ====================== STATS CARD ====================== */
function StatsCard({ title, value, icon, color, loading }) {
  return (
    <Card className="h-full border-0 shadow-sm" loading={loading}>
      <Statistic
        title={<span className="text-gray-500">{title}</span>}
        value={value}
        prefix={<span className={`text-${color}-500`}>{icon}</span>}
        valueStyle={{ color: "#3f8600" }}
        className="h-full"
      />
    </Card>
  );
}

/* ====================== ATTENDANCE CARD ====================== */
function AttendanceCard({
  title,
  rows,
  loading,
  divisiOptions,
  statusOptions,
  filters,
  setFilters,
  dateLabel,
  jamColumnTitle,
  stats,
  headerRight,
}) {
  const columns = useMemo(
    () => [
      {
        title: "Tanggal",
        dataIndex: "tanggal",
        width: 120,
        render: (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "-"),
        sorter: (a, b) => dayjs(a.tanggal).unix() - dayjs(b.tanggal).unix(),
      },
      {
        title: "Karyawan",
        dataIndex: ["user", "nama_pengguna"],
        width: 280,
        render: (t, r) => (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={r.user?.foto_profil_user} alt={t} name={t} />
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-gray-900 truncate">
                {t || r.nama || "-"}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {r.user?.departement?.nama_departement || "-"}
              </span>
            </div>
          </div>
        ),
        sorter: (a, b) =>
          (a.user?.nama_pengguna || "").localeCompare(
            b.user?.nama_pengguna || ""
          ),
      },
      {
        title: jamColumnTitle,
        dataIndex: "jam",
        width: 120,
        render: (v) => onlyHHmm(v),
        sorter: (a, b) => {
          const av = onlyHHmm(a.jam);
          const bv = onlyHHmm(b.jam);
          return av.localeCompare(bv);
        },
      },
      {
        title: "Status",
        dataIndex: "status_label",
        width: 150,
        render: statusTag,
        filters: statusOptions.map((opt) => ({
          text: opt.label,
          value: opt.value,
        })),
        onFilter: (value, record) =>
          String(record.status_label || "").toLowerCase().includes(value),
      },
    ],
    [statusOptions, jamColumnTitle]
  );

  const data = rows || [];

  return (
    <Card
      className="p-0 rounded-xl shadow-sm border-0 overflow-hidden"
      bodyStyle={{ padding: 0 }}
    >
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <Typography.Title
              level={4}
              className="!m-0 !text-gray-800 flex items-center gap-2"
            >
              <BarChartOutlined />
              {title}
            </Typography.Title>
            <div className="mt-1 text-sm text-gray-500">{dateLabel}</div>
          </div>

          <div className="flex items-center gap-2">
            {headerRight}
            <Tooltip title="Export data">
              <Button
                icon={<DownloadOutlined />}
                className="rounded-lg flex items-center"
                type="primary"
              >
                Export
              </Button>
            </Tooltip>
          </div>
        </div>

        {stats && (
          <div className="mt-4">
            <Divider className="!my-4" />
            <Row gutter={16}>
              <Col xs={12} sm={6}>
                <StatsCard
                  title="Karyawan Presensi"
                  value={stats.total}
                  icon={<TeamOutlined />}
                  color="blue"
                  loading={loading}
                />
              </Col>
              <Col xs={12} sm={6}>
                <StatsCard
                  title="Tepat Waktu"
                  value={stats.onTime}
                  icon={<CheckCircleOutlined />}
                  color="green"
                  loading={loading}
                />
              </Col>
              <Col xs={12} sm={6}>
                <StatsCard
                  title="Terlambat"
                  value={stats.late}
                  icon={<WarningOutlined />}
                  color="orange"
                  loading={loading}
                />
              </Col>
              <Col xs={12} sm={6}>
                <StatsCard
                  title="Lembur"
                  value={stats.overtime}
                  icon={<ClockCircleOutlined />}
                  color="blue"
                  loading={loading}
                />
              </Col>
            </Row>
          </div>
        )}
      </div>

      <div className="px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Cari nama atau divisi..."
            value={filters.q}
            onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
            className="rounded-lg"
          />
          <Select
            allowClear
            placeholder="Semua Divisi"
            className="w-full rounded-lg"
            value={filters.divisi}
            onChange={(v) => setFilters((p) => ({ ...p, divisi: v }))}
            options={divisiOptions}
          />
          <Select
            allowClear
            placeholder="Semua Status"
            className="w-full rounded-lg"
            value={filters.status}
            onChange={(v) => setFilters((p) => ({ ...p, status: v }))}
            options={statusOptions}
          />
          <div className="flex items-center justify-end lg:justify-start">
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {data.length} data ditemukan
            </span>
          </div>
        </div>

        <Table
          rowKey={(r) =>
            r.id_absensi ||
            r.id_absensi_report_recipient ||
            r.id ||
            `${r.user?.id_user}-${r.tanggal}`
          }
          size="middle"
          loading={loading}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Tidak ada data absensi"
              />
            ),
          }}
          scroll={{ x: "100%" }}
          columns={columns}
          dataSource={data}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} dari ${total} data`,
            className: "px-4 py-2",
          }}
          className="rounded-lg border border-gray-200"
          rowClassName="hover:bg-blue-50 transition-colors"
        />
      </div>
    </Card>
  );
}

/* ====================== PAGE ====================== */
export default function AbsensiContent() {
  const vm = useAbsensiViewModel();

  // mode: 'in' (Kedatangan) | 'out' (Kepulangan)
  const [mode, setMode] = useState("in");
  const isIn = mode === "in";

  // Pastikan default tanggal = hari ini (sudah default di VM)
  // Tidak mengosongkan tanggal supaya selalu terfilter hari ini
  useEffect(() => {
    // no-op
  }, []);

  // Ambil binding sesuai mode
  const rows = isIn ? vm.kedatangan : vm.kepulangan;
  const filters = isIn ? vm.filterIn : vm.filterOut;
  const setFilters = isIn ? vm.setFilterIn : vm.setFilterOut;
  const statusOptions = isIn ? vm.statusOptionsIn : vm.statusOptionsOut;
  const jamColumnTitle = isIn ? "Jam Masuk" : "Jam Pulang";
  const dateValue = isIn ? vm.dateIn : vm.dateOut;
  const setDateValue = isIn ? vm.setDateIn : vm.setDateOut;

  const dateLabel = `Tanggal: ${dayjs(dateValue).format(
    "dddd, DD MMMM YYYY"
  )}`;

  const stats = useMemo(() => {
    const total = rows.length;
    const onTime = rows.filter((r) => /tepat/i.test(r.status_label)).length;
    const late = rows.filter((r) => /lambat/i.test(r.status_label)).length;
    const overtime = rows.filter((r) => /lembur/i.test(r.status_label)).length;
    return { total, onTime, late, overtime };
  }, [rows]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <Typography.Title level={2} className="!mb-1 !text-gray-800">
              Absensi
            </Typography.Title>
            <Typography.Text type="secondary">
              Pantau kehadiran dan kepulangan karyawan secara real-time
            </Typography.Text>
          </div>

          {/* Select Kedatangan/Kepulangan di header page */}
          <Select
            value={mode}
            onChange={setMode}
            options={[
              { value: "in", label: "Kedatangan" },
              { value: "out", label: "Kepulangan" },
            ]}
            style={{ minWidth: 180 }}
          />
        </div>

        <AttendanceCard
          title={isIn ? "Absensi Kedatangan Karyawan" : "Absensi Kepulangan Karyawan"}
          rows={rows}
          loading={vm.loading}
          divisiOptions={vm.divisiOptions}
          statusOptions={statusOptions}
          filters={filters}
          setFilters={setFilters}
          dateLabel={dateLabel}
          jamColumnTitle={jamColumnTitle}
          stats={stats}
          headerRight={
            <>
              {/* DatePicker kembali, default hari ini, tapi bisa dipilih */}
              <DatePicker
                value={dateValue}
                onChange={setDateValue}
                format="DD/MM/YYYY"
                allowClear={false}
              />
            </>
          }
        />
      </div>
    </div>
  );
}
