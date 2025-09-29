"use client";

import React from "react";
import {
  ConfigProvider,
  Button,
  Select,
  Input,
  Table,
  Avatar,
  Space,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  EllipsisOutlined,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import useKaryawanViewModel from "./useKaryawanViewModel";

dayjs.locale("id");
const BRAND = "#003A6F";

export default function KaryawanContent() {
  const vm = useKaryawanViewModel();

  const columns = [
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={44}
            icon={<UserOutlined />}
            style={{
              backgroundColor: "#E6F0FA",
              color: BRAND,
              border: `1px solid ${BRAND}22`,
            }}
          />
          <div>
            <div style={{ fontWeight: 600, color: "#0f172a" }}>{row.name}</div>
            <div style={{ fontSize: 12, color: "#475569" }}>
              {row.jabatan || "—"}{row.jabatan && " "}
              {row.departement ? `| ${row.departement}` : row.jabatan ? "" : "—"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Identitas",
      key: "identitas",
      width: 320,
      render: (_, row) => (
        <div style={{ fontSize: 13, color: "#334155" }}>
          <div>{row.email}</div>
        </div>
      ),
      responsive: ["md"],
    },
    {
      title: "Sisa Cuti",
      key: "sisa",
      width: 220,
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.sisaCuti}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {row.cutiResetAt ? `↻ ${dayjs(row.cutiResetAt).format("DD MMM YYYY")}` : "—"}
          </div>
        </div>
      ),
      align: "left",
      responsive: ["sm"],
    },
    {
      title: "Dokumen",
      key: "doc",
      width: 120,
      align: "center",
      render: () => (
        <Tooltip title="Dokumen karyawan">
          <Button
            type="text"
            icon={<FileTextOutlined />}
            style={{ color: BRAND }}
          />
        </Tooltip>
      ),
    },
    {
      title: "Aksi",
      key: "aksi",
      width: 140,
      fixed: "right",
      render: () => (
        <Space>
          <Tooltip title="Ubah">
            <Button
              size="small"
              icon={<EditOutlined />}
              style={{ borderColor: BRAND, color: BRAND }}
            />
          </Tooltip>
          <Tooltip title="Lainnya">
            <Button size="small" icon={<EllipsisOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: BRAND, borderRadius: 12 },
        components: {
          Button: { borderRadius: 10, defaultHoverBorderColor: BRAND },
          Select: { optionSelectedBg: `${BRAND}10`, optionSelectedColor: BRAND },
          Table: { headerBg: "#F4F7FB", headerColor: "#0f172a" },
        },
      }}
    >
      <div className="p-6">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select
            placeholder="--Divisi--"
            value={vm.deptId || undefined}
            onChange={(v) => vm.setDeptId(v || null)}
            options={[{ value: null, label: "--Divisi--" }, ...vm.deptOptions]}
            allowClear
            className="min-w-[220px]"
          />
          <Select
            placeholder="--Jabatan--"
            value={vm.jabatanId || undefined}
            onChange={(v) => vm.setJabatanId(v || null)}
            options={[{ value: null, label: "--Jabatan--" }, ...vm.jabatanOptions]}
            allowClear
            className="min-w-[220px]"
          />
          <Input.Search
            allowClear
            placeholder="Cari"
            className="w-[280px]"
            value={vm.q}
            onChange={(e) => vm.setQ(e.target.value)}
            onSearch={(v) => vm.setQ(v)}
          />

          <div className="ml-auto">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {/* arahkan ke halaman tambah jika sudah ada route */}}
            >
              Tambah Karyawan
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table
          rowKey="id"
          loading={vm.loading}
          columns={columns}
          dataSource={vm.rows}
          pagination={{
            current: vm.page,
            pageSize: vm.pageSize,
            total: vm.total,
            showSizeChanger: true,
            onChange: vm.changePage,
          }}
          bordered
          size="middle"
        />
      </div>
    </ConfigProvider>
  );
}
