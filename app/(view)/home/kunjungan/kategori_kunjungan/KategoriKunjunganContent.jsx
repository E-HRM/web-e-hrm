// KategoriKunjunganContent.jsx
'use client';

import { useMemo, useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, RollbackOutlined, SearchOutlined } from '@ant-design/icons';
import useVM from './useKategoriKunjunganViewModel';

import AppCard from '../../../component_shared/AppCard';
import AppTable from '../../../component_shared/AppTable';
import AppInput from '../../../component_shared/AppInput';
import AppButton from '../../../component_shared/AppButton';
import AppModal from '../../../component_shared/AppModal';
import AppTooltip from '../../../component_shared/AppTooltip';
import AppPopconfirm from '../../../component_shared/AppPopconfirm';
import AppTag from '../../../component_shared/AppTag';
import AppSwitch from '../../../component_shared/AppSwitch';
import AppMessage from '../../../component_shared/AppMessage';
import AppSpace from '../../../component_shared/AppSpace';

// ===== Waktu lokal (sesuai user) =====
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

// Formatter lokal: kalau value ada suffix Z / offset → treat as zoned;
// kalau tidak ada → treat as UTC lalu konversi ke zona lokal user.
const AUDIT_TZ = dayjs.tz.guess(); // ganti manual ke "Asia/Jakarta" bila perlu
function formatAuditLocal(v, fmt = 'DD MMM YYYY HH:mm') {
  if (!v) return '—';
  const s = String(v).trim();
  const hasTZ = /Z|[+-]\d{2}:\d{2}$/.test(s);
  const m = hasTZ ? dayjs(s).tz(AUDIT_TZ) : dayjs.utc(s).tz(AUDIT_TZ);
  return m.isValid() ? m.format(fmt) : '—';
}

export default function KategoriKunjunganContent() {
  const vm = useVM();

  // modal add
  const [openAdd, setOpenAdd] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addErr, setAddErr] = useState('');

  // modal edit
  const [openEdit, setOpenEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editErr, setEditErr] = useState('');
  const [editingRow, setEditingRow] = useState(null);

  const closeAdd = () => {
    setOpenAdd(false);
    setSavingAdd(false);
    setAddName('');
    setAddErr('');
  };

  const closeEdit = () => {
    setOpenEdit(false);
    setSavingEdit(false);
    setEditingRow(null);
    setEditName('');
    setEditErr('');
  };

  const onAddSubmit = async () => {
    const name = String(addName || '').trim();
    if (!name) {
      setAddErr('Wajib diisi');
      return;
    }

    try {
      setSavingAdd(true);
      await vm.create(name);
      AppMessage.success('Kategori kunjungan berhasil ditambahkan');
      closeAdd();
    } catch (e) {
      AppMessage.error(e?.message || 'Gagal menambah kategori');
    } finally {
      setSavingAdd(false);
    }
  };

  const onEditOpen = (row) => {
    setEditingRow(row);
    setEditName(row?.kategori_kunjungan || '');
    setEditErr('');
    setOpenEdit(true);
  };

  const onEditSubmit = async () => {
    const name = String(editName || '').trim();
    if (!name) {
      setEditErr('Wajib diisi');
      return;
    }
    if (!editingRow?.id_kategori_kunjungan) {
      AppMessage.error('Data kategori tidak valid');
      return;
    }

    try {
      setSavingEdit(true);
      await vm.update(editingRow.id_kategori_kunjungan, name);
      AppMessage.success('Kategori kunjungan berhasil diubah');
      closeEdit();
    } catch (e) {
      AppMessage.error(e?.message || 'Gagal mengubah kategori');
    } finally {
      setSavingEdit(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'Kategori',
        dataIndex: 'kategori_kunjungan',
        key: 'kat',
      },
      {
        title: 'Status',
        key: 'st',
        width: 120,
        render: (_, r) =>
          r.deleted_at ? (
            <AppTag
              tone='danger'
              variant='soft'
              pill={false}
            >
              Terhapus
            </AppTag>
          ) : (
            <AppTag
              tone='success'
              variant='soft'
              pill={false}
            >
              Aktif
            </AppTag>
          ),
      },
      {
        title: 'Dibuat',
        dataIndex: 'created_at',
        key: 'cr',
        width: 180,
        render: (v) => formatAuditLocal(v, 'DD MMM YYYY HH:mm'),
      },
      {
        title: 'Diubah',
        dataIndex: 'updated_at',
        key: 'up',
        width: 180,
        render: (v) => formatAuditLocal(v, 'DD MMM YYYY HH:mm'),
      },
      {
        title: 'Aksi',
        key: 'aksi',
        align: 'right',
        width: 280,
        render: (_, row) => {
          const isDeleted = !!row.deleted_at;
          const willHardDelete = isDeleted || vm.includeDeleted;

          const title = willHardDelete ? 'Hapus permanen kategori?' : 'Hapus kategori?';
          const desc = willHardDelete ? 'Hard delete: data akan hilang permanen.' : "Soft delete: data bisa dikembalikan dari tampilan 'Tampilkan yang terhapus saja'.";

          const onConfirmDelete = async () => {
            try {
              if (willHardDelete) {
                await vm.removeHard(row.id_kategori_kunjungan);
                AppMessage.success('Kategori dihapus permanen.');
              } else {
                await vm.remove(row.id_kategori_kunjungan);
                AppMessage.success('Kategori dihapus (soft delete).');
              }
            } catch (e) {
              AppMessage.error(e?.message || 'Gagal menghapus kategori');
            }
          };

          return (
            <AppSpace
              size='sm'
              align='center'
            >
              {isDeleted ? (
                <AppTooltip title='Kembalikan kategori'>
                  <AppButton
                    size='small'
                    variant='primary'
                    icon={<RollbackOutlined />}
                    onClick={async () => {
                      try {
                        await vm.restore(row.id_kategori_kunjungan);
                        AppMessage.success('Kategori dikembalikan.');
                      } catch (e) {
                        AppMessage.error(e?.message || 'Gagal mengembalikan kategori');
                      }
                    }}
                  >
                    Kembalikan
                  </AppButton>
                </AppTooltip>
              ) : (
                <AppTooltip title='Ubah'>
                  <AppButton
                    size='small'
                    variant='outline'
                    icon={<EditOutlined />}
                    onClick={() => onEditOpen(row)}
                  />
                </AppTooltip>
              )}

              <AppPopconfirm
                variant='danger'
                title={title}
                description={desc}
                okText='Hapus'
                cancelText='Batal'
                onConfirm={onConfirmDelete}
              >
                <AppButton
                  size='small'
                  variant='danger'
                  icon={<DeleteOutlined />}
                />
              </AppPopconfirm>
            </AppSpace>
          );
        },
      },
    ],
    [vm]
  );

  return (
    <div className='p-4'>
      <AppCard
        title={<span className='text-lg font-semibold'>Kategori Kunjungan</span>}
        styles={{ body: { paddingTop: 16 } }}
      >
        {/* Filter bar */}
        <div className='flex flex-wrap items-center gap-3 md:flex-nowrap mb-4'>
          <AppInput
            placeholder='Cari kategori'
            className='w-[240px]'
            value={vm.q}
            onChange={(e) => vm.setQ(e.target.value)}
            onPressEnter={() => vm.setQ(vm.q)}
            allowClear
            addonAfter={
              <div
                className='w-[52px] flex items-center justify-center cursor-pointer'
                onClick={() => vm.setQ(vm.q)}
                role='button'
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') vm.setQ(vm.q);
                }}
              >
                <SearchOutlined className='opacity-60' />
              </div>
            }
          />

          <AppSpace
            size='sm'
            align='center'
          >
            <AppSwitch
              checked={vm.includeDeleted}
              onChange={(v) => vm.setIncludeDeleted(v)}
            />
            <div className='opacity-75 select-none'>Tampilkan yang terhapus saja</div>
          </AppSpace>

          <AppButton
            icon={<PlusOutlined />}
            onClick={() => setOpenAdd(true)}
          >
            Tambah Kategori
          </AppButton>
        </div>

        <AppTable
          card={false}
          rowKey='id_kategori_kunjungan'
          columns={columns}
          dataSource={vm.rows}
          loading={vm.loading}
          pagination={false}
          size='middle'
        />
      </AppCard>

      {/* Modal Tambah */}
      <AppModal
        open={openAdd}
        onClose={closeAdd}
        title='Tambah Kategori'
        okText='Simpan'
        cancelText='Batal'
        onOk={onAddSubmit}
        closeOnOk={false}
        okLoading={savingAdd}
        width={560}
      >
        <AppInput
          label='Nama Kategori'
          required
          placeholder='Mis. Kunjungan Klien, Survey Lokasi, dsb.'
          value={addName}
          onChange={(e) => {
            setAddName(e.target.value);
            if (addErr) setAddErr('');
          }}
          error={addErr}
          autoFocus
        />
      </AppModal>

      {/* Modal Edit */}
      <AppModal
        open={openEdit}
        onClose={closeEdit}
        title='Ubah Kategori'
        okText='Simpan'
        cancelText='Batal'
        onOk={onEditSubmit}
        closeOnOk={false}
        okLoading={savingEdit}
        width={560}
      >
        <AppInput
          label='Nama Kategori'
          required
          value={editName}
          onChange={(e) => {
            setEditName(e.target.value);
            if (editErr) setEditErr('');
          }}
          error={editErr}
          autoFocus
        />
      </AppModal>
    </div>
  );
}
