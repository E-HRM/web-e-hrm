"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table, Input, Button, Space, Tooltip, Modal, Form,
  Input as AntInput, DatePicker, Select, Tag, Card,
} from "antd";
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, LeftOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import useKaryawanViewModel from "./useKaryawanViewModel";

const prettyAgama = (v) => {
  if (!v) return "-";
  const s = String(v).toLowerCase();
  if (s.includes("katolik")) return "Katolik";
  if (s.includes("protestan") || s.includes("kristen protestan")) return "Kristen Protestan";
  if (s === "kristen") return "Kristen Protestan";
  if (s.includes("islam")) return "Islam";
  if (s.includes("hindu")) return "Hindu";
  if (s.includes("buddha")) return "Buddha";
  if (s.includes("konghucu")) return "Konghucu";
  return v;
};

function AvatarCell({ src, alt }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt || ""} className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200" />;
  }
  return (
    <div className="w-7 h-7 rounded-full ring-1 ring-gray-300 bg-slate-200 grid place-items-center">
      <span className="text-[11px] leading-none text-slate-600 font-semibold">?</span>
    </div>
  );
}

export default function KaryawanContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const departementId = sp.get("id") || "";
  const departementName = sp.get("name") || "";

  const {
    rows, loading, pagination, search, setSearch,
    onTableChange, addKaryawan, updateKaryawan, deleteKaryawan,
    locationOptions, locationLoading,
  } = useKaryawanViewModel({ departementId, departementName });

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const title = useMemo(() => (editing ? "Edit Karyawan" : "Tambah Karyawan"), [editing]);

  // ---- judul yang tidak dobel "Divisi" ----
  const pageTitle = useMemo(() => {
    const n = (departementName || "").trim();
    if (!n) return "Karyawan";
    return /^divisi\s+/i.test(n) ? `Karyawan ${n}` : `Karyawan Divisi ${n}`;
  }, [departementName]);

  // ---- FILTER sederhana (client-side) ----
  const [filterRole, setFilterRole] = useState();
  const [filterAgama, setFilterAgama] = useState();

  const filteredRows = useMemo(() => {
    let data = rows || [];
    if (filterRole) data = data.filter((r) => String(r.role || "").toLowerCase() === String(filterRole).toLowerCase());
    if (filterAgama) data = data.filter((r) => prettyAgama(r.agama) === filterAgama);
    if (search?.trim()) {
      const s = search.toLowerCase();
      data = data.filter(
        (r) =>
          String(r.nama_pengguna || "").toLowerCase().includes(s) ||
          String(r.email || "").toLowerCase().includes(s),
      );
    }
    return data;
  }, [rows, search, filterRole, filterAgama]);

  // === Handlers: Add/Edit/Delete ===
  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    // default role saat tambah
    form.setFieldsValue({ role: "KARYAWAN" });
    setOpenForm(true);
  };

  const openEdit = (rec) => {
    setEditing(rec);
    // set nilai form untuk edit
    form.setFieldsValue({
      nama_pengguna: rec.nama_pengguna,
      email: rec.email,
      kontak: rec.kontak,
      agama: prettyAgama(rec.agama),
      role: rec.role || "KARYAWAN",
      tanggal_lahir: rec.tanggal_lahir ? dayjs(rec.tanggal_lahir) : null,
      id_location: rec.id_location || null,
    });
    setOpenForm(true);
  };

  const handleDelete = (rec) =>
    Modal.confirm({
      title: "Hapus Karyawan?",
      content: <>Data karyawan <b>{rec.nama_pengguna}</b> akan dihapus.</>,
      okText: "Hapus",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      onOk: async () => { await deleteKaryawan(rec.id_user); },
    });

  // Sinkronisasi nilai form saat modal dibuka & mode berubah (aman terhadap race)
  useEffect(() => {
    if (!openForm) return;
    if (editing) {
      form.setFieldsValue({
        nama_pengguna: editing.nama_pengguna,
        email: editing.email,
        kontak: editing.kontak,
        agama: prettyAgama(editing.agama),
        role: editing.role || "KARYAWAN",
        tanggal_lahir: editing.tanggal_lahir ? dayjs(editing.tanggal_lahir) : null,
        id_location: editing.id_location || null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ role: "KARYAWAN" });
    }
  }, [openForm, editing, form]);

  const roleTag = (val) => {
    const key = String(val || "").toLowerCase();
    const map = { direktur: "magenta", admin: "gold", hr: "green", operasional: "blue", karyawan: "geekblue" };
    return <Tag color={map[key] || "default"}>{String(val || "-").toUpperCase()}</Tag>;
  };

  // Kolom tabel
  const columns = [
    {
      title: "Nama Karyawan",
      dataIndex: "nama_pengguna",
      key: "nama_pengguna",
      width: 420,
      render: (t, r) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0"><AvatarCell src={r.foto_profil_user} alt={t} /></div>
          <span className="font-medium whitespace-nowrap">{t || "-"}</span>
        </div>
      ),
    },
    { title: "Email", dataIndex: "email", key: "email", width: 320, render: (v) => <span className="whitespace-nowrap">{v}</span> },
    { title: "Lokasi", key: "lokasi", width: 260, render: (_, r) => r?.kantor?.nama_kantor || r?.nama_kantor || "-" },
    { title: "Agama", dataIndex: "agama", key: "agama", width: 180, render: (v) => prettyAgama(v) },
    { title: "Kontak", dataIndex: "kontak", key: "kontak", width: 200, render: (v) => <span className="whitespace-nowrap">{v || "-"}</span> },
    { title: "Tanggal Lahir", dataIndex: "tanggal_lahir", key: "tanggal_lahir", width: 170, render: (v) => (v ? new Date(v).toLocaleDateString() : "-") },
    { title: "Role", dataIndex: "role", key: "role", width: 140, align: "center", render: roleTag },
    {
      title: "Opsi",
      key: "aksi",
      width: 120,
      fixed: "right",
      align: "center",
      render: (_, row) => (
        <Space>
          <Tooltip title="Edit"><Button size="small" shape="circle" icon={<EditOutlined />} onClick={() => openEdit(row)} /></Tooltip>
          <Tooltip title="Hapus"><Button size="small" danger shape="circle" icon={<DeleteOutlined />} onClick={() => handleDelete(row)} /></Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 space-y-4">
      {/* Header actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={() => router.back()}   // atau: router.push("/home/departement")
          />
          <h2 className="text-xl md:text-2xl font-semibold">{pageTitle}</h2>
        </div>

        <div className="flex items-center gap-2">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Cari karyawan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[220px]"
          />
          <Select
            allowClear
            placeholder="Filter Role"
            className="w-[150px]"
            value={filterRole}
            onChange={setFilterRole}
            options={["KARYAWAN","HR","OPERASIONAL","DIREKTUR","ADMIN"].map(v => ({value:v, label:v}))}
          />
          <Select
            allowClear
            placeholder="Filter Agama"
            className="w-[160px]"
            value={filterAgama}
            onChange={setFilterAgama}
            options={["Islam","Kristen Protestan","Katolik","Hindu","Buddha","Konghucu"].map(v => ({value:v,label:v}))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            Tambah
          </Button>
        </div>
      </div>

      <Card className="shadow-sm p-0">
        <Table
          rowKey="id_user"
          columns={columns}
          dataSource={filteredRows}
          loading={loading}
          size="small"
          tableLayout="auto"
          scroll={{ x: "max-content" }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
          }}
          onChange={onTableChange}
          className="
            [&_.ant-table-container]:!rounded-2xl
            [&_.ant-table]:!border [&_.ant-table]:!border-slate-200
            [&_.ant-table-thead_th]:!bg-slate-50
            [&_.ant-table-thead_th]:!font-semibold
            [&_.ant-table-thead_th]:!text-slate-600
            [&_.ant-table-thead_th]:!py-2
            [&_.ant-table-tbody_td]:!py-2
            [&_.ant-table-tbody_td]:!whitespace-nowrap
            [&_.ant-table-tbody_tr:hover_td]:!bg-slate-50
          "
        />
      </Card>

      {/* Modal Add/Edit */}
      <Modal
        open={openForm}
        title={<div className="text-lg font-semibold">{title}</div>}
        onCancel={() => setOpenForm(false)}
        onOk={() => form.submit()}
        okText="Simpan"
        destroyOnClose
        afterClose={() => {
          // Bersihkan jejak mode edit dan nilai form ketika modal ditutup
          setEditing(null);
          form.resetFields();
        }}
      >
        <Form
          key={editing ? `edit-${editing.id_user}` : "add"} // Paksa remount ketika mode berubah
          form={form}
          layout="vertical"
          initialValues={{ role: "KARYAWAN" }}
          onFinish={async (vals) => {
            const payload = {
              ...vals,
              // kirim DOB dalam format tanggal saja (hindari pergeseran zona waktu)
              tanggal_lahir: vals.tanggal_lahir
                ? dayjs(vals.tanggal_lahir).format("YYYY-MM-DD")
                : null,
              agama: prettyAgama(vals.agama),
            };

            if (editing) {
              delete payload.password;               // password tidak dikirim saat edit
              await updateKaryawan(editing.id_user, payload);
            } else {
              await addKaryawan({
                ...payload,
                id_departement: departementId,
                role: vals.role || "KARYAWAN",
              });
            }
            setOpenForm(false);
          }}
        >
          {/* Nama */}
          <Form.Item
            label="Nama Karyawan"
            name="nama_pengguna"
            rules={[{ required: true, message: "Nama wajib diisi" }]}
          >
            <AntInput placeholder="Nama lengkap" />
          </Form.Item>

          {/* Email */}
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email wajib diisi" },
              { type: "email", message: "Format email tidak valid" },
            ]}
          >
            <AntInput placeholder="nama@domain.com" />
          </Form.Item>

          {/* Password hanya saat TAMBAH */}
          {!editing && (
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Password wajib diisi" },
                { min: 6, message: "Minimal 6 karakter" },
              ]}
            >
              <AntInput.Password placeholder="Password" />
            </Form.Item>
          )}

          {/* Baris: Kontak & Agama */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item label="Kontak" name="kontak">
              <AntInput placeholder="08xxxx" />
            </Form.Item>

            <Form.Item label="Agama" name="agama">
              <Select
                allowClear
                placeholder="Pilih agama"
                options={[
                  { value: "Islam", label: "Islam" },
                  { value: "Kristen Protestan", label: "Kristen Protestan" },
                  { value: "Katolik", label: "Katolik" },
                  { value: "Hindu", label: "Hindu" },
                  { value: "Buddha", label: "Buddha" },
                  { value: "Konghucu", label: "Konghucu" },
                ]}
              />
            </Form.Item>
          </div>

          {/* Baris: Tanggal lahir & Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item label="Tanggal Lahir" name="tanggal_lahir">
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
                // cegah pilih tanggal masa depan
                disabledDate={(d) => d && d > dayjs().endOf("day")}
              />
            </Form.Item>

            <Form.Item label="Role" name="role">
              <Select
                options={[
                  { value: "KARYAWAN", label: "KARYAWAN" },
                  { value: "HR", label: "HR" },
                  { value: "OPERASIONAL", label: "OPERASIONAL" },
                  { value: "DIREKTUR", label: "DIREKTUR" },
                  { value: "ADMIN", label: "ADMIN" },
                ]}
              />
            </Form.Item>
          </div>

          {/* Lokasi */}
          <Form.Item label="Lokasi" name="id_location">
            <Select
              showSearch
              allowClear
              placeholder="Pilih lokasi / kantor"
              loading={locationLoading}
              options={locationOptions}
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 


