"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Modal,
  Form,
  Select,
  message,
  Typography,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined, // <— ikon visualisasi
} from "@ant-design/icons";
import useJabatanViewModel from "./useJabatanViewModel";

const { Title } = Typography;

export default function JabatanContent() {
  const vm = useJabatanViewModel();

  const columns = [
    {
      title: "Jabatan",
      dataIndex: "nama_jabatan",
      key: "nama_jabatan",
    },
    {
      title: "Aksi",
      key: "action",
      fixed: "right",
      width: 160,
      render: (_, row) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => vm.openEdit(row.id_jabatan)}
          />
          <Popconfirm
            title="Hapus jabatan ini?"
            okText="Hapus"
            okButtonProps={{ danger: true }}
            cancelText="Batal"
            onConfirm={() => vm.remove(row.id_jabatan)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Title level={2} style={{ marginTop: 0 }}>
        Jabatan
      </Title>

      <Card
        bordered
        style={{ borderRadius: 16 }}
        bodyStyle={{ paddingTop: 16 }}
        title={
          <Space>
            <Input.Search
              placeholder="Cari jabatan…"
              allowClear
              onSearch={(v) => {
                vm.setSearch(v);
                vm.reload();
              }}
              onChange={(e) => vm.setSearch(e.target.value)}
              value={vm.search}
              enterButton={<SearchOutlined />}
              style={{ width: 320 }}
            />
          </Space>
        }
        extra={
          <Space>
            {/* Tombol Visualisasi */}
            <Link href="/home/kelola_karyawan/jabatan/visualisasi">
              <Button icon={<ApartmentOutlined />}>Lihat Visualisasi</Button>
            </Link>

            {/* Tombol Tambah */}
            <Button type="primary" icon={<PlusOutlined />} onClick={vm.openCreate}>
              Tambah Jabatan
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id_jabatan"
          loading={vm.loading}
          columns={columns}
          dataSource={vm.data}
          pagination={{
            current: vm.page,
            pageSize: vm.pageSize,
            total: vm.total,
            showSizeChanger: true,
            onChange: (p, ps) => vm.changePage(p, ps),
          }}
          scroll={{ x: 560 }}
        />
      </Card>

      {/* ==== MODAL ==== */}
      <Modal
        open={vm.modal.open}
        onCancel={vm.closeModal}
        title={vm.modal.mode === "create" ? "Tambah Jabatan" : "Ubah Jabatan"}
        okText={vm.modal.mode === "create" ? "Simpan" : "Simpan Perubahan"}
        onOk={() => vm.form.submit()}
        confirmLoading={vm.saving}
        destroyOnClose
        styles={{
          header: { borderBottom: "1px solid #ECEEF1" },
          footer: { borderTop: "1px solid #ECEEF1" },
          body: { paddingTop: 20, paddingBottom: 8 },
        }}
      >
        <Form
          form={vm.form}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          colon={false}
          onFinish={(values) => {
            if (vm.modal.mode === "edit" && values.id_induk_jabatan === vm.modal.id) {
              return message.error(
                "Induk jabatan tidak boleh sama dengan jabatan itu sendiri."
              );
            }
            vm.submit(values);
          }}
          initialValues={{
            nama_jabatan: "",
            id_induk_jabatan: undefined,
          }}
        >
          {/* Nama */}
          <Form.Item
            name="nama_jabatan"
            label={
              <span className="font-medium">
                Nama <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true, message: "Nama jabatan wajib diisi" }]}
            required
          >
            <Input placeholder="cth: Manager Operasional" size="large" allowClear />
          </Form.Item>

          {/* Induk */}
          <Form.Item
            name="id_induk_jabatan"
            label={<span className="font-medium">Induk</span>}
            tooltip="Biarkan kosong untuk menjadikannya root (Tanpa Induk)."
          >
            <Select
              size="large"
              placeholder="Tanpa Induk"
              allowClear
              showSearch
              optionFilterProp="label"
              options={vm.parentOptions.filter(
                (o) => !(vm.modal.mode === "edit" && o.value === vm.modal.id)
              )}
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
