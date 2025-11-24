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
  TFag,
  Upload,
  Form,
  Select,
  Avatar,
  Tooltip,
  Tabs,
  Checkbox,
  message,
  Typography,
  Badge,
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
  ClockCircleOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import useBroadcastViewModel from "./useBroadcastViewModel";
import ReactQuill from "react-quill";

const { Title, Text } = Typography;
const BRAND = "#003A6F";

/* ---------- Modal: Kirim Sekarang ---------- */
function SendNowModal({ open, onCancel, onSend }) {
  const [agree, setAgree] = useState(false);
    const [content, setContent] = useState('');

  const handleContentChange = (value) => {
    setContent(value);
  };
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
    <Modal open={open} onCancel={onCancel} footer={null} title="Daftar Penerima" width={600}>
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
  const [content, setContent] = useState(""); // <-- tambahkan state untuk konten

  return (
    <Modal
      open={open}
      onCancel={() => {
        form.resetFields();
        setFileList([]);
        setContent(""); // <-- reset konten saat batal/tutup
        onCancel?.();
      }}
      title="Broadcast Baru"
      okText="Simpan"
      okButtonProps={{ type: "primary", style: { background: BRAND } }}
      onOk={async () => {
        // pastikan field Form sinkron dengan state content sebelum validasi
        form.setFieldsValue({ content });

        const v = await form.validateFields();
        const files = fileList.map((f) => ({ name: f.name || f.file?.name || "dokumen" }));

        onSave?.({
          title: v.title,
          content: v.content,      // akan berisi nilai dari ReactQuill
          recipientIds: v.recipients,
          files,
        });

        form.resetFields();
        setFileList([]);
        setContent(""); // <-- reset setelah simpan
      }}
      destroyOnClose
      width={600}
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
          <ReactQuill
            theme="snow"
            value={content}
            onChange={(v) => {
              setContent(v);
              form.setFieldsValue({ content: v });
            }}
            placeholder="Tulis sesuatu di sini..."
          />
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

// Komponen Tab Kustom untuk tampilan yang lebih baik
const CustomTab = ({ count, label, icon, active }) => (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
    active 
      ? 'bg-blue-50 text-blue-600 border border-blue-200' 
      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
  }`}>
    {icon}
    <span className="font-medium">{label}</span>
    <Badge 
      count={count} 
      showZero 
      color={active ? BRAND : '#94a3b8'}
      style={{ backgroundColor: active ? BRAND : '#94a3b8' }}
      className="ml-1"
    />
  </div>
);

/* =========================================================
   MAIN CONTENT
========================================================= */
export default function BroadcastContent() {
  const vm = useBroadcastViewModel();

  const [openAdd, setOpenAdd] = useState(false);
  const [sendTarget, setSendTarget] = useState(null);
  const [recipientsModal, setRecipientsModal] = useState({ open: false, list: [] });

  // Konfigurasi tab dengan icon dan styling yang lebih baik
  const tabItems = [
    { 
      key: "ALL", 
      label: "Semua",
      icon: <FileTextOutlined />,
      count: vm.counts.ALL
    },
    { 
      key: "DRAFT", 
      label: "Konsep",
      icon: <EditOutlined />,
      count: vm.counts.DRAFT
    },
    { 
      key: "SENDING", 
      label: "Mengirim",
      icon: <ClockCircleOutlined />,
      count: vm.counts.SENDING
    },
    { 
      key: "DELAYED", 
      label: "Ditunda",
      icon: <PauseCircleOutlined />,
      count: vm.counts.DELAYED
    },
    { 
      key: "CANCELED", 
      label: "Batal",
      icon: <CloseCircleOutlined />,
      count: vm.counts.CANCELED
    },
    { 
      key: "DONE", 
      label: "Selesai",
      icon: <CheckCircleOutlined />,
      count: vm.counts.DONE
    },
  ];

  const columns = [
    {
      title: <span style={{ whiteSpace: "nowrap" }}>Judul</span>,
      dataIndex: "title",
      key: "title",
      width: 180,
      ellipsis: true,
      onHeaderCell: () => ({ style: { whiteSpace: "nowrap" } }),
      onCell: () => ({ style: { maxWidth: 180 } }),
      render: (_, row) => (
        <div style={{ maxWidth: 180 }}>
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
      width: 200,
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
      width: 80,
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
      width: 180,
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

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: BRAND, borderRadius: 12 },
        components: {
          Button: { borderRadius: 10 },
          Table: { headerBg: "#F6F7FB", headerColor: "#0f172a" },
          Tabs: { 
            itemSelectedColor: BRAND, 
            inkBarColor: BRAND,
            itemHoverColor: BRAND,
          },
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
          {/* Tab Section yang diperbaiki */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
            </div>
            
            {/* Custom Tabs */}
            <div className="flex flex-wrap gap-2">
              {tabItems.map((tab) => (
                <div
                  key={tab.key}
                  onClick={() => vm.setStatusTab(tab.key)}
                  className="cursor-pointer"
                >
                  <CustomTab
                    label={tab.label}
                    count={tab.count}
                    icon={tab.icon}
                    active={vm.statusTab === tab.key}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 text-slate-600 text-sm bg-slate-50 rounded-md mb-3 border border-slate-200">
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={vm.filteredRows}
            pagination={{ 
              pageSize: 10, 
              showSizeChanger: false,
              showTotal: (total, range) => 
                `Menampilkan ${range[0]}-${range[1]} dari ${total} broadcast`
            }}
            bordered
            size="middle"
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