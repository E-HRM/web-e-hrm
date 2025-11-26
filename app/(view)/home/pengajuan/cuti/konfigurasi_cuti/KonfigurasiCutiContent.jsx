"use client";

import React, { useMemo } from "react";
import {
  ConfigProvider,
  Card,
  Table,
  Input,
  Button,
  Space,
  Tooltip,
  InputNumber,
  Alert,
  message,
} from "antd";
import { SearchOutlined, SaveOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useKonfigurasiCutiViewModel, {
  GOLD,
  LIGHT_BLUE,
  HEADER_BLUE_BG,
} from "./useKonfigurasiCutiViewModel";

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

/** Gambar bulat anti-gepeng */
function CircleImg({ src, size = 44, alt = "Foto" }) {
  const s = {
    width: size,
    height: size,
    borderRadius: "9999px",
    overflow: "hidden",
    border: `1px solid ${GOLD}22`,
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

export default function KonfigurasiCutiContent() {
  const vm = useKonfigurasiCutiViewModel();
  const router = useRouter();

  // kolom bulan (JAN–DES)
  const monthColumns = useMemo(
    () =>
      vm.months.map((m) => ({
        title: m.label,
        key: m.key,
        dataIndex: ["quotas", m.key],
        width: 110,
        align: "center",
        render: (_v, row) => {
          const dirty = vm.isDirty(row.id, m.key);
          return (
            <Tooltip title={dirty ? "Perubahan belum disimpan" : ""}>
              <InputNumber
                size="small"
                min={0}
                value={Number(row.quotas?.[m.key] ?? 0)}
                onChange={(val) => vm.setQuota(row.id, m.key, val)}
                controls
                style={{
                  width: 88,
                  background: dirty ? "#FFF7E6" : undefined,   // ant orange-1
                  borderColor: dirty ? "#FAAD14" : undefined,  // ant orange-6
                }}
              />
            </Tooltip>
          );
        },
      })),
    [vm.months, vm.setQuota, vm.isDirty]
  );

  const columns = useMemo(() => {
    return [
      {
        title: "Karyawan",
        key: "karyawan",
        fixed: "left",
        width: 320,
        render: (_, r) => {
          const total = vm.getTotal(r);
          const photo = getPhotoUrl(r) || "/avatar-placeholder.jpg";
          return (
            <div className="flex items-start gap-3 min-w-0">
              <CircleImg src={photo} alt={r?.name || "Foto karyawan"} />
              <div className="min-w-0">
                <div style={{ fontWeight: 600, color: "#0f172a" }} className="truncate">
                  {r.name}
                </div>
                <div style={{ fontSize: 12, color: "#475569" }} className="truncate">
                  {r.jabatan || "—"}
                  {r.jabatan && " "}
                  {r.departemen ? `| ${r.departemen}` : r.jabatan ? "" : "—"}
                </div>

                <div style={{ marginTop: 6 }}>
                  <span
                    className="inline-block px-2 py-1 rounded-md"
                    style={{
                      background: LIGHT_BLUE,
                      color: GOLD,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Total kuota (tahun berjalan): {total} hari
                  </span>
                </div>
              </div>
            </div>
          );
        },
      },
      ...monthColumns,
    ];
  }, [monthColumns, vm]);

  const handleSave = async () => {
    const res = await vm.saveAll();
    if (res.ok) {
      message.success(res.message || "Perubahan tersimpan.");
      router.push("/home/pengajuan/cuti");
    } else {
      message.error(res.message || "Gagal menyimpan.");
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: GOLD, borderRadius: 10 },
        components: {
          Table: { headerBg: "#F4F7FB", headerColor: "#0f172a" },
          Button: { borderRadius: 10 },
          Input: { borderRadiusLG: 10 },
        },
      }}
    >
      <div className="p-6">
        <Card className="shadow-lg border-0" bodyStyle={{ padding: 0 }}>
          {/* HEADER / Filter bar */}
          <div
            className="p-5 border-b border-slate-100 bg-[var(--header-bg)]"
            style={{ ["--header-bg"]: HEADER_BLUE_BG }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-0.5">
                  Konfigurasi Kuota Cuti
                </h2>
                <p className="text-slate-500 text-xs md:text-sm">
                  Perubahan hanya akan disimpan setelah menekan <b>Simpan Semua</b>.
                </p>
              </div>

              <Space wrap>
                <Input.Search
                  placeholder="Cari nama/email/jabatan/dept…"
                  allowClear
                  enterButton={<SearchOutlined />}
                  value={vm.q}
                  onChange={(e) => vm.setQ(e.target.value)}
                  onSearch={(v) => vm.setQ(v ?? "")}
                  style={{ width: 300 }}
                />

                <Tooltip title={vm.hasDirty ? "" : "Tidak ada perubahan"}>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={vm.saving}
                    disabled={!vm.hasDirty}
                    className="!bg-[var(--gold)] !text-white hover:!bg-[#0B63C7]"
                    style={{ ["--gold"]: GOLD }}
                  >
                    {vm.hasDirty ? `Simpan Semua (${vm.dirtyCount})` : "Simpan Semua"}
                  </Button>
                </Tooltip>
              </Space>
            </div>

            {vm.hasDirty && (
              <div className="mt-3">
                <Alert
                  type="warning"
                  showIcon
                  message="Ada perubahan yang belum disimpan."
                  description="Sistem baru akan memperbarui kuota cuti setelah Anda menekan tombol Simpan Semua."
                />
              </div>
            )}
          </div>

          {/* TABLE */}
          <div className="p-4">
            <Table
              rowKey="id"
              loading={vm.loading}
              dataSource={vm.rows}
              columns={columns}
              size="small"
              tableLayout="fixed"
              sticky
              pagination={false}
              scroll={{ x: 1600, y: 600 }}
              rowClassName="align-top"
            />
          </div>
        </Card>

        <style jsx>{`
          :global(.ant-table-thead > tr > th) {
            background: #f8fafc !important;
            color: #0f172a !important;
          }
          :global(.ant-input-number) {
            border-radius: 8px !important;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
}
