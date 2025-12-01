"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
// HAPUS: import "react-quill/dist/quill.snow.css";
import {
  App as AntdApp,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Space,
  Tooltip,
  Divider,
  Dropdown,
} from "antd";
import {
  ProfileOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import useVM, { showFromDB as showFromDBVM } from "./useAgendaCalendarViewModel";

dayjs.locale("id");
dayjs.extend(utc);
dayjs.extend(timezone);

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});
// HAPUS: ReactQuill
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";

/* Avatar bulat ringkas */
function CircleImg({ src, size = 44, alt = "Avatar" }) {
  const s = {
    width: size,
    height: size,
    borderRadius: "9999px",
    overflow: "hidden",
    border: `1px solid #003A6F22`,
    background: "#E6F0FA",
    flexShrink: 0,
    display: "inline-block",
  };
  return (
    <span style={s} className="shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || "/avatar-placeholder.jpg"}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
        onError={(e) => {
          e.currentTarget.src = "/avatar-placeholder.jpg";
          e.currentTarget.onerror = null;
        }}
      />
    </span>
  );
}

function isQuillEmpty(html) {
  if (!html) return true;
  const stripped = html
    .replace(/<p><br><\/p>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
  return stripped.length === 0;
}

/* ===== Formatter KHUSUS Riwayat ===== */
const AUDIT_TZ = dayjs.tz.guess();
function formatAuditLocal(v, fmt = "DD MMM YYYY HH:mm:ss") {
  if (!v) return "—";
  const s = String(v).trim();
  const hasTZ = /Z|[+-]\d{2}:\d{2}$/.test(s);
  const m = hasTZ ? dayjs(s).tz(AUDIT_TZ) : dayjs.utc(s).tz(AUDIT_TZ);
  return m.isValid() ? m.format(fmt) : "—";
}

/* ===== NORMALIZER URGENSI ===== */
function normalizeUrgencyLocal(v) {
  const s = (v || "").toString().trim().toUpperCase();
  switch (s) {
    case "PENTING MENDESAK":
      return { label: "PENTING MENDESAK", level: 1 };
    case "TIDAK PENTING TAPI MENDESAK":
    case "TIDAK PENTING, TAPI MENDESAK":
      return { label: "TIDAK PENTING TAPI MENDESAK", level: 2 };
    case "PENTING TAK MENDESAK":
    case "PENTING TIDAK MENDESAK":
      return { label: "PENTING TAK MENDESAK", level: 3 };
    case "TIDAK PENTING TIDAK MENDESAK":
      return { label: "TIDAK PENTING TIDAK MENDESAK", level: 4 };
    default:
      return s ? { label: s, level: 4 } : null;
  }
}

export default function AgendaCalendarContent() {
  const { notification } = AntdApp.useApp();
  const calRef = useRef(null);
  const vm = useVM();

  // default jam untuk DatePicker (tanpa detik)
  const defaultStartTime = dayjs("00:00", "HH:mm");
  const defaultEndTime = dayjs("23:59", "HH:mm");

  /* ===== Form Create/Edit ===== */
  const [formOpen, setFormOpen] = useState(false);
  const [form] = Form.useForm();
  const [editId, setEditId] = useState(null);

  // Watch untuk jumlah user
  const usersSelected = Form.useWatch("users", form) || [];
  const totalUsers = vm.userOptions?.length || 0;

  const [createProgress, setCreateProgress] = useState({
    running: false,
    sent: 0,
    total: 0,
  });

  /* ===== Modal Tambah Proyek (opsional) ===== */
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [agendaForm] = Form.useForm();

  /* ===== Detail Modal ===== */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);

  /* ===== Riwayat Modal ===== */
  const [historyOpen, setHistoryOpen] = useState(false);

  /* ----- helpers ----- */
  const statusColor = (st) =>
    st === "selesai"
      ? "fc-chip fc-chip--done"
      : st === "ditunda"
      ? "fc-chip fc-chip--hold"
      : st === "teragenda"
      ? "fc-chip fc-chip--plan"
      : "fc-chip fc-chip--proc";

  // BUKA CREATE:
  // base day = tanggal yang dipilih di kalender (startStr),
  // lalu set 00:00–23:59 di hari itu, supaya 1 kotak saja.
  const openCreate = (startStr, endStr) => {
    setEditId(null);

    const baseDay = startStr ? dayjs(startStr) : dayjs();
    const start = baseDay.startOf("day"); // 00:00
    const end = baseDay.hour(23).minute(59); // 23:59

    form.setFieldsValue({
      title: "",
      status: "teragenda",
      users: [],
      id_agenda: null,
      start,
      end,
    });
    setFormOpen(true);
  };

  const openEdit = (fcEvent) => {
    setEditId(fcEvent.id);

    const raw = fcEvent.extendedProps?.raw || {};
    const descText =
      fcEvent.extendedProps?.deskripsi ??
      raw.deskripsi_kerja ??
      raw.deskripsi ??
      "";

    // Normalisasi start & end
    let start = dayjs(fcEvent.start);
    let end = dayjs(fcEvent.end || fcEvent.start);

    // Kalau data lama pola-nya: start=hari N 00:00, end=hari N+1 00:00,
    // anggap sebagai "full day" dan ubah end jadi 23:59 di hari yang sama.
    if (
      fcEvent.end &&
      end.diff(start, "day") === 1 &&
      start.hour() === 0 &&
      start.minute() === 0 &&
      end.hour() === 0 &&
      end.minute() === 0
    ) {
      end = start.hour(23).minute(59);
    }

    form.setFieldsValue({
      title: descText,
      status: fcEvent.extendedProps?.status || "teragenda",
      users: [fcEvent.extendedProps?.id_user].filter(Boolean),
      id_agenda: fcEvent.extendedProps?.id_agenda || null,
      start,
      end,
    });
    setFormOpen(true);
  };

  // Helper Pilih Semua / Bersihkan Karyawan
  const handleSelectAllUsers = () => {
    const allIds = (vm.userOptions || []).map((opt) => opt.value);
    form.setFieldsValue({ users: allIds });
  };

  const handleClearUsers = () => {
    form.setFieldsValue({ users: [] });
  };

  const usersLabelNode = (
    <div className="flex items-center justify-between gap-2">
      <span>Karyawan</span>
      <span className="text-[11px] text-slate-500">
        Dipilih: {usersSelected.length}/{totalUsers}
      </span>
    </div>
  );

  const handleSubmitForm = async () => {
    const v = await form.validateFields();
    const title = (v.title || "").trim();

    if (!title) {
      notification.warning({ message: "Nama aktivitas tidak boleh kosong" });
      return;
    }

    const payload = {
      title,
      start: v.start?.toDate(),
      end: (v.end || v.start)?.toDate(),
      status: v.status,
      id_agenda: v.id_agenda || null,
    };

    try {
      if (editId) {
        setCreateProgress({ running: true, sent: 0, total: 1 });
        await vm.updateEvent(editId, payload);
        notification.success({ message: "Agenda diperbarui" });
      } else {
        if (!Array.isArray(v.users) || v.users.length === 0) {
          notification.warning({
            message: "Pilih setidaknya satu karyawan",
          });
          return;
        }

        const total = v.users.length;
        setCreateProgress({ running: true, sent: 0, total });

        await vm.createEvents({
          ...payload,
          userIds: v.users,
          onProgress: ({ sent, total }) => {
            setCreateProgress((prev) => ({
              ...prev,
              running: true,
              sent,
              total,
            }));
          },
        });

        notification.success({ message: "Agenda dibuat" });
      }

      setFormOpen(false);
      setEditId(null);
      form.resetFields();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Gagal menyimpan agenda";
      notification.error({ message: msg });
    } finally {
      setCreateProgress({ running: false, sent: 0, total: 0 });
    }
  };

  const confirmDelete = (id) => {
    Modal.confirm({
      title: "Hapus agenda ini?",
      okText: "Hapus",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      zIndex: 11150,
      getContainer: () => document.body,
      onOk: async () => {
        try {
          await vm.deleteEvent(id);
          notification.success({ message: "Agenda dihapus" });
          setDetailOpen(false);
        } catch (e) {
          const msg =
            e?.response?.data?.message ||
            e?.message ||
            "Gagal menghapus agenda";
          notification.error({ message: msg });
        }
      },
    });
  };

  const confirmBulkDeleteSimilar = async () => {
    if (!detailEvent) return;
    try {
      const { targets } = await vm.findSimilarEventsByEvent(detailEvent);
      const n = targets.length;
      if (!n) {
        notification.info({
          message: "Tidak ada agenda serupa ditemukan.",
        });
        return;
      }
      Modal.confirm({
        title: `Hapus ${n} agenda serupa untuk semua karyawan?`,
        content:
          "Semua item dengan Proyek, Aktivitas, dan jam Mulai/Selesai yang sama akan dihapus.",
        okText: "Hapus Semua",
        okButtonProps: { danger: true },
        cancelText: "Batal",
        zIndex: 11150,
        getContainer: () => document.body,
        onOk: async () => {
          try {
            const ids = targets.map((t) => t.id_agenda_kerja || t.id);
            await vm.bulkDeleteByIds(ids);
            notification.success({ message: `Terhapus ${n} agenda` });
            setDetailOpen(false);
          } catch (e) {
            const msg =
              e?.response?.data?.message ||
              e?.message ||
              "Gagal hapus massal";
            notification.error({ message: msg });
          }
        },
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Gagal mencari agenda serupa";
      notification.error({ message: msg });
    }
  };

  /* === BUKA DETAIL TANPA MENUTUP POPOVER "+X more" === */
  const openDetail = (arg) => {
    arg.jsEvent?.preventDefault?.();
    arg.jsEvent?.stopPropagation?.();
    setDetailEvent(arg.event);
    setDetailOpen(true);
  };

  /* ====== Guard: tahan FullCalendar menutup popover saat modal detail terbuka ====== */
  useEffect(() => {
    if (!detailOpen) return;
    const guard = (e) => {
      e.stopPropagation();
    };
    document.addEventListener("mousedown", guard, true);
    document.addEventListener("touchstart", guard, true);
    return () => {
      document.removeEventListener("mousedown", guard, true);
      document.removeEventListener("touchstart", guard, true);
    };
  }, [detailOpen]);

  const commitMoveResize = async ({ event }) => {
    try {
      const raw = event.extendedProps?.raw || {};
      const descText =
        event.extendedProps?.deskripsi ??
        raw.deskripsi_kerja ??
        raw.deskripsi ??
        "";

      await vm.updateEvent(event.id, {
        title: descText, // pakai deskripsi aktivitas, bukan nama proyek
        start: event.start,
        end: event.end || event.start,
        status: event.extendedProps?.status || "teragenda",
        id_agenda: event.extendedProps?.id_agenda || null,
      });
      notification.success({ message: "Agenda diperbarui" });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Gagal memperbarui agenda";
      notification.error({ message: msg });
      event.revert();
    }
  };

  /* ===== Render event: JAM · EVENT/PROYEK · NAMA · STATUS ===== */
  const renderEventContent = (info) => {
    const st = info.event.extendedProps?.status;

    const projectName =
      info.event.extendedProps?.agenda?.nama_agenda ||
      info.event.extendedProps?.agenda_name ||
      info.event.title ||
      "-";

    const uid = info.event.extendedProps?.id_user;
    const userFromMap = uid ? vm.getUserById(uid) : null;
    const userName =
      info.event.extendedProps?.user?.nama_pengguna ||
      userFromMap?.nama_pengguna ||
      info.event.extendedProps?.user?.name ||
      info.event.extendedProps?.user?.email ||
      "";

    const jam = info.timeText ? info.timeText.replace(":", ".") : "";
    const titleText = [jam, projectName, userName]
      .filter(Boolean)
      .join(" · ");

    return (
      <div className="fc-event-custom">
        <span className="fc-title-ellipsis" title={titleText}>
          {titleText}
        </span>
        {st ? <span className={statusColor(st)}>{st}</span> : null}
      </div>
    );
  };

  /* ===== user header untuk Detail ===== */
  const detailUser = useMemo(() => {
    if (!detailEvent) return null;
    const raw = detailEvent.extendedProps?.raw || {};

    const id =
      detailEvent.extendedProps?.id_user ??
      raw?.id_user ??
      raw?.user?.id_user ??
      null;

    const fromMap = id ? vm.getUserById(id) : null;
    const fallback = detailEvent.extendedProps?.user || raw?.user || null;
    const user = fromMap ? { ...fallback, ...fromMap } : fallback;

    const name =
      user?.nama_pengguna || user?.name || user?.email || id || "—";
    const photo = vm.getPhotoUrl(user) || "/avatar-placeholder.jpg";
    const sub =
      vm.getJabatanName(user) ||
      vm.getDepartemenName(user) ||
      "—";
    const link = user?.id_user
      ? `/home/kelola_karyawan/karyawan/${user.id_user}`
      : null;

    return { user, name, photo, sub, link };
  }, [detailEvent, vm]);

  /* ===== audit created/updated ===== */
  const audit = useMemo(() => {
    const raw = detailEvent?.extendedProps?.raw || {};
    const created =
      raw.created_at ??
      raw.createdAt ??
      raw.created ??
      raw.tanggal_dibuat ??
      null;
    const updated =
      raw.updated_at ??
      raw.updatedAt ??
      raw.updated ??
      raw.tanggal_diubah ??
      null;

    return {
      createdText: formatAuditLocal(created, "DD MMM YYYY HH:mm"),
      updatedText: formatAuditLocal(updated, "DD MMM YYYY HH:mm"),
    };
  }, [detailEvent]);

  /* ===== URGENSI ===== */
  const urgencyChip = useMemo(() => {
    if (!detailEvent) return null;
    const fromProps = detailEvent.extendedProps?.urgency || null;
    if (fromProps?.label) return fromProps;

    const raw = detailEvent.extendedProps?.raw || {};
    const rawVal =
      raw.kebutuhan_agenda ??
      raw.kebutuhan ??
      raw.urgensi ??
      raw.prioritas ??
      raw.agenda?.kebutuhan_agenda ??
      raw.agenda_kerja?.kebutuhan_agenda ??
      null;

    return normalizeUrgencyLocal(rawVal);
  }, [detailEvent]);

  const descHtml = detailEvent?.extendedProps?.deskripsi || "";

  // Menu titik tiga
  const onMoreMenuClick = ({ key }) => {
    if (key === "history") setHistoryOpen(true);
    if (key === "bulk-delete") confirmBulkDeleteSimilar();
  };
  const moreMenu = {
    items: [
      { key: "history", label: "Lihat Riwayat", icon: <ClockCircleOutlined /> },
      { type: "divider" },
      {
        key: "bulk-delete",
        label: "Hapus Serentak",
        icon: <DeleteOutlined />,
        danger: true,
      },
    ],
    onClick: onMoreMenuClick,
  };

  return (
    <div className="p-4">
      <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl p-3">
        {vm.loadingInitialEvents && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50/90 px-4 py-1 text-xs text-sky-700 ring-1 ring-sky-200 shadow">
              <span className="inline-block h-3 w-3 rounded-full border border-sky-500 border-t-transparent animate-spin" />
              <span>Memuat agenda kerja…</span>
            </div>
          </div>
        )}

        {vm.reloadingEvents && !vm.loadingInitialEvents && (
          <div className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] text-slate-500 shadow-sm">
            Memuat ulang agenda…
          </div>
        )}

        <FullCalendar
          ref={calRef}
          height="auto"
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          locale="id"
          timeZone="local"
          dayMaxEventRows={3}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          selectable
          selectMirror
          editable
          eventResizableFromStart
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          select={(sel) => openCreate(sel.startStr, sel.endStr)}
          eventClick={openDetail}
          eventDrop={commitMoveResize}
          eventResize={commitMoveResize}
          datesSet={(info) => vm.setRange(info.start, info.end)}
          events={vm.events}
          eventContent={renderEventContent}
        />
      </div>

      {/* Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ProfileOutlined />
            <span>Agenda Detail</span>
          </div>
        }
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={760}
        destroyOnClose
        maskClosable={false}
        zIndex={11000}
        centered
        styles={{ body: { maxHeight: "72vh", overflowY: "auto" } }}
      >
        {!detailEvent ? null : (
          <>
            <div className="flex items-start gap-3">
              <CircleImg
                src={detailUser?.photo}
                alt={detailUser?.name}
                size={48}
              />
              <div className="min-w-0">
                <div
                  style={{ fontWeight: 700, fontSize: 16 }}
                  className="truncate"
                >
                  {detailUser?.link ? (
                    <Link
                      href={detailUser.link}
                      className="no-underline"
                      style={{ color: "#0f172a" }}
                    >
                      {detailUser?.name}
                    </Link>
                  ) : (
                    detailUser?.name
                  )}
                </div>
                <div
                  style={{ color: "#64748b", marginTop: 2 }}
                  className="truncate"
                >
                  {detailUser?.sub || "—"}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {detailEvent.extendedProps?.status ? (
                    <span
                      className={statusColor(
                        detailEvent.extendedProps.status
                      )}
                    >
                      {detailEvent.extendedProps.status}
                    </span>
                  ) : null}

                  {urgencyChip?.label ? (
                    <span
                      className={`fc-chip fc-chip--urg-${urgencyChip.level}`}
                    >
                      {urgencyChip.label}
                    </span>
                  ) : null}

                  {detailEvent.extendedProps?.agenda?.nama_agenda ? (
                    <span className="fc-chip fc-chip--clip1">
                      {detailEvent.extendedProps.agenda.nama_agenda}
                    </span>
                  ) : null}

                  <div className="fc-chip--time">
                    <ClockCircleOutlined />
                    <span>
                      {showFromDBVM(
                        detailEvent.extendedProps?.raw?.start_date ||
                          detailEvent.start,
                        "DD MMM YYYY HH:mm"
                      )}{" "}
                      -{" "}
                      {showFromDBVM(
                        detailEvent.extendedProps?.raw?.end_date ||
                          detailEvent.end ||
                          detailEvent.start,
                        "DD MMM YYYY HH:mm"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Divider style={{ margin: "14px 0 12px" }} />

            {/* Deskripsi: kalau data lama masih HTML dari Quill, ini tetap dirender.
                Kalau sekarang plain text, tetap aman. */}
            <div
              style={{
                fontSize: 14,
                color: "#0f172a",
                wordBreak: "break-word",
              }}
              dangerouslySetInnerHTML={{
                __html: isQuillEmpty(descHtml)
                  ? '<span style="color:#94a3b8">—</span>'
                  : descHtml,
              }}
            />

            <div className="flex justify-end gap-2 mt-10">
              <Tooltip title="Edit">
                <Button
                  size="large"
                  shape="circle"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setDetailOpen(false);
                    openEdit(detailEvent);
                  }}
                />
              </Tooltip>

              <Tooltip title="Hapus satu ini">
                <Button
                  size="large"
                  danger
                  shape="circle"
                  icon={<DeleteOutlined />}
                  onClick={() => confirmDelete(detailEvent.id)}
                />
              </Tooltip>

              <Dropdown
                menu={moreMenu}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Button
                  size="large"
                  shape="circle"
                  icon={<EllipsisOutlined />}
                />
              </Dropdown>
            </div>
          </>
        )}
      </Modal>

      {/* Modal Riwayat */}
      <Modal
        title="Riwayat Agenda"
        open={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        footer={null}
        width={480}
        destroyOnClose
        maskClosable
        zIndex={11100}
        centered
        styles={{ body: { maxHeight: "60vh", overflowY: "auto" } }}
      >
        <div style={{ display: "grid", rowGap: 8, fontSize: 14 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 120, color: "#64748b" }}>Dibuat</div>
            <div style={{ color: "#0f172a" }}>
              {formatAuditLocal(
                detailEvent?.extendedProps?.raw?.created_at,
                "DD MMM YYYY HH:mm"
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 120, color: "#64748b" }}>Diubah</div>
            <div style={{ color: "#0f172a" }}>
              {formatAuditLocal(
                detailEvent?.extendedProps?.raw?.updated_at,
                "DD MMM YYYY HH:mm"
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Buat / Edit Agenda */}
      <Modal
        title={editId ? "Edit Agenda" : "Agenda Baru"}
        open={formOpen}
        onCancel={() => {
          setFormOpen(false);
          setEditId(null);
          form.resetFields();
        }}
        centered
        footer={
          <div className="flex items-center justify-between gap-3">
            <div>
              {createProgress.running && !editId && (
                <span className="text-xs text-slate-500">
                  Sedang memproses agenda (
                  {createProgress.sent}/{createProgress.total})
                </span>
              )}
              {createProgress.running && editId && (
                <span className="text-xs text-slate-500">
                  Menyimpan perubahan agenda...
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setFormOpen(false);
                  setEditId(null);
                  form.resetFields();
                }}
                disabled={createProgress.running}
              >
                Batal
              </Button>
              <Button
                type="primary"
                onClick={handleSubmitForm}
                loading={createProgress.running}
              >
                {createProgress.running && !editId
                  ? `Buat (${createProgress.sent}/${createProgress.total})`
                  : createProgress.running && editId
                  ? "Menyimpan..."
                  : editId
                  ? "Simpan"
                  : "Buat"}
              </Button>
            </div>
          </div>
        }
        destroyOnClose
        styles={{
          body: {
            maxHeight: "60vh",
            overflowY: "auto",
          },
        }}
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Proyek/Agenda" required>
            <Space.Compact className="w-full">
              <Form.Item
                name="id_agenda"
                noStyle
                rules={[
                  { required: true, message: "Pilih proyek/agenda" },
                ]}
              >
                <Select
                  placeholder="Pilih Proyek"
                  options={vm.agendaOptions}
                  showSearch
                  optionFilterProp="label"
                  dropdownStyle={{ maxHeight: 320, overflowY: "auto" }}
                />
              </Form.Item>
              <Button
                icon={<PlusOutlined />}
                onClick={() => setAgendaOpen(true)}
              >
                Tambah Proyek
              </Button>
            </Space.Compact>
          </Form.Item>

          {/* INI KEMBALI KE ANT DESIGN BIASA */}
          <Form.Item
            label="Nama Aktivitas"
            name="title"
            rules={[{ required: true, message: "Judul wajib diisi" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Isi kegiatan..."
              autoSize={{ minRows: 4, maxRows: 8 }}
            />
          </Form.Item>

          {!editId && (
            <Form.Item
              label={usersLabelNode}
              name="users"
              rules={[
                {
                  required: true,
                  message: "Pilih minimal satu karyawan",
                },
              ]}
            >
              <Select
                mode="multiple"
                placeholder="Pilih karyawan"
                options={vm.userOptions}
                showSearch
                optionFilterProp="label"
                listHeight={256}
                virtual
                loading={!vm.userOptions?.length}
                maxTagCount="responsive"
                dropdownStyle={{ maxHeight: 360 }}
                dropdownRender={(menu) => (
                  <div>
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
                      <span className="text-[11px] text-slate-600">
                        Dipilih: {usersSelected.length}/{totalUsers}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          type="link"
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelectAllUsers();
                          }}
                        >
                          Pilih semua
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleClearUsers();
                          }}
                        >
                          Bersihkan
                        </Button>
                      </div>
                    </div>
                    <div style={{ maxHeight: 320, overflowY: "auto" }}>
                      {menu}
                    </div>
                  </div>
                )}
              />
            </Form.Item>
          )}

          {editId && (
            <Form.Item label={usersLabelNode} name="users">
              <Select
                mode="multiple"
                disabled
                options={vm.userOptions}
                maxTagCount="responsive"
              />
            </Form.Item>
          )}

          <Form.Item label="Status" name="status" initialValue="teragenda">
            <Select
              options={[
                { value: "teragenda", label: "Teragenda" },
                { value: "diproses", label: "Diproses" },
                { value: "ditunda", label: "Ditunda" },
                { value: "selesai", label: "Selesai" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Mulai"
            name="start"
            rules={[
              { required: true, message: "Tanggal mulai wajib diisi" },
            ]}
          >
            <DatePicker
              showTime={{ format: "HH:mm", defaultValue: defaultStartTime }}
              format="YYYY-MM-DD HH:mm"
              className="w-full"
            />
          </Form.Item>
          <Form.Item label="Selesai" name="end">
            <DatePicker
              showTime={{ format: "HH:mm", defaultValue: defaultEndTime }}
              format="YYYY-MM-DD HH:mm"
              className="w-full"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Tambah Proyek */}
      <Modal
        title="Tambah Proyek"
        open={agendaOpen}
        onCancel={() => {
          setAgendaOpen(false);
          agendaForm.resetFields();
        }}
        onOk={async () => {
          const v = await agendaForm.validateFields();
          const nama = String(v.nama_agenda || "").trim();
          if (!nama) return;

          try {
            const newId = await vm.createAgendaMaster(nama);
            if (newId) {
              form.setFieldsValue({ id_agenda: newId });
            }
            notification.success({
              message: "Proyek/agenda berhasil ditambahkan",
            });
            setAgendaOpen(false);
            agendaForm.resetFields();
          } catch (e) {
            const msg =
              e?.response?.data?.message ||
              e?.message ||
              "Gagal menambah proyek/agenda";
            notification.error({ message: msg });
          }
        }}
        okText="Simpan"
        destroyOnClose
        centered
        maskClosable={false}
        styles={{ body: { maxHeight: "60vh", overflowY: "auto" } }}
      >
        <Form form={agendaForm} layout="vertical">
          <Form.Item
            label="Nama Proyek / Agenda"
            name="nama_agenda"
            rules={[
              { required: true, message: "Nama proyek wajib diisi" },
            ]}
          >
            <Input placeholder="Contoh: Implementasi Client X" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Styling global FullCalendar + chip */}
      <style jsx global>{`
        .fc .fc-daygrid-event {
          padding: 2px 6px;
        }
        .fc-event-custom {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .fc-title-ellipsis {
          display: inline-block;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          line-height: 1.15;
        }

        .fc-more-popover {
          max-width: min(90vw, 560px);
          z-index: 1050 !important;
        }
        .fc-more-popover .fc-popover-body {
          max-height: 60vh;
          overflow: auto;
          padding-right: 4px;
        }
        .fc-more-popover .fc-event-custom {
          align-items: flex-start;
        }
        .fc-more-popover .fc-title-ellipsis {
          white-space: normal !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.25;
        }

        .fc-chip {
          display: inline-block;
          padding: 1px 6px;
          border-radius: 999px;
          font-size: 10px;
          line-height: 16px;
          border: 1px solid transparent;
          flex: 0 0 auto;
          background: #f3f4f6;
          color: #334155;
          border-color: #e5e7eb;
          max-width: 220px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fc-chip--proc {
          background: #ebf2ff;
          color: #1d4ed8;
          border-color: #dbeafe;
        }
        .fc-chip--hold {
          background: #fff7e6;
          color: #b45309;
          border-color: #fde68a;
        }
        .fc-chip--done {
          background: #eaf7ec;
          color: #15803d;
          border-color: #bbf7d0;
        }
        .fc-chip--plan {
          background: #f3f4f6;
          color: #374151;
          border-color: #e5e7eb;
        }

        .fc-chip--clip1 {
          max-width: 280px;
        }

        .fc-chip--time {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          font-size: 12px;
          line-height: 20px;
          border-radius: 999px;
          background: #f3f4f6;
          color: #334155;
          border: 1px solid #e5e7eb;
          width: max-content;
          max-width: none;
          white-space: nowrap;
          overflow: visible;
          text-overflow: clip;
          flex: 0 0 auto;
          flex-shrink: 0;
        }

        .fc .fc-daygrid-event a {
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}
