"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  Table,
  Input,
  Button,
  Modal,
  Form,
  Popconfirm,
  Tooltip,
  message,
  Select,
  Tag,
  DatePicker,
  Alert,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import useSWR from "swr";
import { fetcher } from "../../../../utils/fetcher";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";
import useProyekViewModel from "./ProyekViewModel";

dayjs.extend(utc);

const BRAND = { accent: "#003A6F" };

export default function ProyekContent() {
  const vm = useProyekViewModel();

  // modal tambah & edit
  const [openAdd, setOpenAdd] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addForm] = Form.useForm();

  const [openEdit, setOpenEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm] = Form.useForm();
  const [editingRow, setEditingRow] = useState(null);

  // modal activity list
  const [openList, setOpenList] = useState(false);
  const [listProject, setListProject] = useState(null); // {id_agenda, nama_agenda}

  // modal anggota lainnya
  const [openMembers, setOpenMembers] = useState(false);
  const [membersProjectName, setMembersProjectName] = useState("");
  const [membersList, setMembersList] = useState([]);

  const onAddSubmit = async () => {
    try {
      const v = await addForm.validateFields();
      setSavingAdd(true);
      await vm.create(v.nama_agenda.trim());
      setOpenAdd(false);
      addForm.resetFields();
      message.success("Proyek berhasil ditambahkan");
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Gagal menambah proyek");
    } finally {
      setSavingAdd(false);
    }
  };

  const onEditOpen = (row) => {
    setEditingRow(row);
    editForm.setFieldsValue({ nama_agenda: row.nama_agenda });
    setOpenEdit(true);
  };

  const onEditSubmit = async () => {
    try {
      const v = await editForm.validateFields();
      setSavingEdit(true);
      await vm.update(editingRow.id_agenda, v.nama_agenda.trim());
      setOpenEdit(false);
      setEditingRow(null);
      editForm.resetFields();
      message.success("Proyek berhasil diubah");
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Gagal mengubah proyek");
    } finally {
      setSavingEdit(false);
    }
  };

  const openActivities = (row) => {
    setListProject({ id_agenda: row.id_agenda, nama_agenda: row.nama_agenda });
    setOpenList(true);
  };

  const openMembersModal = (row, allNames, showFrom = 3) => {
    setMembersProjectName(row.nama_agenda);
    setMembersList(allNames.slice(showFrom)); // sisanya
    setOpenMembers(true);
  };

  const columns = useMemo(
    () => [
      {
        title: "Nama",
        dataIndex: "nama_agenda",
        key: "nama",
        render: (v, row) => (
          <a className="underline" onClick={() => openActivities(row)}>
            {v}
          </a>
        ),
      },
      {
        title: "Anggota",
        key: "anggota",
        render: (_, row) => {
          const names = vm.membersNames(row.id_agenda); // hanya user aktif
          if (!names.length) return "—";

          const top = names.slice(0, 3);
          const more = names.length - top.length;

          return (
            <div className="whitespace-pre-wrap">
              {top.map((n, i) => `${i + 1}. ${n}`).join("\n")}
              {more > 0 ? (
                <>
                  {"\n"}
                  <a onClick={() => openMembersModal(row, names)}>{`+${more} lainnya`}</a>
                </>
              ) : null}
            </div>
          );
        },
      },
      {
        title: "Jml. Pekerjaan",
        dataIndex: ["_count", "items"],
        key: "jumlah",
        align: "center",
        render: (n = 0, row) => <a onClick={() => openActivities(row)}>{n}</a>,
      },
      {
        title: "Aksi",
        key: "aksi",
        align: "right",
        render: (_, row) => (
          <div className="flex gap-2 justify-end">
            <Tooltip title="Ubah">
              <Button size="small" icon={<EditOutlined />} onClick={() => onEditOpen(row)} />
            </Tooltip>
            <Popconfirm
              title="Hapus proyek?"
              description="Soft delete."
              onConfirm={() => vm.remove(row.id_agenda)}
              okText="Hapus"
              cancelText="Batal"
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </div>
        ),
      },
    ],
    [vm]
  );

  return (
    <div className="p-4">
      <Card styles={{ body: { paddingTop: 16 } }} title={<span className="text-lg font-semibold">Proyek</span>}>
        <div className="flex items-center gap-2 md:flex-nowrap flex-wrap mb-4">
          <Input.Search
            placeholder="Cari proyek"
            className="w-[150px]"
            value={vm.q}
            onChange={(e) => vm.setQ(e.target.value)}
            onSearch={(v) => vm.setQ(v)}
            allowClear
          />
          <Select
            className="w-[220px]"
            placeholder="Filter Karyawan"
            allowClear
            value={vm.filterUserId || undefined}
            onChange={(v) => vm.setFilterUserId(v || "")}
            options={vm.userOptions}
            showSearch
            optionFilterProp="label"
          />
          <Button
            icon={<PlusOutlined />}
            onClick={() => setOpenAdd(true)}
            style={{ background: BRAND.accent, color: "#fff", borderColor: BRAND.accent }}
          >
            Tambah Proyek
          </Button>
        </div>

        <Table
          rowKey="id_agenda"
          columns={columns}
          dataSource={vm.filteredRows}
          loading={vm.loading}
          pagination={false}
          size="middle"
        />
      </Card>

      {/* Modal Tambah */}
      <Modal
        title="Tambah Proyek"
        open={openAdd}
        onCancel={() => setOpenAdd(false)}
        okText="Simpan"
        okButtonProps={{ style: { background: BRAND.accent, color: "#fff" } }}
        confirmLoading={savingAdd}
        onOk={onAddSubmit}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical">
          <Form.Item name="nama_agenda" label="Nama" rules={[{ required: true, message: "Wajib diisi" }]}>
            <Input placeholder="Mis. The Day OSS EXPO" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Edit */}
      <Modal
        title="Ubah Proyek"
        open={openEdit}
        onCancel={() => setOpenEdit(false)}
        okText="Simpan"
        okButtonProps={{ style: { background: BRAND.accent, color: "#fff" } }}
        confirmLoading={savingEdit}
        onOk={onEditSubmit}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="nama_agenda" label="Nama" rules={[{ required: true, message: "Wajib diisi" }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Aktivitas Proyek */}
      <ActivitiesModal open={openList} onClose={() => setOpenList(false)} project={listProject} />

      {/* Modal Anggota Lainnya */}
      <Modal
        title={`Anggota Proyek: ${membersProjectName || "-"}`}
        open={openMembers}
        onCancel={() => setOpenMembers(false)}
        footer={<Button onClick={() => setOpenMembers(false)} style={{ background: "#F4F4F5" }}>Tutup</Button>}
        destroyOnClose
      >
        {membersList.length ? (
          <div className="space-y-1">
            {membersList.map((n, i) => (
              <div key={i}>{`${i + 4}. ${n}`}</div>
            ))}
          </div>
        ) : (
          <div className="opacity-60">Tidak ada data.</div>
        )}
      </Modal>
    </div>
  );
}

/* ======================= Modal List Aktivitas ======================= */

// Map label → warna Tag (normalisasi supaya konsisten)
function normalizeUrgency(v) {
  const s = (v || "").toString().trim().toUpperCase();
  switch (s) {
    case "PENTING MENDESAK":
      return { label: "PENTING MENDESAK", color: "red" };
    case "TIDAK PENTING TAPI MENDESAK":
    case "TIDAK PENTING, TAPI MENDESAK":
      return { label: "TIDAK PENTING TAPI MENDESAK", color: "magenta" };
    case "PENTING TAK MENDESAK":
    case "PENTING TIDAK MENDESAK":
      return { label: "PENTING TAK MENDESAK", color: "orange" };
    case "TIDAK PENTING TIDAK MENDESAK":
      return { label: "TIDAK PENTING TIDAK MENDESAK", color: "default" };
    default:
      return s ? { label: s, color: "default" } : null;
  }
}

function ActivitiesModal({ open, onClose, project }) {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [status, setStatus] = useState("");
  const [division, setDivision] = useState("");
  const [urgency, setUrgency] = useState(""); // filter urgensi
  const [q, setQ] = useState("");

  const showDB = (v) => (v ? dayjs.utc(v).format("DD MMM YYYY HH:mm") : "-");

  const fmtLocal = (d, edge /* 'start'|'end' */) =>
    d ? dayjs(d)[edge === "end" ? "endOf" : "startOf"]("day").format("YYYY-MM-DD HH:mm:ss") : null;

  const qs = useMemo(() => {
    if (!project?.id_agenda) return null;
    const p = new URLSearchParams();
    p.set("id_agenda", project.id_agenda);
    const f = fmtLocal(from, "start");
    const t = fmtLocal(to, "end");
    if (f) p.set("from", f);
    if (t) p.set("to", t);
    if (status) p.set("status", status);
    p.set("perPage", "500");
    return `${ApiEndpoints.GetAgendaKerja}?${p.toString()}`;
  }, [project?.id_agenda, from, to, status]);

  const { data, isLoading } = useSWR(open && qs ? qs : null, fetcher, { revalidateOnFocus: false });
  const rows = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data]);

  // opsi filter division dan urgensi dibangun dari data yang ada
  const divisionOptions = useMemo(() => {
    const s = new Set();
    rows.forEach((r) => r.user?.role && s.add(r.user.role));
    return Array.from(s).map((v) => ({ value: v, label: v }));
  }, [rows]);

  const urgencyOptions = useMemo(() => {
    const s = new Map();
    rows.forEach((r) => {
      const u = normalizeUrgency(r?.kebutuhan_agenda);
      if (u) s.set(u.label, u.color);
    });
    return Array.from(s.entries()).map(([label, color]) => ({
      value: label,
      label,
      color,
    }));
  }, [rows]);

  const filteredRows = useMemo(() => {
    let xs = rows;
    if (division) xs = xs.filter((r) => (r.user?.role || "") === division);
    if (urgency) {
      xs = xs.filter((r) => {
        const u = normalizeUrgency(r?.kebutuhan_agenda);
        return u?.label === urgency;
      });
    }
    const qq = q.trim().toLowerCase();
    if (qq) {
      xs = xs.filter(
        (r) =>
          (r.deskripsi_kerja || "").toLowerCase().includes(qq) ||
          (r.user?.nama_pengguna || r.user?.email || "").toLowerCase().includes(qq) ||
          (r.kebutuhan_agenda || "").toLowerCase().includes(qq)
      );
    }
    return xs;
  }, [rows, division, urgency, q]);

  // === Column widths + wrapping rules ===
  const columns = useMemo(
    () => [
      {
        title: "Pekerjaan",
        dataIndex: "deskripsi_kerja",
        key: "pek",
        width: 280,
        onCell: () => ({
          style: {
            maxWidth: 280,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          },
        }),
        // HAPUS underline:
        render: (v) => <span className="block leading-5">{v || "-"}</span>,
      },
      {
        title: "Diproses Oleh",
        key: "oleh",
        width: 150,
        onCell: () => ({
          style: {
            maxWidth: 220,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          },
        }),
        render: (_, r) => r.user?.nama_pengguna || r.user?.email || "—",
      },
      {
        title: "Diproses Pada",
        key: "pada",
        width: 150,
        onCell: () => ({
          style: { whiteSpace: "pre", maxWidth: 220, overflowWrap: "anywhere" },
        }),
        render: (_, r) => (
          <div className="whitespace-pre leading-5">
            {`${showDB(r.start_date)}\n${showDB(r.end_date)}`}
          </div>
        ),
      },
      {
        title: "Durasi",
        dataIndex: "duration_seconds",
        key: "dur",
        width: 80,
        render: (s) => formatDuration(s),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 80,
        render: (st) => {
          const c = st === "selesai" ? "success" : st === "ditunda" ? "warning" : "processing";
          const t = st === "selesai" ? "Selesai" : st === "ditunda" ? "Ditunda" : "Diproses";
          return <Tag color={c}>{t}</Tag>;
        },
      },
      {
        title: "Urgensi",
        dataIndex: "kebutuhan_agenda",
        key: "urgensi",
        width: 200,
        onCell: () => ({
          style: {
            maxWidth: 200,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          },
        }),
        render: (v) => {
          const u = normalizeUrgency(v);
          if (!u) return <Tag style={{ fontStyle: "italic" }}>Belum diisi</Tag>;
          return <Tag color={u.color}>{u.label}</Tag>;
        },
      },
    ],
    []
  );

  return (
    <Modal
      title={<span className="text-xl font-semibold">Daftar Pekerjaan Proyek: {project?.nama_agenda || "-"}</span>}
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose} style={{ background: "#F4F4F5" }}>Tutup</Button>}
      width={1000}
      destroyOnClose
      styles={{
        body: { maxHeight: 640, overflowY: "auto" }, // scroll vertikal, no horizontal overflow
      }}
    >
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <DatePicker placeholder="Tanggal Mulai" value={from ? dayjs(from) : null} onChange={(d) => setFrom(d ? d.toDate() : null)} />
        <span className="opacity-60">-</span>
        <DatePicker placeholder="Tanggal Selesai" value={to ? dayjs(to) : null} onChange={(d) => setTo(d ? d.toDate() : null)} />
        <Select
          className="min-w-[160px]"
          placeholder="--Filter Divisi--"
          allowClear
          options={divisionOptions}
          value={division || undefined}
          onChange={(v) => setDivision(v || "")}
        />
        <Select
          className="min-w-[160px]"
          placeholder="--Filter Status--"
          allowClear
          value={status || undefined}
          onChange={(v) => setStatus(v || "")}
          options={[
            { value: "diproses", label: "Diproses" },
            { value: "ditunda", label: "Ditunda" },
            { value: "selesai", label: "Selesai" },
          ]}
        />
        {/* Filter Urgensi */}
        <Select
          className="min-w-[200px]"
          placeholder="--Filter Urgensi--"
          allowClear
          value={urgency || undefined}
          onChange={(v) => setUrgency(v || "")}
          options={urgencyOptions}
          optionFilterProp="label"
          showSearch
        />
        <Input.Search className="w-[140px]" placeholder="Cari" value={q} onChange={(e) => setQ(e.target.value)} allowClear />
      </div>

      {isLoading ? (
        <Alert type="info" message="Memuat data..." />
      ) : (
        <Table
          rowKey="id_agenda_kerja"
          columns={columns}
          dataSource={filteredRows}
          pagination={{ pageSize: 10 }}
          size="middle"
          className="activities-table"
          tableLayout="fixed"   // biar wrap, bukan melebar
        />
      )}

      {/* CSS khusus untuk tabel aktivitas di modal ini */}
      <style jsx global>{`
        .activities-table .ant-table-cell {
          white-space: normal;           
          word-break: break-word;
        }
        .activities-table .ant-table {
          overflow-x: hidden !important; 
        }
      `}</style>

      <div className="mt-2 text-sm font-semibold">
        Menampilkan {filteredRows.length} dari {rows.length} total data
      </div>
    </Modal>
  );
}

function formatDuration(sec = 0) {
  if (!sec || sec < 1) return "0 detik";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const parts = [];
  if (h) parts.push(`${h} jam`);
  if (m) parts.push(`${m} menit`);
  if (s) parts.push(`${s} detik`);
  return parts.join(" ");
}
