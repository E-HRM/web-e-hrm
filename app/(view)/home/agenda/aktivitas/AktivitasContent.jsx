"use client";

import { useMemo, useState } from "react";
import {
  Card,
  Select,
  DatePicker,
  Input,
  Tag,
  Table,
  Space,
  Alert,
  Button,
  Tooltip,
  Empty,
  Skeleton,
  Modal,
  Form,
  message,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UndoOutlined,
  ReloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import useAktivitasTimesheetViewModel from "./AktivitasViewModel";

const BRAND = { accent: "#D9A96F", dark: "#0A3848" };

export default function AktivitasContent() {
  const vm = useAktivitasTimesheetViewModel();

  // State Modal Tambah Pekerjaan
  const [openAdd, setOpenAdd] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addForm] = Form.useForm();

  // State Modal Tambah Proyek/Agenda
  const [openAddAgenda, setOpenAddAgenda] = useState(false);
  const [savingAgenda, setSavingAgenda] = useState(false);
  const [agendaForm] = Form.useForm();

  const columns = useMemo(
    () => [
      {
        title: "Pekerjaan",
        dataIndex: "deskripsi_kerja",
        key: "deskripsi_kerja",
        render: (v, r) => (
          <div className="flex flex-col">
            <a className="font-medium">{v}</a>
            <span className="opacity-60 text-xs">
              Dibuat: {dayjs(r.created_at).format("DD MMM YYYY HH:mm")}
            </span>
          </div>
        ),
      },
      {
        title: "Proyek/Agenda",
        dataIndex: ["agenda", "nama_agenda"],
        key: "agenda",
        render: (v) => v || "—",
      },
      {
        title: "Waktu",
        key: "waktu",
        render: (_, r) => {
          const s = r.start_date ? dayjs(r.start_date).format("HH:mm") : "-";
          const e = r.end_date ? dayjs(r.end_date).format("HH:mm") : "-";
          return `${s} - ${e}`;
        },
      },
      {
        title: "Durasi",
        dataIndex: "duration_seconds",
        key: "durasi",
        render: (sec) => formatDuration(sec),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (st) => {
          const m =
            st === "selesai"
              ? { color: "success", text: "Selesai" }
              : st === "ditunda"
              ? { color: "warning", text: "Ditunda" }
              : { color: "processing", text: "Diproses" };
          return <Tag color={m.color}>{m.text}</Tag>;
        },
      },
      {
        title: "Pembuat",
        dataIndex: "user",
        key: "user",
        render: (u) => (u?.nama_pengguna ? u.nama_pengguna : "—"),
      },
      {
        title: "Aksi",
        key: "aksi",
        align: "right",
        render: (_, r) => (
          <Space>
            <Tooltip title="Tandai selesai (contoh)">
              <Button size="small" icon={<EditOutlined />} onClick={() => vm.quickFinish(r)} />
            </Tooltip>
            <Tooltip title="Hapus">
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => vm.remove(r.id_agenda_kerja)}
              />
            </Tooltip>
            <Tooltip title="Set Ulang ke Diproses">
              <Button size="small" icon={<UndoOutlined />} onClick={() => vm.resetToDiproses(r)} />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [vm]
  );

  // Submit Tambah Pekerjaan
  const onSubmitAdd = async () => {
    try {
      const values = await addForm.validateFields();
      setSavingAdd(true);
      await vm.createActivity({
        deskripsi_kerja: values.deskripsi_kerja.trim(),
        id_agenda: values.id_agenda,
      });
      setOpenAdd(false);
      addForm.resetFields();
      message.success("Pekerjaan ditambahkan");
    } catch (e) {
      if (e?.errorFields) return; // validation
      message.error(e?.message || "Gagal menambahkan pekerjaan");
    } finally {
      setSavingAdd(false);
    }
  };

  // Submit Tambah Agenda Master
  const onSubmitAgenda = async () => {
    try {
      const { nama_agenda } = await agendaForm.validateFields();
      setSavingAgenda(true);
      await vm.createAgendaMaster(nama_agenda.trim());
      setOpenAddAgenda(false);
      agendaForm.resetFields();
      message.success("Proyek/Agenda berhasil dibuat");
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Gagal membuat proyek/agenda");
    } finally {
      setSavingAgenda(false);
    }
  };

  return (
    <div className="p-4">
      <Card
        styles={{ body: { paddingTop: 16 } }}
        title={<span className="text-lg font-semibold">Aktivitas</span>}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={vm.refresh}
            style={{ background: BRAND.accent, color: BRAND.dark }}
          >
            Muat Ulang
          </Button>
        }
      >
        {/* BAR FILTER ATAS */}
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <Select
            className="min-w-[260px]"
            placeholder="Pilih Karyawan"
            options={vm.userOptions}
            loading={vm.loadingUsers}
            value={vm.filters.user_id || undefined}
            onChange={(v) => vm.setFilters((s) => ({ ...s, user_id: v }))}
            showSearch
            optionFilterProp="label"
          />
          <DatePicker
            value={vm.filters.from ? dayjs(vm.filters.from) : null}
            onChange={(d) => vm.setFilters((s) => ({ ...s, from: d ? d.startOf("day").toISOString() : "" }))}
            format="DD/MM/YYYY"
          />
          <span className="opacity-60">-</span>
          <DatePicker
            value={vm.filters.to ? dayjs(vm.filters.to) : null}
            onChange={(d) => vm.setFilters((s) => ({ ...s, to: d ? d.endOf("day").toISOString() : "" }))}
            format="DD/MM/YYYY"
          />
        </div>

        {/* STRIP TANGGAL */}
        {vm.filters.user_id ? (
          vm.loading ? (
            <Skeleton active />
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto pb-2 -mb-1">
                {vm.dayBuckets.map((d) => {
                  const active = vm.selectedDay === d.date;
                  return (
                    <button
                      key={d.date}
                      onClick={() => vm.setSelectedDay(active ? "" : d.date)}
                      className={[
                        "px-3 py-2 rounded-md border",
                        "text-left whitespace-nowrap",
                        active ? "border-transparent" : "border-white/10",
                      ].join(" ")}
                      style={{ background: active ? BRAND.accent : "transparent", color: active ? BRAND.dark : "inherit" }}
                    >
                      <div className="font-semibold">{dayjs(d.date).format("DD MMM YYYY")}</div>
                      <div className={active ? "" : "opacity-70"}>{d.count} Pekerjaan</div>
                    </button>
                  );
                })}
              </div>

              {/* FILTER BAR KEDUA */}
              <div className="flex flex-wrap gap-3 items-center mt-4">
                <Select
                  className="min-w-[220px]"
                  placeholder="-- Filter Status --"
                  allowClear
                  value={vm.filters.status || undefined}
                  onChange={(v) => vm.setFilters((s) => ({ ...s, status: v || "" }))}
                  options={[
                    { value: "diproses", label: "Diproses" },
                    { value: "ditunda", label: "Ditunda" },
                    { value: "selesai", label: "Selesai" },
                  ]}
                />
                <Select
                  className="min-w-[220px]"
                  placeholder="Filter Proyek/Agenda"
                  allowClear
                  value={vm.filters.id_agenda || undefined}
                  onChange={(v) => vm.setFilters((s) => ({ ...s, id_agenda: v || "" }))}
                  options={vm.agendaOptions}
                  showSearch
                  optionFilterProp="label"
                />
                <Input.Search
                  className="w-[280px] max-w-full"
                  placeholder="Cari"
                  value={vm.filters.q}
                  onChange={(e) => vm.setFilters((s) => ({ ...s, q: e.target.value }))}
                  onSearch={() => vm.refresh()}
                />
              </div>

              {/* TABEL + TOMBOL TAMBAH */}
              <div className="mt-4">
                <div className="mb-3">
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => setOpenAdd(true)}
                    style={{ background: BRAND.accent, color: BRAND.dark }}
                  >
                    Tambah Pekerjaan
                  </Button>
                </div>
                {vm.filteredRows.length === 0 ? (
                  <Empty description="Tidak ada pekerjaan pada rentang/tanggal ini" />
                ) : (
                  <Table
                    rowKey="id_agenda_kerja"
                    columns={columns}
                    dataSource={vm.filteredRows}
                    pagination={false}
                    size="middle"
                  />
                )}
              </div>
            </>
          )
        ) : (
          <Alert className="mt-4" type="info" message="Silakan pilih karyawan terlebih dahulu" showIcon />
        )}
      </Card>

      {/* MODAL: TAMBAH PEKERJAAN */}
      <Modal
        title="Tambah Pekerjaan"
        open={openAdd}
        onCancel={() => setOpenAdd(false)}
        okText="Simpan"
        confirmLoading={savingAdd}
        onOk={onSubmitAdd}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            label="Deskripsi Pekerjaan"
            name="deskripsi_kerja"
            rules={[{ required: true, message: "Wajib diisi" }]}
          >
            <Input placeholder="Mis. Membuat laporan mingguan" />
          </Form.Item>

          <Form.Item label="Proyek" required>
            <Space.Compact className="w-full">
              <Form.Item name="id_agenda" noStyle rules={[{ required: true, message: "Pilih proyek/agenda" }]}>
                <Select
                  placeholder="Pilih Proyek"
                  options={vm.agendaOptions}
                  loading={vm.loadingAgenda}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
              <Button onClick={() => setOpenAddAgenda(true)} style={{ background: BRAND.accent, color: BRAND.dark }}>
                Tambah Proyek
              </Button>
            </Space.Compact>
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL: TAMBAH PROYEK/AGENDA MASTER */}
      <Modal
        title="Tambah Proyek/Agenda"
        open={openAddAgenda}
        onCancel={() => setOpenAddAgenda(false)}
        okText="Simpan"
        confirmLoading={savingAgenda}
        onOk={onSubmitAgenda}
        destroyOnClose
      >
        <Form form={agendaForm} layout="vertical">
          <Form.Item
            label="Nama Proyek/Agenda"
            name="nama_agenda"
            rules={[{ required: true, message: "Wajib diisi" }]}
          >
            <Input placeholder="Mis. Pengembangan Fitur HRIS" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function formatDuration(sec = 0) {
  if (!sec || sec < 1) return "0 detik";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const parts = [];
  if (h) parts.push(`${h} jam`);
  if (m) parts.push(`${m} menit`);
  if (s) parts.push(`${s} detik`);
  return parts.join(" ");
}
