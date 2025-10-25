// KunjunganRekapanContent.jsx
// (SUDAH menampilkan label "Teragenda" untuk value 'diproses'; hanya kirim utuh)
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  Table,
  Tag,
  Select,
  DatePicker,
  Input,
  ConfigProvider,
  theme,
  Button,
  Space,
  Tooltip,
  Modal,
  Image,
} from "antd";
import { EnvironmentOutlined, PictureOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import useVM, { showFromDB } from "./useKunjunganRekapanViewModel";

const NAVY = "#003A6F";

function getPhotoUrl(user) {
  return (
    user?.foto_profil_user ||
    user?.avatarUrl ||
    user?.foto ||
    user?.foto_url ||
    user?.photoUrl ||
    user?.photo ||
    user?.avatar ||
    user?.gambar ||
    "/avatar-placeholder.jpg"
  );
}

function CircleImg({ src, size = 36, alt = "Foto" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || "/avatar-placeholder.jpg"}
      alt={alt}
      style={{
        width: size, height: size, borderRadius: 999, objectFit: "cover",
        border: "1px solid #003A6F22", background: "#E6F0FA", display: "inline-block",
      }}
      onError={(e) => {
        e.currentTarget.src = "/avatar-placeholder.jpg";
        e.currentTarget.onerror = null;
      }}
    />
  );
}

export default function KunjunganRekapanContent() {
  const vm = useVM();
  const [img, setImg] = useState(null);

  const columns = useMemo(
    () => [
      { title: "Kategori", key: "kategori", width: 180, render: (_, r) => r.kategori?.kategori_kunjungan || "—" },
      { title: "Deskripsi", dataIndex: "deskripsi", width: 300, key: "desk", render: (v) => v || "—" },
      { title: "Tanggal", dataIndex: "tanggal", key: "tgl", width: 150, render: (v) => (v ? showFromDB(v, "DD MMM YYYY") : "-") },
      {
        title: "Start",
        key: "start",
        render: (_, r) => {
          const t = r.jam_mulai ? showFromDB(r.jam_mulai, "HH:mm") : "-";
          const { lat, lon } = vm.getStartCoord(r);
          const photo = vm.pickPhotoUrl(r);
          return (
            <Space size="small">
              <span>{t}</span>
              {lat != null && lon != null ? (
                <Tooltip title="Lihat lokasi (OpenStreetMap)">
                  <Button size="small" type="text" icon={<EnvironmentOutlined />} onClick={() => window.open(vm.osmUrl(lat, lon), "_blank")} />
                </Tooltip>
              ) : null}
              {photo ? (
                <Tooltip title="Lihat foto">
                  <Button size="small" type="text" icon={<PictureOutlined />} onClick={() => setImg(photo)} />
                </Tooltip>
              ) : null}
            </Space>
          );
        },
      },
      {
        title: "End",
        key: "end",
        render: (_, r) => {
          const t = r.jam_selesai ? showFromDB(r.jam_selesai, "HH:mm") : "-";
          const { lat, lon } = vm.getEndCoord(r);
          const photo = vm.pickPhotoUrl(r);
          return (
            <Space size="small">
              <span>{t}</span>
              {lat != null && lon != null ? (
                <Tooltip title="Lihat lokasi (OpenStreetMap)">
                  <Button size="small" type="text" icon={<EnvironmentOutlined />} onClick={() => window.open(vm.osmUrl(lat, lon), "_blank")} />
                </Tooltip>
              ) : null}
              {photo ? (
                <Tooltip title="Lihat foto">
                  <Button size="small" type="text" icon={<PictureOutlined />} onClick={() => setImg(photo)} />
                </Tooltip>
              ) : null}
            </Space>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status_kunjungan",
        key: "status",
        width: 140,
        render: (st) => {
          const m =
            st === "selesai"
              ? { color: "success", text: "Selesai" }
              : st === "berlangsung"
              ? { color: "warning", text: "Berlangsung" }
              : { color: "processing", text: "Teragenda" }; // diproses → Teragenda
          return <Tag color={m.color}>{m.text}</Tag>;
        },
      },
      {
        title: "User",
        dataIndex: "user",
        key: "user",
        width: 360,
        render: (u) => {
          if (!u) return "—";
          const id = u.id_user ?? u.id ?? u.uuid;
          const href = id ? `/home/kelola_karyawan/karyawan/${id}` : undefined;
          const displayName = u.nama_pengguna ?? u.name ?? u.email ?? "—";

          const jabatan =
            u.jabatan?.nama_jabatan ??
            u.jabatan?.nama ??
            u.jabatan?.title ??
            (typeof u.jabatan === "string" ? u.jabatan : "") ?? "";

          const departemen =
            u.departemen?.nama_departemen ??
            u.departemen?.nama ??
            u.departemen?.title ??
            u.departement?.nama_departement ??
            u.departement?.nama ??
            u.departement?.title ??
            u.department?.name ??
            u.department?.nama ??
            u.department?.title ??
            u.divisi?.nama_divisi ??
            u.divisi?.nama ??
            u.divisi?.title ??
            (typeof u.departemen === "string" ? u.departemen : "") ??
            (typeof u.departement === "string" ? u.departement : "") ??
            (typeof u.department === "string" ? u.department : "") ??
            (typeof u.divisi === "string" ? u.divisi : "") ?? "";

          const subtitle = jabatan && departemen ? `${jabatan} | ${departemen}` : (jabatan || departemen || "—");

          const node = (
            <div className="flex items-center gap-3 min-w-0">
              <CircleImg src={getPhotoUrl(u)} alt={displayName} />
              <div className="min-w-0">
                <div style={{ fontWeight: 600, color: "#0f172a" }} className="truncate">{displayName}</div>
                <div style={{ fontSize: 12, color: "#475569" }} className="truncate">{subtitle}</div>
              </div>
            </div>
          );
          return href ? <Link href={href} className="no-underline">{node}</Link> : node;
        },
      },
    ],
    [vm]
  );

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: NAVY, borderRadius: 12 } }}>
      <div className="p-4">
        <Card title={<span className="text-lg font-semibold">Rekapan Kunjungan</span>} styles={{ body: { paddingTop: 16 } }}>
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Select
              className="min-w-[220px]"
              placeholder="Filter Karyawan"
              allowClear
              value={vm.filters.userId || undefined}
              options={vm.userOptions}
              onChange={(v) => vm.setFilters((s) => ({ ...s, userId: v || "" }))}
              showSearch
              optionFilterProp="label"
            />

            <Select
              className="min-w-[220px]"
              placeholder="Kategori Kunjungan"
              allowClear
              value={vm.filters.kategoriId || undefined}
              options={vm.kategoriOptions}
              onChange={(v) => vm.setFilters((s) => ({ ...s, kategoriId: v || "" }))}
              showSearch
              optionFilterProp="label"
            />

            <Select
              className="min-w-[160px]"
              placeholder="Status"
              allowClear
              value={vm.filters.status || undefined}
              onChange={(v) => vm.setFilters((s) => ({ ...s, status: v || "" }))}
              options={[
                { value: "diproses", label: "Teragenda" },   // value tetap diproses
                { value: "berlangsung", label: "Berlangsung" },
                { value: "selesai", label: "Selesai" },
              ]}
            />

            <DatePicker
              placeholder="Dari"
              value={vm.filters.from ? dayjs(vm.filters.from) : null}
              onChange={(d) => vm.setFilters((s) => ({ ...s, from: d ? d.toDate() : null })) }
              format="DD/MM/YYYY"
            />
            <span className="opacity-60">-</span>
            <DatePicker
              placeholder="Sampai"
              value={vm.filters.to ? dayjs(vm.filters.to) : null}
              onChange={(d) => vm.setFilters((s) => ({ ...s, to: d ? d.toDate() : null })) }
              format="DD/MM/YYYY"
            />

            <Input.Search
              className="w-[260px]"
              placeholder="Cari deskripsi/hand over"
              value={vm.filters.q}
              onChange={(e) => vm.setFilters((s) => ({ ...s, q: e.target.value }))}
              allowClear
            />
          </div>

          <Table
            rowKey="id_kunjungan"
            columns={columns}
            dataSource={vm.rows}
            loading={vm.loading}
            pagination={{ pageSize: 15 }}
            size="middle"
          />

          <Modal open={!!img} footer={null} onCancel={() => setImg(null)} width={720}>
            <Image src={img || ""} alt="Lampiran" style={{ width: "100%" }} />
          </Modal>
        </Card>
      </div>
    </ConfigProvider>
  );
}
