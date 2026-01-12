'use client';

import React, { useMemo, useState } from 'react';

import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppTooltip from '@/app/(view)/component_shared/AppTooltip';
import AppMessage from '@/app/(view)/component_shared/AppMessage';

import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

import SOPCategoryFormModal from './SOPCategoryFormModal';

export default function SOPCategoryModal({ open, categories, onClose, onSave, onDelete }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // ✅ Modal konfirmasi hapus kategori
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const activeList = useMemo(() => (categories || []).filter((c) => c.is_active), [categories]);

  const openDeleteConfirm = (record) => {
    setDeleteTarget(record || null);
    setDeleteOpen(true);
  };

  const closeDeleteConfirm = () => {
    if (deleteLoading) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);

      // record.key biasanya id kategori
      const id = deleteTarget?.key ?? deleteTarget?.id;
      if (!id) {
        AppMessage.error('ID kategori tidak valid');
        return;
      }

      await onDelete?.(id);

      AppMessage.success('Kategori berhasil dihapus');
      closeDeleteConfirm();
    } catch (e) {
      AppMessage.error(e?.message || 'Gagal menghapus kategori');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'NAMA KATEGORI',
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <div className='min-w-0'>
            <AppTypography.Text size={13} weight={800} className='text-slate-900 block truncate' title={text}>
              {text}
            </AppTypography.Text>
            <AppTypography.Text size={12} tone='muted' className='text-slate-500 block'>
              {record.description || '—'}
            </AppTypography.Text>
          </div>
        ),
      },
      {
        title: 'AKSI',
        key: 'action',
        width: 140,
        align: 'center',
        render: (_, record) => (
          <AppSpace size='sm'>
            <AppTooltip title='Edit'>
              <AppButton
                aria-label='Edit'
                variant='ghost'
                icon={<EditOutlined />}
                onClick={() => {
                  setEditing(record);
                  setFormOpen(true);
                }}
              />
            </AppTooltip>

            <AppTooltip title='Hapus'>
              <AppButton
                aria-label='Hapus'
                danger
                icon={<DeleteOutlined />}
                onClick={() => openDeleteConfirm(record)}
              />
            </AppTooltip>
          </AppSpace>
        ),
      },
    ],
    []
  );

  return (
    <>
      <AppModal open={open} title='Manajemen Kategori SOP' onCancel={onClose} footer={null} destroyOnClose width={900}>
        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between gap-2 flex-wrap'>
            <AppTypography.Text tone='secondary'>
              Total kategori aktif: <b>{activeList.length}</b>
            </AppTypography.Text>

            <AppButton
              variant='primary'
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Tambah Kategori
            </AppButton>
          </div>

          <AppTable rowKey='key' dataSource={activeList} columns={columns} pagination={{ pageSize: 10 }} />
        </div>
      </AppModal>

      {/* Modal tambah/edit kategori */}
      <SOPCategoryFormModal
        open={formOpen}
        category={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={async (payload) => {
          await onSave?.(payload);
          setFormOpen(false);
          setEditing(null);
        }}
      />

      {/* ✅ Modal konfirmasi hapus kategori */}
      <AppModal
        open={deleteOpen}
        onClose={closeDeleteConfirm}
        onCancel={closeDeleteConfirm}
        title='Konfirmasi Hapus Kategori'
        width={520}
        destroyOnClose
        footer={
          <div className='flex items-center justify-end gap-2'>
            <AppButton
              variant='outline'
              onClick={closeDeleteConfirm}
              disabled={deleteLoading}
              className='!border-red-600 !text-red-600 hover:!border-red-700 hover:!text-red-700'
            >
              Batal
            </AppButton>

            <AppButton
              variant='primary'
              onClick={confirmDelete}
              loading={deleteLoading}
              className='!bg-red-600 hover:!bg-red-700 !border-red-600 hover:!border-red-700'
            >
              Hapus
            </AppButton>
          </div>
        }
      >
        <div className='space-y-2'>
          <AppTypography.Text>Anda yakin ingin menghapus kategori berikut?</AppTypography.Text>

          <div className='rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3'>
            <AppTypography.Text
              weight={800}
              className='block text-slate-900 truncate'
              title={deleteTarget?.name || ''}
            >
              {deleteTarget?.name || '—'}
            </AppTypography.Text>

            <AppTypography.Text tone='muted' className='block'>
              Tindakan ini tidak dapat dibatalkan.
            </AppTypography.Text>
          </div>
        </div>
      </AppModal>
    </>
  );
}
