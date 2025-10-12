"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Typography,
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
  Modal,
  Image,
  Segmented,
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
  EnvironmentOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import useAbsensiViewModel from "./useAbsensiViewModel";

/* -------------------- Helpers tampilan -------------------- */
function fmtHHmmss(v) {
  if (!v) return "—";
  if (typeof v === "string") {
    const m = v.match(/(?:T|\s)?(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (m) return `${m[1]}:${m[2]}:${m[3] ?? "00"}`;
    const d = dayjs(v);
    return d.isValid() ? d.format("HH:mm:ss") : "—";
  }
  const d = dayjs(v);
  return d.isValid() ? d.format("HH:mm:ss") : "—";
}

/** Pastikan URL foto absolut+aman untuk dipakai di <img> */
function resolveUserPhoto(u) {
  const raw =
    u?.foto_profil_user ||
    u?.avatarUrl ||
    u?.foto ||
    u?.foto_url ||
    u?.photoUrl ||
    u?.photo ||
    u?.avatar ||
    u?.gambar ||
    "";

  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/^http:\/\//i, "https://");
  }

  if (String(raw).startsWith("/")) {
    if (typeof window !== "undefined") return `${window.location.origin}${raw}`;
    return raw;
  }

  if (String(raw).startsWith("storage/") || String(raw).startsWith("/storage/")) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return base
      ? `${base.replace(/\/+$/, "")}/${String(raw).replace(/^\/+/, "")}`
      : `/${String(raw).replace(/^\/+/, "")}`;
  }

  return `/${String(raw).replace(/^\.?\//, "")}`;
}

/** Row key stabil supaya Table tidak “nakal” */
function rowKeySafe(r) {
  if (r?.id_absensi) return r.id_absensi;
  const uid = r?.user?.id_user || r?.user?.id || r?.user?.uuid || "unknown";
  const tgl = r?.tanggal ? dayjs(r.tanggal).format("YYYY-MM-DD") : "no-date";
  const jam = r?.jam_masuk || r?.jam_pulang || "no-time";
  return `${uid}__${tgl}__${jam}`;
}

/* Opsional Avatar */
function Avatar({ src, alt, name }) {
  if (src) {
    return (
      <AntAvatar src={src} alt={alt || ""} className="ring-2 ring-white shadow-sm" />
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

/* Foto bulat anti-gepeng */
function CircleImg({ src, size = 36, alt = "Foto" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || "/avatar-placeholder.jpg"}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        objectFit: "cover",
        border: "1px solid #003A6F22",
        background: "#E6F0FA",
        display: "inline-block",
      }}
      onError={(e) => {
        e.currentTarget.src = "/avatar-placeholder.jpg";
        e.currentTarget.onerror = null;
      }}
    />
  );
}

/* ====================== STATUS TAG ====================== */
const statusTag = (s) => {
  const key = String(s || "").toLowerCase();
  if (key.includes("tepat"))
    return (
      <Tag icon={<CheckCircleOutlined />} color="green" className="px-2 py-1 rounded-md flex items-center gap-1">
        Tepat Waktu
      </Tag>
    );
  if (key.includes("lambat"))
    return (
      <Tag icon={<WarningOutlined />} color="orange" className="px-2 py-1 rounded-md flex items-center gap-1">
        Terlambat
      </Tag>
    );
  if (key.includes("lembur"))
    return (
      <Tag icon={<ClockCircleOutlined />} color="blue" className="px-2 py-1 rounded-md flex items-center gap-1">
        Lembur
      </Tag>
    );
  if (key.includes("izin")) return <Tag color="geekblue">Izin</Tag>;
  if (key.includes("sakit")) return <Tag color="purple">Sakit</Tag>;
  return <Tag>{s || "-"}</Tag>;
};

const tinyStatus = (s) => {
  const key = String(s || "").toLowerCase();
  if (!key) return null;
  if (key.includes("tepat")) return <Tag color="green" className="px-2 py-0.5 rounded-full">Tepat</Tag>;
  if (key.includes("lambat")) return <Tag color="orange" className="px-2 py-0.5 rounded-full">Terlambat</Tag>;
  if (key.includes("lembur")) return <Tag color="blue" className="px-2 py-0.5 rounded-full">Lembur</Tag>;
  if (key.includes("izin")) return <Tag color="geekblue" className="px-2 py-0.5 rounded-full">Izin</Tag>;
  if (key.includes("sakit")) return <Tag color="purple" className="px-2 py-0.5 rounded-full">Sakit</Tag>;
  return <Tag className="px-2 py-0.5 rounded-full">{s}</Tag>;
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

/* ====================== TABEL DENGAN MODAL ====================== */
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
  selectedDate,
}) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoSrc, setPhotoSrc] = useState(null);

  const [mapOpen, setMapOpen] = useState(false);
  const [mapWhich, setMapWhich] = useState("start");
  const [mapEmbedUrl, setMapEmbedUrl] = useState(null);
  const [activeRow, setActiveRow] = useState(null);

  const normalizePhotoUrl = (u) => {
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u.replace(/^http:\/\//i, "https://");
    if (typeof window !== "undefined" && u.startsWith("/"))
      return `${window.location.origin}${u}`;
    return u;
  };
  const makeOsmEmbed = (lat, lon) => {
    const dx = 0.0025, dy = 0.0025;
    const bbox = `${(lon - dx).toFixed(6)}%2C${(lat - dy).toFixed(
      6
    )}%2C${(lon + dx).toFixed(6)}%2C${(lat + dy).toFixed(6)}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(
      6
    )}%2C${lon.toFixed(6)}`;
  };
  const getStartCoord = (row) => row?.lokasiIn || null;
  const getEndCoord = (row) => row?.lokasiOut || null;

  const data = useMemo(() => {
    const q = (filters?.q || "").toLowerCase().trim();
    const needDiv = filters?.divisi;
    const needStatus = (filters?.status || "").toLowerCase().trim();
    const dateKey = selectedDate ? dayjs(selectedDate).format("YYYY-MM-DD") : null;

    return (rows || [])
      .filter((r) => {
        if (!dateKey) return true;
        const rk = r?.tanggal ? dayjs(r.tanggal).format("YYYY-MM-DD") : "";
        return rk === dateKey;
      })
      .filter((r) => (needDiv ? r.user?.departement?.nama_departement === needDiv : true))
      .filter((r) => {
        if (!needStatus) return true;
        const hay = [r.status_masuk, r.status_pulang]
          .map((x) => String(x || "").toLowerCase())
          .join(" ");
        return hay.includes(needStatus);
      })
      .filter((r) => {
        if (!q) return true;
        const hay = [
          r.user?.nama_pengguna,
          r.user?.departement?.nama_departement,
        ]
          .map((s) => String(s || "").toLowerCase())
          .join(" ");
        return hay.includes(q);
      });
  }, [rows, filters, selectedDate]);

  const openPhoto = (which, row) => {
    const src = which === "in" ? row?.photo_in : row?.photo_out;
    if (!src) return;
    setPhotoSrc(normalizePhotoUrl(src));
    setPhotoOpen(true);
  };

  const openMap = (which, row) => {
    const coord = which === "end" ? getEndCoord(row) : getStartCoord(row);
    if (!coord) return;
    const url = makeOsmEmbed(coord.lat, coord.lon);
    setActiveRow(row);
    setMapWhich(which);
    setMapEmbedUrl(url);
    setMapOpen(true);
  };

  const columns = useMemo(
    () => [
      {
        title: "Nama",
        dataIndex: "name",
        key: "name",
        width: 360,
        render: (_, row) => {
          const u = row?.user || {};
          const id = u?.id_user ?? u?.id ?? u?.uuid;
          const href = id ? `/home/kelola_karyawan/karyawan/${id}` : undefined;

          const displayName = u?.nama_pengguna ?? u?.name ?? u?.email ?? "—";
          const jabatan =
            u?.jabatan?.nama_jabatan ??
            u?.jabatan?.nama ??
            (typeof u?.jabatan === "string" ? u?.jabatan : "") ??
            "";
          const departemen =
            u?.departement?.nama_departement ??
            u?.departemen?.nama ??
            (typeof u?.departemen === "string" ? u?.departemen : "") ??
            "";

          const subtitle =
            jabatan && departemen
              ? `${jabatan} | ${departemen}`
              : (jabatan || departemen || "—");

          const photo = resolveUserPhoto(u) || "/avatar-placeholder.jpg";

          const node = (
            <div className="flex items-center gap-3 min-w-0">
              <CircleImg src={photo} alt={displayName} />
              <div className="min-w-0">
                <div style={{ fontWeight: 600, color: "#0f172a" }} className="truncate">
                  {displayName}
                </div>
                <div style={{ fontSize: 12, color: "#475569" }} className="truncate">
                  {subtitle}
                </div>
              </div>
            </div>
          );

          return href ? (
            <Link href={href} className="no-underline">
              {node}
            </Link>
          ) : (
            node
          );
        },
        sorter: (a, b) =>
          (a.user?.nama_pengguna || "").localeCompare(b.user?.nama_pengguna || ""),
        fixed: "left",
      },

      {
        title: "Presensi Masuk",
        dataIndex: "jam_masuk",
        width: 280,
        render: (_, r) => (
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-3xl md:text-4xl font-bold tracking-tight tabular-nums">
                {fmtHHmmss(r.jam_masuk)}
              </div>
              <div className="mt-1">{tinyStatus(r.status_masuk)}</div>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip title="Lihat foto masuk">
                <Button
                  size="middle"
                  shape="circle"
                  icon={<PictureOutlined />}
                  onClick={() => openPhoto("in", r)}
                  disabled={!r.photo_in}
                />
              </Tooltip>
              <Tooltip title="Lihat lokasi masuk">
                <Button
                  size="middle"
                  shape="circle"
                  icon={<EnvironmentOutlined />}
                  onClick={() => openMap("start", r)}
                  disabled={!r.lokasiIn}
                />
              </Tooltip>
            </div>
          </div>
        ),
        sorter: (a, b) =>
          String(a.jam_masuk || "").localeCompare(String(b.jam_masuk || "")),
      },

      {
        title: "Mulai Istirahat",
        dataIndex: "istirahat_mulai",
        width: 220,
        render: (v) => (
          <div className="text-3xl md:text-4xl font-bold tracking-tight tabular-nums">
            {fmtHHmmss(v)}
          </div>
        ),
        sorter: (a, b) =>
          String(a.istirahat_mulai || "").localeCompare(String(b.istirahat_mulai || "")),
      },

      {
        title: "Selesai Istirahat",
        dataIndex: "istirahat_selesai",
        width: 220,
        render: (v) => (
          <div className="text-3xl md:text-4xl font-bold tracking-tight tabular-nums">
            {fmtHHmmss(v)}
          </div>
        ),
        sorter: (a, b) =>
          String(a.istirahat_selesai || "").localeCompare(String(b.istirahat_selesai || "")),
      },

      {
        title: "Presensi Keluar",
        dataIndex: "jam_pulang",
        width: 280,
        render: (_, r) => (
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-3xl md:text-4xl font-bold tracking-tight tabular-nums">
                {fmtHHmmss(r.jam_pulang)}
              </div>
              <div className="mt-1">{tinyStatus(r.status_pulang)}</div>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip title="Lihat foto pulang">
                <Button
                  size="middle"
                  shape="circle"
                  icon={<PictureOutlined />}
                  onClick={() => openPhoto("out", r)}
                  disabled={!r.photo_out}
                />
              </Tooltip>
              <Tooltip title="Lihat lokasi pulang">
                <Button
                  size="middle"
                  shape="circle"
                  icon={<EnvironmentOutlined />}
                  onClick={() => openMap("end", r)}
                  disabled={!r.lokasiOut}
                />
              </Tooltip>
            </div>
          </div>
        ),
        sorter: (a, b) =>
          String(a.jam_pulang || "").localeCompare(String(b.jam_pulang || "")),
      },
    ],
    [] // kolom statis
  );

  return (
    <Card className="p-0 rounded-xl shadow-sm border-0 overflow-hidden" bodyStyle={{ padding: 0 }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <Typography.Title level={4} className="!m-0 !text-gray-800 flex items-center gap-2">
              <BarChartOutlined />
              {title}
            </Typography.Title>
            <div className="mt-1 text-sm text-gray-500">{dateLabel}</div>
          </div>

        <div className="flex items-center gap-2">
          {headerRight}
          <Tooltip title="Export data">
            <Button icon={<DownloadOutlined />} className="rounded-lg" type="primary">
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
                <StatsCard title="Karyawan Presensi" value={stats.total} icon={<TeamOutlined />} color="blue" loading={loading} />
              </Col>
              <Col xs={12} sm={6}>
                <StatsCard title="Tepat Waktu" value={stats.onTime} icon={<CheckCircleOutlined />} color="green" loading={loading} />
              </Col>
              <Col xs={12} sm={6}>
                <StatsCard title="Terlambat" value={stats.late} icon={<WarningOutlined />} color="orange" loading={loading} />
              </Col>
              <Col xs={12} sm={6}>
                <StatsCard title="Lembur" value={stats.overtime} icon={<ClockCircleOutlined />} color="blue" loading={loading} />
              </Col>
            </Row>
          </div>
        )}
      </div>

      {/* Filter ringkas */}
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
        </div>

        <Table
          rowKey={rowKeySafe}
          size="middle"
          loading={loading}
          locale={{
            emptyText: (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Tidak ada data absensi" />
            ),
          }}
          scroll={{ x: 1200 }}
          columns={columns}
          dataSource={data}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} data`,
            className: "px-4 py-2",
          }}
          className="rounded-lg border border-gray-200"
          rowClassName="hover:bg-blue-50 transition-colors"
        />
      </div>

      {/* Modal Foto */}
      <Modal
        title="Attachment"
        open={photoOpen}
        onCancel={() => setPhotoOpen(false)}
        footer={null}
        width={560}
        zIndex={1500}
        getContainer={() => document.body}
      >
        {photoSrc ? (
          <Image
            src={photoSrc}
            alt="Attachment"
            style={{ width: "100%", maxWidth: 520, maxHeight: "50vh", objectFit: "contain" }}
            preview={{ mask: "Click to zoom", zIndex: 1600 }}
            onError={(e) => (e.currentTarget.src = "/image-not-found.png")}
          />
        ) : (
          <div style={{ opacity: 0.6 }}>No attachment</div>
        )}
      </Modal>

      {/* Modal Lokasi (OSM) */}
      <Modal
        title="Location"
        open={mapOpen}
        onCancel={() => setMapOpen(false)}
        footer={null}
        width={860}
        zIndex={1550}
        getContainer={() => document.body}
      >
        <div className="mb-2">
          <Segmented
            value={mapWhich}
            onChange={(v) => {
              setMapWhich(v);
              if (!activeRow) return;
              const src = v === "end" ? (activeRow?.lokasiOut || null) : (activeRow?.lokasiIn || null);
              if (src) setMapEmbedUrl(makeOsmEmbed(src.lat, src.lon));
            }}
            options={[
              { label: "Start", value: "start" },
              { label: "End", value: "end" },
            ]}
          />
        </div>
        {mapEmbedUrl ? (
          <div style={{ width: "100%", height: 420, borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }}>
            <iframe
              src={mapEmbedUrl}
              style={{ width: "100%", height: "100%", border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div style={{ opacity: 0.6 }}>No coordinates</div>
        )}
      </Modal>
    </Card>
  );
}

/* ====================== PAGE ====================== */
export default function AbsensiContent() {
  const vm = useAbsensiViewModel();

  const [mode, setMode] = useState("in");
  const isIn = mode === "in";

  useEffect(() => {}, []);

  const rows = isIn ? vm.kedatangan : vm.kepulangan;
  const filters = isIn ? vm.filterIn : vm.filterOut;
  const setFilters = isIn ? vm.setFilterIn : vm.setFilterOut;
  const statusOptions = isIn ? vm.statusOptionsIn : vm.statusOptionsOut;
  const jamColumnTitle = isIn ? "Jam Masuk" : "Jam Pulang";
  const dateValue = isIn ? vm.dateIn : vm.dateOut;
  const setDateValue = isIn ? vm.setDateIn : vm.setDateOut;

  const dateLabel = `${dayjs(dateValue).format("dddd, DD MMMM YYYY")}`;

  const stats = useMemo(() => {
    const total = rows.length;
    const onTime = rows.filter((r) => /tepat/i.test(r.status_label)).length;
    const late = rows.filter((r) => /lambat/i.test(r.status_label)).length;
    const overtime = rows.filter((r) => /lembur/i.test(r.status_label)).length;
    return { total, onTime, late, overtime };
  }, [rows]);

  const tableDate = isIn ? vm.dateIn : vm.dateOut;

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
        </div>

        <AttendanceCard
          title={isIn ? "Absensi Kedatangan Karyawan" : "Absensi Kepulangan Karyawan"}
          rows={vm.rowsAll}
          loading={vm.loading}
          divisiOptions={vm.divisiOptions}
          statusOptions={statusOptions}
          filters={filters}
          setFilters={setFilters}
          dateLabel={dateLabel}
          jamColumnTitle={jamColumnTitle}
          stats={stats}
          headerRight={
            <DatePicker
              value={dateValue}
              onChange={setDateValue}
              format="DD/MM/YYYY"
              allowClear={false}
            />
          }
          selectedDate={tableDate}
        />
      </div>
    </div>
  );
}
