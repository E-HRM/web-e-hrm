"use client";

import { useMemo, useState } from "react";
import {
  Card,
  Table,
  Input,
  Button,
  Modal,
  Form,
  Tooltip,
  Popconfirm,
  Tag,
  Switch,
  ConfigProvider,
  theme,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import useVM, { showFromDB } from "./useKategoriKunjunganViewModel";

const NAVY = "#003A6F";

export default function KategoriKunjunganContent() {
  const vm = useVM();

  // modal add
  const [openAdd, setOpenAdd] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addForm] = Form.useForm();

  // modal edit
  const [openEdit, setOpenEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm] = Form.useForm();
  const [editingRow, setEditingRow] = useState(null);

  const onAddSubmit = async () => {
    try {
      const v = await addForm.validateFields();
      setSavingAdd(true);
      await vm.create(v.kategori_kunjungan);
      setOpenAdd(false);
      addForm.resetFields();
      message.success("Kategori kunjungan berhasil ditambahkan");
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Gagal menambah kategori");
    } finally {
      setSavingAdd(false);
    }
  };

  const onEditOpen = (row) => {
    setEditingRow(row);
    editForm.setFieldsValue({ kategori_kunjungan: row.kategori_kunjungan });
    setOpenEdit(true);
  };

  const onEditSubmit = async () => {
    try {
      const v = await editForm.validateFields();
      setSavingEdit(true);
      await vm.update(editingRow.id_kategori_kunjungan, v.kategori_kunjungan);
      setOpenEdit(false);
      setEditingRow(null);
      editForm.resetFields();
      message.success("Kategori kunjungan berhasil diubah");
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Gagal mengubah kategori");
    } finally {
      setSavingEdit(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Kategori",
        dataIndex: "kategori_kunjungan",
        key: "kat",
      },
      {
        title: "Status",
        key: "st",
        width: 120,
        render: (_, r) =>
          r.deleted_at ? <Tag color="error">Terhapus</Tag> : <Tag color="success">Aktif</Tag>,
      },
      {
        title: "Dibuat",
        dataIndex: "created_at",
        key: "cr",
        width: 180,
        render: (v) => showFromDB(v),
      },
      {
        title: "Diubah",
        dataIndex: "updated_at",
        key: "up",
        width: 180,
        render: (v) => showFromDB(v),
      },
      {
        title: "Aksi",
        key: "aksi",
        align: "right",
        width: 170,
        render: (_, row) => {
          const isDeleted = !!row.deleted_at;
          const willHardDelete = isDeleted || vm.includeDeleted;

          const title = willHardDelete ? "Hapus permanen kategori?" : "Hapus kategori?";
          const desc = willHardDelete
            ? "Hard delete: data akan hilang permanen."
            : "Soft delete: data bisa dihapus permanen dari tampilan 'Tampilkan yang terhapus'.";

          const onConfirmDelete = async () => {
            try {
              if (willHardDelete) {
                await vm.removeHard(row.id_kategori_kunjungan);
                message.success("Kategori dihapus permanen.");
              } else {
                await vm.remove(row.id_kategori_kunjungan);
                message.success("Kategori dihapus (soft delete).");
              }
            } catch (e) {
              message.error(e?.message || "Gagal menghapus kategori");
            }
          };

          return (
            <div className="flex gap-2 justify-end">
              <Tooltip title={isDeleted ? "Tidak bisa ubah data yang sudah terhapus" : "Ubah"}>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEditOpen(row)}
                  disabled={isDeleted}
                />
              </Tooltip>
              <Popconfirm
                title={title}
                description={desc}
                okText="Hapus"
                cancelText="Batal"
                onConfirm={onConfirmDelete}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </div>
          );
        },
      },
    ],
    [vm]
  );

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: NAVY, borderRadius: 12 } }}>
      <div className="p-4">
        <Card
          title={<span className="text-lg font-semibold">Kategori Kunjungan</span>}
          styles={{ body: { paddingTop: 16 } }}
          extra={
            <div className="flex items-center gap-2">
              <Tooltip title="Muat ulang">
                <Button icon={<ReloadOutlined />} onClick={vm.refresh} />
              </Tooltip>
            </div>
          }
        >
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2 md:flex-nowrap mb-4">
            <Input.Search
              placeholder="Cari kategori"
              className="w-[240px]"
              value={vm.q}
              onChange={(e) => vm.setQ(e.target.value)}
              onSearch={(v) => vm.setQ(v)}
              allowClear
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={vm.includeDeleted}
                onChange={(v) => vm.setIncludeDeleted(v)}
              />
              <span className="opacity-75">Tampilkan yang terhapus</span>
            </div>
            <Button
              icon={<PlusOutlined />}
              onClick={() => setOpenAdd(true)}
              style={{ background: NAVY, color: "#fff", borderColor: NAVY }}
            >
              Tambah Kategori
            </Button>
          </div>

          <Table
            rowKey="id_kategori_kunjungan"
            columns={columns}
            dataSource={vm.rows}
            loading={vm.loading}
            pagination={false}
            size="middle"
          />
        </Card>
      </div>

      {/* Modal Tambah */}
      <Modal
        title="Tambah Kategori"
        open={openAdd}
        onCancel={() => setOpenAdd(false)}
        okText="Simpan"
        okButtonProps={{ style: { background: NAVY, color: "#fff" } }}
        confirmLoading={savingAdd}
        onOk={onAddSubmit}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            name="kategori_kunjungan"
            label="Nama Kategori"
            rules={[{ required: true, message: "Wajib diisi" }]}
          >
            <Input placeholder="Mis. Kunjungan Klien, Survey Lokasi, dsb." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Edit */}
      <Modal
        title="Ubah Kategori"
        open={openEdit}
        onCancel={() => setOpenEdit(false)}
        okText="Simpan"
        okButtonProps={{ style: { background: NAVY, color: "#fff" } }}
        confirmLoading={savingEdit}
        onOk={onEditSubmit}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="kategori_kunjungan"
            label="Nama Kategori"
            rules={[{ required: true, message: "Wajib diisi" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
