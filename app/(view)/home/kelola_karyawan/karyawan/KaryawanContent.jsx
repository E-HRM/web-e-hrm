"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/id";
import useKaryawanViewModel from "./useKaryawanViewModel";

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

import AppTypography from "../../../component_shared/AppTypography";
import AppCard from "../../../component_shared/AppCard";
import AppTable from "../../../component_shared/AppTable";
import AppInput from "../../../component_shared/AppInput";
import AppSelect from "../../../component_shared/AppSelect";
import AppButton from "../../../component_shared/AppButton";
import AppTooltip from "../../../component_shared/AppTooltip";
import AppDropdown from "../../../component_shared/AppDropdown";
import AppModal from "../../../component_shared/AppModal";
import AppMessage from "../../../component_shared/AppMessage";
import AppTag from "../../../component_shared/AppTag";
import AppSwitch from "../../../component_shared/AppSwitch";
import AppAvatar from "../../../component_shared/AppAvatar";

dayjs.locale("id");

function useIsMobile(maxWidth = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const apply = () => setIsMobile(!!mq.matches);

    apply();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }

    mq.addListener(apply);
    return () => mq.removeListener(apply);
  }, [maxWidth]);

  return isMobile;
}

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

function CatatanDeleteCell({ deletedAt, note }) {
  if (!deletedAt) return null;
  if (!note) return <AppTag tone="neutral">—</AppTag>;

  return (
    <AppTooltip title={note}>
      <div className="truncate" style={{ maxWidth: 320 }}>
        {note}
      </div>
    </AppTooltip>
  );
}

function StatusCutiTag({ v }) {
  if (!v) return <AppTag tone="neutral">—</AppTag>;
  const isAktif = String(v).toLowerCase() === "aktif";
  return (
    <AppTag tone={isAktif ? "success" : "danger"} variant="soft">
      {isAktif ? "Aktif" : "Nonaktif"}
    </AppTag>
  );
}

export default function KaryawanContent() {
  const vm = useKaryawanViewModel();
  const isMobile = useIsMobile(640);

  const [del, setDel] = useState({ open: false, row: null, note: "" });

  const openDelete = (row) => setDel({ open: true, row, note: "" });

  const handleDelete = async () => {
    if (!del.row) return;

    const res = await vm.deleteById(del.row.id, del.note);
    if (res?.ok) {
      AppMessage.success(
        del.row.deletedAt ? "Karyawan dihapus permanen." : "Karyawan dihapus."
      );
    } else {
      AppMessage.error(res?.error || "Gagal menghapus karyawan.");
    }
    setDel({ open: false, row: null, note: "" });
  };

  const actionItems = (row) => [
    {
      key: "edit",
      label: "Ubah",
      icon: <EditOutlined />,
      href: `/home/kelola_karyawan/karyawan/${row.id}/edit`,
    },
    { type: "divider" },
    {
      key: "delete",
      danger: true,
      icon: <DeleteOutlined />,
      label: row.deletedAt ? "Hapus Permanen" : "Hapus (soft delete)",
      onClick: async () => openDelete(row),
    },
  ];

  const baseColumns = useMemo(
    () => [
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
                <AppAvatar src={photo} name={row?.name || ""} size={44} />

                {/* ✅ FIX: AppTypography.Text biasanya render <span> (inline),
                    jadi nama + jabatan bisa nyamping.
                    Paksa jadi 2 baris dengan wrapper <div> dan display:block */}
                <div className="min-w-0 leading-tight">
                  <div className="truncate">
                    <AppTypography.Text
                      strong
                      style={{
                        display: "block",
                        color: row.deletedAt ? "#64748b" : undefined,
                      }}
                    >
                      {row.name}
                    </AppTypography.Text>
                  </div>

                  <div className="truncate">
                    <AppTypography.Text
                      tone="muted"
                      size={12}
                      style={{ display: "block" }}
                    >
                      {row.jabatan || "—"}
                      {row.departemen
                        ? ` | ${row.departemen}`
                        : row.jabatan
                        ? ""
                        : "—"}
                    </AppTypography.Text>
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
          <div
            className="truncate"
            style={{
              fontSize: 13,
              color: row.deletedAt ? "#94a3b8" : "#334155",
            }}
          >
            {v || "—"}
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
          <AppTooltip title="Dokumen karyawan">
            <span className="inline-flex">
              <AppButton variant="text" size="small" icon={<FileTextOutlined />} />
            </span>
          </AppTooltip>
        ),
        responsive: ["sm"],
      },
    ],
    []
  );

  const catatanDeleteColumn = useMemo(
    () => ({
      title: "Catatan Delete",
      key: "deleteNote",
      width: 240,
      render: (_, row) => (
        <CatatanDeleteCell deletedAt={row.deletedAt} note={row.deleteNote} />
      ),
      responsive: ["md"],
    }),
    []
  );

  const columns = useMemo(() => {
    const aksiColumn = {
      title: "Aksi",
      key: "aksi",
      width: 170,
      fixed: "right",
      render: (_, row) =>
        isMobile ? (
          <AppDropdown items={actionItems(row)} placement="bottomRight" trigger={["click"]}>
            <span>
              <AppButton
                variant="text"
                size="small"
                icon={<EllipsisOutlined />}
                loading={vm.deletingId === row.id}
              />
            </span>
          </AppDropdown>
        ) : (
          <div className="flex items-center gap-2">
            <AppTooltip title="Ubah (halaman edit)">
              <span className="inline-flex">
                <AppButton
                  variant="outline"
                  size="small"
                  icon={<EditOutlined />}
                  href={`/home/kelola_karyawan/karyawan/${row.id}/edit`}
                />
              </span>
            </AppTooltip>

            <AppDropdown items={actionItems(row)} placement="bottomRight" trigger={["click"]}>
              <span>
                <AppButton
                  variant="text"
                  size="small"
                  icon={<EllipsisOutlined />}
                  loading={vm.deletingId === row.id}
                />
              </span>
            </AppDropdown>
          </div>
        ),
    };

    return vm.showDeleted
      ? [...baseColumns.slice(0, 2), catatanDeleteColumn, ...baseColumns.slice(2), aksiColumn]
      : [...baseColumns, aksiColumn];
  }, [vm.showDeleted, isMobile, vm.deletingId, baseColumns, catatanDeleteColumn]);

  const Filters = (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <div className="w-[280px]">
        <AppInput
          placeholder="Cari nama/email…"
          allowClear
          value={vm.q}
          onChange={(e) => vm.setQ(e.target.value)}
          onPressEnter={() => vm.setQ(vm.q ?? "")}
          prefixIcon={<SearchOutlined />}
        />
      </div>

      <div className="min-w-[200px]">
        <AppSelect
          allowClear
          showSearch
          placeholder="Filter Divisi"
          optionFilterProp="label"
          value={vm.deptId != null ? String(vm.deptId) : undefined}
          onChange={(v) => vm.setDeptId(v ?? null)}
          options={(vm.deptOptions || []).map((o) => ({
            label: o.label,
            value: String(o.value),
          }))}
        />
      </div>

      <div className="min-w-[200px]">
        <AppSelect
          allowClear
          showSearch
          placeholder="Filter Jabatan"
          optionFilterProp="label"
          value={vm.jabatanId != null ? String(vm.jabatanId) : undefined}
          onChange={(v) => vm.setJabatanId(v ?? null)}
          options={(vm.jabatanOptions || []).map((o) => ({
            label: o.label,
            value: String(o.value),
          }))}
        />
      </div>

      <div className="inline-flex items-center gap-2 ml-2">
        <AppSwitch checked={vm.showDeleted} onChange={vm.setShowDeleted} />
        <AppTypography.Text className="!mb-0" style={{ color: "#334155", fontSize: 13 }}>
          Karyawan yang dihapus
        </AppTypography.Text>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <AppTypography.Title level={2} className="!mt-0">
        Karyawan
      </AppTypography.Title>

      <AppCard
        className="!rounded-2xl"
        headStyle={{ paddingTop: 20, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}
        bodyStyle={{ paddingTop: 16 }}
        title={Filters}
        extra={
          <AppButton variant="primary" icon={<PlusOutlined />} href="/home/kelola_karyawan/karyawan/add">
            Tambah Karyawan
          </AppButton>
        }
      >
        {isMobile ? (
          <div className="grid grid-cols-1 gap-3">
            {(vm.rows || []).map((row) => (
              <AppCard
                key={row.id}
                className="!rounded-2xl"
                shadow="sm"
                bodyStyle={{ padding: 12 }}
                hoverable
              >
                <Link href={`/home/kelola_karyawan/karyawan/${row.id}`} className="no-underline">
                  <div className="flex items-center gap-3">
                    <AppAvatar
                      src={getPhotoUrl(row) || "/avatar-placeholder.jpg"}
                      name={row?.name || ""}
                      size={48}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-semibold" style={{ color: row.deletedAt ? "#64748b" : "#0f172a" }}>
                        {row.name}
                      </div>

                      {/* Mobile sudah 2 baris (div block), aman */}
                      <div className="truncate text-[12px] text-slate-600">
                        {row.jabatan || "—"}
                        {row.departemen ? ` | ${row.departemen}` : row.jabatan ? "" : "—"}
                      </div>

                      <div className="truncate text-[12px] text-slate-700">{row.email || "—"}</div>

                      <div className="mt-1 flex items-center gap-3 flex-wrap">
                        <StatusCutiTag v={row.statusCuti} />
                        {row.deletedAt ? (
                          <AppTag tone="warning" icon={<WarningTwoTone twoToneColor="#faad14" />}>
                            Dihapus
                          </AppTag>
                        ) : null}
                      </div>

                      {vm.showDeleted && row.deletedAt ? (
                        <div className="mt-1 text-[12px] text-slate-500 line-clamp-2">{row.deleteNote || "—"}</div>
                      ) : null}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center justify-between mt-2">
                  <div className="text-[12px] text-slate-500">
                    {row.deletedAt ? `Terhapus ${dayjs(row.deletedAt).format("DD MMM YYYY")}` : "\u00A0"}
                  </div>

                  <AppDropdown items={actionItems(row)} placement="bottomRight" trigger={["click"]}>
                    <span>
                      <AppButton
                        variant="text"
                        size="small"
                        icon={<EllipsisOutlined />}
                        loading={vm.deletingId === row.id}
                      />
                    </span>
                  </AppDropdown>
                </div>
              </AppCard>
            ))}
          </div>
        ) : (
          <AppTable
            card={false}
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
            scroll={{ x: 900 }}
            bordered
            size="middle"
            rowClassName={(row) => (row.deletedAt ? "opacity-70" : "")}
          />
        )}
      </AppCard>

      <AppModal
        open={del.open}
        onClose={() => setDel({ open: false, row: null, note: "" })}
        title={del.row?.deletedAt ? "Hapus permanen?" : "Hapus karyawan?"}
        subtitle={del.row?.deletedAt ? undefined : "Tambahkan catatan (opsional) untuk soft delete."}
        variant="danger"
        okText={del.row?.deletedAt ? "Hapus Permanen" : "Hapus"}
        cancelText="Batal"
        okLoading={vm.deletingId === del.row?.id}
        onOk={handleDelete}
        destroyOnClose
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <ExclamationCircleFilled style={{ color: "#faad14", marginTop: 3 }} />
            <div>
              {del.row?.deletedAt ? (
                <AppTypography.Text>
                  Data <b>{del.row?.name}</b> akan <b>DIHAPUS PERMANEN</b> dan tidak bisa dipulihkan.
                </AppTypography.Text>
              ) : (
                <AppTypography.Text>
                  Data <b>{del.row?.name}</b> akan dihapus (soft delete). Tindakan ini dapat dipulihkan oleh admin
                  (restore manual).
                </AppTypography.Text>
              )}
            </div>
          </div>

          {!del.row?.deletedAt ? (
            <AppInput.TextArea
              placeholder="Catatan penghapusan (opsional)"
              rows={3}
              value={del.note}
              onChange={(e) => setDel((s) => ({ ...s, note: e.target.value }))}
              maxLength={2000}
              allowClear
            />
          ) : null}
        </div>
      </AppModal>
    </div>
  );
}
