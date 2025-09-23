"use client";

import {
  ConfigProvider,
  Input,
  Button,
  Table,
  Space,
  Tooltip,
  Modal,
  Form,
  InputNumber,
  TimePicker,
  theme,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  SettingOutlined,
  EditOutlined,
  ReloadOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import UseShiftViewModel from "./UseShiftViewModel";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

/* warna utama untuk tombol custom */
const GOLD = "#D9A96F";

export default function ShiftContent() {
  const vm = UseShiftViewModel();

  // Modal "Tambah" dikelola lokal di komponen ini
  const [openAdd, setOpenAdd] = useState(false);

  const [formAdd] = Form.useForm();
  const [formEdit] = Form.useForm();

  useEffect(() => {
    if (vm.openEdit && vm.selected) {
      formEdit.setFieldsValue(vm.getEditInitial());
    }
  }, [vm.openEdit, vm.selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = [
    {
      title: <span className="text-slate-600">Nama Pola Kerja</span>,
      dataIndex: "name",
      key: "name",
      width: 240,
      render: (v) => <span className="text-slate-800">{v}</span>,
    },
    {
      title: <span className="text-slate-600">Jam Kerja</span>,
      dataIndex: "jamKerja",
      key: "jamKerja",
      width: 200,
      render: (v) => <span className="text-slate-700">{v}</span>,
    },
    {
      title: <span className="text-slate-600">Jam Istirahat</span>,
      dataIndex: "istirahat",
      key: "istirahat",
      width: 230,
      render: (v) => <span className="text-slate-700">{v}</span>,
    },
    {
      title: <span className="text-slate-600">Toleransi Keterlambatan</span>,
      dataIndex: "toleransi",
      key: "toleransi",
      width: 220,
      render: (v) => <span className="text-slate-700">{v}</span>,
    },
    {
      title: <span className="text-slate-600">Catatan</span>,
      dataIndex: "note",
      key: "note",
      render: (v) => <span className="text-slate-500">{v}</span>,
    },
    {
      title: <span className="text-slate-600">Aksi</span>,
      key: "aksi",
      fixed: "right",
      width: 170,
      render: (_, row) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              size="small"
              type="text"
              className="!h-8 !w-8 !rounded-full !bg-white hover:!bg-slate-100 !text-slate-600 !border !border-slate-300"
              icon={<EditOutlined />}
              onClick={() => vm.onEditOpen(row)}
            />
          </Tooltip>
          <Tooltip title="Riwayat / Reset">
            <Button
              size="small"
              type="text"
              className="!h-8 !w-8 !rounded-full !bg-white hover:!bg-slate-100 !text-slate-600 !border !border-slate-300"
              icon={<ReloadOutlined />}
              onClick={() => vm.onReset(row)}
            />
          </Tooltip>
          <Tooltip title="Hapus">
            <Button
              size="small"
              type="text"
              className="!h-8 !w-8 !rounded-full !bg-white !text-rose-500 !border !border-rose-300 hover:!bg-rose-50"
              icon={<DeleteOutlined />}
              onClick={() => vm.onDeleteOpen(row)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: GOLD, // aktif pagination/focus ikut kuning
          borderRadius: 12,
          colorBorderSecondary: "#E5E7EB",
          colorBgContainer: "#FFFFFF",
          colorText: "#0F172A",
        },
        components: {
          Table: {
            headerBg: "#F8FAFC",
            headerColor: "#475569",
            rowHoverBg: "#F1F5F9",
            borderColor: "#E5E7EB",
          },
          Input: {
            colorBgContainer: "#FFFFFF",
            colorBorder: "#E5E7EB",
            activeBorderColor: "#A3A3A3",
            borderRadius: 12,
          },
          Button: { borderRadius: 12 },
          Modal: { borderRadiusLG: 16 },
          Pagination: { colorPrimary: GOLD },
        },
      }}
    >
      <div className="p-6">
        {/* Header bar */}
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Pola Kerja - Shift</h1>
          <div className="ml-auto flex items-center gap-2">
            <Input
              allowClear
              placeholder="Cari nama pola…"
              prefix={<SearchOutlined className="text-slate-400" />}
              value={vm.search}
              onChange={(e) => vm.setSearch(e.target.value)}
              className="w-72 rounded-xl"
              size="large"
            />
            <Button
              icon={<SettingOutlined />}
              size="large"
              className="rounded-xl !bg-white !text-slate-600 !border !border-slate-300 hover:!bg-slate-50"
            >
              Pengaturan
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              className="rounded-xl !text-white hover:brightness-95"
              style={{ backgroundColor: GOLD, borderColor: GOLD }}
              onClick={() => setOpenAdd(true)}
            >
              Tambah
            </Button>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-4">
            <Table
              size="middle"
              columns={columns}
              dataSource={vm.rows}
              rowKey="id"
              loading={vm.loading}
              pagination={{
                current: vm.pagination.page,
                pageSize: vm.pagination.pageSize,
                total: vm.pagination.total,
                position: ["bottomRight"],
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50"],
                showTotal: (t, [a, b]) => `${a}-${b} dari ${t}`,
                className: "px-2 pb-2",
              }}
              onChange={vm.onTableChange}
              className="!bg-transparent [&_.ant-table-container]:!bg-transparent
                         [&_.ant-table-thead>tr>th]:!bg-slate-50 [&_.ant-table-thead>tr>th]:!text-slate-600
                         [&_.ant-table-tbody>tr>td]:!bg-white"
            />
          </div>
        </div>
      </div>

      {/* ========= MODAL TAMBAH ========= */}
      <Modal
        title={<span className="text-lg font-semibold">Tambah Pola Kerja - Shift</span>}
        open={openAdd}
        onCancel={() => setOpenAdd(false)}
        footer={null}
        width={960}
      >
        <Form
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          className="mt-2"
          form={formAdd}
          initialValues={{
            maxIstirahat: 60,
            jamMasuk: dayjs("09:00", "HH:mm"),
            jamKeluar: dayjs("18:00", "HH:mm"),
          }}
          onFinish={async (vals) => {
            await vm.onAddSubmit(vals);
            formAdd.resetFields();
            setOpenAdd(false);
          }}
        >
          <Form.Item
            label={
              <span>
                Nama Pola Kerja<span className="text-rose-500">*</span>
              </span>
            }
            name="nama"
            rules={[{ required: true, message: "Wajib diisi" }]}
          >
            <Input className="rounded-xl" />
          </Form.Item>

          <Form.Item label="Toleransi Keterlambatan" name="toleransi">
            <InputNumber addonAfter="Menit" className="w-40" min={0} />
          </Form.Item>

          <Form.Item label="Catatan" name="catatan">
            <Input className="rounded-xl" />
          </Form.Item>

          {/* Jadwal Kerja */}
          <div className="pl-[25%] -mt-2 mb-2 text-slate-700 flex items-center gap-2">
            <span className="font-medium">Jadwal Kerja</span>
            <QuestionCircleOutlined className="text-slate-400" />
            <span className="text-rose-500 ml-1">*</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <div className="grid grid-cols-5 gap-3 text-sm font-medium text-slate-600 mb-2 px-1">
              <div>Jam Masuk</div>
              <div>Jam Keluar</div>
              <div>Mulai Istirahat</div>
              <div>Selesai Istirahat</div>
              <div>Maks. Menit Istirahat</div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              <Form.Item name="jamMasuk" noStyle rules={[{ required: true, message: "Wajib" }]}>
                <TimePicker format="HH:mm" className="w-full rounded-lg" />
              </Form.Item>
              <Form.Item name="jamKeluar" noStyle rules={[{ required: true, message: "Wajib" }]}>
                <TimePicker format="HH:mm" className="w-full rounded-lg" />
              </Form.Item>
              <Form.Item name="mulaiIstirahat" noStyle>
                <TimePicker format="HH:mm" className="w-full rounded-lg" />
              </Form.Item>
              <Form.Item name="selesaiIstirahat" noStyle>
                <TimePicker format="HH:mm" className="w-full rounded-lg" />
              </Form.Item>
              <Form.Item name="maxIstirahat" noStyle>
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </div>
          </div>

          <div className="mt-6 flex gap-2 justify-start pl-[25%]">
            <Button
              type="primary"
              htmlType="submit"
              className="rounded-xl px-6 !text-white hover:brightness-95"
              style={{ backgroundColor: GOLD, borderColor: GOLD }}
            >
              Simpan
            </Button>
            <Button onClick={() => setOpenAdd(false)} className="rounded-xl px-6">
              Tutup
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ========= MODAL EDIT ========= */}
      <Modal
        title={<span className="text-lg font-semibold">Ubah Data</span>}
        open={vm.openEdit}
        onCancel={vm.onEditClose}
        footer={null}
        width={960}
      >
        <Form
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          className="mt-2"
          form={formEdit}
          onFinish={vm.onEditSubmit}
        >
          <Form.Item
            label={
              <span>
                Nama Pola Kerja<span className="text-rose-500">*</span>
              </span>
            }
            name="nama"
            rules={[{ required: true, message: "Wajib diisi" }]}
          >
            <Input className="rounded-xl" />
          </Form.Item>

          <Form.Item label="Toleransi Keterlambatan" name="toleransi">
            <InputNumber addonAfter="Menit" className="w-40" min={0} />
          </Form.Item>

          <Form.Item label="Catatan" name="catatan">
            <Input className="rounded-xl" />
          </Form.Item>

          <div className="pl-[25%] -mt-2 mb-2 text-slate-700 flex items-center gap-2">
            <span className="font-medium">Jadwal Kerja</span>
            <QuestionCircleOutlined className="text-slate-400" />
            <span className="text-rose-500 ml-1">*</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <div className="grid grid-cols-5 gap-3 text-sm font-medium text-slate-600 mb-2 px-1">
              <div>Jam Masuk</div>
              <div>Jam Keluar</div>
              <div>Mulai Istirahat</div>
              <div>Selesai Istirahat</div>
              <div>Maks. Menit Istirahat</div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              <Form.Item name="jamMasuk" noStyle rules={[{ required: true, message: "Wajib" }]}>
                <TimePicker format="HH:mm" className="w-full rounded-lg" />
              </Form.Item>
              <Form.Item name="jamKeluar" noStyle rules={[{ required: true, message: "Wajib" }]}>
                <TimePicker format="HH:mm" className="w-full rounded-lg" />
              </Form.Item>
              <Form.Item name="mulaiIstirahat" noStyle>
                <TimePicker format="HH:mm" className="w-full rounded-lg" />
              </Form.Item>
              <Form.Item name="selesaiIstirahat" noStyle>
                <TimePicker format="HH:mm" className="w-full rounded-lg" />
              </Form.Item>
              <Form.Item name="maxIstirahat" noStyle>
                <InputNumber className="w-full" min={0} />
              </Form.Item>
            </div>
          </div>

          <div className="mt-6 flex gap-2 justify-start pl-[25%]">
            <Button
              type="primary"
              htmlType="submit"
              className="rounded-xl px-6 !text-white hover:brightness-95"
              style={{ backgroundColor: GOLD, borderColor: GOLD }}
            >
              Simpan
            </Button>
            <Button onClick={vm.onEditClose} className="rounded-xl px-6">
              Tutup
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ========= MODAL DELETE ========= */}
      <Modal
        open={vm.openDelete}
        onCancel={vm.onDeleteClose}
        footer={null}
        title={<span className="text-lg font-semibold">Hapus Pola Kerja</span>}
      >
        <p className="text-slate-600">
          Yakin ingin menghapus pola <span className="font-semibold">{vm.selected?.name}</span>?
        </p>
        <div className="mt-6 flex gap-2">
          <Button onClick={vm.onDeleteClose} className="rounded-xl px-6">
            Batal
          </Button>
          <Button
            danger
            className="rounded-xl px-6 !text-white hover:brightness-95"
            style={{ backgroundColor: "#EF4444", borderColor: "#EF4444" }}
            onClick={vm.onDeleteConfirm}
          >
            Hapus
          </Button>
        </div>
      </Modal>
    </ConfigProvider>
  );
}
