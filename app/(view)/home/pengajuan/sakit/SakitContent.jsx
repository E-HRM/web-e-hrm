"use client";

import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import {
  ConfigProvider,
  Tabs,
  Input,
  Button,
  Tag,
  Modal,
  Tooltip,
  Space,
  Card,
  Table,
  Avatar,
  Badge,
} from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import useSakitViewModel from "./useSakitViewModel";

dayjs.locale("id");

const PRIMARY_COLOR = "#003A6F";
const SUCCESS_COLOR = "#52c41a";
const ERROR_COLOR = "#ff4d4f";
const WARNING_COLOR = "#faad14";

/* ===== Reusable ===== */
function MiniField({ label, children, span = 1, className = "" }) {
  return (
    <div
      className={`min-w-0 ${className}`}
      style={{ gridColumn: `span ${span} / span ${span}` }}
    >
      <div className="text-xs font-semibold text-gray-600 mb-1">{label}</div>
      <div className="text-sm text-gray-900 leading-5 break-words">
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg =
    {
      Disetujui: { color: SUCCESS_COLOR, text: "Disetujui" },
      Ditolak: { color: ERROR_COLOR, text: "Ditolak" },
      Menunggu: { color: WARNING_COLOR, text: "Menunggu" },
    }[status] || { color: WARNING_COLOR, text: "Menunggu" };
  return (
    <Badge color={cfg.color} text={cfg.text} className="font-medium text-xs" />
  );
}

function ellipsisWords(str, maxWords = 2) {
  const s = String(str ?? "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/);
  return parts.length <= maxWords ? s : `${parts.slice(0, maxWords).join(" ")}…`;
}

function formatDateTimeID(date) {
  try {
    return dayjs(date).format("DD MMM YYYY • HH:mm");
  } catch {
    return String(date);
  }
}

function formatDateOnlyID(d) {
  if (!d) return "—";
  try {
    return dayjs(d).format("DD MMM YYYY");
  } catch {
    return "—";
  }
}

/* ===== Clamp cell (konsisten dgn Cuti) ===== */
function TextClampCell({ text, expanded, onToggle }) {
  const ghostRef = useRef(null);
  const [showToggle, setShowToggle] = useState(false);

  const recompute = useCallback(() => {
    const el = ghostRef.current;
    if (!el) return;
    const cs = window.getComputedStyle(el);
    const base = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3 || 18;
    const lines = Math.round(el.scrollHeight / base);
    setShowToggle(lines > 1);
  }, []);

  useLayoutEffect(() => {
    recompute();
    const ro = new ResizeObserver(recompute);
    if (ghostRef.current?.parentElement) ro.observe(ghostRef.current.parentElement);
    return () => ro.disconnect();
  }, [recompute, text]);

  return (
    <>
      <Tooltip title={!expanded && text?.length > 100 ? text : undefined}>
        <span
          className="block text-sm text-gray-900"
          style={
            expanded
              ? { whiteSpace: "pre-wrap", overflowWrap: "anywhere" }
              : {
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  overflowWrap: "anywhere",
                }
          }
        >
          {text || "—"}
        </span>
      </Tooltip>

      {showToggle && (
        <button
          onClick={onToggle}
          className="mt-1 inline-block text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          style={{ border: "none", background: "transparent", padding: 0 }}
        >
          {expanded ? "Sembunyikan" : "Selengkapnya"}
        </button>
      )}

      <div
        ref={ghostRef}
        aria-hidden
        className="absolute invisible pointer-events-none text-sm leading-5"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          visibility: "hidden",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        {text}
      </div>
    </>
  );
}

export default function SakitContent() {
  const vm = useSakitViewModel();

  const [rejectRow, setRejectRow] = useState(null);
  const [reason, setReason] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const [expandedHandover, setExpandedHandover] = useState(new Set());
  const toggleHandover = (id) =>
    setExpandedHandover((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const counts = vm.tabCounts || { pengajuan: 0, disetujui: 0, ditolak: 0 };

  const columns = useMemo(
    () => [
      {
        title: "NO",
        key: "no",
        width: 60,
        fixed: "left",
        align: "center",
        onCell: () => ({ style: { verticalAlign: "top" } }),
        render: (_, __, index) => (
          <div className="text-sm font-medium text-gray-600">
            {(pagination.current - 1) * pagination.pageSize + index + 1}
          </div>
        ),
      },
      {
        title: "KARYAWAN",
        key: "karyawan",
        width: 280,
        fixed: "left",
        onCell: () => ({ style: { verticalAlign: "top" } }),
        render: (_, r) => (
          <div className="flex items-start gap-3">
            <Avatar
              src={r.foto}
              size={48}
              icon={<UserOutlined />}
              className="border-2 border-gray-200"
            />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 text-sm mb-1">
                {r.nama}
              </div>
              <div className="text-xs text-gray-600 mb-2">{r.jabatanDivisi}</div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <ClockCircleOutlined />
                <span>{formatDateTimeID(r.tglPengajuan)}</span>
              </div>
              <div className="mt-2">
                <StatusBadge status={r.status} />
              </div>
            </div>
          </div>
        ),
      },
      {
        title: "DETAIL PENGAJUAN",
        key: "detail",
        onCell: () => ({ style: { verticalAlign: "top" } }),
        render: (_, r) => {
          const expHan = expandedHandover.has(r.id);

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1) Kategori Sakit */}
              <MiniField label="Kategori Sakit">
                <span className="font-medium">{r.kategori}</span>
              </MiniField>

              {/* 2) Handover Pekerjaan (tepat di bawah Kategori) */}
              <MiniField label="Handover Pekerjaan" className="lg:col-span-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <TextClampCell
                    text={r.handover}
                    expanded={expHan}
                    onToggle={() => toggleHandover(r.id)}
                  />

                  {Array.isArray(r.handoverUsers) && r.handoverUsers.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-gray-700 mb-2">
                        Daftar Penerima Handover :
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {r.handoverUsers.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200"
                          >
                            <Avatar src={u.photo} size={24} icon={<UserOutlined />} />
                            <Tooltip title={u.name}>
                              <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                                {ellipsisWords(u.name, 2)}
                              </span>
                            </Tooltip>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </MiniField>

              {/* 3) Tanggal Pengajuan (full width agar "Dokumen" berada tepat di bawahnya) */}
              <MiniField label="Tanggal Pengajuan" className="lg:col-span-3">
                {formatDateTimeID(r.tglPengajuan)}
              </MiniField>

              {/* 4) Dokumen Pendukung (di bawah Tanggal Pengajuan) */}
              <MiniField label="Dokumen Pendukung" className="lg:col-span-3">
                {Array.isArray(r.attachments) && r.attachments.length > 0 ? (
                  <Space wrap>
                    {r.attachments.map((f, i) => (
                      <Button
                        key={i}
                        icon={<FileTextOutlined />}
                        size="small"
                        type="primary"
                        onClick={() => window.open(f.url, "_blank")}
                        className="flex items-center gap-1"
                      >
                        Lihat Dokumen
                      </Button>
                    ))}
                  </Space>
                ) : r.buktiUrl ? (
                  <Button
                    icon={<FileTextOutlined />}
                    size="small"
                    type="primary"
                    onClick={() => window.open(r.buktiUrl, "_blank")}
                    className="flex items-center gap-1"
                  >
                    Lihat Dokumen
                  </Button>
                ) : (
                  <Button
                    icon={<FileTextOutlined />}
                    size="small"
                    disabled
                    className="flex items-center gap-1"
                  >
                    Tidak Ada File
                  </Button>
                )}
              </MiniField>
            </div>
          );
        },
      },
      {
        title: "AKSI & KEPUTUSAN",
        key: "aksi",
        width: 200,
        fixed: "right",
        onCell: () => ({ style: { verticalAlign: "top" } }),
        render: (_, r) => {
          if (vm.tab === "pengajuan") {
            return (
              <Space direction="vertical" size={8} className="w-full">
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  className="w-full bg-green-600 hover:bg-green-700 border-green-600"
                  onClick={() => vm.approve(r.id)}
                  size="small"
                >
                  Setujui
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  className="w-full"
                  onClick={() => {
                    setRejectRow(r);
                    setReason(r.tempAlasan || "");
                  }}
                  size="small"
                >
                  Tolak
                </Button>
              </Space>
            );
          }

          // Tab disetujui/ditolak → info saja
          return (
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {vm.tab === "disetujui" ? "Disetujui Pada" : "Ditolak Pada"}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {r.tglKeputusan ? formatDateTimeID(r.tglKeputusan) : "-"}
                </div>
              </div>

              {r.alasan && (
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">
                    Catatan
                  </div>
                  <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                    {r.alasan}
                  </div>
                </div>
              )}
            </div>
          );
        },
      },
    ],
    [vm.tab, expandedHandover, pagination]
  );

  const dataSource = vm.filteredData.map((d) => ({ key: d.id, ...d }));

  const tabItems = [
    {
      key: "pengajuan",
      label: (
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="font-medium">Pengajuan</span>
          <span className="bg-orange-100 text-orange-800 rounded-full px-2 py-1 text-xs font-medium min-w-6 text-center">
            {counts.pengajuan}
          </span>
        </div>
      ),
    },
    {
      key: "disetujui",
      label: (
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="font-medium">Disetujui</span>
          <span className="bg-green-100 text-green-800 rounded-full px-2 py-1 text-xs font-medium min-w-6 text-center">
            {counts.disetujui}
          </span>
        </div>
      ),
    },
    {
      key: "ditolak",
      label: (
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="font-medium">Ditolak</span>
          <span className="bg-red-100 text-red-800 rounded-full px-2 py-1 text-xs font-medium min-w-6 text-center">
            {counts.ditolak}
          </span>
        </div>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        components: {
          Tabs: {
            inkBarColor: PRIMARY_COLOR,
            itemActiveColor: PRIMARY_COLOR,
            itemHoverColor: PRIMARY_COLOR,
            itemSelectedColor: PRIMARY_COLOR,
          },
          Card: {
            borderRadiusLG: 12,
            boxShadowTertiary: "0 4px 12px rgba(0, 0, 0, 0.1)",
          },
          Table: {
            headerBg: "#f8fafc",
            headerColor: "#374151",
            headerSplitColor: "transparent",
            rowHoverBg: "transparent",
          },
        },
        token: {
          colorPrimary: PRIMARY_COLOR,
          borderRadius: 8,
          colorBgContainer: "#ffffff",
          colorBorder: "#e5e7eb",
        },
      }}
    >
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Pengajuan Izin Sakit
              </h1>
              <p className="text-gray-600 text-sm">
                Kelola pengajuan izin sakit. Gunakan tab untuk melihat status.
              </p>
            </div>
          </div>
        </div>

        {/* Konten */}
        <Card className="shadow-sm border-0">
          <Tabs
            activeKey={vm.tab}
            onChange={vm.setTab}
            type="line"
            size="large"
            items={tabItems.map((t) => ({
              key: t.key,
              label: t.label,
              children: (
                <div className="mt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Daftar {t.key.charAt(0).toUpperCase() + t.key.slice(1)}
                      </h2>
                      <p className="text-gray-500 text-sm mt-1">
                        Menampilkan {dataSource.length} dari {counts[t.key]} pengajuan
                      </p>
                    </div>
                    <Input
                      allowClear
                      placeholder="Cari nama, jabatan, kategori, handover…"
                      prefix={<SearchOutlined className="text-gray-400" />}
                      value={vm.search}
                      onChange={(e) => vm.setSearch(e.target.value)}
                      className="w-full lg:w-80"
                      size="large"
                    />
                  </div>

                  <Table
                    columns={columns}
                    dataSource={dataSource}
                    size="middle"
                    tableLayout="fixed"
                    sticky
                    pagination={{
                      current: pagination.current,
                      pageSize: pagination.pageSize,
                      pageSizeOptions: [10, 20, 50],
                      showSizeChanger: true,
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} dari ${total} data`,
                      onChange: (current, pageSize) =>
                        setPagination({ current, pageSize }),
                    }}
                    scroll={{ x: 1200, y: 600 }}
                    loading={vm.loading}
                    rowClassName={() => "no-hover-row"}
                  />
                </div>
              ),
            }))}
          />
        </Card>

        {/* Hilangkan hover abu-abu Antd */}
        <style jsx global>{`
          .no-hover-row:hover > td {
            background: transparent !important;
          }
          .ant-table-tbody > tr.ant-table-row:hover > td {
            background: transparent !important;
          }
        `}</style>

        {/* Modal Penolakan */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <CloseOutlined className="text-red-600" />
              <span>Tolak Pengajuan Izin Sakit</span>
            </div>
          }
          open={!!rejectRow}
          okText="Tolak Pengajuan"
          okButtonProps={{
            danger: true,
            disabled: !reason.trim(),
            icon: <CloseOutlined />,
          }}
          onOk={async () => {
            vm.handleAlasanChange(rejectRow.id, reason.trim());
            await vm.reject(rejectRow.id);
            setRejectRow(null);
            setReason("");
          }}
          onCancel={() => {
            setRejectRow(null);
            setReason("");
          }}
          width={500}
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-red-900">
                <InfoCircleOutlined />
                Konfirmasi Penolakan
              </div>
              <div className="text-sm text-red-700 mt-1">
                Anda akan menolak pengajuan dari <strong>{rejectRow?.nama}</strong>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Penolakan *
              </label>
              <Input.TextArea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Berikan alasan penolakan yang jelas…"
                className="resize-none"
              />
              <div className="text-xs text-gray-500 mt-2">
                Alasan penolakan wajib diisi dan akan dikirimkan kepada karyawan.
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </ConfigProvider>
  );
}
