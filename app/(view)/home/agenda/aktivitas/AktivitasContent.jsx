// AktivitasContent.jsx
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
  Button,
  Tooltip,
  Empty,
  Skeleton,
  Modal,
  Form,
  message,
  Popconfirm,
  Alert,
  Upload,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import useAktivitasTimesheetViewModel from "./AktivitasViewModel";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

dayjs.extend(utc);

const BRAND = { accent: "#003A6F" };

export default function AktivitasContent() {
  const vm = useAktivitasTimesheetViewModel();

  // modal tambah aktivitas
  const [openAdd, setOpenAdd] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addForm] = Form.useForm();

  // modal tambah proyek master
  const [openAddAgenda, setOpenAddAgenda] = useState(false);
  const [savingAgenda, setSavingAgenda] = useState(false);
  const [agendaForm] = Form.useForm();

  // modal ubah aktivitas (hanya ganti proyek)
  const [openEdit, setOpenEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm] = Form.useForm();
  const [editingRow, setEditingRow] = useState(null);

  // modal impor
  const [openImport, setOpenImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileImport, setFileImport] = useState(null);

  const handleOpenEdit = (row) => {
    setEditingRow(row);
    editForm.setFieldsValue({
      deskripsi_kerja: row.deskripsi_kerja || "",
      id_agenda: row.id_agenda || row.agenda?.id_agenda || undefined,
    });
    setOpenEdit(true);
  };

  const handleExport = () => {
    if (!vm.filters.user_id) return;
    const p = new URLSearchParams();
    p.set("user_id", vm.filters.user_id);
    if (vm.filters.id_agenda) p.set("id_agenda", vm.filters.id_agenda);
    if (vm.filters.status) p.set("status", vm.filters.status);
    if (vm.filters.from) p.set("from", vm.filters.from);
    if (vm.filters.to) p.set("to", vm.filters.to);
    p.set("perPage", "1000");
    p.set("format", "xlsx"); // trigger export
    window.location.href = `${ApiEndpoints.GetAgendaKerja}?${p.toString()}`;
  };

  const columns = useMemo(
    () => [
      {
        title: "Pekerjaan",
        dataIndex: "deskripsi_kerja",
        key: "deskripsi_kerja",
        render: (v, r) => (
          <div className="flex flex-col">
            <span className="font-medium">{v}</span>
            <span className="opacity-60 text-xs">
              Dibuat: {dayjs.utc(r.created_at).format("DD MMM YYYY HH:mm")}
            </span>
          </div>
        ),
      },
      {
        title: "Proyek",
        dataIndex: ["agenda", "nama_agenda"],
        key: "agenda",
        render: (v) => v || "—",
      },
      {
        title: "Waktu",
        key: "waktu",
        render: (_, r) => {
          const s = r.start_date ? dayjs.utc(r.start_date).format("HH:mm") : "-";
          const e = r.end_date ? dayjs.utc(r.end_date).format("HH:mm") : "-";
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
        render: (u) => u?.nama_pengguna || u?.email || "—",
      },
      {
        title: "Aksi",
        key: "aksi",
        align: "right",
        render: (_, r) => (
          <Space>
            <Tooltip title="Ubah aktivitas">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleOpenEdit(r)}
              />
            </Tooltip>
            <Popconfirm
              title="Hapus pekerjaan?"
              onConfirm={() => vm.remove(r.id_agenda_kerja)}
              okText="Hapus"
              cancelText="Batal"
            >
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [vm]
  );

  // submit tambah aktivitas
  const onSubmitAdd = async () => {
    try {
      const values = await addForm.validateFields();
      setSavingAdd(true);
      await vm.createActivity({
        deskripsi_kerja: values.deskripsi_kerja.trim(),
        id_agenda: values.id_agenda,
        start_date: values.start_date
          ? values.start_date.format("YYYY-MM-DD HH:mm:ss")
          : undefined,
        end_date: values.end_date
          ? values.end_date.format("YYYY-MM-DD HH:mm:ss")
          : undefined,
      });
      setOpenAdd(false);
      addForm.resetFields();
      message.success("Pekerjaan ditambahkan");
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Gagal menambahkan pekerjaan");
    } finally {
      setSavingAdd(false);
    }
  };

  // submit tambah proyek master
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

  // submit ubah aktivitas (deskripsi + proyek)
  const onSubmitEdit = async () => {
    try {
      const { deskripsi_kerja, id_agenda } = await editForm.validateFields();
      if (!editingRow) return;
      setSavingEdit(true);
      await vm.updateActivity(editingRow.id_agenda_kerja, {
        deskripsi_kerja: deskripsi_kerja.trim(),
        id_agenda,
      });
      setOpenEdit(false);
      setEditingRow(null);
      editForm.resetFields();
      message.success("Aktivitas diperbarui");
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Gagal memperbarui aktivitas");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="p-4">
      <Card
        styles={{ body: { paddingTop: 16 } }}
        title={<span className="text-lg font-semibold">Aktivitas</span>}
        extra={
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={!vm.filters.user_id}
            >
              Export Excel
            </Button>
            <Button
              icon={<UploadOutlined />}
              onClick={() => setOpenImport(true)}
              disabled={!vm.filters.user_id}
              style={{ background: BRAND.accent, color: "#fff" }}
            >
              Import Excel
            </Button>
            <Button
              disabled={!vm.filters.user_id}
              icon={<PlusOutlined />}
              onClick={() => setOpenAdd(true)}
              style={{ background: BRAND.accent, color: "#fff" }}
            >
              Tambah Pekerjaan
            </Button>
          </Space>
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
            value={
              vm.filters.from
                ? dayjs(vm.filters.from, "YYYY-MM-DD HH:mm:ss")
                : null
            }
            onChange={(d) =>
              vm.setFilters((s) => ({
                ...s,
                from: d ? d.startOf("day").format("YYYY-MM-DD HH:mm:ss") : "",
              }))
            }
            format="DD/MM/YYYY"
          />
          <span className="opacity-60">-</span>
          <DatePicker
            value={
              vm.filters.to
                ? dayjs(vm.filters.to, "YYYY-MM-DD HH:mm:ss")
                : null
            }
            onChange={(d) =>
              vm.setFilters((s) => ({
                ...s,
                to: d ? d.endOf("day").format("YYYY-MM-DD HH:mm:ss") : "",
              }))
            }
            format="DD/MM/YYYY"
          />
        </div>

        {/* STRIP TANGGAL + TABEL */}
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
                        "group px-3 py-2 rounded-md border",
                        "text-left whitespace-nowrap transition-colors",
                        active
                          ? "bg-[#003A6F] text-white border-transparent shadow-sm"
                          : "border-white/10 hover:bg-[#003A6F] hover:text-white hover:border-transparent hover:shadow-sm",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "font-semibold",
                          active ? "text-white" : "",
                          "group-hover:text-white",
                        ].join(" ")}
                      >
                        {dayjs(d.date).format("DD MMM YYYY")}
                      </div>
                      <div
                        className={[
                          active ? "text-white" : "opacity-70",
                          "group-hover:text-white",
                        ].join(" ")}
                      >
                        {d.count} Pekerjaan
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3 items-center mt-4">
                <Select
                  className="min-w=[200px]"
                  placeholder="-- Filter Status --"
                  allowClear
                  value={vm.filters.status || undefined}
                  onChange={(v) =>
                    vm.setFilters((s) => ({ ...s, status: v || "" }))
                  }
                  options={[
                    { value: "diproses", label: "Diproses" },
                    { value: "ditunda", label: "Ditunda" },
                    { value: "selesai", label: "Selesai" },
                  ]}
                />
                <Select
                  className="min-w-[220px]"
                  placeholder="Filter Proyek"
                  allowClear
                  value={vm.filters.id_agenda || undefined}
                  onChange={(v) =>
                    vm.setFilters((s) => ({ ...s, id_agenda: v || "" }))
                  }
                  options={vm.agendaOptions}
                  showSearch
                  optionFilterProp="label"
                />
                <Input.Search
                  className="w-[240px]"
                  placeholder="Cari"
                  value={vm.filters.q}
                  onChange={(e) =>
                    vm.setFilters((s) => ({ ...s, q: e.target.value }))
                  }
                />
              </div>

              <div className="mt-4">
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
          <Alert
            className="mt-2"
            type="info"
            message="Silakan pilih karyawan terlebih dahulu"
            showIcon
          />
        )}
      </Card>

      {/* MODAL: TAMBAH PEKERJAAN */}
      <Modal
        title="Tambah Pekerjaan"
        open={openAdd}
        onCancel={() => setOpenAdd(false)}
        okText="Simpan"
        okButtonProps={{ style: { background: BRAND.accent, color: "#fff" } }}
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
              <Form.Item
                name="id_agenda"
                noStyle
                rules={[{ required: true, message: "Pilih proyek/agenda" }]}
              >
                <Select
                  placeholder="Pilih Proyek"
                  options={vm.agendaOptions}
                  loading={vm.loadingAgenda}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
              <Button
                onClick={() => setOpenAddAgenda(true)}
                style={{ background: BRAND.accent, color: "#FFFFFF" }}
              >
                Tambah Proyek
              </Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item label="Mulai" name="start_date">
            <DatePicker showTime className="w-full" />
          </Form.Item>
          <Form.Item label="Selesai" name="end_date">
            <DatePicker showTime className="w-full" />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL: UBAH AKTIVITAS */}
      <Modal
        title="Ubah Aktivitas"
        open={openEdit}
        onCancel={() => {
          setOpenEdit(false);
          setEditingRow(null);
          editForm.resetFields();
        }}
        okText="Simpan"
        okButtonProps={{ style: { background: BRAND.accent, color: "#fff" } }}
        confirmLoading={savingEdit}
        onOk={onSubmitEdit}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="Deskripsi Pekerjaan"
            name="deskripsi_kerja"
            rules={[{ required: true, message: "Wajib diisi" }]}
          >
            <Input placeholder="Mis. Membuat laporan mingguan" />
          </Form.Item>

          <Form.Item
            label="Proyek/Agenda"
            name="id_agenda"
            rules={[{ required: true, message: "Pilih proyek/agenda" }]}
          >
            <Select
              placeholder="Pilih Proyek"
              options={vm.agendaOptions}
              loading={vm.loadingAgenda}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL: IMPOR EXCEL */}
      <Modal
        title="Impor Excel"
        open={openImport}
        onCancel={() => {
          setOpenImport(false);
          setFileImport(null);
        }}
        okText="Proses"
        cancelText="Tutup"
        okButtonProps={{
          disabled: !fileImport,
          style: { background: BRAND.accent, color: "#fff" },
        }}
        confirmLoading={importing}
        onOk={async () => {
          try {
            if (!fileImport) return;
            setImporting(true);
            const fd = new FormData();
            fd.append("file", fileImport);
            fd.append("user_id", vm.filters.user_id);
            fd.append("createAgendaIfMissing", "1"); // opsional
            const res = await fetch(ApiEndpoints.ImportAgendaKerja, {
              method: "POST",
              body: fd,
            });
            const json = await res.json();
            if (!res.ok || json?.ok === false) {
              throw new Error(json?.message || "Gagal impor");
            }
            message.success(
              `Impor selesai: ${json?.summary?.created || 0} baris dibuat`
            );
            setOpenImport(false);
            setFileImport(null);
            vm.refresh();
          } catch (e) {
            message.error(e?.message || "Gagal memproses impor");
          } finally {
            setImporting(false);
          }
        }}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          className="mb-3"
          message="PENTING!"
          description={
            <div>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Untuk melakukan impor data timesheet, pastikan file sesuai
                  format yang ditentukan.{" "}
                  <a
                    className="text-blue-600 underline"
                    onClick={() =>
                      window.open(
                        ApiEndpoints.ImportAgendaKerjaTemplate,
                        "_blank"
                      )
                    }
                  >
                    Download format impor excel di sini
                  </a>
                  .
                </li>
                <li>
                  Aksi impor hanya akan dijalankan jika semua data sudah benar.
                </li>
                <li>
                  Jika ada data yang perlu diperbaiki, sistem akan menampilkan
                  informasinya setelah klik tombol proses.
                </li>
              </ul>
            </div>
          }
        />

        <div className="mb-2 font-medium">
          Pilih Berkas <span className="text-red-500">*</span>
        </div>
        <Space align="center">
          <Upload
            accept=".xlsx,.xls"
            maxCount={1}
            showUploadList={fileImport ? { showRemoveIcon: true } : false}
            beforeUpload={(file) => {
              const MAX = 500 * 1024; // 500KB
              if (file.size > MAX) {
                message.error("Ukuran file melebihi 500 KB");
                return Upload.LIST_IGNORE;
              }
              setFileImport(file);
              return false; // jangan auto-upload
            }}
            onRemove={() => setFileImport(null)}
          >
            <Button style={{ background: BRAND.accent, color: "#fff" }}>
              Pilih File
            </Button>
          </Upload>
          <div>{fileImport?.name || "Belum ada file"}</div>
        </Space>
        <div className="text-xs opacity-60 mt-2">Ukuran Maksimal: 500 KB</div>
      </Modal>

      {/* MODAL: TAMBAH PROYEK MASTER */}
      <Modal
        title="Tambah Proyek/Agenda"
        open={openAddAgenda}
        onCancel={() => setOpenAddAgenda(false)}
        okText="Simpan"
        okButtonProps={{ style: { background: BRAND.accent, color: "#fff" } }}
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
            <Input placeholder="Mis. Pengembangan HRIS" />
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
