'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, LeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useKaryawanViewModel from './useKaryawanViewModel';

import AppTable from '../../../../component_shared/AppTable';
import AppInput from '../../../../component_shared/AppInput';
import AppButton from '../../../../component_shared/AppButton';
import AppSelect from '../../../../component_shared/AppSelect';
import AppCard from '../../../../component_shared/AppCard';
import AppModal from '../../../../component_shared/AppModal';
import AppForm from '../../../../component_shared/AppForm';
import AppTag from '../../../../component_shared/AppTag';
import AppTypography from '../../../../component_shared/AppTypography';
import AppAvatar from '../../../../component_shared/AppAvatar';

const prettyAgama = (v) => {
  if (!v) return '-';
  const s = String(v).toLowerCase();
  if (s.includes('katolik')) return 'Katolik';
  if (s.includes('protestan') || s.includes('kristen protestan')) return 'Kristen Protestan';
  if (s === 'kristen') return 'Kristen Protestan';
  if (s.includes('islam')) return 'Islam';
  if (s.includes('hindu')) return 'Hindu';
  if (s.includes('buddha')) return 'Buddha';
  if (s.includes('konghucu')) return 'Konghucu';
  return v;
};

const ROLE_TONE = {
  direktur: 'warning',
  admin: 'info',
  hr: 'success',
  operasional: 'primary',
  karyawan: 'primary',
  superadmin: 'danger',
};

export default function KaryawanContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const departementId = sp.get('id') || '';
  const departementName = sp.get('name') || '';

  const { rows, loading, pagination, search, setSearch, onTableChange, addKaryawan, updateKaryawan, deleteKaryawan, locationOptions, locationLoading } = useKaryawanViewModel({ departementId, departementName });

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const title = useMemo(() => (editing ? 'Edit Karyawan' : 'Tambah Karyawan'), [editing]);

  const pageTitle = useMemo(() => {
    const n = (departementName || '').trim();
    if (!n) return 'Karyawan';
    return /^divisi\s+/i.test(n) ? `Karyawan ${n}` : `Karyawan Divisi ${n}`;
  }, [departementName]);

  const [filterRole, setFilterRole] = useState();
  const [filterAgama, setFilterAgama] = useState();

  const filteredRows = useMemo(() => {
    let data = rows || [];
    if (filterRole) {
      data = data.filter((r) => String(r.role || '').toLowerCase() === String(filterRole).toLowerCase());
    }
    if (filterAgama) {
      data = data.filter((r) => prettyAgama(r.agama) === filterAgama);
    }
    if (search?.trim()) {
      const s = search.toLowerCase();
      data = data.filter(
        (r) =>
          String(r.nama_pengguna || '')
            .toLowerCase()
            .includes(s) ||
          String(r.email || '')
            .toLowerCase()
            .includes(s)
      );
    }
    return data;
  }, [rows, search, filterRole, filterAgama]);

  const openAdd = () => {
    setEditing(null);
    setOpenForm(true);
  };

  const openEdit = (rec) => {
    setEditing(rec);
    setOpenForm(true);
  };

  const closeForm = () => {
    setOpenForm(false);
    setEditing(null);
  };

  const roleTag = (val) => {
    const raw = String(val || '-');
    const key = raw.toLowerCase();
    const tone = ROLE_TONE[key] || 'primary';
    return (
      <AppTag
        tone={tone}
        variant='soft'
        className='!font-semibold'
      >
        {raw.toUpperCase()}
      </AppTag>
    );
  };

  const columns = [
    {
      title: 'Nama Karyawan',
      dataIndex: 'nama_pengguna',
      key: 'nama_pengguna',
      width: 420,
      render: (t, r) => (
        <div className='flex items-center gap-3 min-w-0'>
          <div className='shrink-0'>
            <AppAvatar
              src={r.foto_profil_user || undefined}
              name={t || ''}
              size='sm'
            />
          </div>
          <AppTypography.Text
            strong
            className='whitespace-nowrap'
          >
            {t || '-'}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 320,
      render: (v) => <AppTypography.Text className='whitespace-nowrap'>{v || '-'}</AppTypography.Text>,
    },
    {
      title: 'Lokasi',
      key: 'lokasi',
      width: 260,
      render: (_, r) => r?.kantor?.nama_kantor || r?.nama_kantor || '-',
    },
    {
      title: 'Agama',
      dataIndex: 'agama',
      key: 'agama',
      width: 180,
      render: (v) => prettyAgama(v),
    },
    {
      title: 'Kontak',
      dataIndex: 'kontak',
      key: 'kontak',
      width: 200,
      render: (v) => <AppTypography.Text className='whitespace-nowrap'>{v || '-'}</AppTypography.Text>,
    },
    {
      title: 'Tanggal Lahir',
      dataIndex: 'tanggal_lahir',
      key: 'tanggal_lahir',
      width: 170,
      render: (v) => (v ? new Date(v).toLocaleDateString() : '-'),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      align: 'center',
      render: roleTag,
    },

    // Jika nanti diaktifkan:
    // {
    //   title: "Opsi",
    //   key: "aksi",
    //   width: 130,
    //   fixed: "right",
    //   align: "center",
    //   render: (_, row) => (
    //     <div className="flex items-center justify-center gap-2">
    //       <AppButton
    //         variant="text"
    //         size="small"
    //         icon={<EditOutlined />}
    //         onClick={() => openEdit(row)}
    //       />
    //       <AppButton
    //         variant="danger"
    //         size="small"
    //         icon={<DeleteOutlined />}
    //         confirm={{
    //           title: "Hapus Karyawan?",
    //           content: (
    //             <>
    //               Data karyawan <b>{row.nama_pengguna}</b> akan dihapus.
    //             </>
    //           ),
    //           okText: "Hapus",
    //           cancelText: "Batal",
    //           onOk: async () => {
    //             await deleteKaryawan(row.id_user);
    //           },
    //         }}
    //       />
    //     </div>
    //   ),
    // },
  ];

  const formKey = editing ? `edit-${editing.id_user}` : 'add';

  const initialValues = useMemo(() => {
    if (!editing) return { role: 'KARYAWAN' };
    return {
      nama_pengguna: editing.nama_pengguna,
      email: editing.email,
      kontak: editing.kontak,
      agama: prettyAgama(editing.agama),
      role: editing.role || 'KARYAWAN',
      tanggal_lahir: editing.tanggal_lahir ? dayjs(editing.tanggal_lahir) : null,
      id_location: editing.id_location || null,
    };
  }, [editing]);

  const formFields = useMemo(() => {
    const agamaOptions = ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'].map((v) => ({ value: v, label: v }));

    const roleOptions = ['KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'ADMIN', 'SUPERADMIN'].map((v) => ({ value: v, label: v }));

    const base = [
      {
        type: 'text',
        name: 'nama_pengguna',
        label: 'Nama Karyawan',
        placeholder: 'Nama lengkap',
        rules: [{ required: true, message: 'Nama wajib diisi' }],
      },
      {
        type: 'email',
        name: 'email',
        label: 'Email',
        placeholder: 'nama@domain.com',
        rules: [
          { required: true, message: 'Email wajib diisi' },
          { type: 'email', message: 'Format email tidak valid' },
        ],
      },
    ];

    const password = !editing
      ? [
          {
            type: 'password',
            name: 'password',
            label: 'Password',
            placeholder: 'Password',
            rules: [
              { required: true, message: 'Password wajib diisi' },
              { min: 6, message: 'Minimal 6 karakter' },
            ],
          },
        ]
      : [];

    const rest = [
      {
        type: 'row',
        gutter: [12, 12],
        children: [
          {
            type: 'text',
            name: 'kontak',
            label: 'Kontak',
            placeholder: '08xxxx',
            md: 12,
            xs: 24,
          },
          {
            type: 'select',
            name: 'agama',
            label: 'Agama',
            placeholder: 'Pilih agama',
            options: agamaOptions,
            allowClear: true,
            md: 12,
            xs: 24,
          },
        ],
      },
      {
        type: 'row',
        gutter: [12, 12],
        children: [
          {
            type: 'date',
            name: 'tanggal_lahir',
            label: 'Tanggal Lahir',
            md: 12,
            xs: 24,
            controlProps: {
              format: 'DD/MM/YYYY',
              disabledDate: (d) => d && d > dayjs().endOf('day'),
            },
          },
          {
            type: 'select',
            name: 'role',
            label: 'Role',
            options: roleOptions,
            md: 12,
            xs: 24,
          },
        ],
      },
      {
        type: 'select',
        name: 'id_location',
        label: 'Lokasi',
        placeholder: 'Pilih lokasi / kantor',
        options: locationOptions,
        allowClear: true,
        controlProps: {
          showSearch: true,
          optionFilterProp: 'label',
          loading: locationLoading,
        },
      },
    ];

    return [...base, ...password, ...rest];
  }, [editing, locationOptions, locationLoading]);

  return (
    <div className='px-4 md:px-6 lg:px-8 py-5 space-y-4'>
      {/* Header actions */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <AppButton
            variant='text'
            icon={<LeftOutlined />}
            onClick={() => router.back()}
          />
          <AppTypography.Title
            level={3}
            className='!mb-0'
          >
            {pageTitle}
          </AppTypography.Title>
        </div>

        <div className='flex items-center gap-2 flex-wrap'>
          <div className='w-[220px]'>
            <AppInput
              allowClear
              prefixIcon={<SearchOutlined />}
              placeholder='Cari karyawan…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className='w-[150px]'>
            <AppSelect
              allowClear
              placeholder='Filter Role'
              value={filterRole}
              onChange={setFilterRole}
              options={['KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'ADMIN', 'SUPERADMIN'].map((v) => ({ value: v, label: v }))}
            />
          </div>

          <div className='w-[160px]'>
            <AppSelect
              allowClear
              placeholder='Filter Agama'
              value={filterAgama}
              onChange={setFilterAgama}
              options={['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'].map((v) => ({ value: v, label: v }))}
            />
          </div>

          {/* Jika mau diaktifkan lagi */}
          {/* <AppButton variant="primary" icon={<PlusOutlined />} onClick={openAdd}>
            Tambah
          </AppButton> */}
        </div>
      </div>

      <AppCard className='p-0'>
        <AppTable
          rowKey='id_user'
          columns={columns}
          dataSource={filteredRows}
          loading={loading}
          size='small'
          tableLayout='auto'
          scroll={{ x: 'max-content' }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
          }}
          onChange={onTableChange}
        />
      </AppCard>

      {/* Modal Add/Edit */}
      <AppModal
        open={openForm}
        onClose={closeForm}
        title={title}
        destroyOnClose
        footer={false}
      >
        <AppForm
          key={formKey}
          initialValues={initialValues}
          fields={formFields}
          loading={saving}
          submitText='Simpan'
          footer={({ submit }) => (
            <div className='flex items-center justify-end gap-2 pt-2'>
              <AppButton
                variant='outline'
                onClick={closeForm}
              >
                Batal
              </AppButton>
              <AppButton
                variant='primary'
                onClick={submit}
                loading={saving}
              >
                Simpan
              </AppButton>
            </div>
          )}
          onFinish={async (vals) => {
            const payload = {
              ...vals,
              tanggal_lahir: vals.tanggal_lahir ? dayjs(vals.tanggal_lahir).format('YYYY-MM-DD') : null,
              agama: prettyAgama(vals.agama),
            };

            try {
              setSaving(true);

              if (editing) {
                delete payload.password;
                await updateKaryawan(editing.id_user, payload);
              } else {
                await addKaryawan({
                  ...payload,
                  id_departement: departementId,
                  role: vals.role || 'KARYAWAN',
                });
              }

              closeForm();
            } finally {
              setSaving(false);
            }
          }}
        />
      </AppModal>
    </div>
  );
}
