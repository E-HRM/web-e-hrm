"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ConfigProvider,
  Table,
  Input,
  Button,
  Space,
  Tooltip,
  Modal,
  Form,
  Input as AntInput,
  DatePicker,
  Select,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import useKaryawanViewModel from "./useKaryawanViewModel";

const BRAND = { primary: "#0A3848", accent: "#D9A96F" };

// normalisasi label agama
const prettyAgama = (v) => {
  if (!v) return "-";
  const s = String(v).toLowerCase();
  if (s.includes("katolik")) return "Katolik";
  if (s.includes("protestan") || s.includes("kristen protestan"))
    return "Kristen Protestan";
  if (s === "kristen") return "Kristen Protestan"; // fallback
  if (s.includes("islam")) return "Islam";
  if (s.includes("hindu")) return "Hindu";
  if (s.includes("buddha")) return "Buddha";
  if (s.includes("konghucu")) return "Konghucu";
  return v;
};

export default function KaryawanPage() {
  const sp = useSearchParams();
  const departementId = sp.get("id") || "";   // ?id=... (konteks departemen)
  const departementName = sp.get("name") || "";

  const {
    rows,
    loading,
    pagination,
    search,
    setSearch,
    onTableChange,
    fetchList,
    addKaryawan,
    updateKaryawan,
    deleteKaryawan,
    // lokasi
    locationOptions,
    locationLoading,
  } = useKaryawanViewModel({ departementId, departementName });

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const title = useMemo(
    () => (editing ? "Edit Karyawan" : "Tambah Karyawan"),
    [editing]
  );

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setOpenForm(true);
  };

  const openEdit = (rec) => {
    setEditing(rec);
    form.setFieldsValue({
      nama_pengguna: rec.nama_pengguna,
      email: rec.email,
      kontak: rec.kontak,
      agama: prettyAgama(rec.agama),
      role: rec.role || "KARYAWAN",
      tanggal_lahir: rec.tanggal_lahir ? dayjs(rec.tanggal_lahir) : null,
      id_location: rec.id_location || null, // prefill lokasi
    });
    setOpenForm(true);
  };

  const handleDelete = (rec) => {
    Modal.confirm({
      title: "Hapus Karyawan?",
      content: (
        <>
          Data karyawan <b>{rec.nama_pengguna}</b> akan dihapus.
        </>
      ),
      okText: "Hapus",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      onOk: async () => {
        await deleteKaryawan(rec.id_user);
      },
    });
  };

  const columns = [
    {
      title: "Nama Karyawan",
      dataIndex: "nama_pengguna",
      key: "nama_pengguna",
      render: (t, r) => (
        <div className="flex items-center gap-2">
          <img
            src={r.foto_profil_user || "/avatar.png"}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200"
            alt=""
          />
          <span className="font-medium">{t || "-"}</span>
        </div>
      ),
    },
    { title: "Email", dataIndex: "email", key: "email", width: 240 },

    // === GANTI: Divisi -> Lokasi ===
    {
      title: "Lokasi",
      key: "lokasi",
      width: 180,
      render: (_, r) => r?.kantor?.nama_kantor || r?.nama_kantor || "-",
    },

    {
      title: "Agama",
      dataIndex: "agama",
      key: "agama",
      width: 160,
      render: (v) => prettyAgama(v),
    },
    {
      title: "Kontak",
      dataIndex: "kontak",
      key: "kontak",
      width: 160,
      render: (v) => v || "-",
    },
    {
      title: "Tanggal Lahir",
      dataIndex: "tanggal_lahir",
      key: "tanggal_lahir",
      width: 160,
      render: (v) => (v ? new Date(v).toLocaleDateString() : "-"),
      responsive: ["md"],
    },
    { title: "Role", dataIndex: "role", key: "role", width: 130, align: "center" },
    {
      title: "Opsi",
      key: "aksi",
      width: 130,
      align: "center",
      render: (_, row) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(row)}
            />
          </Tooltip>
          <Tooltip title="Hapus">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(row)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: { borderRadius: 10 },
        components: {
          Table: {
            headerBg: "#F7F9FB",
            headerColor: "#334155",
            rowHoverBg: "#FAFBFC",
            headerSplitColor: "#ECEEF1",
          },
        },
      }}
    >
      <div className="px-4 md:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-xl md:text-2xl font-semibold">
            {departementName ? `Karyawan ${departementName}` : "Karyawan"}
          </h2>
          <div className="flex items-center gap-2">
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Cari karyawan…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[220px]"
            />
            <Button icon={<ReloadOutlined />} onClick={fetchList}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAdd}
              style={{ background: BRAND.accent, borderColor: BRAND.accent }}
            >
              Tambah
            </Button>
          </div>
        </div>

        <div className="rounded-xl bg-white ring-1 ring-gray-200 p-2 md:p-3">
          <Table
            rowKey="id_user"
            columns={columns}
            dataSource={rows}
            loading={loading}
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
            }}
            onChange={onTableChange}
            size="middle"
          />
        </div>
      </div>

      {/* Modal Add/Edit */}
      <Modal
        open={openForm}
        title={<div className="text-lg font-semibold">{title}</div>}
        onCancel={() => setOpenForm(false)}
        onOk={() => form.submit()}
        okText="Simpan"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (vals) => {
            const payload = {
              ...vals,
              tanggal_lahir: vals.tanggal_lahir
                ? vals.tanggal_lahir.toISOString()
                : null,
              agama: prettyAgama(vals.agama),
            };

            if (editing) {
              // EDIT → /api/users/[id] (tanpa password)
              delete payload.password;
              await updateKaryawan(editing.id_user, payload);
            } else {
              // CREATE → /api/auth/register (via ApiEndpoints.CreateUser)
              // id_departement diambil dari context halaman
              await addKaryawan({
                ...payload,
                id_departement: departementId,
                role: vals.role || "KARYAWAN",
              });
            }
            setOpenForm(false);
          }}
          initialValues={{
            role: "KARYAWAN",
          }}
        >
          <Form.Item
            label="Nama Karyawan"
            name="nama_pengguna"
            rules={[{ required: true, message: "Nama wajib diisi" }]}
          >
            <AntInput placeholder="Nama lengkap" />
          </Form.Item>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item label="Tanggal Lahir" name="tanggal_lahir">
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item label="Role" name="role" initialValue="KARYAWAN">
              <Select
                options={[
                  { value: "KARYAWAN", label: "KARYAWAN" },
                  { value: "HR", label: "HR" },
                  { value: "OPERASIONAL", label: "OPERASIONAL" },
                  { value: "DIREKTUR", label: "DIREKTUR" },
                ]}
              /> 
            </Form.Item>
          </div>

          {/* === Lokasi (baru) === */}
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

          {/*
            OPSIONAL: kalau mau IZINKAN ganti departemen saat EDIT
            - Tambahkan Select departemen di sini (khusus HR).
            - Lihat snippet di catatan setelah file kedua.
          */}
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
