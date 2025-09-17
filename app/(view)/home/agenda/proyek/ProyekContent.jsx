"use client";

import { useMemo, useState } from "react";
import { Card, Table, Input, Button, Modal, Form, Popconfirm, Tooltip, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useProyekViewModel from "./ProyekViewModel";

const BRAND = { accent: "#D9A96F", dark: "#0A3848" };

export default function ProyekContent() {
  const router = useRouter();
  const vm = useProyekViewModel();

  // modal tambah & edit
  const [openAdd, setOpenAdd] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addForm] = Form.useForm();

  const [openEdit, setOpenEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm] = Form.useForm();
  const [editingRow, setEditingRow] = useState(null);

  const onAddSubmit = async () => {
    try {
      const { nama_agenda } = await addForm.validateFields();
      setSavingAdd(true);
      await vm.create(nama_agenda.trim());
      setOpenAdd(false);
      addForm.resetFields();
      message.success("Proyek berhasil ditambahkan");
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Gagal menambah proyek");
    } finally {
      setSavingAdd(false);
    }
  };

  const onEditOpen = (row) => {
    setEditingRow(row);
    editForm.setFieldsValue({ nama_agenda: row.nama_agenda });
    setOpenEdit(true);
  };

  const onEditSubmit = async () => {
    try {
      const { nama_agenda } = await editForm.validateFields();
      setSavingEdit(true);
      await vm.update(editingRow.id_agenda, nama_agenda.trim());
      setOpenEdit(false);
      setEditingRow(null);
      editForm.resetFields();
      message.success("Proyek berhasil diubah");
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Gagal mengubah proyek");
    } finally {
      setSavingEdit(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Nama",
        dataIndex: "nama_agenda",
        key: "nama",
        render: (v, row) => (
          <a
            onClick={() =>
              router.push(`/home/agenda-kerja/aktivitas?id_agenda=${encodeURIComponent(row.id_agenda)}`)
            }
          >
            {v}
          </a>
        ),
      },
      {
        title: "Warna",
        key: "warna",
        render: () => "—", // API belum mendukung warna; tampilkan placeholder
      },
      {
        title: "Anggota",
        key: "anggota",
        render: () => "—", // API belum mendukung anggota; placeholder
      },
      {
        title: "Jml. Pekerjaan",
        dataIndex: ["_count", "items"],
        key: "jumlah",
        align: "center",
        render: (n = 0, row) => (
          <a
            onClick={() =>
              router.push(`/home/agenda-kerja/aktivitas?id_agenda=${encodeURIComponent(row.id_agenda)}`)
            }
          >
            {n}
          </a>
        ),
      },
      {
        title: "Aksi",
        key: "aksi",
        align: "right",
        render: (_, row) => (
          <div className="flex gap-2 justify-end">
            <Tooltip title="Ubah">
              <Button size="small" icon={<EditOutlined />} onClick={() => onEditOpen(row)} />
            </Tooltip>
            <Popconfirm
              title="Hapus proyek?"
              description="Ini adalah penghapusan lembut (soft delete)."
              onConfirm={() => vm.remove(row.id_agenda)}
              okText="Hapus"
              cancelText="Batal"
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </div>
        ),
      },
    ],
    [router, vm]
  );

  return (
    <div className="p-4">
      <Card
        title={<span className="text-lg font-semibold">Proyek</span>}
        extra={
          <Button icon={<ReloadOutlined />} onClick={vm.refresh} style={{ background: BRAND.accent, color: BRAND.dark }}>
            Muat Ulang
          </Button>
        }
      >
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <Input.Search
            className="w-[320px] max-w-full"
            placeholder="Cari"
            value={vm.q}
            onChange={(e) => vm.setQ(e.target.value)}
            onSearch={() => vm.refresh()}
          />
          <Button
            icon={<PlusOutlined />}
            onClick={() => setOpenAdd(true)}
            style={{ background: BRAND.accent, color: BRAND.dark }}
          >
            Tambah Proyek
          </Button>
        </div>

        {/* Table */}
        <Table
          rowKey="id_agenda"
          columns={columns}
          dataSource={vm.rows}
          loading={vm.loading}
          pagination={false}
          size="middle"
        />
      </Card>

      {/* Modal Tambah */}
      <Modal
        title="Tambah Proyek"
        open={openAdd}
        onCancel={() => setOpenAdd(false)}
        okText="Simpan"
        confirmLoading={savingAdd}
        onOk={onAddSubmit}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical">
          <Form.Item name="nama_agenda" label="Nama Proyek" rules={[{ required: true, message: "Wajib diisi" }]}>
            <Input placeholder="Mis. Pengembangan HRIS" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Edit */}
      <Modal
        title="Ubah Proyek"
        open={openEdit}
        onCancel={() => setOpenEdit(false)}
        okText="Simpan"
        confirmLoading={savingEdit}
        onOk={onEditSubmit}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="nama_agenda" label="Nama Proyek" rules={[{ required: true, message: "Wajib diisi" }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
