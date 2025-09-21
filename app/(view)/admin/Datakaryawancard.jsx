"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Input, Button, Space, Tooltip, Modal, Form,
  Input as AntInput, DatePicker, Select, Tag, Card, Avatar,
  Pagination, Dropdown, Menu
} from "antd";
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, LeftOutlined,
  FilterOutlined, MoreOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined,
  CalendarOutlined, UserOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import useKaryawanViewModel from "./useKaryawanViewModel";

const { Option } = Select;

const prettyAgama = (v) => {
  if (!v) return "-";
  const s = String(v).toLowerCase();
  if (s.includes("katolik")) return "Katolik";
  if (s.includes("protestan") || s.includes("kristen protestan")) return "Kristen Protestan";
  if (s === "kristen") return "Kristen Protestan";
  if (s.includes("islam")) return "Islam";
  if (s.includes("hindu")) return "Hindu";
  if (s.includes("buddha")) return "Buddha";
  if (s.includes("konghucu")) return "Konghucu";
  return v;
};

const roleTag = (val) => {
  const key = String(val || "").toLowerCase();
  const colorMap = { 
    direktur: "magenta", 
    admin: "gold", 
    hr: "green", 
    operasional: "blue", 
    karyawan: "geekblue" 
  };
  return <Tag color={colorMap[key] || "default"}>{String(val || "-").toUpperCase()}</Tag>;
};

function KaryawanCard({ data, onEdit, onDelete }) {
  return (
    <Card className="karyawan-card" bodyStyle={{ padding: "16px" }}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <Avatar 
            size={48} 
            src={data.foto_profil_user} 
            icon={<UserOutlined />}
            className="shadow-sm"
          />
          <div>
            <h3 className="font-semibold text-lg mb-0">{data.nama_pengguna || "-"}</h3>
            <div className="flex items-center text-sm text-gray-500">
              {roleTag(data.role)}
            </div>
          </div>
        </div>
        
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => onEdit(data)}>
                Edit
              </Menu.Item>
              <Menu.Item key="delete" icon={<DeleteOutlined />} onClick={() => onDelete(data)} danger>
                Hapus
              </Menu.Item>
            </Menu>
          }
          trigger={['click']}
          placement="bottomRight"
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center text-sm">
          <MailOutlined className="text-gray-400 mr-2" />
          <span className="text-gray-700">{data.email || "-"}</span>
        </div>
        
        {data.kontak && (
          <div className="flex items-center text-sm">
            <PhoneOutlined className="text-gray-400 mr-2" />
            <span className="text-gray-700">{data.kontak}</span>
          </div>
        )}
        
        <div className="flex items-center text-sm">
          <EnvironmentOutlined className="text-gray-400 mr-2" />
          <span className="text-gray-700">{data?.kantor?.nama_kantor || data?.nama_kantor || "-"}</span>
        </div>
        
        {data.tanggal_lahir && (
          <div className="flex items-center text-sm">
            <CalendarOutlined className="text-gray-400 mr-2" />
            <span className="text-gray-700">{new Date(data.tanggal_lahir).toLocaleDateString('id-ID')}</span>
          </div>
        )}
        
        {data.agama && (
          <div className="flex items-center text-sm">
            <UserOutlined className="text-gray-400 mr-2" />
            <span className="text-gray-700">{prettyAgama(data.agama)}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function KaryawanContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const departementId = sp.get("id") || "";
  const departementName = sp.get("name") || "";

  const {
    rows, loading, pagination, search, setSearch,
    onTableChange, addKaryawan, updateKaryawan, deleteKaryawan,
    locationOptions, locationLoading,
  } = useKaryawanViewModel({ departementId, departementName });

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterVisible, setFilterVisible] = useState(false);
  const title = useMemo(() => (editing ? "Edit Karyawan" : "Tambah Karyawan"), [editing]);

  const pageTitle = useMemo(() => {
    const n = (departementName || "").trim();
    if (!n) return "Karyawan";
    return /^divisi\s+/i.test(n) ? `Karyawan ${n}` : `Karyawan Divisi ${n}`;
  }, [departementName]);

  // Filter state
  const [filterRole, setFilterRole] = useState();
  const [filterAgama, setFilterAgama] = useState();

  const filteredRows = useMemo(() => {
    let data = rows || [];
    if (filterRole) data = data.filter((r) => String(r.role || "").toLowerCase() === String(filterRole).toLowerCase());
    if (filterAgama) data = data.filter((r) => prettyAgama(r.agama) === filterAgama);
    if (search?.trim()) {
      const s = search.toLowerCase();
      data = data.filter(
        (r) =>
          String(r.nama_pengguna || "").toLowerCase().includes(s) ||
          String(r.email || "").toLowerCase().includes(s),
      );
    }
    return data;
  }, [rows, search, filterRole, filterAgama]);

  // Handlers
  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ role: "KARYAWAN" });
    setOpenForm(true);
  };

  const openEdit = (rec) => {
    setEditing(rec);
    form.setFieldsValue({
      nama_pengguna: rec.nama_pengguna,
      email: rec.email,
      kontak: rec.kontak,
      agama: prettyAgama(rec.agama),
      role: rec.role || "KARYAWAN",
      tanggal_lahir: rec.tanggal_lahir ? dayjs(rec.tanggal_lahir) : null,
      id_location: rec.id_location || null,
    });
    setOpenForm(true);
  };

  const handleDelete = (rec) =>
    Modal.confirm({
      title: "Hapus Karyawan?",
      content: <>Data karyawan <b>{rec.nama_pengguna}</b> akan dihapus.</>,
      okText: "Hapus",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      onOk: async () => { await deleteKaryawan(rec.id_user); },
    });

  useEffect(() => {
    if (!openForm) return;
    if (editing) {
      form.setFieldsValue({
        nama_pengguna: editing.nama_pengguna,
        email: editing.email,
        kontak: editing.kontak,
        agama: prettyAgama(editing.agama),
        role: editing.role || "KARYAWAN",
        tanggal_lahir: editing.tanggal_lahir ? dayjs(editing.tanggal_lahir) : null,
        id_location: editing.id_location || null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ role: "KARYAWAN" });
    }
  }, [openForm, editing, form]);

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={() => router.back()}
            className="flex items-center"
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{pageTitle}</h2>
            <p className="text-gray-500">Kelola data karyawan dengan mudah</p>
          </div>
        </div>

        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={openAdd}
          size="large"
        >
          Tambah Karyawan
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Cari nama atau email karyawan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
            size="large"
          />
          
          <div className="flex gap-2">
            <Button 
              icon={<FilterOutlined />} 
              onClick={() => setFilterVisible(!filterVisible)}
            >
              Filter
            </Button>
            
            <Button.Group>
              <Button 
                icon={<i className="fas fa-th-large"></i>}
                type={viewMode === 'grid' ? 'primary' : 'default'}
                onClick={() => setViewMode('grid')}
              />
              <Button 
                icon={<i className="fas fa-list"></i>}
                type={viewMode === 'list' ? 'primary' : 'default'}
                onClick={() => setViewMode('list')}
              />
            </Button.Group>
          </div>
        </div>

        {filterVisible && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <Select
                allowClear
                placeholder="Pilih Role"
                className="w-full"
                value={filterRole}
                onChange={setFilterRole}
                options={["KARYAWAN","HR","OPERASIONAL","DIREKTUR","ADMIN"].map(v => ({value:v, label:v}))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agama</label>
              <Select
                allowClear
                placeholder="Pilih Agama"
                className="w-full"
                value={filterAgama}
                onChange={setFilterAgama}
                options={["Islam","Kristen Protestan","Katolik","Hindu","Buddha","Konghucu"].map(v => ({value:v,label:v}))}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          Menampilkan <span className="font-semibold">{filteredRows.length}</span> karyawan
        </p>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRows.map(record => (
            <KaryawanCard 
              key={record.id_user} 
              data={record} 
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRows.map(record => (
            <Card key={record.id_user} className="shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar 
                    size={40} 
                    src={record.foto_profil_user} 
                    icon={<UserOutlined />}
                  />
                  
                  <div>
                    <h3 className="font-semibold mb-0">{record.nama_pengguna}</h3>
                    <p className="text-gray-500 mb-0">{record.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {roleTag(record.role)}
                  
                  <Space>
                    <Tooltip title="Edit">
                      <Button 
                        size="small" 
                        icon={<EditOutlined />} 
                        onClick={() => openEdit(record)}
                      />
                    </Tooltip>
                    <Tooltip title="Hapus">
                      <Button 
                        size="small" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => handleDelete(record)}
                      />
                    </Tooltip>
                  </Space>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <div className="text-gray-500">Lokasi</div>
                  <div>{record?.kantor?.nama_kantor || record?.nama_kantor || "-"}</div>
                </div>
                
                <div>
                  <div className="text-gray-500">Kontak</div>
                  <div>{record.kontak || "-"}</div>
                </div>
                
                <div>
                  <div className="text-gray-500">Tanggal Lahir</div>
                  <div>{record.tanggal_lahir ? new Date(record.tanggal_lahir).toLocaleDateString() : "-"}</div>
                </div>
                
                <div>
                  <div className="text-gray-500">Agama</div>
                  <div>{prettyAgama(record.agama)}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredRows.length === 0 && !loading && (
        <Card className="text-center py-10">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada karyawan</h3>
          <p className="text-gray-500 mb-4">
            {search || filterRole || filterAgama 
              ? "Tidak ada karyawan yang sesuai dengan filter pencarian" 
              : "Belum ada data karyawan yang ditambahkan"}
          </p>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            Tambah Karyawan
          </Button>
        </Card>
      )}

      {/* Modal Add/Edit */}
      <Modal
        open={openForm}
        title={title}
        onCancel={() => setOpenForm(false)}
        onOk={() => form.submit()}
        okText="Simpan"
        cancelText="Batal"
        width={600}
        destroyOnClose
        afterClose={() => {
          setEditing(null);
          form.resetFields();
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ role: "KARYAWAN" }}
          onFinish={async (vals) => {
            const payload = {
              ...vals,
              tanggal_lahir: vals.tanggal_lahir
                ? dayjs(vals.tanggal_lahir).format("YYYY-MM-DD")
                : null,
              agama: prettyAgama(vals.agama),
            };

            if (editing) {
              delete payload.password;
              await updateKaryawan(editing.id_user, payload);
            } else {
              await addKaryawan({
                ...payload,
                id_departement: departementId,
                role: vals.role || "KARYAWAN",
              });
            }
            setOpenForm(false);
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Nama Karyawan"
              name="nama_pengguna"
              rules={[{ required: true, message: "Nama wajib diisi" }]}
            >
              <AntInput placeholder="Nama lengkap" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Email wajib diisi" },
                { type: "email", message: "Format email tidak valid" },
              ]}
            >
              <AntInput placeholder="nama@domain.com" />
            </Form.Item>
          </div>

          {!editing && (
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Password wajib diisi" },
                { min: 6, message: "Minimal 6 karakter" },
              ]}
            >
              <AntInput.Password placeholder="Password" />
            </Form.Item>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Kontak" name="kontak">
              <AntInput placeholder="08xxxx" />
            </Form.Item>

            <Form.Item label="Agama" name="agama">
              <Select
                allowClear
                placeholder="Pilih agama"
                options={[
                  { value: "Islam", label: "Islam" },
                  { value: "Kristen Protestan", label: "Kristen Protestan" },
                  { value: "Katolik", label: "Katolik" },
                  { value: "Hindu", label: "Hindu" },
                  { value: "Buddha", label: "Buddha" },
                  { value: "Konghucu", label: "Konghucu" },
                ]}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Tanggal Lahir" name="tanggal_lahir">
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
                disabledDate={(d) => d && d > dayjs().endOf("day")}
              />
            </Form.Item>

            <Form.Item label="Role" name="role">
              <Select
                options={[
                  { value: "KARYAWAN", label: "KARYAWAN" },
                  { value: "HR", label: "HR" },
                  { value: "OPERASIONAL", label: "OPERASIONAL" },
                  { value: "DIREKTUR", label: "DIREKTUR" },
                  { value: "ADMIN", label: "ADMIN" },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item label="Lokasi" name="id_location">
            <Select
              showSearch
              allowClear
              placeholder="Pilih lokasi / kantor"
              loading={locationLoading}
              options={locationOptions}
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .karyawan-card {
          transition: all 0.3s ease;
          border-radius: 8px;
        }
        
        .karyawan-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .ant-card {
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}