"use client";

import React from "react";
import {
  Tabs,
  Button,
  Table,
  ConfigProvider,
  Card,
  Space,
  Tooltip,
  Modal,
  Form,
  Input,
  Select, // [ADDED]
  Tag,    // [ADDED]
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import useManajemenKategoriviewModel from "./useManajemenKategoriviewModel";

const GOLD = "#003A6F";
const LIGHT_BLUE = "#E8F6FF";
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SCROLL_Y = 440;

/** Modal form */
function FormKategoriModal({
  open,
  mode,
  kind,
  initialName,
  initialReduce = true, // [ADDED]
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue({
        nama_kategori: initialName || "",
        ...(kind === "cuti" ? { pengurangan_kouta: initialReduce } : {}), // [ADDED]
      });
    } else {
      form.resetFields();
    }
  }, [open, initialName, initialReduce, kind, form]);

  const kindLabel =
    kind === "cuti" ? "Cuti" : kind === "sakit" ? "Izin Sakit" : "Izin Jam";

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      title={mode === "create" ? `Tambah Kategori ${kindLabel}` : `Edit Kategori ${kindLabel}`}
      okText={mode === "create" ? "Simpan" : "Simpan Perubahan"}
      cancelText="Batal"
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="Nama Kategori"
          name="nama_kategori"
          rules={[{ required: true, message: "Nama kategori wajib diisi" }]}
        >
          <Input placeholder="Contoh: Cuti Tahunan" />
        </Form.Item>

        {kind === "cuti" && (
          <Form.Item
            label="Pengurangan Kuota"
            name="pengurangan_kouta"
            tooltip="Tentukan apakah kategori ini mengurangi kuota cuti"
            rules={[{ required: true, message: "Pilih status pengurangan kuota" }]}
          >
            <Select
              options={[
                { value: true, label: "Berkurang" },        // [ADDED]
                { value: false, label: "Tidak berkurang" }, // [ADDED]
              ]}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

export default function ManajemenKategoriContent() {
  const vm = useManajemenKategoriviewModel();

  const makePagination = (kind) => {
    const pag =
      kind === "cuti" ? vm.pagCuti : kind === "sakit" ? vm.pagSakit : vm.pagIzinJam;
    const current = pag?.page ?? 1;
    const pageSize = pag?.pageSize ?? DEFAULT_PAGE_SIZE;
    const total = pag?.total ?? 0;

    return {
      current,
      pageSize,
      total,
      showSizeChanger: true,
      pageSizeOptions: ["5", "10", "20", "50", "100"],
      showTotal: (t, [a, b]) => `${a}-${b} dari ${t}`,
      onChange: (page, size) => vm.onPageChange(kind, page, size),
    };
  };

  // [ADDED] kolom Tag status pengurangan kuota untuk tab Cuti
  const colReduce = {
    title: "Pengurangan Kuota",
    key: "reduce",
    width: 180,
    render: (_, record) => {
      const isReduce = !!record.reduce;
      return (
        <Tag color={isReduce ? "green" : "gold"} className="!rounded-md px-2 py-1">
          {isReduce ? "Berkurang" : "Tidak berkurang"}
        </Tag>
      );
    },
  };

  const columns = (kind) => {
    const base = [
      {
        title: "No",
        key: "no",
        width: 60,
        render: (_, __, index) => index + 1,
      },
      {
        title: "Nama Kategori",
        dataIndex: "nama",
        key: "nama",
        render: (text) => <span className="font-medium text-slate-800">{text}</span>,
      },
    ];

    if (kind === "cuti") base.push(colReduce); // [ADDED]

    base.push({
      title: "Aksi",
      key: "aksi",
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              aria-label="Edit"
              type="default"
              shape="circle"
              className="!w-7 !h-7 !p-0 !rounded-full !border !border-[#B9DAFF] !bg-[#F3FAFF] hover:!bg-[#E6F2FF]"
              icon={<EditOutlined style={{ color: "#003A6F", fontSize: 13 }} />}
              onClick={() => vm.openEdit(kind, record)}
            />
          </Tooltip>
          <Tooltip title="Hapus">
            <Button
              aria-label="Hapus"
              type="default"
              shape="circle"
              className="!w-7 !h-7 !p-0 !rounded-full !border !border-[#FFC2C8] !bg-[#FFF5F6] hover:!bg-[#FFE8EA]"
              icon={<DeleteOutlined style={{ color: "#ff4d4f", fontSize: 13 }} />}
              onClick={() => vm.confirmDelete(kind, record)}
            />
          </Tooltip>
        </Space>
      ),
    });

    return base;
  };

  const tabItems = [
    {
      key: "cuti",
      label: "Kategori Cuti",
      count: vm.pagCuti?.total ?? 0,
      children: (
        <Card className="shadow-lg border-0 mt-4" bodyStyle={{ padding: 0 }}>
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-0.5">
                  Kategori Cuti
                </h2>
                <p className="text-slate-500 text-xs md:text-sm">
                  Kelola berbagai jenis cuti yang tersedia
                </p>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="middle"
                className="!rounded-lg !bg-[#003A6F] hover:!bg-[#0056A1]"
                onClick={() => vm.openCreate("cuti")}
              >
                Tambah Kategori
              </Button>
            </div>
          </div>

          <Table
            sticky
            rowKey={(r) => r.id}
            dataSource={vm.itemsCuti}
            columns={columns("cuti")}
            loading={vm.loading}
            pagination={makePagination("cuti")}
            scroll={{ y: DEFAULT_SCROLL_Y }}
            locale={{
              emptyText: (
                <div className="py-10 text-center">
                  <div className="text-3xl mb-3">📝</div>
                  <p className="text-slate-500">Belum ada kategori</p>
                </div>
              ),
            }}
            className="[&_.ant-table-thead>tr>th]:!bg-slate-50 [&_.ant-table-thead>tr>th]:!text-slate-600 [&_.ant-table-thead>tr>th]:!font-semibold"
          />
        </Card>
      ),
    },
    {
      key: "sakit",
      label: "Izin Sakit",
      count: vm.pagSakit?.total ?? 0,
      children: (
        <Card className="shadow-lg border-0 mt-4" bodyStyle={{ padding: 0 }}>
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-0.5">
                  Izin Sakit
                </h2>
                <p className="text-slate-500 text-xs md:text-sm">Kelola kategori izin sakit</p>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="middle"
                className="!rounded-lg !bg-[#003A6F] hover:!bg-[#0056A1]"
                onClick={() => vm.openCreate("sakit")}
              >
                Tambah Kategori
              </Button>
            </div>
          </div>

          <Table
            sticky
            rowKey={(r) => r.id}
            dataSource={vm.itemsSakit}
            columns={columns("sakit")}
            loading={vm.loading}
            pagination={makePagination("sakit")}
            scroll={{ y: DEFAULT_SCROLL_Y }}
            locale={{
              emptyText: (
                <div className="py-10 text-center">
                  <div className="text-3xl mb-3">🏥</div>
                  <p className="text-slate-500">Belum ada kategori izin sakit</p>
                </div>
              ),
            }}
            className="[&_.ant-table-thead>tr>th]:!bg-slate-50 [&_.ant-table-thead>tr>th]:!text-slate-600 [&_.ant-table-thead>tr>th]:!font-semibold"
          />
        </Card>
      ),
    },
    {
      key: "izinjam",
      label: "Izin Jam",
      count: vm.pagIzinJam?.total ?? 0,
      children: (
        <Card className="shadow-lg border-0 mt-4" bodyStyle={{ padding: 0 }}>
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-0.5">
                  Kategori Izin Jam
                </h2>
                <p className="text-slate-500 text-xs md:text-sm">Kelola kategori izin jam</p>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="middle"
                className="!rounded-lg !bg-[#003A6F] hover:!bg-[#0056A1]"
                onClick={() => vm.openCreate("izinjam")}
              >
                Tambah Kategori
              </Button>
            </div>
          </div>

          <Table
            sticky
            rowKey={(r) => r.id}
            dataSource={vm.itemsIzinJam}
            columns={columns("izinjam")}
            loading={vm.loading}
            pagination={makePagination("izinjam")}
            scroll={{ y: DEFAULT_SCROLL_Y }}
            locale={{
              emptyText: (
                <div className="py-10 text-center">
                  <div className="text-3xl mb-3">🔁</div>
                  <p className="text-slate-500">Belum ada kategori izin jam</p>
                </div>
              ),
            }}
            className="[&_.ant-table-thead>tr>th]:!bg-slate-50 [&_.ant-table-thead>tr>th]:!text-slate-600 [&_.ant-table-thead>tr>th]:!font-semibold"
          />
        </Card>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        components: {
          Tabs: {
            inkBarColor: GOLD,
            itemActiveColor: GOLD,
            itemHoverColor: GOLD,
            itemSelectedColor: GOLD,
          },
          Card: { borderRadiusLG: 12 },
        },
        token: { colorPrimary: GOLD, borderRadius: 8, colorBgContainer: "#ffffff" },
      }}
    >
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-[22px] font-semibold leading-tight text-slate-900 mb-1">
            Manajemen Kategori
          </h1>
          <p className="text-slate-500 text-sm">
            Kelola berbagai jenis kategori cuti, izin sakit, dan izin jam
          </p>
        </div>

        <Tabs
          activeKey={vm.activeTab}
          onChange={vm.setActiveTab}
          type="card"
          className="custom-tabs"
          items={tabItems.map((item) => ({
            key: item.key,
            label: (
              <div className="flex items-center gap-2 px-2 py-1 text-[13px]">
                <span>{item.label}</span>
                <span className="bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 text-[11px] min-w-6 text-center">
                  {item.count}
                </span>
              </div>
            ),
            children: item.children,
          }))}
        />
      </div>

      <FormKategoriModal
        open={vm.modalOpen}
        mode={vm.modalMode}
        kind={vm.modalKind}
        initialName={vm.editingItem?.nama}
        initialReduce={vm.editingItem?.reduce ?? true} // [ADDED]
        onCancel={() => vm.setModalOpen(false)}
        onSubmit={vm.submitForm}
      />

      <style jsx>{`
        .custom-tabs :global(.ant-tabs-tab) {
          border: none !important;
          background: white !important;
          border-radius: 8px !important;
          margin-right: 8px !important;
          padding: 6px 14px !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        .custom-tabs :global(.ant-tabs-tab-active) {
          background: ${LIGHT_BLUE} !important;
          border: 1px solid ${GOLD} !important;
        }
        .custom-tabs :global(.ant-tabs-nav) {
          margin-bottom: 0 !important;
        }
        .custom-tabs :global(.ant-tabs-content) {
          margin-top: 12px;
        }
      `}</style>
    </ConfigProvider>
  );
}
