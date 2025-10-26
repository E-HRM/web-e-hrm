"use client";

import React, { useState } from "react";
import { Tabs, Button, Table, ConfigProvider } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const GOLD = "#003A6F";

export default function ManajemenKategori() {
  const [activeTab, setActiveTab] = useState("cuti");

  const columns = [
    {
      title: "Nama Kategori",
      dataIndex: "nama",
      key: "nama",
    },
    {
      title: "Aksi",
      key: "aksi",
      render: () => (
        <div className="flex gap-2">
          <Button
            type="default"
            className="!rounded-full !bg-[#E8F6FF] !border-none !text-[#003A6F] hover:!bg-[#99D7FF]/40 hover:!text-[#184c81]"
          >
            Edit
          </Button>
          <Button
            type="default"
            danger
            className="!rounded-full !bg-[#FFECEC] !border-none !text-[#B00020] hover:!bg-[#FFD4D4]"
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  const data = [];

  const items = [
    {
      key: "cuti",
      label: "Cuti",
      children: (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Kategori Cuti
            </h2>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="!rounded-full !bg-[#003A6F] hover:!bg-[#0056A1]"
            >
              Tambah Kategori
            </Button>
          </div>
          <Table
            dataSource={data}
            columns={columns}
            pagination={false}
            locale={{ emptyText: "Belum ada kategori" }}
          />
        </div>
      ),
    },
    {
      key: "izinjam",
      label: "Izin Jam",
      children: (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Kategori Izin Jam
            </h2>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="!rounded-full !bg-[#003A6F] hover:!bg-[#0056A1]"
            >
              Tambah Kategori
            </Button>
          </div>
          <Table
            dataSource={data}
            columns={columns}
            pagination={false}
            locale={{ emptyText: "Belum ada kategori" }}
          />
        </div>
      ),
    },
    {
      key: "tukarhari",
      label: "Izin Tukar Hari",
      children: (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Kategori Izin Tukar Hari
            </h2>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="!rounded-full !bg-[#003A6F] hover:!bg-[#0056A1]"
            >
              Tambah Kategori
            </Button>
          </div>
          <Table
            dataSource={data}
            columns={columns}
            pagination={false}
            locale={{ emptyText: "Belum ada kategori" }}
          />
        </div>
      ),
    },
    {
      key: "izinsakit",
      label: "Izin Sakit",
      children: (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Kategori Izin Sakit
            </h2>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="!rounded-full !bg-[#003A6F] hover:!bg-[#0056A1]"
            >
              Tambah Kategori
            </Button>
          </div>
          <Table
            dataSource={data}
            columns={columns}
            pagination={false}
            locale={{ emptyText: "Belum ada kategori" }}
          />
        </div>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        components: {
          Tabs: {
            inkBarColor: "transparent", // hilangkan garis aktif
          },
        },
        token: {
          colorPrimary: GOLD,
          borderRadius: 12,
        },
      }}
    >
      <div className="p-6">
        {/* HEADER */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900 flex-1">
            Manajemen Kategori
          </h1>
        </div>

        {/* TABS */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          tabBarStyle={{ borderBottom: "none" }} // hilangkan garis bawah
          className="
            [&_.ant-tabs-nav]:!mb-2
            [&_.ant-tabs-tab]:!rounded-full
            [&_.ant-tabs-tab]:!px-5
            [&_.ant-tabs-tab]:!py-1.5
            [&_.ant-tabs-tab]:!transition-all
            [&_.ant-tabs-tab]:!text-sm
            [&_.ant-tabs-tab-active]:!bg-[#003A6F]/25
            [&_.ant-tabs-tab-active>div>span]:!text-[#003A6F]
            [&_.ant-tabs-tab:hover]:!bg-[#003A6F]/15
            [&_.ant-tabs-tab:hover>div>span]:!text-[#003A6F]
            [&_.ant-tabs-tab-btn]:!text-slate-700
          "
        >
          {items.map((item) => (
            <Tabs.TabPane key={item.key} tab={item.label}>
              {item.children}
            </Tabs.TabPane>
          ))}
        </Tabs>
      </div>
    </ConfigProvider>
  );
}
