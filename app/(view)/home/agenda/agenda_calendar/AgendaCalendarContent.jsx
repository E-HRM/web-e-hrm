"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { App as AntdApp, Button, Modal, Form, Input, DatePicker, Select, Space, Tag } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/id";
import useAgendaCalendarViewModel from "./useAgendaCalendarViewModel";

dayjs.locale("id");

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";

export default function AgendaCalendarContent() {
  const { notification } = AntdApp.useApp();
  const calRef = useRef(null);

  const vm = useAgendaCalendarViewModel();

  // modal state
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [editId, setEditId] = useState(null);

  // open create with prefilled dates
  const openCreate = (startStr, endStr) => {
    setEditId(null);
    form.setFieldsValue({
      title: "",
      start: dayjs(startStr),
      end: dayjs(endStr),
      status: "diproses",
    });
    setOpen(true);
  };

  // open edit
  const openEdit = (event) => {
    setEditId(event.id);
    form.setFieldsValue({
      title: event.title,
      start: dayjs(event.start),
      end: dayjs(event.end || event.start),
      status: event.extendedProps?.status || "diproses",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      title: values.title.trim(),
      start: values.start.toDate(),
      end: values.end?.toDate() ?? values.start.toDate(),
      status: values.status,
    };
    try {
      if (editId) {
        await vm.updateEvent(editId, payload);
        notification.success({ message: "Agenda diperbarui" });
      } else {
        await vm.createEvent(payload);
        notification.success({ message: "Agenda dibuat" });
      }
      setOpen(false);
      form.resetFields();
    } catch (e) {
      notification.error({ message: "Gagal menyimpan agenda" });
    }
  };

  // drag/resize update
  const commitMoveResize = async ({ event }) => {
    try {
      await vm.updateEvent(event.id, {
        title: event.title,
        start: event.start,
        end: event.end || event.start,
        status: event.extendedProps?.status || "diproses",
      });
      notification.success({ message: "Agenda diperbarui" });
    } catch {
      notification.error({ message: "Gagal memperbarui agenda" });
      event.revert();
    }
  };

  // delete
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
        } catch {
          notification.error({ message: "Gagal menghapus agenda" });
        }
      },
    });
  };

  // render event content (label + status tag)
  const renderEventContent = (info) => {
    const status = info.event.extendedProps?.status;
    const color =
      status === "selesai" ? "green" :
      status === "ditunda" ? "orange" : "blue";
    return (
      <div className="fc-event-custom">
        <div>{info.timeText ? `${info.timeText} ` : ""}{info.event.title}</div>
        {status ? <Tag color={color} style={{ marginTop: 2 }}>{status}</Tag> : null}
      </div>
    );
  };

  // height responsif
  const height = "auto";

  return (
    <div className="p-4">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xl p-3">
        <FullCalendar
          ref={calRef}
          height={height}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          locale="id"
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
          select={(sel) => openCreate(sel.startStr, sel.endStr)}
          eventClick={(arg) =>
            Modal.info({
              title: arg.event.title,
              content: (
                <Space direction="vertical">
                  <div>
                    <b>Mulai:</b> {dayjs(arg.event.start).format("DD MMM YYYY HH:mm")}
                  </div>
                  <div>
                    <b>Selesai:</b>{" "}
                    {dayjs(arg.event.end || arg.event.start).format("DD MMM YYYY HH:mm")}
                  </div>
                  {arg.event.extendedProps?.deskripsi && (
                    <div>
                      <b>Deskripsi:</b> {arg.event.extendedProps.deskripsi}
                    </div>
                  )}
                  {arg.event.extendedProps?.status && (
                    <div>
                      <b>Status:</b> {arg.event.extendedProps.status}
                    </div>
                  )}
                </Space>
              ),
              okText: "Tutup",
              centered: true,
              icon: null,
              footer: (
                <div className="flex justify-end gap-2">
                  <Button onClick={() => { Modal.destroyAll(); openEdit(arg.event); }}>
                    Edit
                  </Button>
                  <Button danger onClick={() => { Modal.destroyAll(); confirmDelete(arg.event.id); }}>
                    Hapus
                  </Button>
                </div>
              ),
            })
          }
          eventDrop={commitMoveResize}
          eventResize={commitMoveResize}
          datesSet={(info) => vm.setRange(info.start, info.end)}
          events={vm.events}
          eventContent={renderEventContent}
        />
      </div>

      <Modal
        title={editId ? "Edit Agenda" : "Agenda Baru"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
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
          <Form.Item label="Status" name="status" initialValue="diproses">
            <Select
              options={[
                { value: "diproses", label: "Diproses" },
                { value: "ditunda", label: "Ditunda" },
                { value: "selesai", label: "Selesai" },
              ]}
            />
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
          <Form.Item label="Deskripsi" name="deskripsi">
            <Input.TextArea rows={3} placeholder="Catatan opsional..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
