"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
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
  Dropdown,            // <-- ADD
} from "antd";
import {
  ProfileOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EllipsisOutlined,     // <-- ADD
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import useVM from "./useAgendaCalendarViewModel";

dayjs.locale("id");
dayjs.extend(utc);
dayjs.extend(timezone);

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });
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
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onError={(e) => {
          e.currentTarget.src = "/avatar-placeholder.jpg";
          e.currentTarget.onerror = null;
        }}
      />
    </span>
  );
}

/* ===== Formatter KHUSUS Riwayat (tidak mengubah waktu lain) ===== */
const AUDIT_TZ = dayjs.tz.guess(); // ganti ke "Asia/Jakarta" bila perlu
function formatAuditLocal(v, fmt = "DD MMM YYYY HH:mm:ss") {
  if (!v) return "—";
  const s = String(v).trim();
  const hasTZ = /Z|[+-]\d{2}:\d{2}$/.test(s);
  const m = hasTZ ? dayjs(s).tz(AUDIT_TZ) : dayjs.utc(s).tz(AUDIT_TZ);
  return m.isValid() ? m.format(fmt) : "—";
}

/* ===== NORMALIZER URGENSI (fallback kalau VM belum kirim) ===== */
function normalizeUrgencyLocal(v) {
  const s = (v || "").toString().trim().toUpperCase();
  switch (s) {
    case "PENTING MENDESAK": return { label: "PENTING MENDESAK", level: 1 };
    case "TIDAK PENTING TAPI MENDESAK":
    case "TIDAK PENTING, TAPI MENDESAK": return { label: "TIDAK PENTING TAPI MENDESAK", level: 2 };
    case "PENTING TAK MENDESAK":
    case "PENTING TIDAK MENDESAK": return { label: "PENTING TAK MENDESAK", level: 3 };
    case "TIDAK PENTING TIDAK MENDESAK": return { label: "TIDAK PENTING TIDAK MENDESAK", level: 4 };
    default: return s ? { label: s, level: 4 } : null;
  }
}

export default function AgendaCalendarContent() {
  const { notification } = AntdApp.useApp();
  const calRef = useRef(null);
  const vm = useVM();

  /* ===== Form Create/Edit ===== */
  const [formOpen, setFormOpen] = useState(false);
  const [form] = Form.useForm();
  const [editId, setEditId] = useState(null);

  /* ===== Modal Tambah Proyek ===== */
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [agendaForm] = Form.useForm();

  /* ===== Detail Modal ===== */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);

  /* ===== Riwayat Modal ===== */
  const [historyOpen, setHistoryOpen] = useState(false);

  /* ----- helpers ----- */
  const statusColor = (st) =>
    st === "selesai" ? "fc-chip fc-chip--done" : st === "ditunda" ? "fc-chip fc-chip--hold" : "fc-chip fc-chip--proc";

  const openCreate = (startStr, endStr) => {
    setEditId(null);
    form.setFieldsValue({
      title: "",
      status: "diproses",
      users: [],
      id_agenda: null,
      start: dayjs(startStr),
      end: dayjs(endStr),
    });
    setFormOpen(true);
  };

  const openEdit = (fcEvent) => {
    setEditId(fcEvent.id);
    form.setFieldsValue({
      title: fcEvent.title,
      status: fcEvent.extendedProps?.status || "diproses",
      users: [fcEvent.extendedProps?.id_user].filter(Boolean),
      id_agenda: fcEvent.extendedProps?.id_agenda || null,
      start: dayjs(fcEvent.start),
      end: dayjs(fcEvent.end || fcEvent.start),
    });
    setFormOpen(true);
  };

  const handleSubmitForm = async () => {
    const v = await form.validateFields();
    const payload = {
      title: v.title.trim(),
      start: v.start?.toDate(),
      end: (v.end || v.start)?.toDate(),
      status: v.status,
      id_agenda: v.id_agenda || null,
    };
    try {
      if (editId) {
        await vm.updateEvent(editId, payload);
        notification.success({ message: "Agenda diperbarui" });
      } else {
        if (!Array.isArray(v.users) || v.users.length === 0) {
          notification.warning({ message: "Pilih setidaknya satu karyawan" });
          return;
        }
        await vm.createEvents({ ...payload, userIds: v.users });
        notification.success({ message: "Agenda dibuat" });
      }
      setFormOpen(false);
      form.resetFields();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Gagal menyimpan agenda";
      notification.error({ message: msg });
    }
  };

  // Single delete -> pastikan di atas modal detail
  const confirmDelete = (id) => {
    Modal.confirm({
      title: "Hapus agenda ini?",
      okText: "Hapus",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      zIndex: 11150,                // <-- di atas modal detail (11000)
      getContainer: () => document.body,
      onOk: async () => {
        try {
          await vm.deleteEvent(id);
          notification.success({ message: "Agenda dihapus" });
          setDetailOpen(false);
        } catch (e) {
          const msg = e?.response?.data?.message || e?.message || "Gagal menghapus agenda";
          notification.error({ message: msg });
        }
      },
    });
  };

  // Hapus serentak (judul+proyek+jam sama) -> konfirm di atas modal detail
  const confirmBulkDeleteSimilar = async () => {
    if (!detailEvent) return;
    try {
      const { targets } = await vm.findSimilarEventsByEvent(detailEvent);
      const n = targets.length;
      if (!n) {
        notification.info({ message: "Tidak ada agenda serupa ditemukan." });
        return;
      }
      Modal.confirm({
        title: `Hapus ${n} agenda serupa untuk semua karyawan?`,
        content: "Semua item dengan Proyek, Judul, dan jam Mulai/Selesai yang sama akan dihapus.",
        okText: "Hapus Semua",
        okButtonProps: { danger: true },
        cancelText: "Batal",
        zIndex: 11150,              // <-- di atas modal detail (11000) & riwayat (11100)
        getContainer: () => document.body,
        onOk: async () => {
          try {
            const ids = targets.map((t) => t.id_agenda_kerja || t.id);
            await vm.bulkDeleteByIds(ids);
            notification.success({ message: `Terhapus ${n} agenda` });
            setDetailOpen(false);
          } catch (e) {
            const msg = e?.response?.data?.message || e?.message || "Gagal hapus massal";
            notification.error({ message: msg });
          }
        },
      });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Gagal mencari agenda serupa";
      notification.error({ message: msg });
    }
  };

  const openDetail = (arg) => {
    setDetailEvent(arg.event);
    setDetailOpen(true);
    // Tutup popover "+X more" agar tidak menutupi modal
    document.querySelectorAll(".fc-popover").forEach((el) => el.remove());
  };

  const commitMoveResize = async ({ event }) => {
    try {
      await vm.updateEvent(event.id, {
        title: event.title,
        start: event.start,
        end: event.end || event.start,
        status: event.extendedProps?.status || "diproses",
        id_agenda: event.extendedProps?.id_agenda || null,
      });
      notification.success({ message: "Agenda diperbarui" });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Gagal memperbarui agenda";
      notification.error({ message: msg });
      event.revert();
    }
  };

  /* ===== Render event dengan ellipsis & chip kecil ===== */
  const renderEventContent = (info) => {
    const st = info.event.extendedProps?.status;
    const time = info.timeText ? `${info.timeText} ` : "";
    return (
      <div className="fc-event-custom">
        <span className="fc-title-ellipsis" title={info.event.title}>
          {time}
          {info.event.title}
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

    const name = user?.nama_pengguna || user?.name || user?.email || id || "—";
    const photo = vm.getPhotoUrl(user) || "/avatar-placeholder.jpg";
    const sub = vm.getJabatanName(user) || vm.getDepartemenName(user) || "—";
    const link = user?.id_user ? `/home/kelola_karyawan/karyawan/${user.id_user}` : null;

    return { user, name, photo, sub, link };
  }, [detailEvent, vm]);

  /* ===== audit created/updated (KHUSUS Riwayat) ===== */
  const audit = useMemo(() => {
    const raw = detailEvent?.extendedProps?.raw || {};
       const created =
      raw.created_at ?? raw.createdAt ?? raw.created ?? raw.tanggal_dibuat ?? null;
    const updated =
      raw.updated_at ?? raw.updatedAt ?? raw.updated ?? raw.tanggal_diubah ?? null;

    return {
      createdText: formatAuditLocal(created, "DD MMM YYYY HH:mm"),
      updatedText: formatAuditLocal(updated, "DD MMM YYYY HH:mm"),
    };
  }, [detailEvent]);

  /* ===== URGENSI: pastikan selalu terhitung (fallback dari raw) ===== */
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

  // === Menu titik-tiga (More)
  const onMoreMenuClick = ({ key }) => {
    if (key === "history") setHistoryOpen(true);
    if (key === "bulk-delete") confirmBulkDeleteSimilar();
  };
  const moreMenu = {
    items: [
      { key: "history", label: "Lihat Riwayat", icon: <ClockCircleOutlined /> },
      { type: "divider" },
      { key: "bulk-delete", label: "Hapus Serentak", icon: <DeleteOutlined />, danger: true },
    ],
    onClick: onMoreMenuClick,
  };

  return (
    <div className="p-4">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xl p-3">
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
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
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
      >
        {!detailEvent ? null : (
          <>
            <div className="flex items-start gap-3">
              <CircleImg src={detailUser?.photo} alt={detailUser?.name} size={48} />
              <div className="min-w-0">
                <div style={{ fontWeight: 700, fontSize: 16 }} className="truncate">
                  {detailUser?.link ? (
                    <Link href={detailUser.link} className="no-underline" style={{ color: "#0f172a" }}>
                      {detailUser?.name}
                    </Link>
                  ) : (
                    detailUser?.name
                  )}
                </div>
                <div style={{ color: "#64748b", marginTop: 2 }} className="truncate">
                  {detailUser?.sub || "—"}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {detailEvent.extendedProps?.status ? (
                    <span className={statusColor(detailEvent.extendedProps.status)}>
                      {detailEvent.extendedProps.status}
                    </span>
                  ) : null}

                  {/* Chip urgensi di sebelah kanan status */}
                  {urgencyChip?.label ? (
                    <span className={`fc-chip fc-chip--urg-${urgencyChip.level}`}>
                      {urgencyChip.label}
                    </span>
                  ) : null}

                  {detailEvent.extendedProps?.agenda?.nama_agenda ? (
                    <span className="fc-chip">{detailEvent.extendedProps.agenda.nama_agenda}</span>
                  ) : null}

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: 999,
                      fontSize: 12,
                      color: "#334155",
                      background: "#fafafa",
                    }}
                  >
                    <ClockCircleOutlined />
                    <span>
                      {vm.showFromDB(
                        detailEvent.extendedProps?.raw?.start_date || detailEvent.start,
                        "DD MMM YYYY HH:mm"
                      )}{" "}
                      -{" "}
                      {vm.showFromDB(
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

            <div style={{ fontSize: 14, color: "#0f172a", whiteSpace: "pre-wrap" }}>
              {detailEvent.extendedProps?.deskripsi || "—"}
            </div>

            <div className="flex justify-end gap-2 mt-12">
              {/* Edit */}
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

              {/* Hapus satu */}
              <Tooltip title="Hapus satu ini">
                <Button
                  size="large"
                  danger
                  shape="circle"
                  icon={<DeleteOutlined />}
                  onClick={() => confirmDelete(detailEvent.id)}
                />
              </Tooltip>

              {/* More (history + bulk delete) — diletakkan setelah tong sampah */}
              <Dropdown menu={moreMenu} placement="bottomRight" trigger={["click"]}>
                <Button size="large" shape="circle" icon={<EllipsisOutlined />} />
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
      >
        <div style={{ display: "grid", rowGap: 8, fontSize: 14 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 120, color: "#64748b" }}>Dibuat</div>
            <div style={{ color: "#0f172a" }}>{audit.createdText}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 120, color: "#64748b" }}>Diubah</div>
            <div style={{ color: "#0f172a" }}>{audit.updatedText}</div>
          </div>
        </div>
      </Modal>

      {/* Form Create/Edit */}
      <Modal
        title={editId ? "Edit Agenda" : "Agenda Baru"}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleSubmitForm}
        okText={editId ? "Simpan" : "Buat"}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Nama Aktivitas"
            name="title"
            rules={[{ required: true, message: "Judul wajib diisi" }]}
          >
            <Input placeholder="Contoh: Meeting Sprint, Kunjungan Client" />
          </Form.Item>

          {!editId && (
            <Form.Item
              label="Karyawan"
              name="users"
              rules={[{ required: true, message: "Pilih minimal satu karyawan" }]}
            >
              <Select
                mode="multiple"
                placeholder="Pilih karyawan"
                options={vm.userOptions}
                showSearch
                optionFilterProp="label"
                listHeight={400}
                virtual
                loading={!vm.userOptions?.length}
              />
            </Form.Item>
          )}

          {editId && (
            <Form.Item label="Karyawan" name="users">
              <Select mode="multiple" disabled options={vm.userOptions} />
            </Form.Item>
          )}

          <Form.Item label="Status" name="status" initialValue="diproses">
            <Select
              options={[
                { value: "diproses", label: "Diproses" },
                { value: "ditunda", label: "Ditunda" },
                { value: "selesai", label: "Selesai" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Proyek/Agenda" required>
            <Space.Compact className="w-full">
              <Form.Item
                name="id_agenda"
                noStyle
                rules={[{ required: true, message: "Pilih proyek/agenda" }]}
              >
                <Select
                  placeholder="Pilih Proyek"
                  options={vm.agendaOptions}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
              <Button icon={<PlusOutlined />} onClick={() => setAgendaOpen(true)}>
                Tambah Proyek
              </Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            label="Mulai"
            name="start"
            rules={[{ required: true, message: "Tanggal mulai wajib diisi" }]}
          >
            <DatePicker showTime className="w-full" />
          </Form.Item>
          <Form.Item label="Selesai" name="end">
            <DatePicker showTime className="w-full" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Gaya global khusus FullCalendar (ellipsis + chip + urgensi) */}
      <style jsx global>{`
        .fc .fc-daygrid-event { padding: 2px 6px; }
        .fc-event-custom{ display:flex; align-items:center; gap:6px; min-width:0; }
        .fc-title-ellipsis{
          display:inline-block; min-width:0; max-width:100%;
          overflow:hidden; white-space:nowrap; text-overflow:ellipsis; line-height:1.15;
        }
        .fc-chip{
          display:inline-block; padding:1px 6px; border-radius:999px;
          font-size:10px; line-height:16px; border:1px solid transparent;
          flex:0 0 auto; background:#f3f4f6; color:#334155; border-color:#e5e7eb;
        }
        .fc-chip--proc{ background:#EBF2FF; color:#1d4ed8; border-color:#dbeafe; }
        .fc-chip--hold{ background:#FFF7E6; color:#b45309; border-color:#fde68a; }
        .fc-chip--done{ background:#EAF7EC; color:#15803d; border-color:#bbf7d0; }
        .fc-chip--urg-1{ background:#fee2e2; color:#b91c1c; border-color:#fecaca; }
        .fc-chip--urg-2{ background:#fce7f3; color:#9d174d; border-color:#fbcfe8; }
        .fc-chip--urg-3{ background:#fff7ed; color:#9a3412; border-color:#fed7aa; }
        .fc-chip--urg-4{ background:#f1f5f9; color:#334155; border-color:#e2e8f0; }
        .fc .fc-daygrid-event a{ text-decoration:none; }
      `}</style>
    </div>
  );
}
