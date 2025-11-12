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
  Select,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import useManajemenKategoriviewModel from "./useManajemenKategoriviewModel";

const PRIMARY_COLOR = "#003A6F";
const HEADER_BLUE_BG = "#F0F6FF";
const DEFAULT_SCROLL_Y = 600;

/* ===== Modal Form (konsisten, simple) ===== */
function FormKategoriModal({
  open,
  mode,
  kind,
  initialName,
  initialReduce = true,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue({
        nama_kategori: initialName || "",
        ...(kind === "cuti" ? { pengurangan_kouta: initialReduce } : {}),
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
            tooltip="Apakah kategori ini mengurangi kuota cuti?"
            rules={[{ required: true, message: "Pilih status pengurangan kuota" }]}
          >
            <Select
              options={[
                { value: true, label: "Berkurang" },
                { value: false, label: "Tidak berkurang" },
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

  // ====== kolom khusus Cuti ======
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
    const pag =
      kind === "cuti" ? vm.pagCuti : kind === "sakit" ? vm.pagSakit : vm.pagIzinJam;
    const current = pag?.page ?? 1;
    const pageSize = pag?.pageSize ?? 10;
    const offset = (current - 1) * pageSize;

    const base = [
      {
        title: "NO",
        key: "no",
        width: 70,
        align: "center",
        render: (_r, __, index) => (
          <div className="text-sm font-medium text-gray-600">
            {offset + index + 1}
          </div>
        ),
      },
      {
        title: "NAMA KATEGORI",
        dataIndex: "nama",
        key: "nama",
        ellipsis: true,
        render: (text) => (
          <span className="font-medium text-gray-900 block truncate" title={text}>
            {text}
          </span>
        ),
      },
    ];

    if (kind === "cuti") base.push(colReduce);

    base.push({
      title: "AKSI",
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
              icon={<EditOutlined style={{ color: PRIMARY_COLOR, fontSize: 13 }} />}
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

  const TabPane = ({ kind, title, items, pag }) => (
    <Card className="shadow-sm border-0" bodyStyle={{ padding: 0 }}>
      {/* Header section ala CutiContent */}
      <div
        className="p-5 border-b border-slate-100 bg-[var(--header-bg)]"
        style={{ ["--header-bg"]: HEADER_BLUE_BG }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
            <p className="text-gray-500 text-sm">
              Menampilkan {items.length} dari {pag?.total ?? 0} kategori
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              allowClear
              placeholder="Cari kategori…"
              prefix={<SearchOutlined className="text-gray-400" />}
              value={vm.search}
              onChange={(e) => vm.setSearch(e.target.value)}
              className="w-72 rounded-xl"
              size="middle"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="middle"
              className="!rounded-lg !bg-[var(--brand)] hover:!bg-[#0B63C7]"
              style={{ ["--brand"]: PRIMARY_COLOR }}
              onClick={() => vm.openCreate(kind)}
            >
              Tambah Kategori
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-4">
        <Table
          sticky
          rowKey={(r) => r.id}
          dataSource={items}
          columns={columns(kind)}
          loading={vm.loading}
          pagination={{
            current: pag?.page ?? 1,
            pageSize: pag?.pageSize ?? 10,
            total: pag?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20, 50, 100],
            showTotal: (t, range) => `${range[0]}-${range[1]} dari ${t} data`,
            onChange: (p, ps) => vm.onPageChange(kind, p, ps),
          }}
          scroll={{ y: DEFAULT_SCROLL_Y }}
          tableLayout="fixed"
          locale={{
            emptyText: (
              <div className="py-10 text-center">
                <div className="text-3xl mb-3">🗂️</div>
                <p className="text-slate-500">Belum ada kategori</p>
              </div>
            ),
          }}
          rowClassName={() => "no-hover-row"}
        />
      </div>
    </Card>
  );

  const tabs = [
    {
      key: "cuti",
      label: (
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="font-medium">Kategori Cuti</span>
          <span className="bg-slate-100 text-slate-600 rounded-full px-2 py-1 text-xs font-medium min-w-6 text-center">
            {vm.pagCuti?.total ?? 0}
          </span>
        </div>
      ),
      content: (
        <TabPane
          kind="cuti"
          title="Kategori Cuti"
          items={vm.itemsCuti}
          pag={vm.pagCuti}
        />
      ),
    },
    {
      key: "sakit",
      label: (
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="font-medium">Izin Sakit</span>
          <span className="bg-slate-100 text-slate-600 rounded-full px-2 py-1 text-xs font-medium min-w-6 text-center">
            {vm.pagSakit?.total ?? 0}
          </span>
        </div>
      ),
      content: (
        <TabPane
          kind="sakit"
          title="Kategori Izin Sakit"
          items={vm.itemsSakit}
          pag={vm.pagSakit}
        />
      ),
    },
    {
      key: "izinjam",
      label: (
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="font-medium">Izin Jam</span>
          <span className="bg-slate-100 text-slate-600 rounded-full px-2 py-1 text-xs font-medium min-w-6 text-center">
            {vm.pagIzinJam?.total ?? 0}
          </span>
        </div>
      ),
      content: (
        <TabPane
          kind="izinjam"
          title="Kategori Izin Jam"
          items={vm.itemsIzinJam}
          pag={vm.pagIzinJam}
        />
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        components: {
          Tabs: {
            inkBarColor: PRIMARY_COLOR,
            itemActiveColor: PRIMARY_COLOR,
            itemHoverColor: PRIMARY_COLOR,
            itemSelectedColor: PRIMARY_COLOR,
          },
          Card: { borderRadiusLG: 12 },
          Table: {
            headerBg: "#f8fafc",
            headerColor: "#374151",
            headerSplitColor: "transparent",
            rowHoverBg: "transparent", // hilangkan hover abu-abu
          },
        },
        token: {
          colorPrimary: PRIMARY_COLOR,
          borderRadius: 8,
          colorBgContainer: "#ffffff",
          colorBorder: "#e5e7eb",
        },
      }}
    >
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header utama (sama pola dengan Cuti) */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Manajemen Kategori
              </h1>
              <p className="text-gray-600 text-sm">
                Kelola kategori cuti, izin sakit, dan izin jam dalam satu tempat
              </p>
            </div>
          </div>
        </div>

        {/* Tabs ala CutiContent (type=line) */}
        <Card className="shadow-sm border-0">
          <Tabs
            activeKey={vm.activeTab}
            onChange={vm.setActiveTab}
            type="line"
            size="large"
            items={tabs.map((t) => ({
              key: t.key,
              label: t.label,
              children: <div className="mt-6">{t.content}</div>,
            }))}
          />
        </Card>

        {/* Matikan efek hover abu-abu (fallback CSS) */}
        <style jsx global>{`
          .no-hover-row:hover > td {
            background: transparent !important;
          }
          .ant-table-tbody > tr.ant-table-row:hover > td {
            background: transparent !important;
          }
        `}</style>
      </div>

      <FormKategoriModal
        open={vm.modalOpen}
        mode={vm.modalMode}
        kind={vm.modalKind}
        initialName={vm.editingItem?.nama}
        initialReduce={vm.editingItem?.reduce ?? true}
        onCancel={() => vm.setModalOpen(false)}
        onSubmit={vm.submitForm}
      />
    </ConfigProvider>
  );
}
