"use client";

import React from "react";
import {
  ConfigProvider,
  Button,
  Select,
  Input,
  Table,
  Space,
  Tooltip,
  Grid,
  Card,
  Dropdown,
  Modal,
  message,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileTextOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import Link from "next/link";
import useKaryawanViewModel from "./useKaryawanViewModel";

dayjs.locale("id");
const BRAND = "#003A6F";
const { Title } = Typography;

/** Ambil URL foto dari row dengan berbagai kemungkinan nama field */
function getPhotoUrl(row) {
  return (
    row?.foto_profil_user ||
    row?.avatarUrl ||
    row?.foto ||
    row?.foto_url ||
    row?.photoUrl ||
    row?.photo ||
    row?.avatar ||
    row?.gambar ||
    null
  );
}

/** Gambar bulat anti-gepeng (selalu crop center) */
function CircleImg({ src, size = 44, alt = "Foto" }) {
  const s = {
    width: size,
    height: size,
    borderRadius: "9999px",
    overflow: "hidden",
    border: `1px solid ${BRAND}22`,
    background: "#E6F0FA",
    flexShrink: 0,
    display: "inline-block",
  };
  return (
    <span style={s} className="shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || "/avatar-placeholder.jpg"}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onError={(e) => {
          e.currentTarget.src = "/avatar-placeholder.jpg";
          e.currentTarget.onerror = null;
        }}
      />
    </span>
  );
}

export default function KaryawanContent() {
  const vm = useKaryawanViewModel();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.sm; // xs

  // konfirmasi + panggil VM.deleteById
  const confirmDelete = (row) => {
    Modal.confirm({
      title: `Hapus karyawan?`,
      icon: <ExclamationCircleFilled />,
      content: (
        <div>
          Data <b>{row.name}</b> akan dihapus (soft delete). Tindakan ini tidak bisa
          dibatalkan.
        </div>
      ),
      okText: "Hapus",
      okButtonProps: { danger: true, loading: vm.deletingId === row.id },
      cancelText: "Batal",
      async onOk() {
        const res = await vm.deleteById(row.id);
        if (res.ok) message.success("Karyawan dihapus.");
        else message.error(res.error);
      },
    });
  };

  const actionMenu = (row) => ({
    items: [
      {
        key: "edit",
        label: <Link href={`/home/kelola_karyawan/karyawan/${row.id}/edit`}>Ubah</Link>,
        icon: <EditOutlined />,
      },
      { type: "divider" },
      {
        key: "delete",
        danger: true,
        icon: <DeleteOutlined />,
        label: "Hapus",
        onClick: () => confirmDelete(row),
      },
    ],
  });

  const columns = [
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
      render: (_, row) => {
        const photo = getPhotoUrl(row) || "/avatar-placeholder.jpg";
        return (
          <Link
            href={`/home/kelola_karyawan/karyawan/${row.id}`}
            className="no-underline"
          >
            <div className="flex items-center gap-3">
              <CircleImg src={photo} alt={row?.name || "Foto karyawan"} />
              <div className="min-w-0">
                <div style={{ fontWeight: 600, color: "#0f172a" }} className="truncate">
                  {row.name}
                </div>
                <div style={{ fontSize: 12, color: "#475569" }} className="truncate">
                  {row.jabatan || "—"}{row.jabatan && " "}
                  {row.departemen ? `| ${row.departemen}` : row.jabatan ? "" : "—"}
                </div>
              </div>
            </div>
          </Link>
        );
      },
    },
    {
      title: "Identitas",
      key: "identitas",
      width: 300,
      render: (_, row) => (
        <div style={{ fontSize: 13, color: "#334155" }}>
          <div className="truncate">{row.email}</div>
        </div>
      ),
      responsive: ["md"],
    },
    {
      title: "Sisa Cuti",
      key: "sisa",
      width: 200,
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
      width: 110,
      align: "center",
      render: () => (
        <Tooltip title="Dokumen karyawan">
          <Button size="small" type="text" icon={<FileTextOutlined />} style={{ color: BRAND }} />
        </Tooltip>
      ),
      responsive: ["sm"],
    },
    {
      title: "Aksi",
      key: "aksi",
      width: 150,
      fixed: "right",
      render: (_, row) =>
        isMobile ? (
          <Dropdown trigger={["click"]} menu={actionMenu(row)} placement="bottomRight">
            <Button
              size="small"
              icon={<EllipsisOutlined />}
              loading={vm.deletingId === row.id}
            />
          </Dropdown>
        ) : (
          <Space>
            <Tooltip title="Ubah (halaman edit)">
              <Link href={`/home/kelola_karyawan/karyawan/${row.id}/edit`}>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  style={{ borderColor: BRAND, color: BRAND }}
                />
              </Link>
            </Tooltip>
            <Dropdown trigger={["click"]} menu={actionMenu(row)} placement="bottomRight">
              <Button
                size="small"
                icon={<EllipsisOutlined />}
                loading={vm.deletingId === row.id}
              />
            </Dropdown>
          </Space>
        ),
    },
  ];

  // ★ Normalisasi options → string agar pasti cocok dengan querystring
  const deptOptionsStr = (vm.deptOptions || []).map((o) => ({
    label: o.label,
    value: String(o.value),
  }));
  const jabatanOptionsStr = (vm.jabatanOptions || []).map((o) => ({
    label: o.label,
    value: String(o.value),
  }));

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: BRAND, borderRadius: 12 },
        components: {
          Button: { borderRadius: 10, defaultHoverBorderColor: BRAND },
          Select: { optionSelectedBg: `${BRAND}10`, optionSelectedColor: BRAND },
          Table: { headerBg: "#F4F7FB", headerColor: "#0f172a" },
          Input: { borderRadiusLG: 10, controlHeightSM: 28 },
        },
      }}
    >
      <div className="p-6">
        <Title level={2} style={{ marginTop: 0 }}>
          Karyawan
        </Title>

        <Card
          bordered
          style={{ borderRadius: 16 }}
          bodyStyle={{ paddingTop: 16 }}
          title={
            <Space wrap>
              {/* Pencarian — dipendekkan */}
              <Input.Search
                placeholder="Cari karyawan…"
                allowClear
                enterButton={<SearchOutlined />}
                value={vm.q}
                onChange={(e) => {
                  const v = e.target.value;
                  // ★ tidak perlu reload; SWR akan refetch saat key berubah
                  vm.setQ(v);
                }}
                onSearch={(v) => {
                  vm.setQ(v ?? "");
                }}
                style={{ width: 280 }}
              />

              {/* Filter Divisi */}
              <Select
                allowClear
                showSearch
                placeholder="Filter Divisi"
                optionFilterProp="label"
                value={vm.deptId != null ? String(vm.deptId) : undefined}  // ★ pastikan string
                onChange={(v) => {
                  vm.setDeptId(v ?? null); // tanpa reload
                }}
                options={deptOptionsStr} // [{value,label}] sudah string
                style={{ minWidth: 200 }}
              />

              {/* Filter Jabatan */}
              <Select
                allowClear
                showSearch
                placeholder="Filter Jabatan"
                optionFilterProp="label"
                value={vm.jabatanId != null ? String(vm.jabatanId) : undefined} // ★ pastikan string
                onChange={(v) => {
                  vm.setJabatanId(v ?? null); // tanpa reload
                }}
                options={jabatanOptionsStr} // [{value,label}] sudah string
                style={{ minWidth: 200 }}
              />
            </Space>
          }
          extra={
            <Link href="/home/kelola_karyawan/karyawan/add">
              <Button type="primary" icon={<PlusOutlined />}>
                Tambah Karyawan
              </Button>
            </Link>
          }
        >
          {/* Mobile: list kartu; Desktop/Tablet: tabel */}
          {isMobile ? (
            <div className="grid grid-cols-1 gap-3">
              {vm.rows.map((row) => (
                <Card
                  key={row.id}
                  size="small"
                  style={{ borderRadius: 14 }}
                  bodyStyle={{ padding: 12 }}
                  hoverable
                >
                  <Link
                    href={`/home/kelola_karyawan/karyawan/${row.id}`}
                    className="no-underline"
                  >
                    <div className="flex items-center gap-3">
                      <CircleImg src={getPhotoUrl(row) || "/avatar-placeholder.jpg"} size={48} alt={row?.name} />
                      <div className="min-w-0">
                        <div style={{ fontWeight: 700, color: "#0f172a" }} className="truncate">
                          {row.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#475569" }} className="truncate">
                          {(row.jabatan || "—")}{row.jabatan && " "}
                          {row.departemen ? `| ${row.departemen}` : row.jabatan ? "" : "—"}
                        </div>
                        <div style={{ fontSize: 12, color: "#334155" }} className="truncate">
                          {row.email}
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center justify-between mt-2">
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {row.cutiResetAt
                        ? `↻ ${dayjs(row.cutiResetAt).format("DD MMM YYYY")}`
                        : "—"}
                    </div>
                    <Dropdown trigger={["click"]} menu={actionMenu(row)} placement="bottomRight">
                      <Button
                        size="small"
                        icon={<EllipsisOutlined />}
                        loading={vm.deletingId === row.id}
                      />
                    </Dropdown>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
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
                size: "small",
              }}
              bordered
              size="middle"
              scroll={{ x: 900 }}
            />
          )}
        </Card>
      </div>
    </ConfigProvider>
  );
}
