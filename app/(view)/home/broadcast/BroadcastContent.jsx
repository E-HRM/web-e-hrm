"use client";

import React from "react";
import {
  ConfigProvider,
  Card,
  Button,
  Select,
  Input,
  Table,
  Space,
  Tooltip,
  Dropdown,
  Tabs,
  Tag,
  Modal,
  message,
  Grid,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import Link from "next/link";
import useBroadcastViewModel from "./useBroadcastViewModel";

const BRAND = "#003A6F";

export default function BroadcastContent() {
  const vm = useBroadcastViewModel();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.sm;

  const confirmDelete = (row) => {
    Modal.confirm({
      title: `Hapus broadcast?`,
      icon: <ExclamationCircleFilled />,
      content: (
        <div>
          Broadcast <b>{row.title}</b> akan dihapus. Tindakan ini tidak bisa
          dibatalkan.
        </div>
      ),
      okText: "Hapus",
      okButtonProps: { danger: true, loading: vm.deletingId === row.id },
      cancelText: "Batal",
      async onOk() {
        const res = await vm.deleteById(row.id);
        if (res.ok) message.success("Broadcast dihapus.");
        else message.error(res.error || "Gagal menghapus.");
      },
    });
  };

  const menuFor = (row) => ({
    items: [
      {
        key: "detail",
        icon: <EyeOutlined />,
        label: <Link href={`/home/broadcast/${row.id}`}>Detail</Link>,
      },
      row.status === "DRAFT"
        ? {
            key: "edit",
            icon: <EditOutlined />,
            label: <Link href={`/home/broadcast/${row.id}/edit`}>Ubah</Link>,
          }
        : null,
      { type: "divider" },
      {
        key: "delete",
        icon: <DeleteOutlined />,
        danger: true,
        label: "Hapus",
        onClick: () => confirmDelete(row),
      },
    ].filter(Boolean),
  });

  const columns = [
    {
      title: "Judul",
      dataIndex: "title",
      key: "title",
      render: (text, row) => (
        <Link href={`/home/broadcast/${row.id}`} className="no-underline">
          <span className="font-medium">{text || "—"}</span>
        </Link>
      ),
    },
    {
      title: "Pembuat",
      dataIndex: "creator",
      key: "creator",
      width: 220,
      render: (v) => v || "—",
    },
    {
      title: "Penerima",
      dataIndex: "targetLabel",
      key: "targetLabel",
      width: 260,
      render: (v) => v || "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (_, row) => {
        const { color, text } = vm.statusToTag(row.status);
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Aksi",
      key: "actions",
      fixed: isMobile ? undefined : "right",
      width: 80,
      render: (_, row) => (
        <Dropdown trigger={["click"]} menu={menuFor(row)} placement="bottomRight">
          <Button
            type="text"
            icon={<MoreOutlined />}
            loading={vm.deletingId === row.id}
          />
        </Dropdown>
      ),
    },
  ];

  const tabItems = [
    { key: "ALL", label: "Semua" },
    { key: "DRAFT", label: "Konsep" },
    { key: "SENDING", label: "Mengirim" },
    { key: "CANCELED", label: "Batal" },
    { key: "OUT_OF_QUOTA", label: "Kuota Habis" },
    { key: "DELAYED", label: "Ditunda" },
    { key: "DONE", label: "Selesai" },
  ];

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: BRAND, borderRadius: 12 },
        components: {
          Button: { borderRadius: 10, colorPrimary: BRAND },
          Select: { optionSelectedBg: `${BRAND}10`, optionSelectedColor: BRAND },
          Table: { headerBg: "#F6F7FB", headerColor: "#0f172a" },
          Tabs: { itemSelectedColor: BRAND, inkBarColor: BRAND },
          Input: { borderRadiusLG: 10 },
        },
      }}
    >
      <div className="p-6">
        <Card
          bordered={false}
          style={{ borderRadius: 16 }}
          bodyStyle={{ padding: 24 }}
          className="shadow-sm"
        >
          {/* Toolbar: 1 baris, wrap hanya di mobile */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={vm.receiver || undefined}
              onChange={(v) => vm.setReceiver(v || null)}
              options={[
                { value: null, label: "-- Penerima --" },
                { value: "ALL", label: "Semua karyawan" },
                { value: "DIVISI", label: "Per divisi" },
                { value: "JABATAN", label: "Per jabatan" },
                { value: "INDIVIDU", label: "Individu" },
              ]}
              className="min-w-[180px]"
              allowClear
            />

            <Input
              placeholder="Cari"
              value={vm.q}
              onChange={(e) => vm.setQ(e.target.value)}
              onPressEnter={() => vm.searchNow()}
              className="w-[220px] sm:w-[280px]"
              allowClear
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => vm.searchNow()}
            />

            <div className="ml-auto">
              <Link href="/home/broadcast/new">
                <Button type="primary" icon={<PlusOutlined />}>
                  Broadcast Baru
                </Button>
              </Link>
            </div>
          </div>

          {/* Tabs status */}
          <div className="mt-4">
            <Tabs
              items={tabItems}
              activeKey={vm.status}
              onChange={vm.setStatus}
              tabBarGutter={8}
            />
          </div>

          {/* Subheader */}
          <div className="px-4 py-3 text-slate-600 text-sm bg-slate-50 rounded-md mb-3">
            Daftar broadcast yang dikirimkan perusahaan kepada karyawan
          </div>

          {/* Tabel */}
          <Table
            rowKey="id"
            columns={columns}
            dataSource={vm.rows}
            loading={vm.loading}
            pagination={{
              current: vm.page,
              pageSize: vm.pageSize,
              total: vm.total,
              showSizeChanger: true,
              onChange: vm.changePage,
              size: "small",
              showTotal: (t, [s, e]) =>
                `Menampilkan ${s}–${e} dari ${t} total data`,
            }}
            size="middle"
            bordered
            scroll={{ x: 800 }}
            locale={{ emptyText: "Tidak ada data" }}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
}
