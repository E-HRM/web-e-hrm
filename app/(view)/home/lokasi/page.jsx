"use client";

import {
  ConfigProvider,
  Input,
  InputNumber,
  Select,
  Button,
  Table,
  Space,
  Tooltip,
  Modal,
  Form,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useMemo, useState } from "react";
import useLokasiViewModel from "./useLokasiViewModel";

const BRAND = { accent: "#D9A96F" };

export default function LokasiPage() {
  const {
    rows,
    loading,
    pagination,
    onTableChange,
    // filters
    search, setSearch,
    radiusMin, setRadiusMin,
    radiusMax, setRadiusMax,
    orderBy, setOrderBy,
    sort, setSort,
    // actions
    fetchList,
    addLocation,
    updateLocation,
    deleteLocation,
  } = useLokasiViewModel();

  // Modal tambah
  const [openAdd, setOpenAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addForm] = Form.useForm();

  // Modal edit
  const [openEdit, setOpenEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();
  const [currentRow, setCurrentRow] = useState(null);

  // Modal delete
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const columns = useMemo(() => [
    { title: "Nama Lokasi", dataIndex: "nama_kantor", key: "nama_kantor" },
    {
      title: "Koordinat",
      key: "koordinat",
      width: 220,
      render: (_, r) => (
        <div className="text-xs">
          <div>Lat: <span className="font-medium">{r.latitude ?? "-"}</span></div>
          <div>Lng: <span className="font-medium">{r.longitude ?? "-"}</span></div>
        </div>
      ),
    },
    {
      title: "Radius (m)",
      dataIndex: "radius",
      key: "radius",
      width: 120,
      align: "center",
      render: (v) => v ?? "-",
    },
    {
      title: "Jumlah Karyawan",
      dataIndex: "employeeCount",
      key: "employeeCount",
      width: 160,
      align: "center",
      render: (v) => <span className="font-semibold">{v ?? 0}</span>,
    },
    {
      title: "Dibuat",
      dataIndex: "created_at",
      key: "created_at",
      width: 190,
      render: (v) => (v ? new Date(v).toLocaleString() : "-"),
      responsive: ["lg"],
    },
    {
      title: "Diubah",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 190,
      render: (v) => (v ? new Date(v).toLocaleString() : "-"),
      responsive: ["lg"],
    },
    {
      title: "Aksi",
      key: "aksi",
      width: 160,
      align: "center",
      render: (_, row) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setCurrentRow(row);
                editForm.setFieldsValue({
                  nama_kantor: row.nama_kantor,
                  latitude: row.latitude,
                  longitude: row.longitude,
                  radius: row.radius ?? null,
                });
                setOpenEdit(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Hapus">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                setCurrentRow(row);
                setOpenDelete(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ], [editForm]);

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
        {/* BAR FILTER */}
        <div className="w-full rounded-xl bg-white ring-1 ring-gray-200 p-3 md:p-4 mb-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto_auto] items-center">
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Cari lokasi…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <InputNumber
              className="w-full md:w-[140px]"
              placeholder="Radius min"
              value={radiusMin === "" ? null : Number(radiusMin)}
              onChange={(v) => setRadiusMin(v ?? "")}
            />
            <InputNumber
              className="w-full md:w-[140px]"
              placeholder="Radius max"
              value={radiusMax === "" ? null : Number(radiusMax)}
              onChange={(v) => setRadiusMax(v ?? "")}
            />

            <Select
              value={orderBy}
              onChange={setOrderBy}
              className="w-full md:w-[160px]"
              options={[
                { value: "created_at", label: "Urutkan: Dibuat" },
                { value: "updated_at", label: "Urutkan: Diubah" },
                { value: "nama_kantor", label: "Urutkan: Nama" },
              ]}
            />
            <Select
              value={sort}
              onChange={setSort}
              className="w-full md:w-[120px]"
              options={[
                { value: "desc", label: "Desc" },
                { value: "asc", label: "Asc" },
              ]}
            />

            <Button icon={<ReloadOutlined />} onClick={fetchList}>
              Refresh
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpenAdd(true)}
              style={{ background: BRAND.accent, borderColor: BRAND.accent }}
            >
              Tambah Lokasi
            </Button>
          </div>
        </div>

        {/* TABEL */}
        <div className="rounded-xl bg-white ring-1 ring-gray-200 p-2 md:p-3">
          <Table
            rowKey="id_location"
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

      {/* MODAL TAMBAH LOKASI */}
      <Modal
        open={openAdd}
        onCancel={() => {
          addForm.resetFields();
          setOpenAdd(false);
        }}
        footer={null}
        title={<div className="text-lg font-semibold">Tambah Lokasi</div>}
        destroyOnClose
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={async (values) => {
            setAddLoading(true);
            try {
              await addLocation({
                nama_kantor: values.nama_kantor,
                latitude: values.latitude,
                longitude: values.longitude,
                radius: values.radius ?? null,
              });
              setOpenAdd(false);
              addForm.resetFields();
            } finally {
              setAddLoading(false);
            }
          }}
        >
          <Form.Item
            label="Nama Lokasi"
            name="nama_kantor"
            rules={[{ required: true, message: "Nama lokasi wajib diisi" }]}
          >
            <Input placeholder="Contoh: OSS Bali Denpasar" />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item
              label="Latitude"
              name="latitude"
              rules={[{ required: true, message: "Latitude wajib diisi" }]}
            >
              <Input placeholder="-8.65" />
            </Form.Item>
            <Form.Item
              label="Longitude"
              name="longitude"
              rules={[{ required: true, message: "Longitude wajib diisi" }]}
            >
              <Input placeholder="115.21" />
            </Form.Item>
          </div>

          <Form.Item label="Radius (meter)" name="radius">
            <InputNumber className="w-full" placeholder="Opsional, contoh: 50" />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            loading={addLoading}
            block
            style={{ background: BRAND.accent, borderColor: BRAND.accent }}
          >
            Simpan
          </Button>
        </Form>
      </Modal>

      {/* MODAL EDIT LOKASI */}
      <Modal
        open={openEdit}
        onCancel={() => {
          editForm.resetFields();
          setOpenEdit(false);
          setCurrentRow(null);
        }}
        footer={null}
        title={<div className="text-lg font-semibold">Edit Lokasi</div>}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!currentRow) return;
            setEditLoading(true);
            try {
              await updateLocation(currentRow.id_location, {
                nama_kantor: values.nama_kantor,
                latitude: values.latitude,
                longitude: values.longitude,
                radius: values.radius ?? null,
              });
              setOpenEdit(false);
              setCurrentRow(null);
              editForm.resetFields();
            } finally {
              setEditLoading(false);
            }
          }}
        >
          <Form.Item
            label="Nama Lokasi"
            name="nama_kantor"
            rules={[{ required: true, message: "Nama lokasi wajib diisi" }]}
          >
            <Input placeholder="Contoh: OSS Bali Denpasar" />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item
              label="Latitude"
              name="latitude"
              rules={[{ required: true, message: "Latitude wajib diisi" }]}
            >
              <Input placeholder="-8.65" />
            </Form.Item>
            <Form.Item
              label="Longitude"
              name="longitude"
              rules={[{ required: true, message: "Longitude wajib diisi" }]}
            >
              <Input placeholder="115.21" />
            </Form.Item>
          </div>

          <Form.Item label="Radius (meter)" name="radius">
            <InputNumber className="w-full" placeholder="Opsional, contoh: 50" />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            loading={editLoading}
            block
            style={{ background: BRAND.accent, borderColor: BRAND.accent }}
          >
            Simpan Perubahan
          </Button>
        </Form>
      </Modal>

      {/* MODAL HAPUS LOKASI */}
      <Modal
        open={openDelete}
        onCancel={() => {
          setOpenDelete(false);
          setCurrentRow(null);
        }}
        footer={null}
        title={<div className="text-lg font-semibold text-red-600">Konfirmasi Hapus</div>}
        destroyOnClose
      >
        <p className="text-gray-600 mb-4">
          Yakin ingin menghapus lokasi{" "}
          <span className="font-semibold">{currentRow?.nama_kantor}</span>?
          Tindakan ini akan melakukan <i>soft delete</i>.
        </p>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              setOpenDelete(false);
              setCurrentRow(null);
            }}
            className="flex-1"
          >
            Batal
          </Button>
          <Button
            type="primary"
            danger
            loading={deleteLoading}
            className="flex-1"
            onClick={async () => {
              if (!currentRow) return;
              setDeleteLoading(true);
              try {
                await deleteLocation(currentRow.id_location);
                setOpenDelete(false);
                setCurrentRow(null);
              } finally {
                setDeleteLoading(false);
              }
            }}
            style={{ borderColor: "#ef4444" }}
          >
            Hapus
          </Button>
        </div>
      </Modal>
    </ConfigProvider>
  );
}
