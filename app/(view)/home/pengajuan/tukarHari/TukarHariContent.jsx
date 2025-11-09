"use client";

import React, { useMemo, useState, useRef, useCallback, useLayoutEffect } from "react";
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
  DatePicker,
  Select,
} from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import useTukarHariViewModel from "./useTukarHariViewModel";

dayjs.locale("id");

const BRAND = "#003A6F";
const LIGHT_BLUE = "#E8F6FF";
const HEADER_BLUE_BG = "#F0F6FF";

function MiniField({ label, children, span = 1 }) {
  return (
    <div className="min-w-0 relative" style={{ gridColumn: `span ${span} / span ${span}` }}>
      <div className="text-xs font-semibold text-slate-900 mb-0.5">{label}</div>
      <div className="text-[13px] text-slate-700 leading-5 break-words">{children}</div>
    </div>
  );
}

function KeperluanCell({ id, text, expanded, onToggle }) {
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
      <Tooltip title={!expanded ? text : undefined}>
        <span
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
          {text}
        </span>
      </Tooltip>

      {showToggle && (
        <button onClick={onToggle} className="ml-2 text-[12px] font-medium" style={{ color: BRAND }}>
          {expanded ? "Sembunyikan" : "Lihat selengkapnya"}
        </button>
      )}

      <div
        ref={ghostRef}
        aria-hidden
        className="absolute invisible pointer-events-none text-[13px] leading-5"
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

function formatDateID(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleString("id-ID", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}
function formatDateOnlyID(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function TukarHariContent() {
  const vm = useTukarHariViewModel();

  const [rejectRow, setRejectRow] = useState(null);
  const [reason, setReason] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // Modal Setujui (global pola untuk semua hari_pengganti)
  const [approveRow, setApproveRow] = useState(null);
  const [approvePola, setApprovePola] = useState(""); // id_pola_kerja_pengganti global

  const [expandedKeperluan, setExpandedKeperluan] = useState(new Set());
  const toggleExpand = (id) =>
    setExpandedKeperluan((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const counts = useMemo(() => {
    const all = vm.data ?? [];
    return {
      pengajuan: all.filter((d) => d.statusRaw === "pending").length,
      disetujui: all.filter((d) => d.statusRaw === "disetujui").length,
      ditolak: all.filter((d) => d.statusRaw === "ditolak").length,
    };
  }, [vm.data]);

  const openApproveModal = useCallback(
    async (row) => {
      setApproveRow(row);
      setApprovePola(""); // reset
      vm.fetchPolaOptions();
    },
    [vm]
  );

  const columns = useMemo(
    () => [
      {
        title: "",
        key: "no",
        width: 30,
        fixed: "left",
        render: (_, __, index) =>
          (pagination.current - 1) * pagination.pageSize + index + 1,
      },
      {
        title: "Karyawan",
        key: "karyawan",
        width: 260,
        fixed: "left",
        render: (_, r) => (
          <div className="flex items-start gap-3 min-w-0">
            <img
              src={r.foto}
              alt="foto"
              className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
            />
            <div className="min-w-0">
              <div className="font-medium text-slate-900 truncate">{r.nama}</div>
              <div className="text-xs text-slate-600 truncate">{r.jabatan}</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                <CalendarOutlined />
                <span className="truncate">{formatDateID(r.tglPengajuan)}</span>
              </div>
              <div className="mt-1">
                <Tag
                  color={r.status === "Disetujui" ? "green" : r.status === "Ditolak" ? "red" : "blue"}
                  className="!rounded-md"
                >
                  {r.status}
                </Tag>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: "Detail Pengajuan",
        key: "detail",
        className: "align-top",
        render: (_, r) => {
          const expanded = expandedKeperluan.has(r.id);
          return (
            <div className="grid gap-3 min-w-0" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <style jsx>{`
                @media (min-width: 768px) {
                  div[role='cell'] > div > div.grid {
                    grid-template-columns: repeat(5, minmax(0, 1fr));
                  }
                }
              `}</style>

              <MiniField label="Tgl. Pengajuan">{formatDateID(r.tglPengajuan)}</MiniField>
              <MiniField label="Tgl. Izin">{formatDateOnlyID(r.hariIzin)}</MiniField>
              <MiniField label="Kategori"><span className="text-slate-700">{r.kategori}</span></MiniField>
              <MiniField label="Hari Pengganti">{formatDateOnlyID(r.hariPengganti)}</MiniField>

              <MiniField label="Keperluan" span={2}>
                <KeperluanCell
                  id={r.id}
                  text={r.keperluan}
                  expanded={expanded}
                  onToggle={() => toggleExpand(r.id)}
                />
              </MiniField>
            </div>
          );
        },
      },
      {
        title: "Keputusan",
        key: "aksi",
        width: 180,
        fixed: "right",
        render: (_, r) => {
          if (vm.tab === "pengajuan") {
            return (
              <Space size={8} wrap>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  className="!bg-[var(--brand)] hover:!bg-[#0B63C7]"
                  style={{ "--brand": BRAND }}
                  onClick={() => openApproveModal(r)}
                >
                  Setujui
                </Button>

                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setRejectRow(r);
                    setReason(r.tempAlasan || "");
                  }}
                >
                  Tolak
                </Button>
              </Space>
            );
          }

          return (
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 mb-0.5">
                {vm.tab === "disetujui" ? "Tgl. Disetujui" : "Tgl. Ditolak"}
              </div>
              <div className="text-sm text-slate-700">{formatDateID(r.tglKeputusan)}</div>

              {r.alasan && (
                <>
                  <div className="text-xs font-semibold text-slate-900 mt-3">Catatan</div>
                  <div className="mt-1 flex items-start gap-1 text-[13px] text-slate-700">
                    <InfoCircleOutlined className="text-slate-400 mt-0.5" />
                    <Tooltip title={r.alasan}>
                      <span
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {r.alasan}
                      </span>
                    </Tooltip>
                  </div>
                </>
              )}

              <div className="mt-3">
                {vm.tab === "ditolak" ? (
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckOutlined />}
                    className="!bg-[var(--brand)] hover:!bg-[#0B63C7]"
                    style={{ "--brand": BRAND }}
                    onClick={() => openApproveModal(r)}
                  >
                    Setujui
                  </Button>
                ) : (
                  <Button
                    danger
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setRejectRow(r);
                      setReason(r.tempAlasan || r.alasan || "");
                    }}
                  >
                    Tolak
                  </Button>
                )}
              </div>
            </div>
          );
        },
      },
    ],
    [vm, expandedKeperluan, pagination, openApproveModal]
  );

  const sourceAll = vm.filteredData.map((d) => ({ key: d.id, ...d }));

  const dataSource = useMemo(() => {
    if (vm.tab === "pengajuan") return sourceAll.filter((x) => x.statusRaw === "pending");
    if (vm.tab === "disetujui") return sourceAll.filter((x) => x.statusRaw === "disetujui");
    if (vm.tab === "ditolak") return sourceAll.filter((x) => x.statusRaw === "ditolak");
    return sourceAll;
  }, [sourceAll, vm.tab]);

  const tabItems = [
    {
      key: "pengajuan",
      label: (
        <div className="flex items-center gap-2 px-2 py-1 text-[13px]">
          <span>Pengajuan</span>
          <span className="bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 text-[11px] min-w-6 text-center">
            {counts.pengajuan}
          </span>
        </div>
      ),
    },
    {
      key: "disetujui",
      label: (
        <div className="flex items-center gap-2 px-2 py-1 text-[13px]">
          <span>Disetujui</span>
          <span className="bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 text-[11px] min-w-6 text-center">
            {counts.disetujui}
          </span>
        </div>
      ),
    },
    {
      key: "ditolak",
      label: (
        <div className="flex items-center gap-2 px-2 py-1 text-[13px]">
          <span>Ditolak</span>
          <span className="bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 text-[11px] min-w-6 text-center">
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
            inkBarColor: BRAND,
            itemActiveColor: BRAND,
            itemHoverColor: BRAND,
            itemSelectedColor: BRAND,
          },
          Card: { borderRadiusLG: 12 },
        },
        token: { colorPrimary: BRAND, borderRadius: 8, colorBgContainer: "#ffffff" },
      }}
    >
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-[22px] font-semibold leading-tight text-slate-900 mb-1">
            Pengajuan Izin Tukar Hari
          </h1>
          <p className="text-slate-500 text-sm">
            Kelola pengajuan tukar hari kerja. Gunakan tab untuk melihat status.
          </p>
        </div>

        <Tabs
          activeKey={vm.tab}
          onChange={(k) => vm.setTab(k)}
          type="card"
          className="custom-tabs"
          items={tabItems.map((t) => ({
            key: t.key,
            label: t.label,
            children: (
              <Card className="shadow-lg border-0 mt-4" bodyStyle={{ padding: 0 }}>
                <div
                  className="p-5 border-b border-slate-100 bg-[var(--header-bg)]"
                  style={{ "--header-bg": HEADER_BLUE_BG }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-0.5">
                        Daftar {String(t.key).charAt(0).toUpperCase() + String(t.key).slice(1)}
                      </h2>
                      <p className="text-slate-500 text-xs md:text-sm">
                        Menampilkan {dataSource.length} item pada tab ini
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        allowClear
                        placeholder="Cari nama, kategori, keperluan…"
                        prefix={<SearchOutlined className="text-slate-400" />}
                        value={vm.search}
                        onChange={(e) => vm.setSearch(e.target.value)}
                        className="w-72 rounded-xl"
                        size="middle"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <Table
                    columns={columns}
                    dataSource={dataSource}
                    size="small"
                    tableLayout="fixed"
                    sticky
                    pagination={{
                      current: pagination.current,
                      pageSize: pagination.pageSize,
                      pageSizeOptions: [10, 20, 50],
                      showSizeChanger: true,
                      showTotal: (t) => `${t} total`,
                      onChange: (current, pageSize) => setPagination({ current, pageSize }),
                    }}
                    rowClassName={() => "align-top"}
                    scroll={{ x: 1200, y: 520 }}
                  />
                </div>
              </Card>
            ),
          }))}
        />

        <style jsx>{`
          .custom-tabs :global(.ant-tabs-tab) {
            border: none !important;
            background: white !important;
            border-radius: 8px !important;
            margin-right: 8px !important;
            padding: 6px 14px !important;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }
          .custom-tabs :global(.ant-tabs-tab-active) {
            background: ${LIGHT_BLUE} !important;
            border: 1px solid ${BRAND} !important;
          }
          .custom-tabs :global(.ant-tabs-nav) {
            margin-bottom: 0 !important;
          }
          .custom-tabs :global(.ant-tabs-content) {
            margin-top: 12px;
          }
        `}</style>
      </div>

      {/* Modal SETUJUI - pola global untuk semua hari_pengganti */}
      <Modal
        title="Setujui Pengajuan — Pilih Pola untuk Hari Pengganti"
        open={!!approveRow}
        okText="Setujui"
        okButtonProps={{
          disabled: !approveRow, // pola opsional; kalau wajib, ganti ke: !approvePola
        }}
        onOk={async () => {
          await vm.approve(approveRow.id, null, approvePola || null);
          setApproveRow(null);
          setApprovePola("");
        }}
        onCancel={() => {
          setApproveRow(null);
          setApprovePola("");
        }}
      >
        {!approveRow ? null : (
          <div className="space-y-5">
            <div className="text-sm text-slate-600">
              Pengajuan ini memiliki {approveRow.pairs?.length || 0} pasangan tanggal. Pola yang dipilih di bawah akan
              diterapkan untuk <b>semua</b> hari pengganti.
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-semibold text-slate-900 mb-2">Ringkasan Tanggal</div>
              <div className="space-y-1 text-[13px]">
                {(approveRow.pairs || []).map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Tag className="!m-0 !rounded-md">{idx + 1}</Tag>
                    <span>izin: {formatDateOnlyID(p.izin)}</span>
                    <span className="text-slate-400">→</span>
                    <span>pengganti: {formatDateOnlyID(p.pengganti)}</span>
                    {p.catatan ? <em className="text-slate-500">({p.catatan})</em> : null}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-900 mb-1">Pola Kerja Pengganti (opsional)</div>
              <Select
                showSearch
                allowClear
                placeholder="Pilih pola kerja…"
                optionFilterProp="label"
                loading={vm.loadingPola}
                value={approvePola || undefined}
                onChange={(v) => setApprovePola(v || "")}
                options={vm.polaOptions}
                className="w-full"
              />
              <div className="text-xs text-slate-500 mt-2">
                Jika dikosongkan, backend akan mempertahankan pola default/eksisting.
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal TOLAK */}
      <Modal
        title="Tolak Pengajuan"
        open={!!rejectRow}
        okText="Tolak"
        okButtonProps={{ danger: true, disabled: !reason.trim() }}
        onOk={() => {
          vm.handleAlasanChange(rejectRow.id, reason.trim());
          vm.reject(rejectRow.id);
          setRejectRow(null);
          setReason("");
        }}
        onCancel={() => {
          setRejectRow(null);
          setReason("");
        }}
      >
        <div className="text-sm text-slate-600 mb-2">
          Tulis alasan penolakan singkat. (Wajib diisi saat menolak.)
        </div>
        <Input.TextArea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Contoh: Jadwal pengganti belum sesuai."
        />
      </Modal>
    </ConfigProvider>
  );
}
