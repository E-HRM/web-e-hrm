"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import {
  Card,
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  Input,
  ConfigProvider,
  theme,
  Tag,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import idLocale from "@fullcalendar/core/locales/id";
import useVM, { showFromDB } from "./useKunjunganKalenderViewModel";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";

const NAVY = "#003A6F";

export default function KunjunganKalenderContent() {
  const vm = useVM();

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const onDateClick = useCallback((arg) => {
    form.resetFields();
    form.setFieldsValue({ tanggal: dayjs(arg.date) });
    setOpen(true);
  }, [form]);

  const handleDatesSet = useCallback((info) => {
    // Panggil VM hanya bila range benar-benar berubah (VM sudah guard juga)
    vm.setRange({ start: info.start, end: info.end });
  }, [vm]);

  const submit = useCallback(async () => {
    try {
      const v = await form.validateFields();
      await vm.createPlansForUsers({
        userIds: v.user_ids,
        tanggal: v.tanggal?.toDate(),
        jam_mulai: v.jam_mulai?.toDate(),
        jam_selesai: v.jam_selesai?.toDate(),
        deskripsi: v.deskripsi,
      });
      setOpen(false);
      message.success("Rencana kunjungan tersimpan");
    } catch (e) {
      message.error(e?.message || "Gagal menyimpan rencana");
    }
  }, [form, vm]);

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: NAVY, borderRadius: 12 } }}>
      <div className="p-4">
        <Card
          title={<span className="text-lg font-semibold">Kalender Kunjungan</span>}
          styles={{ body: { paddingTop: 16 } }}
          extra={<PlusOutlined style={{ color: NAVY }} />}
        >
          <FullCalendar
            height="auto"
            locales={[idLocale]}
            locale="id"
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            selectable
            selectMirror
            datesSet={handleDatesSet}              // <- handler stabil
            dateClick={onDateClick}
            events={vm.events}
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            eventContent={(info) => {
              const r = info.event.extendedProps?.raw;
              const s = r?.jam_mulai ? showFromDB(r.jam_mulai, "HH:mm") : "";
              const e = r?.jam_selesai ? showFromDB(r.jam_selesai, "HH:mm") : "";
              return (
                <div style={{ lineHeight: 1.15 }}>
                  <div>{s && e ? `${s}–${e} ` : ""}{info.event.title}</div>
                  {r?.status_kunjungan ? (
                    <Tag
                      style={{ marginTop: 2 }}
                      color={
                        r.status_kunjungan === "selesai"
                          ? "success"
                          : r.status_kunjungan === "ditunda"
                          ? "warning"
                          : "processing"
                      }
                    >
                      {r.status_kunjungan}
                    </Tag>
                  ) : null}
                </div>
              );
            }}
          />
        </Card>
      </div>

      {/* Modal Rencana (multi user) */}
      <Modal
        title="Rencana Kunjungan"
        open={open}
        onCancel={() => setOpen(false)}
        okText="Simpan"
        onOk={submit}
        okButtonProps={{ style: { background: NAVY, color: "#fff" } }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Karyawan"
            name="user_ids"
            rules={[{ required: true, message: "Pilih minimal satu karyawan" }]}
          >
            <Select
              mode="multiple"
              placeholder="Pilih karyawan"
              options={vm.userOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            label="Tanggal"
            name="tanggal"
            rules={[{ required: true, message: "Pilih tanggal" }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-2">
            <Form.Item label="Mulai" name="jam_mulai">
              <TimePicker format="HH:mm" className="w-full" />
            </Form.Item>
            <Form.Item label="Selesai" name="jam_selesai">
              <TimePicker format="HH:mm" className="w-full" />
            </Form.Item>
          </div>

          <Form.Item label="Deskripsi" name="deskripsi">
            <Input.TextArea rows={3} placeholder="Catatan rencana (opsional)" />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
