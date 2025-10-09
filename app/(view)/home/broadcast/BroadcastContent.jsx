"use client";

import React, { useState } from "react";
import {
  ConfigProvider,
  Card,
  Button,
  Input,
  Table,
  Space,
  Dropdown,
  Modal,
  Tag,
  Upload,
  Form,
  Select,
  Avatar,
  Tooltip,
  Tabs,
  Checkbox,
  message,
  Typography,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  SendOutlined,
  PaperClipOutlined,
  ExclamationCircleFilled,
  UploadOutlined,
} from "@ant-design/icons";
import useBroadcastViewModel from "./useBroadcastViewModel";

const { Title, Text } = Typography;
const BRAND = "#003A6F";

/* ---------- Modal: Kirim Sekarang ---------- */
function SendNowModal({ open, onCancel, onSend }) {
  const [agree, setAgree] = useState(false);
  return (
    <Modal
      open={open}
      onCancel={() => {
        setAgree(false);
        onCancel?.();
      }}
      title="Kirim Broadcast"
      okText="Kirim Sekarang"
      okButtonProps={{ type: "primary", style: { background: BRAND }, disabled: !agree }}
      onOk={() => {
        onSend?.();
        setAgree(false);
      }}
      destroyOnClose
    >
      <div className="space-y-3">
        <Text>Broadcast akan dikirim ke semua penerima yang dipilih.</Text>
        <Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)}>
          Saya mengerti dan ingin mengirim sekarang
        </Checkbox>
      </div>
    </Modal>
  );
}

/* ---------- Modal: Daftar Penerima ---------- */
function RecipientsModal({ open, onCancel, recipients = [] }) {
  return (
    <Modal open={open} onCancel={onCancel} footer={null} title="Daftar Penerima">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {recipients.map((r) => (
          <div key={r.id} className="flex items-center gap-2 rounded-xl p-2 ring-1 ring-slate-200">
            <Avatar src={r.avatar} />
            <div className="truncate">{r.name}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ---------- Modal: Form Tambah ---------- */
function BroadcastFormModal({ open, onCancel, onSave, employeeOptions }) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  return (
    <Modal
      open={open}
      onCancel={() => {
        form.resetFields();
        setFileList([]);
        onCancel?.();
      }}
      title="Broadcast Baru"
      okText="Simpan"
      okButtonProps={{ type: "primary", style: { background: BRAND } }}
      onOk={async () => {
        const v = await form.validateFields();
        const files = fileList.map((f) => ({ name: f.name || f.file?.name || "dokumen" }));
        onSave?.({
          title: v.title,
          content: v.content,
          recipientIds: v.recipients,
          files,
        });
        form.resetFields();
        setFileList([]);
      }}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Judul"
          name="title"
          rules={[{ required: true, message: "Judul wajib diisi" }]}
        >
          <Input placeholder="Mis. Pengumuman Rapat Bulanan" />
        </Form.Item>

        <Form.Item
          label="Konten Pengumuman"
          name="content"
          rules={[{ required: true, message: "Konten wajib diisi" }]}
        >
          <Input.TextArea rows={4} placeholder="Tuliskan isi pengumuman..." />
        </Form.Item>

        <Form.Item label="Dokumen">
          <Upload
            multiple
            beforeUpload={() => false}
            listType="text"
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
          >
            <Button icon={<UploadOutlined />}>Tambah Dokumen</Button>
          </Upload>
        </Form.Item>

        <Form.Item
          label="Penerima"
          name="recipients"
          rules={[{ required: true, message: "Penerima wajib dipilih" }]}
        >
          <Select
            mode="multiple"
            placeholder="Pilih karyawan"
            optionFilterProp="label"
            options={employeeOptions}
            maxTagCount="responsive"
            tagRender={(props) => {
              const opt = employeeOptions.find((o) => o.value === props.value);
              return (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] ring-1 ring-slate-200 bg-slate-50 mr-1">
                  <Avatar size={18} src={opt?.avatar} />
                  <span>{props.label}</span>
                </span>
              );
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/* =========================================================
   MAIN CONTENT
========================================================= */
export default function BroadcastContent() {
  const vm = useBroadcastViewModel();

  const [openAdd, setOpenAdd] = useState(false);
  const [sendTarget, setSendTarget] = useState(null);
  const [recipientsModal, setRecipientsModal] = useState({ open: false, list: [] });

  const columns = [
    {
      // header jangan patah per huruf
      title: <span style={{ whiteSpace: "nowrap" }}>Judul</span>,
      dataIndex: "title",
      key: "title",
      width: 320,          // lebar tetap agar tidak menyempit
      ellipsis: true,      // aktifkan ellipsis (perlu width)
      onHeaderCell: () => ({ style: { whiteSpace: "nowrap" } }),
      onCell:    () => ({ style: { maxWidth: 320 } }),
      render: (_, row) => (
        <div style={{ maxWidth: 320 }}>
          <div
            className="font-semibold text-slate-900"
            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {row.title || "—"}
          </div>
          <div
            className="text-slate-500 text-xs"
            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {row.creator?.name} • {row.creator?.when}
          </div>
        </div>
      ),
    },
    {
      title: "Konten Pengumuman",
      dataIndex: "content",
      key: "content",
      width: 480,
      render: (v) => (
        <div
          className="text-slate-700"
          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {v}
        </div>
      ),
      responsive: ["md"],
    },
    {
      title: "Dokumen",
      dataIndex: "files",
      key: "files",
      width: 140,
      render: (files) =>
        files && files.length ? (
          <Space size={4}>
            <PaperClipOutlined />
            <Text>{files.length} file</Text>
          </Space>
        ) : (
          <span>—</span>
        ),
      responsive: ["sm"],
    },
    {
      title: "Penerima",
      key: "recipients",
      width: 260,
      render: (_, row) => {
        const max = 4;
        const show = row.recipients.slice(0, max);
        const rest = row.recipients.length - max;
        return (
          <div className="flex items-center gap-2">
            <Avatar.Group maxCount={4}>
              {show.map((r) => (
                <Tooltip title={r.name} key={r.id}>
                  <Avatar src={r.avatar} />
                </Tooltip>
              ))}
            </Avatar.Group>
            <Button
              type="link"
              className="p-0"
              onClick={() => setRecipientsModal({ open: true, list: row.recipients })}
            >
              {rest > 0 ? `+${rest} Penerima` : "Lihat semua"}
            </Button>
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (st) => {
        const m = vm.statusToTag(st);
        return <Tag color={m.color}>{m.text}</Tag>;
      },
    },
    {
      title: "Aksi",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_, row) => (
        <Space>
          <Tooltip title="Kirim sekarang">
            <Button icon={<SendOutlined />} onClick={() => setSendTarget(row.id)} />
          </Tooltip>

          <Tooltip title="Ubah (dummy)">
            <Button icon={<EditOutlined />} style={{ borderColor: BRAND, color: BRAND }} />
          </Tooltip>

          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            menu={{
              items: [
                { key: "detail", icon: <EyeOutlined />, label: "Detail", onClick: () => {} },
                { type: "divider" },
                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  danger: true,
                  label: "Hapus",
                  onClick: () =>
                    Modal.confirm({
                      title: "Hapus broadcast?",
                      icon: <ExclamationCircleFilled />,
                      okText: "Hapus",
                      okButtonProps: { danger: true },
                      onOk: () => vm.deleteBroadcast(row.id),
                    }),
                },
              ],
            }}
          >
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: "ALL", label: `Semua (${vm.counts.ALL})` },
    { key: "DRAFT", label: `Konsep (${vm.counts.DRAFT})` },
    { key: "SENDING", label: `Mengirim (${vm.counts.SENDING})` },
    { key: "DELAYED", label: `Ditunda (${vm.counts.DELAYED})` },
    { key: "CANCELED", label: `Batal (${vm.counts.CANCELED})` },
    { key: "DONE", label: `Selesai (${vm.counts.DONE})` },
  ];

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: BRAND, borderRadius: 12 },
        components: {
          Button: { borderRadius: 10 },
          Table: { headerBg: "#F6F7FB", headerColor: "#0f172a" },
          Tabs: { itemSelectedColor: BRAND, inkBarColor: BRAND },
          Input: { borderRadiusLG: 10 },
        },
      }}
    >
      <div className="p-6">
        <Title level={2} style={{ marginTop: 0 }}>
          Broadcast
        </Title>

        <Card
          bordered
          style={{ borderRadius: 16 }}
          bodyStyle={{ paddingTop: 16 }}
          title={
            <Space wrap>
              <Input
                placeholder="Cari judul atau konten…"
                value={vm.q}
                onChange={(e) => vm.setQ(e.target.value)}
                allowClear
                suffix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                style={{ width: 280 }}
              />
            </Space>
          }
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenAdd(true)}>
              Broadcast Baru
            </Button>
          }
        >
          <div className="mt-1">
            <Tabs items={tabItems} activeKey={vm.statusTab} onChange={vm.setStatusTab} tabBarGutter={8} />
          </div>

          <div className="px-4 py-3 text-slate-600 text-sm bg-slate-50 rounded-md mb-3">
            Pengumuman perusahaan untuk karyawan. Tanpa sistem kuota; fokus pada isi dan penerima.
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={vm.filteredRows}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            bordered
            size="middle"
            // beri ruang agar kolom "Judul" tidak dipaksa sempit
            scroll={{ x: 1400 }}
          />
        </Card>
      </div>

      {/* Modals */}
      <BroadcastFormModal
        open={openAdd}
        onCancel={() => setOpenAdd(false)}
        employeeOptions={vm.employeeOptions}
        onSave={(payload) => {
          vm.addBroadcast(payload);
          setOpenAdd(false);
          message.success("Broadcast disimpan (konsep).");
        }}
      />

      <SendNowModal
        open={!!sendTarget}
        onCancel={() => setSendTarget(null)}
        onSend={async () => {
          await vm.sendNow(sendTarget);
          setSendTarget(null);
          message.success("Broadcast terkirim.");
        }}
      />

      <RecipientsModal
        open={recipientsModal.open}
        onCancel={() => setRecipientsModal({ open: false, list: [] })}
        recipients={recipientsModal.list}
      />
    </ConfigProvider>
  );
}
