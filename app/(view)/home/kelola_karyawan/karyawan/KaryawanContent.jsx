"use client";

import React, { useMemo, useState } from "react";
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
  Tag,
  Switch,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileTextOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  SearchOutlined,
  WarningTwoTone,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import Link from "next/link";
import useKaryawanViewModel from "./useKaryawanViewModel";

dayjs.locale("id");
const BRAND = "#003A6F";
const { Title } = Typography;

/** Ambil URL foto dari row */
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

/** Cell untuk kolom Catatan Delete (hanya dipakai saat showDeleted = true) */
function CatatanDeleteCell({ deletedAt, note }) {
  if (!deletedAt) return null;
  if (!note) return <Tag color="default">—</Tag>;
  return (
    <Tooltip title={note}>
      <div className="truncate" style={{ maxWidth: 320 }}>
        {note}
      </div>
    </Tooltip>
  );
}

/** Tag status cuti */
function StatusCutiTag({ v }) {
  if (!v) return <Tag>—</Tag>;
  const isAktif = String(v).toLowerCase() === "aktif";
  return <Tag color={isAktif ? "green" : "red"}>{isAktif ? "Aktif" : "Nonaktif"}</Tag>;
}

export default function KaryawanContent() {
  const vm = useKaryawanViewModel();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.sm;

  // Modal delete + catatan
  const [del, setDel] = useState({ open: false, row: null, note: "" });

  const openDelete = (row) => setDel({ open: true, row, note: "" });
  const handleDelete = async () => {
    const res = await vm.deleteById(del.row.id, del.note);
    if (res.ok) message.success(del.row.deletedAt ? "Karyawan dihapus permanen." : "Karyawan dihapus.");
    else message.error(res.error);
    setDel({ open: false, row: null, note: "" });
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
        label: row.deletedAt ? "Hapus Permanen" : "Hapus (soft delete)",
        onClick: () => openDelete(row),
      },
    ],
  });

  // --- kolom dasar (tanpa Catatan Delete) ---
  const baseColumns = [
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
      render: (_, row) => {
        const photo = getPhotoUrl(row) || "/avatar-placeholder.jpg";
        return (
          <Link href={`/home/kelola_karyawan/karyawan/${row.id}`} className="no-underline">
            <div className="flex items-center gap-3">
              <CircleImg src={photo} alt={row?.name || "Foto karyawan"} />
              <div className="min-w-0">
                <div style={{ fontWeight: 600, color: row.deletedAt ? "#64748b" : "#0f172a" }} className="truncate">
                  {row.name}
                </div>
                <div style={{ fontSize: 12, color: "#475569" }} className="truncate">
                  {row.jabatan || "—"}
                  {row.jabatan && " "}
                  {row.departemen ? `| ${row.departemen}` : row.jabatan ? "" : "—"}
                </div>
              </div>
            </div>
          </Link>
        );
      },
    },
    {
      title: "Status Cuti",
      key: "statusCuti",
      width: 130,
      render: (_, row) => <StatusCutiTag v={row.statusCuti} />,
      responsive: ["sm"],
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 260,
      render: (v, row) => (
        <div style={{ fontSize: 13, color: row.deletedAt ? "#94a3b8" : "#334155" }} className="truncate">
          {v}
        </div>
      ),
      responsive: ["lg"],
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
  ];

  // --- kolom Catatan Delete (digunakan hanya saat showDeleted = true) ---
  const catatanDeleteColumn = {
    title: "Catatan Delete",
    key: "deleteNote",
    width: 240,
    render: (_, row) => <CatatanDeleteCell deletedAt={row.deletedAt} note={row.deleteNote} />,
    responsive: ["md"],
  };

  // --- susun kolom final secara kondisional ---
  const columns = useMemo(() => {
    const aksiColumn = {
      title: "Aksi",
      key: "aksi",
      width: 170,
      fixed: "right",
      render: (_, row) =>
        isMobile ? (
          <Dropdown trigger={["click"]} menu={actionMenu(row)} placement="bottomRight">
            <Button size="small" icon={<EllipsisOutlined />} loading={vm.deletingId === row.id} />
          </Dropdown>
        ) : (
          <Space>
            <Tooltip title="Ubah (halaman edit)">
              <Link href={`/home/kelola_karyawan/karyawan/${row.id}/edit`}>
                <Button size="small" icon={<EditOutlined />} style={{ borderColor: BRAND, color: BRAND }} />
              </Link>
            </Tooltip>
            <Dropdown trigger={["click"]} menu={actionMenu(row)} placement="bottomRight">
              <Button size="small" icon={<EllipsisOutlined />} loading={vm.deletingId === row.id} />
            </Dropdown>
          </Space>
        ),
    };

    // Saat Hanya yang dihapus = ON → sisipkan kolom Catatan Delete
    return vm.showDeleted
      ? [...baseColumns.slice(0, 2), catatanDeleteColumn, ...baseColumns.slice(2), aksiColumn]
      : [...baseColumns, aksiColumn];
  }, [vm.showDeleted, isMobile, vm.deletingId]); // actionMenu stabil cukup

  // ===== Header filter container (rapi, ada jarak atas) =====
  const Filters = (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
        paddingTop: 4,
      }}
    >
      <Input.Search
        placeholder="Cari nama/email…"
        allowClear
        enterButton={<SearchOutlined />}
        value={vm.q}
        onChange={(e) => vm.setQ(e.target.value)}
        onSearch={(v) => vm.setQ(v ?? "")}
        style={{ width: 280 }}
      />
      <Select
        allowClear
        showSearch
        placeholder="Filter Divisi"
        optionFilterProp="label"
        value={vm.deptId != null ? String(vm.deptId) : undefined}
        onChange={(v) => vm.setDeptId(v ?? null)}
        options={(vm.deptOptions || []).map((o) => ({ label: o.label, value: String(o.value) }))}
        style={{ minWidth: 200 }}
      />
      <Select
        allowClear
        showSearch
        placeholder="Filter Jabatan"
        optionFilterProp="label"
        value={vm.jabatanId != null ? String(vm.jabatanId) : undefined}
        onChange={(v) => vm.setJabatanId(v ?? null)}
        options={(vm.jabatanOptions || []).map((o) => ({ label: o.label, value: String(o.value) }))}
        style={{ minWidth: 200 }}
      />
      <span className="inline-flex items-center gap-2 ml-2" style={{ marginTop: 2 }}>
        <Switch checked={vm.showDeleted} onChange={vm.setShowDeleted} />
        <span style={{ color: "#334155", fontSize: 13 }}>Karyawan yang dihapus</span>
      </span>
    </div>
  );

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
          headStyle={{ paddingTop: 20, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}
          bodyStyle={{ paddingTop: 16 }}
          title={Filters}
          extra={
            <Link href="/home/kelola_karyawan/karyawan/add">
              <Button type="primary" icon={<PlusOutlined />}>
                Tambah Karyawan
              </Button>
            </Link>
          }
        >
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
                  <Link href={`/home/kelola_karyawan/karyawan/${row.id}`} className="no-underline">
                    <div className="flex items-center gap-3">
                      <CircleImg
                        src={getPhotoUrl(row) || "/avatar-placeholder.jpg"}
                        size={48}
                        alt={row?.name}
                      />
                      <div className="min-w-0">
                        <div
                          style={{ fontWeight: 700, color: row.deletedAt ? "#64748b" : "#0f172a" }}
                          className="truncate"
                        >
                          {row.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#475569" }} className="truncate">
                          {(row.jabatan || "—")}
                          {row.jabatan && " "}
                          {row.departemen ? `| ${row.departemen}` : row.jabatan ? "" : "—"}
                        </div>
                        <div style={{ fontSize: 12, color: "#334155" }} className="truncate">
                          {row.email}
                        </div>
                        <div className="mt-1 flex items-center gap-6">
                          <div>
                            <Tag color={String(row.statusCuti).toLowerCase() === "aktif" ? "green" : "red"}>
                              {row.statusCuti || "—"}
                            </Tag>
                          </div>
                          {row.deletedAt && (
                            <Tag color="default" icon={<WarningTwoTone twoToneColor="#faad14" />}>
                              Dihapus
                            </Tag>
                          )}
                        </div>

                        {/* Catatan delete hanya muncul di mobile saat list soft delete */}
                        {vm.showDeleted && row.deletedAt && (
                          <div
                            style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}
                            className="line-clamp-2"
                          >
                            {row.deleteNote || "—"}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {row.deletedAt ? `Terhapus ${dayjs(row.deletedAt).format("DD MMM YYYY")}` : "\u00A0"}
                    </div>
                    <Dropdown trigger={["click"]} menu={actionMenu(row)} placement="bottomRight">
                      <Button size="small" icon={<EllipsisOutlined />} loading={vm.deletingId === row.id} />
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
              rowClassName={(row) => (row.deletedAt ? "opacity-70" : "")}
            />
          )}
        </Card>
      </div>

      {/* Modal catatan delete */}
      <Modal
        open={del.open}
        title={<span>{del.row?.deletedAt ? "Hapus permanen?" : "Hapus karyawan?"}</span>}
        okText={del.row?.deletedAt ? "Hapus Permanen" : "Hapus"}
        okButtonProps={{ danger: true, loading: vm.deletingId === del.row?.id }}
        cancelText="Batal"
        onOk={handleDelete}
        onCancel={() => setDel({ open: false, row: null, note: "" })}
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <ExclamationCircleFilled style={{ color: "#faad14", marginTop: 3 }} />
            <span>
              {del.row?.deletedAt ? (
                <>
                  Data <b>{del.row?.name}</b> akan <b>DIHAPUS PERMANEN</b> dan tidak bisa dipulihkan.
                </>
              ) : (
                <>
                  Data <b>{del.row?.name}</b> akan dihapus (soft delete).
                  <br />
                  Tindakan ini dapat dipulihkan oleh admin (restore manual).
                </>
              )}
            </span>
          </div>
          {/* Catatan hanya diisi saat soft delete */}
          {!del.row?.deletedAt && (
            <Input.TextArea
              placeholder="Catatan penghapusan (opsional)"
              rows={3}
              value={del.note}
              onChange={(e) => setDel((s) => ({ ...s, note: e.target.value }))}
              maxLength={2000}
            />
          )}
        </div>
      </Modal>
    </ConfigProvider>
  );
}
