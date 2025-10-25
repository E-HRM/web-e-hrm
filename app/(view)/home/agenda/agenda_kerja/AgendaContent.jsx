// AgendaContent.jsx
"use client";

import { useMemo, useState } from "react";
import {
  Card, Table, Select, DatePicker, Input, Tag, Space,
  Button, Modal, Form, Popconfirm, message, Skeleton, Empty,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import useAgendaViewModel from "./AgendaViewModel";

dayjs.extend(utc);

const BRAND = { accent: "#003A6F" };

export default function AgendaContent() {
  const vm = useAgendaViewModel();

  const [openEdit, setOpenEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm] = Form.useForm();
  const [editingRow, setEditingRow] = useState(null);

  const openEditRow = (row) => {
    setEditingRow(row);
    editForm.setFieldsValue({
      deskripsi_kerja: row.deskripsi_kerja,
      status: row.status,
    });
    setOpenEdit(true);
  };

  const submitEdit = async () => {
    try {
      const v = await editForm.validateFields();
      setSavingEdit(true);
      await vm.update(editingRow.id_agenda_kerja, {
        deskripsi_kerja: v.deskripsi_kerja.trim(),
        status: v.status,
      });
      setOpenEdit(false);
      setEditingRow(null);
      message.success("Aktivitas diperbarui");
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Gagal memperbarui");
    } finally {
      setSavingEdit(false);
    }
  };

  /* =======================
     TABEL ANAK (per karyawan)
  ======================== */
  const activityColumns = [
    {
      title: "Aktivitas",
      dataIndex: "deskripsi_kerja",
      key: "desk",
      width: 420,
      render: (text) => (
        <div
          style={{
            maxWidth: 420,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          <span className="font-medium">{text || "—"}</span>
        </div>
      ),
    },
    {
      title: "Waktu",
      key: "waktu",
      width: 170,
      render: (_, r) => {
        const s = r.start_date ? dayjs.utc(r.start_date).format("DD/MM HH:mm") : "-";
        const e = r.end_date ? dayjs.utc(r.end_date).format("DD/MM HH:mm") : "-";
        return `${s} - ${e}`;
      },
    },
    {
      title: "Durasi",
      dataIndex: "duration_seconds",
      key: "dur",
      width: 140,
      render: (s) => formatDuration(s),
    },
    {
      title: "Proyek",
      dataIndex: ["agenda", "nama_agenda"],
      key: "agenda",
      width: 100,
      render: (v) => v || "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (st = "") => {
        const map = {
          selesai: { color: "success", label: "Selesai" },
          ditunda: { color: "warning", label: "Ditunda" },
          diproses: { color: "processing", label: "Diproses" },
          teragenda: { color: "default", label: "Teragenda" },
        };
        const m = map[st] || { color: "default", label: st ? st[0].toUpperCase() + st.slice(1) : "—" };
        return <Tag color={m.color}>{m.label}</Tag>;
      },
    },
    {
      title: "Aksi",
      key: "aksi",
      align: "right",
      width: 120,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditRow(r)} />
          <Popconfirm title="Hapus aktivitas?" onConfirm={() => vm.remove(r.id_agenda_kerja)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const columns = useMemo(
    () => [
      {
        title: "Karyawan",
        dataIndex: "nama",
        key: "nama",
        render: (_, row) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.nama}</span>
            <span className="opacity-60 text-xs">{row.email}</span>
          </div>
        ),
      },
      {
        title: "Aktivitas",
        dataIndex: "count",
        key: "count",
        align: "center",
        width: 120,
      },
      {
        title: "Total Durasi",
        dataIndex: "duration",
        key: "duration",
        width: 180,
        render: (sec) => formatDuration(sec),
      },
    ],
    []
  );

  return (
    <div className="p-4">
      <Card title={<span className="text-lg font-semibold">Agenda Kerja (Semua Karyawan)</span>}>
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <Select
            className="min-w-[220px]"
            placeholder="Filter Proyek"
            allowClear
            value={vm.filters.id_agenda || undefined}
            onChange={(v) => vm.setFilters((s) => ({ ...s, id_agenda: v || "" }))}
            options={vm.agendaOptions}
            showSearch
            optionFilterProp="label"
          />
        </div>
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <Select
            className="min-w-[220px]"
            placeholder="Filter Karyawan"
            allowClear
            value={vm.filters.user_id || undefined}
            onChange={(v) => vm.setFilters((s) => ({ ...s, user_id: v || "" }))}
            options={vm.userOptions}
            showSearch
            optionFilterProp="label"
            listHeight={400}
            virtual
          />

          <DatePicker
            value={vm.filters.from ? dayjs(vm.filters.from, "YYYY-MM-DD HH:mm:ss") : null}
            onChange={(d) =>
              vm.setFilters((s) => ({
                ...s,
                from: d ? d.startOf("day").format("YYYY-MM-DD HH:mm:ss") : "",
              }))
            }
            format="DD/MM/YYYY"
          />
          <span className="opacity-60">-</span>
          <DatePicker
            value={vm.filters.to ? dayjs(vm.filters.to, "YYYY-MM-DD HH:mm:ss") : null}
            onChange={(d) =>
              vm.setFilters((s) => ({
                ...s,
                to: d ? d.endOf("day").format("YYYY-MM-DD HH:mm:ss") : "",
              }))
            }
            format="DD/MM/YYYY"
          />
          <Select
            className="min-w-[180px]"
            placeholder="Status"
            allowClear
            value={vm.filters.status || undefined}
            onChange={(v) => vm.setFilters((s) => ({ ...s, status: v || "" }))}
            options={[
              { value: "teragenda", label: "Teragenda" },
              { value: "diproses", label: "Diproses" },
              { value: "ditunda", label: "Ditunda" },
              { value: "selesai", label: "Selesai" },
            ]}
          />
          <Input.Search
            className="w-[260px] max-w-full"
            placeholder="Cari aktivitas atau proyek…"
            value={vm.filters.q}
            onChange={(e) => vm.setFilters((s) => ({ ...s, q: e.target.value }))}
            onSearch={() => vm.refresh()}
          />
        </div>

        {vm.loading ? (
          <Skeleton active />
        ) : vm.masterRows.length === 0 ? (
          <Empty description="Tidak ada data" />
        ) : (
          <Table
            rowKey="id_user"
            columns={columns}
            dataSource={vm.masterRows}
            pagination={false}
            expandable={{
              expandedRowRender: (userRow) => (
                <Table
                  rowKey="id_agenda_kerja"
                  columns={activityColumns}
                  dataSource={userRow.rows}
                  pagination={false}
                  size="small"
                  tableLayout="fixed"
                />
              ),
            }}
          />
        )}
      </Card>

      <Modal
        title="Ubah Aktivitas"
        open={openEdit}
        onCancel={() => setOpenEdit(false)}
        okText="Simpan"
        okButtonProps={{ style: { background: BRAND.accent, color: "#fff" } }}
        confirmLoading={savingEdit}
        onOk={submitEdit}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="deskripsi_kerja" label="Deskripsi" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "teragenda", label: "Teragenda" },
                { value: "diproses", label: "Diproses" },
                { value: "ditunda", label: "Ditunda" },
                { value: "selesai", label: "Selesai" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
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
