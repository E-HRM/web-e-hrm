"use client";

import {
  Input,
  InputNumber,
  Select,
  Button,
  Table,
  Space,
  Tooltip,
  Modal,
  Form,
  Typography,
  Tag,
  Card,
  Empty,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  AimOutlined,
} from "@ant-design/icons";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import useLokasiViewModel from "./useLokasiViewModel";

const { Title } = Typography;
const BRAND = { accent: "#003A6F" };

// react-leaflet butuh DOM → matikan SSR
const LocationPicker = dynamic(
  () => import("../../../components/map/LocationPicker"),
  { ssr: false }
);

export default function LokasiContent() {
  const {
    rows,
    loading,
    pagination,
    onTableChange,
    // filters
    search,
    setSearch,
    radiusMin,
    setRadiusMin,
    radiusMax,
    setRadiusMax,
    orderBy,
    setOrderBy,
    sort,
    setSort,
    // actions
    addLocation,
    updateLocation,
    deleteLocation,
  } = useLokasiViewModel();

  // Modal tambah
  const [openAdd, setOpenAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addForm] = Form.useForm();
  const [addMapOpenVersion, setAddMapOpenVersion] = useState(0);

  // Modal edit
  const [openEdit, setOpenEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();
  const [currentRow, setCurrentRow] = useState(null);
  const [editMapOpenVersion, setEditMapOpenVersion] = useState(0);

  // quick stats
  const totalLokasi = rows?.length || 0;

  const radiusBadge = (v) => {
    if (v == null) return <Tag>—</Tag>;
    const val = Number(v);
    if (val < 50) return <Tag color="green">{val}</Tag>;
    if (val <= 100) return <Tag color="geekblue">{val}</Tag>;
    return <Tag color="orange">{val}</Tag>;
  };

  const columns = useMemo(
    () => [
      {
        title: "Nama Lokasi",
        dataIndex: "nama_kantor",
        key: "nama_kantor",
        width: 280,
        render: (t) => (
          <div className="flex items-center gap-2">
            <span className="inline-flex w-7 h-7 rounded-full bg-slate-100 text-[var(--brand-teal-700)] items-center justify-center ring-1 ring-slate-200">
              <EnvironmentOutlined />
            </span>
            <span className="font-medium">{t}</span>
          </div>
        ),
      },
      {
        title: "Lokasi",
        key: "lokasi",
        width: 240,
        render: (_, r) => {
          const has = r.latitude != null && r.longitude != null;
          if (!has)
            return (
              <span className="text-xs text-slate-500">Belum ditentukan</span>
            );
          const lat = Number(r.latitude);
          const lng = Number(r.longitude);
          const zoom = 17;
          const mapHref = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
          return (
            <a
              href={mapHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs"
              style={{ color: BRAND.accent }}
            >
              <AimOutlined /> Lihat di OpenStreetMap
            </a>
          );
        },
      },
      {
        title: "Radius (m)",
        dataIndex: "radius",
        key: "radius",
        width: 130,
        align: "center",
        render: radiusBadge,
      },
      {
        title: "Dibuat",
        dataIndex: "created_at",
        key: "created_at",
        width: 180,
        render: (v) => (v ? new Date(v).toLocaleString() : "-"),
        responsive: ["lg"],
      },
      {
        title: "Diubah",
        dataIndex: "updated_at",
        key: "updated_at",
        width: 180,
        render: (v) => (v ? new Date(v).toLocaleString() : "-"),
        responsive: ["lg"],
      },
      {
        title: "Aksi",
        key: "aksi",
        width: 160,
        fixed: "right",
        align: "center",
        render: (_, row) => (
          <Space>
            <Tooltip title="Edit">
              <Button
                size="small"
                className="btn-ghost-circle"
                icon={<EditOutlined />}
                onClick={() => {
                  setCurrentRow(row);
                  editForm.setFieldsValue({
                    nama_kantor: row.nama_kantor,
                    latitude:
                      typeof row.latitude === "number"
                        ? row.latitude
                        : Number(row.latitude ?? -8.65),
                    longitude:
                      typeof row.longitude === "number"
                        ? row.longitude
                        : Number(row.longitude ?? 115.21),
                    radius:
                      row.radius === null || row.radius === undefined
                        ? null
                        : Number(row.radius),
                  });
                  setOpenEdit(true);
                }}
              />
            </Tooltip>
            <Tooltip title="Hapus">
              <Button
                size="small"
                danger
                className="btn-ghost-circle"
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
    ],
    [editForm]
  );

  // Modal delete
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 space-y-4">
      {/* ======= PAGE HEADER ======= */}
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <Title level={3} className="!m-0">Lokasi Kantor</Title>
          <p className="page-header__desc mt-1">
            Kelola titik absen & radius geofence untuk setiap kantor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tag color="geekblue">Total Lokasi: {totalLokasi}</Tag>
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

      {/* ======= FILTER BAR ======= */}
      <Card className="surface-card p-3 md:p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto_auto] items-center">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Cari lokasi…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <InputNumber
              placeholder="Radius min"
              value={radiusMin}
              onChange={setRadiusMin}
              min={0}
            />
            <InputNumber
              placeholder="Radius max"
              value={radiusMax}
              onChange={setRadiusMax}
              min={0}
            />
          </div>
          <Select
            value={orderBy}
            onChange={setOrderBy}
            className="w-full md:w-[170px]"
            options={[
              { value: "created_at", label: "Urutkan: Dibuat" },
              { value: "updated_at", label: "Urutkan: Diubah" },
              { value: "nama_kantor", label: "Urutkan: Nama" },
              { value: "radius", label: "Urutkan: Radius" },
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
        </div>
      </Card>

      {/* ======= TABLE ======= */}
      <Card className="surface-card p-2 md:p-3">
        {(!rows || rows.length === 0) && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Belum ada lokasi. Tambahkan lokasi pertama Anda."
          />
        ) : (
          <Table
            rowKey="id_location"
            columns={columns}
            dataSource={rows}
            loading={loading}
            size="small"
            tableLayout="auto"
            scroll={{ x: "max-content" }}
            sticky
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
              [&_.ant-table-tbody_tr:hover_td]:!bg-slate-50
            "
          />
        )}
      </Card>

      {/* ======= MODALS ======= */}
      {/* Tambah */}
      <Modal
        open={openAdd}
        onCancel={() => {
          addForm.resetFields();
          setOpenAdd(false);
        }}
        footer={null}
        title={<div className="text-lg font-semibold">Tambah Lokasi</div>}
        destroyOnClose
        afterOpenChange={(opened) => {
          if (opened) setAddMapOpenVersion((v) => v + 1);
        }}
      >
        <Form
          form={addForm}
          layout="vertical"
          initialValues={{ latitude: -8.65, longitude: 115.21, radius: 50 }}
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

          {/* Koordinat manual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item
              label="Latitude"
              name="latitude"
              rules={[
                { required: true, message: "Latitude wajib diisi" },
                {
                  validator: (_, v) =>
                    v >= -90 && v <= 90
                      ? Promise.resolve()
                      : Promise.reject("Latitude harus di -90..90"),
                },
              ]}
            >
              <InputNumber className="w-full" step={0.000001} min={-90} max={90} placeholder="-90 .. 90" />
            </Form.Item>

            <Form.Item
              label="Longitude"
              name="longitude"
              rules={[
                { required: true, message: "Longitude wajib diisi" },
                {
                  validator: (_, v) =>
                    v >= -180 && v <= 180
                      ? Promise.resolve()
                      : Promise.reject("Longitude harus di -180..180"),
                },
              ]}
            >
              <InputNumber className="w-full" step={0.000001} min={-180} max={180} placeholder="-180 .. 180" />
            </Form.Item>
          </div>

          {/* Peta OSM (Tambah) */}
          <Form.Item noStyle shouldUpdate>
            {() => {
              const latRaw = addForm.getFieldValue("latitude");
              const lngRaw = addForm.getFieldValue("longitude");
              const rRaw = addForm.getFieldValue("radius");

              const lat = Number(latRaw ?? -8.65);
              const lng = Number(lngRaw ?? 115.21);
              const radius =
                typeof rRaw === "number" ? rRaw : Number(rRaw ?? 50);

              return (
                <div className="mb-3">
                  <LocationPicker
                    value={{ lat, lng, radius }}
                    visible={openAdd}
                    openVersion={addMapOpenVersion}
                    onChange={({ lat, lng, radius }) => {
                      addForm.setFieldsValue({
                        latitude: Number(Number(lat).toFixed(6)),
                        longitude: Number(Number(lng).toFixed(6)),
                        ...(typeof radius === "number" ? { radius } : {}),
                      });
                    }}
                  />
                </div>
              );
            }}
          </Form.Item>

          <Form.Item label="Radius (meter)" name="radius">
            <InputNumber className="w-full" placeholder="Opsional, contoh: 50" min={0} />
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

      {/* Edit */}
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
        afterOpenChange={(opened) => {
          if (opened) setEditMapOpenVersion((v) => v + 1);
        }}
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

          {/* Koordinat manual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item
              label="Latitude"
              name="latitude"
              rules={[
                { required: true, message: "Latitude wajib diisi" },
                {
                  validator: (_, v) =>
                    v >= -90 && v <= 90
                      ? Promise.resolve()
                      : Promise.reject("Latitude harus di -90..90"),
                },
              ]}
            >
              <InputNumber className="w-full" step={0.000001} min={-90} max={90} placeholder="-90 .. 90" />
            </Form.Item>

            <Form.Item
              label="Longitude"
              name="longitude"
              rules={[
                { required: true, message: "Longitude wajib diisi" },
                {
                  validator: (_, v) =>
                    v >= -180 && v <= 180
                      ? Promise.resolve()
                      : Promise.reject("Longitude harus di -180..180"),
                },
              ]}
            >
              <InputNumber className="w-full" step={0.000001} min={-180} max={180} placeholder="-180 .. 180" />
            </Form.Item>
          </div>

          {/* Peta OSM (Edit) */}
          <Form.Item noStyle shouldUpdate>
            {() => {
              const latRaw = editForm.getFieldValue("latitude");
              const lngRaw = editForm.getFieldValue("longitude");
              const rRaw = editForm.getFieldValue("radius");

              const lat = Number(latRaw ?? -8.65);
              const lng = Number(lngRaw ?? 115.21);
              const radius =
                typeof rRaw === "number" ? rRaw : Number(rRaw ?? 50);

              return (
                <div className="mb-3">
                  <LocationPicker
                    value={{ lat, lng, radius }}
                    visible={openEdit}
                    openVersion={editMapOpenVersion}
                    onChange={({ lat, lng, radius }) => {
                      editForm.setFieldsValue({
                        latitude: Number(Number(lat).toFixed(6)),
                        longitude: Number(Number(lng).toFixed(6)),
                        ...(typeof radius === "number" ? { radius } : {}),
                      });
                    }}
                  />
                </div>
              );
            }}
          </Form.Item>

          <Form.Item label="Radius (meter)" name="radius">
            <InputNumber className="w-full" placeholder="Opsional, contoh: 50" min={0} />
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

      {/* Hapus */}
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
          <span className="font-semibold">{currentRow?.nama_kantor}</span>? Tindakan ini akan
          melakukan <i>soft delete</i>.
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
    </div>
  );
}
