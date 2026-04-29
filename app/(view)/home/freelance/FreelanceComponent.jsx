'use client';

import { useMemo, useState } from 'react';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FormOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import useVM from './useFreelanceViewModel';

import AppButton from '../../component_shared/AppButton';
import AppCard from '../../component_shared/AppCard';
import AppInput from '../../component_shared/AppInput';
import AppMessage from '../../component_shared/AppMessage';
import AppModal from '../../component_shared/AppModal';
import AppPopconfirm from '../../component_shared/AppPopconfirm';
import AppSelect from '../../component_shared/AppSelect';
import AppSpace from '../../component_shared/AppSpace';
import AppTable from '../../component_shared/AppTable';
import AppTooltip from '../../component_shared/AppTooltip';

const EMPTY_FORM = Object.freeze({
  nama: '',
  alamat: '',
  kontak: '',
  email: '',
  jenis_bank: '',
  nomor_rekening: '',
  nama_pemilik_rekening: '',
  id_supervisor: undefined,
});

export default function FreelanceComponent() {
  const vm = useVM();
  const [openForm, setOpenForm] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const closeForm = () => {
    setOpenForm(false);
    setEditingRow(null);
    setSaving(false);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const openCreate = () => {
    setEditingRow(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setOpenForm(true);
  };

  const openEdit = (row) => {
    setEditingRow(row);
    setForm({
      nama: row?.nama || '',
      alamat: row?.alamat || '',
      kontak: row?.kontak || '',
      email: row?.email || '',
      jenis_bank: row?.jenis_bank || '',
      nomor_rekening: row?.nomor_rekening || '',
      nama_pemilik_rekening: row?.nama_pemilik_rekening || '',
      id_supervisor: row?.id_supervisor || undefined,
    });
    setErrors({});
    setOpenForm(true);
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!String(form.nama || '').trim()) {
      nextErrors.nama = 'Nama wajib diisi';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email).trim())) {
      nextErrors.email = 'Email tidak valid';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitForm = async () => {
    if (!validate()) return;

    const payload = {
      nama: String(form.nama || '').trim(),
      alamat: String(form.alamat || '').trim() || null,
      kontak: String(form.kontak || '').trim() || null,
      email: String(form.email || '').trim() || null,
      jenis_bank: String(form.jenis_bank || '').trim() || null,
      nomor_rekening: String(form.nomor_rekening || '').trim() || null,
      nama_pemilik_rekening: String(form.nama_pemilik_rekening || '').trim() || null,
      id_supervisor: form.id_supervisor || null,
    };

    try {
      setSaving(true);
      if (editingRow?.id_freelance) {
        await vm.update(editingRow.id_freelance, payload);
        AppMessage.success('Freelance berhasil diperbarui');
      } else {
        await vm.create(payload);
        AppMessage.success('Freelance berhasil ditambahkan');
      }
      closeForm();
    } catch (error) {
      AppMessage.error(error?.message || 'Gagal menyimpan freelance');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'Nama',
        dataIndex: 'nama',
        key: 'nama',
        render: (value, row) => (
          <div>
            <div className='font-medium text-slate-900'>{value || '—'}</div>
            <div className='text-xs text-slate-500'>{row?.email || 'Tanpa email'}</div>
          </div>
        ),
      },
      {
        title: 'Kontak',
        dataIndex: 'kontak',
        key: 'kontak',
        width: 150,
        render: (value) => value || '—',
      },
      {
        title: 'Alamat',
        dataIndex: 'alamat',
        key: 'alamat',
        render: (value) => value || '—',
      },
      {
        title: 'Rekening',
        key: 'rekening',
        width: 220,
        render: (_, row) => (
          <div>
            <div className='font-medium text-slate-900'>{row?.nama_pemilik_rekening || '—'}</div>
            <div className='text-xs text-slate-500'>{row?.jenis_bank && row?.nomor_rekening ? `${row.jenis_bank} - ${row.nomor_rekening}` : 'Belum diisi'}</div>
          </div>
        ),
      },
      {
        title: 'Supervisor',
        key: 'supervisor',
        width: 220,
        render: (_, row) => row?.supervisor?.nama_pengguna || '—',
      },
      {
        title: 'Link Form',
        key: 'form_link',
        width: 280,
        render: (_, row) => {
          const path = vm.getFreelanceFormPath(row.id_freelance);

          return (
            <div className='space-y-2'>
              <div className='rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500'>{path}</div>
              <AppSpace size='sm'>
                <AppButton
                  size='small'
                  variant='outline'
                  icon={<FormOutlined />}
                  onClick={() => vm.openFreelanceForm(row.id_freelance)}
                >
                  Buka Form
                </AppButton>
                <AppButton
                  size='small'
                  variant='ghost'
                  icon={<CopyOutlined />}
                  onClick={async () => {
                    try {
                      await vm.copyFreelanceFormLink(row.id_freelance);
                      AppMessage.success('Link form berhasil disalin');
                    } catch (error) {
                      AppMessage.error(error?.message || 'Gagal menyalin link form');
                    }
                  }}
                >
                  Salin Link
                </AppButton>
              </AppSpace>
            </div>
          );
        },
      },
      {
        title: 'Dibuat',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 170,
        render: (value) => vm.formatDateTime(value),
      },
      {
        title: 'Aksi',
        key: 'aksi',
        width: 140,
        align: 'right',
        render: (_, row) => (
          <AppSpace size='sm'>
            <AppTooltip title='Edit freelance'>
              <AppButton
                size='small'
                variant='outline'
                icon={<EditOutlined />}
                onClick={() => openEdit(row)}
              />
            </AppTooltip>

            <AppTooltip title='Detail freelance'>
              <AppButton
                size='small'
                variant='outline'
                icon={<EyeOutlined />}
                href={`/home/freelance/${row.id_freelance}`}
              />
            </AppTooltip>

            <AppPopconfirm
              variant='danger'
              title='Hapus freelance?'
              description='Data freelance akan dihapus dari daftar aktif.'
              okText='Hapus'
              cancelText='Batal'
              onConfirm={async () => {
                try {
                  await vm.remove(row.id_freelance);
                  AppMessage.success('Freelance berhasil dihapus');
                } catch (error) {
                  AppMessage.error(error?.message || 'Gagal menghapus freelance');
                }
              }}
            >
              <AppButton
                size='small'
                variant='danger'
                icon={<DeleteOutlined />}
              />
            </AppPopconfirm>
          </AppSpace>
        ),
      },
    ],
    [vm]
  );

  return (
    <div className='p-4'>
      <AppCard
        title={<span className='text-lg font-semibold'>Data Freelance</span>}
        styles={{ body: { paddingTop: 16 } }}
      >
        <div className='mb-4 flex flex-wrap items-center gap-3 md:flex-nowrap'>
          <AppInput
            placeholder='Cari nama, email, kontak, alamat, supervisor'
            className='w-full md:w-[340px]'
            value={vm.q}
            onChange={(event) => {
              vm.setQ(event.target.value);
              vm.setPage(1);
            }}
            allowClear
            addonAfter={
              <div className='flex items-center px-1 text-slate-400'>
                <SearchOutlined />
              </div>
            }
          />

          <div className='ml-auto'>
            <AppButton
              variant='primary'
              icon={<PlusOutlined />}
              onClick={openCreate}
            >
              Tambah Freelance
            </AppButton>
          </div>
        </div>

        <AppTable
          rowKey='id_freelance'
          columns={columns}
          dataSource={vm.rows}
          loading={vm.loading}
          pagination={vm.pagination}
          onChange={vm.onTableChange}
          totalLabel='freelance'
          emptyTitle='Belum ada data freelance'
          emptyDescription='Tambahkan freelance baru untuk mulai mengelola datanya.'
        />
      </AppCard>

      <AppModal
        open={openForm}
        onClose={closeForm}
        title={editingRow ? 'Edit Freelance' : 'Tambah Freelance'}
        footer={false}
        destroyOnClose
      >
        <div className='space-y-4'>
          <AppInput
            label='Nama'
            required
            placeholder='Nama freelance'
            value={form.nama}
            error={errors.nama}
            onChange={(event) => setField('nama', event.target.value)}
          />

          <AppInput
            label='Alamat'
            placeholder='Alamat freelance'
            value={form.alamat}
            onChange={(event) => setField('alamat', event.target.value)}
          />

          <AppInput
            label='Kontak'
            placeholder='Nomor kontak freelance'
            value={form.kontak}
            onChange={(event) => setField('kontak', event.target.value)}
          />

          <AppInput
            label='Email'
            placeholder='Email freelance'
            value={form.email}
            error={errors.email}
            onChange={(event) => setField('email', event.target.value)}
          />

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <AppInput
              label='Jenis Bank'
              placeholder='Masukkan jenis bank'
              value={form.jenis_bank}
              onChange={(event) => setField('jenis_bank', event.target.value)}
            />

            <AppInput
              label='Nomor Rekening'
              placeholder='Masukkan nomor rekening'
              value={form.nomor_rekening}
              onChange={(event) => setField('nomor_rekening', event.target.value)}
            />
          </div>

          <AppInput
            label='Nama Pemilik Rekening'
            placeholder='Masukkan nama pemilik rekening'
            value={form.nama_pemilik_rekening}
            onChange={(event) => setField('nama_pemilik_rekening', event.target.value)}
          />

          <AppSelect
            label='Supervisor'
            placeholder='Pilih supervisor'
            allowClear
            value={form.id_supervisor}
            options={vm.supervisorOptions}
            loading={vm.supervisorLoading}
            onChange={(value) => setField('id_supervisor', value)}
          />

          <div className='flex justify-end gap-2 pt-2'>
            <AppButton
              variant='ghost'
              onClick={closeForm}
            >
              Batal
            </AppButton>
            <AppButton
              variant='primary'
              loading={saving}
              onClick={submitForm}
            >
              {editingRow ? 'Simpan Perubahan' : 'Simpan Freelance'}
            </AppButton>
          </div>
        </div>
      </AppModal>
    </div>
  );
}
