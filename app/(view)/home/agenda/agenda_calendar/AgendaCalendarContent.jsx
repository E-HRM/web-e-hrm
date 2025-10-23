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
} from "antd";
import {
  ProfileOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import useVM from "./useAgendaCalendarViewModel";

dayjs.locale("id");

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

  const confirmDelete = (id) => {
    Modal.confirm({
      title: "Hapus agenda ini?",
      okText: "Hapus",
      okButtonProps: { danger: true },
      cancelText: "Batal",
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

  const openDetail = (arg) => {
    setDetailEvent(arg.event);
    setDetailOpen(true);
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

  // Ambil id_user seandainya sumbernya beda-beda
  const id =
    detailEvent.extendedProps?.id_user ??
    raw?.id_user ??
    raw?.user?.id_user ??
    null;

  // 1) PRIORITAS: user lengkap dari master (punya foto)
  const fromMap = id ? vm.getUserById(id) : null;

  // 2) FALLBACK: user tipis dari event (biasanya tanpa foto)
  const fallback = detailEvent.extendedProps?.user || raw?.user || null;

  // Merge: field dari fromMap menimpa fallback (biar foto ikut)
  const user = fromMap ? { ...fallback, ...fromMap } : fallback;

  const name = user?.nama_pengguna || user?.name || user?.email || id || "—";
  const photo = vm.getPhotoUrl(user) || "/avatar-placeholder.jpg";
  const sub = vm.getJabatanName(user) || vm.getDepartemenName(user) || "—";
  const link = user?.id_user ? `/home/kelola_karyawan/karyawan/${user.id_user}` : null;

  return { user, name, photo, sub, link };
}, [detailEvent, vm]);

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
              <Tooltip title="Hapus">
                <Button
                  size="large"
                  danger
                  shape="circle"
                  icon={<DeleteOutlined />}
                  onClick={() => confirmDelete(detailEvent.id)}
                />
              </Tooltip>
            </div>
          </>
        )}
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
            label="Judul"
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

      {/* Modal Tambah Proyek/Agenda */}
      <Modal
        title="Tambah Proyek/Agenda"
        open={agendaOpen}
        onCancel={() => setAgendaOpen(false)}
        onOk={async () => {
          const { nama } = await agendaForm.validateFields();
          const id = await vm.createAgendaMaster(nama.trim());
          if (id) {
            form.setFieldsValue({ id_agenda: id });
          }
          setAgendaOpen(false);
          agendaForm.resetFields();
          notification.success({ message: "Proyek/Agenda dibuat" });
        }}
        okText="Simpan"
        destroyOnClose
      >
        <Form form={agendaForm} layout="vertical">
          <Form.Item
            label="Nama Proyek/Agenda"
            name="nama"
            rules={[{ required: true, message: "Wajib diisi" }]}
          >
            <Input placeholder="Mis. Pengembangan HRIS" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Gaya global khusus FullCalendar (ellipsis + chip) */}
      <style jsx global>{`
        .fc .fc-daygrid-event { padding: 2px 6px; }
        .fc-event-custom{
          display:flex;
          align-items:center;
          gap:6px;
          min-width:0;
        }
        .fc-title-ellipsis{
          display:inline-block;
          min-width:0;
          max-width:100%;
          overflow:hidden;
          white-space:nowrap;
          text-overflow:ellipsis;
          line-height:1.15;
        }
        .fc-chip{
          display:inline-block;
          padding:1px 6px;
          border-radius:999px;
          font-size:10px;
          line-height:16px;
          border:1px solid transparent;
          flex:0 0 auto;
          background:#f3f4f6;
          color:#334155;
          border-color:#e5e7eb;
        }
        .fc-chip--proc{ background:#EBF2FF; color:#1d4ed8; border-color:#dbeafe; }
        .fc-chip--hold{ background:#FFF7E6; color:#b45309; border-color:#fde68a; }
        .fc-chip--done{ background:#EAF7EC; color:#15803d; border-color:#bbf7d0; }

        /* Hilangkan underline link event bawaan */
        .fc .fc-daygrid-event a{ text-decoration:none; }

        /* Opsional: clamp 2 baris (ganti title satu baris di atas) */
        /* 
        .fc-title-ellipsis{
          display:-webkit-box;
          -webkit-line-clamp:2;
          -webkit-box-orient:vertical;
          overflow:hidden;
          white-space:normal;
        }
        */
      `}</style>
    </div>
  );
}
