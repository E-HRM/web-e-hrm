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
  Select,
  DatePicker,
} from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/id";
import useCutiViewModel from "./useCutiViewModel";

dayjs.locale("id");

const GOLD = "#003A6F";
const LIGHT_BLUE = "#E8F6FF";
const HEADER_BLUE_BG = "#F0F6FF";

/* ====== small bits ====== */
function MiniField({ label, children, span = 1 }) {
  return (
    <div
      className="min-w-0 relative"
      style={{ gridColumn: `span ${span} / span ${span}` }}
    >
      <div className="text-xs font-semibold text-slate-900 mb-0.5">{label}</div>
      <div className="text-[13px] text-slate-700 leading-5 break-words">
        {children}
      </div>
    </div>
  );
}

function TextClampCell({ text, expanded, onToggle }) {
  const ghostRef = useRef(null);
  const [showToggle, setShowToggle] = useState(false);

  const recompute = useCallback(() => {
    const el = ghostRef.current;
    if (!el) return;
    const cs = window.getComputedStyle(el);
    const base =
      parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3 || 18;
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
        <button
          onClick={onToggle}
          className="ml-2 text-[12px] font-medium"
          style={{ color: GOLD }}
        >
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

function formatDateShortID(d) {
  try {
    return dayjs(d).format("ddd, DD MMM YYYY");
  } catch {
    return String(d);
  }
}

/* ===== Modal Setujui: pilih tanggal + pola kerja ===== */
function ApproveModal({ openRow, polaOptions, onSubmit, onCancel }) {
  const [dateVal, setDateVal] = useState(() =>
    openRow?.tglMasuk ? dayjs(openRow.tglMasuk) : dayjs()
  );
  const [polaId, setPolaId] = useState();

  React.useEffect(() => {
    setDateVal(openRow?.tglMasuk ? dayjs(openRow.tglMasuk) : dayjs());
    setPolaId(undefined);
  }, [openRow]);

  const handleOk = async () => {
    if (!dateVal || !polaId) return;
    await onSubmit({
      date: dateVal.format("YYYY-MM-DD"),
      id_pola_kerja: String(polaId),
    });
  };

  return (
    <Modal
      title="Setujui Pengajuan — Atur Pola Kerja Saat Masuk"
      open={!!openRow}
      okText="Setujui"
      onOk={handleOk}
      onCancel={onCancel}
      okButtonProps={{ disabled: !dateVal || !polaId, type: "primary" }}
    >
      <div className="space-y-3">
        <div>
          <div className="text-xs font-semibold text-slate-900 mb-1">Tanggal Masuk Kerja</div>
          <DatePicker
            className="w-full"
            value={dateVal}
            onChange={(d) => setDateVal(d ?? null)}
            format="DD MMM YYYY"
          />
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-900 mb-1">Pola Kerja pada Tanggal Tersebut</div>
          <Select
            className="w-full"
            showSearch
            optionFilterProp="label"
            placeholder="— Pilih pola kerja —"
            value={polaId}
            onChange={setPolaId}
            options={polaOptions}
          />
          <div className="mt-2 text-xs text-slate-500">
            Pola yang dipilih akan diterapkan sebagai jadwal <b>KERJA</b> untuk tanggal masuk.
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function CutiContent() {
  const vm = useCutiViewModel();

  // modal tolak
  const [rejectRow, setRejectRow] = useState(null);
  const [reason, setReason] = useState("");

  // modal setujui (return shift)
  const [approveRow, setApproveRow] = useState(null);

  // pagination untuk kolom No
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // expand state: keterangan & handover
  const [expandedKeterangan, setExpandedKeterangan] = useState(new Set());
  const [expandedHandover, setExpandedHandover] = useState(new Set());
  const toggleKeterangan = (id) =>
    setExpandedKeterangan((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  const toggleHandover = (id) =>
    setExpandedHandover((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const counts = useMemo(() => {
    const all = vm.data ?? [];
    return {
      pengajuan: all.filter((d) => d.status === "Menunggu").length,
      disetujui: all.filter((d) => d.status === "Disetujui").length,
      ditolak: all.filter((d) => d.status === "Ditolak").length,
    };
  }, [vm.data]);

  const columns = useMemo(() => {
    return [
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
                  color={
                    r.status === "Disetujui"
                      ? "green"
                      : r.status === "Ditolak"
                      ? "red"
                      : "blue"
                  }
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
          const expKet = expandedKeterangan.has(r.id);
          const expHan = expandedHandover.has(r.id);
          return (
            <div
              className="grid gap-3 min-w-0"
              style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
            >
              <style jsx>{`
                @media (min-width: 768px) {
                  div[role='cell'] > div > div.grid {
                    grid-template-columns: repeat(5, minmax(0, 1fr));
                  }
                }
              `}</style>

              <MiniField label="Jenis Cuti">
                <span className="text-slate-700">{r.jenisCuti}</span>
              </MiniField>

              <MiniField label="Tgl. Pengajuan">
                {formatDateID(r.tglPengajuan)}
              </MiniField>

              {/* === UI BARU: Tanggal Cuti (bukan range) === */}
              <MiniField label="Tanggal Cuti" span={2}>
                {Array.isArray(r.tglCutiList) && r.tglCutiList.length ? (
                  <div className="flex flex-wrap gap-6">
                    {/* daftar tanggal sebagai chip kecil */}
                    <div className="flex flex-wrap gap-6">
                      {r.tglCutiList.map((d, idx) => (
                        <Tag
                          key={idx}
                          className="!rounded-md !border-slate-200 !px-2 !py-1 !text-[12px] !bg-white"
                        >
                          {formatDateShortID(d)}
                        </Tag>
                      ))}
                    </div>

                    {/* info ringkas di ujung */}
                    <div className="text-xs text-slate-500 self-center">
                      {r.totalHariCuti} hari
                    </div>
                  </div>
                ) : (
                  "—"
                )}
              </MiniField>

              <MiniField label="Tgl. Masuk Kerja">
                {r.tglMasuk
                  ? new Date(r.tglMasuk).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </MiniField>

              {/* Keterangan */}
              <MiniField label="Keterangan" span={2}>
                <TextClampCell
                  text={r.keterangan}
                  expanded={expKet}
                  onToggle={() => toggleKeterangan(r.id)}
                />
              </MiniField>

              {/* Handover */}
              <MiniField label="Handover Pekerjaan" span={2}>
                <TextClampCell
                  text={r.handover}
                  expanded={expHan}
                  onToggle={() => toggleHandover(r.id)}
                />
              </MiniField>

              <MiniField label="File Kelengkapan">
                <Button
                  icon={<FileTextOutlined />}
                  size="small"
                  className="!rounded-md !border-none !bg-[#E8F6FF] !text-[#003A6F] hover:!bg-[#99D7FF]/40 hover:!text-[#184c81]"
                  disabled={!r.buktiUrl}
                  onClick={() => r.buktiUrl && window.open(r.buktiUrl, "_blank")}
                >
                  {r.buktiUrl ? "Lihat" : "Tidak ada file"}
                </Button>
              </MiniField>
            </div>
          );
        },
      },
      {
        title: "Keputusan",
        key: "aksi",
        width: 220,
        fixed: "right",
        render: (_, r) => {
          if (vm.tab === "pengajuan") {
            return (
              <Space size={8} wrap>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  className="!bg-[var(--gold)] hover:!bg-[#0B63C7]"
                  style={{ ["--gold"]: GOLD }}
                  onClick={() => setApproveRow(r)}
                >
                  Setujui
                </Button>

                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setRejectRow(r);
                    setReason("");
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
              <div className="text-sm text-slate-700">
                {formatDateID(r.tglKeputusan)}
              </div>

              {r.alasan && (
                <>
                  <div className="text-xs font-semibold text-slate-900 mt-3">
                    Catatan
                  </div>
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
                    className="!bg-[var(--gold)] hover:!bg-[#0B63C7]"
                    style={{ ["--gold"]: GOLD }}
                    onClick={() => setApproveRow(r)}
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
                      setReason(r.alasan || "");
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
    ];
  }, [vm, expandedKeterangan, expandedHandover, pagination]);

  const dataSource = vm.filteredData.map((d) => ({ key: d.id, ...d }));

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
            inkBarColor: GOLD,
            itemActiveColor: GOLD,
            itemHoverColor: GOLD,
            itemSelectedColor: GOLD,
          },
          Card: { borderRadiusLG: 12 },
        },
        token: { colorPrimary: GOLD, borderRadius: 8, colorBgContainer: "#ffffff" },
      }}
    >
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-[22px] font-semibold leading-tight text-slate-900 mb-1">
                Pengajuan Cuti
              </h1>
              <p className="text-slate-500 text-sm">
                Kelola pengajuan cuti. Gunakan tab untuk melihat status.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/home/pengajuan/cuti/konfigurasi_cuti">
                <Button
                  type="primary"
                  icon={<SettingOutlined />}
                  className="!bg-[var(--gold)] hover:!bg-[#0B63C7]"
                  style={{ ["--gold"]: GOLD }}
                >
                  Konfigurasi Cuti
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <Tabs
          activeKey={vm.tab}
          onChange={vm.setTab}
          type="card"
          className="custom-tabs"
          items={tabItems.map((t) => ({
            key: t.key,
            label: t.label,
            children: (
              <Card className="shadow-lg border-0 mt-4" bodyStyle={{ padding: 0 }}>
                <div
                  className="p-5 border-b border-slate-100 bg-[var(--header-bg)]"
                  style={{ ["--header-bg"]: HEADER_BLUE_BG }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-0.5">
                        Daftar {t.key.charAt(0).toUpperCase() + t.key.slice(1)}
                      </h2>
                      <p className="text-slate-500 text-xs md:text-sm">
                        Menampilkan {dataSource.length} item pada tab ini
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        allowClear
                        placeholder="Cari nama, jenis cuti, keterangan, atau tanggal…"
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
                      onChange: (current, pageSize) =>
                        setPagination({ current, pageSize }),
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
            border: 1px solid ${GOLD} !important;
          }
          .custom-tabs :global(.ant-tabs-nav) {
            margin-bottom: 0 !important;
          }
          .custom-tabs :global(.ant-tabs-content) {
            margin-top: 12px;
          }
        `}</style>
      </div>

      {/* Modal penolakan */}
      <Modal
        title="Tolak Pengajuan"
        open={!!rejectRow}
        okText="Tolak"
        okButtonProps={{ danger: true, disabled: !reason.trim() }}
        onOk={async () => {
          await vm.reject(rejectRow.id, reason.trim());
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
          placeholder="Contoh: Lengkapi dokumen pendukung."
        />
      </Modal>

      {/* Modal setujui: pilih return shift */}
      <ApproveModal
        openRow={approveRow}
        polaOptions={vm.polaOptions}
        onCancel={() => setApproveRow(null)}
        onSubmit={async (returnShift) => {
          await vm.approve(approveRow.id, null, returnShift);
          setApproveRow(null);
        }}
      />
    </ConfigProvider>
  );
}
