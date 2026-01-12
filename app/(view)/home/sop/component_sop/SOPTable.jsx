'use client';

import React, { useMemo, useState } from 'react';

import AppTable from '@/app/(view)/component_shared/AppTable';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppDropdown from '@/app/(view)/component_shared/AppDropdown';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppMessage from '@/app/(view)/component_shared/AppMessage';

import { SearchOutlined, MoreOutlined, FilePdfOutlined, LinkOutlined } from '@ant-design/icons';

const DEFAULT_SCROLL_Y = 600;

function getCategoryName(categoryMap, key) {
  if (!key) return '—';
  return categoryMap?.[key]?.name || '—';
}

export default function SOPTable({ sops, categories, onSelectSOP, onEdit, onDelete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // ✅ Modal konfirmasi hapus
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const categoryMap = useMemo(() => {
    const map = {};
    (categories || []).forEach((c) => (map[c.key] = c));
    return map;
  }, [categories]);

  const activeCategories = useMemo(() => (categories || []).filter((c) => c.is_active), [categories]);

  const filteredSOPs = useMemo(() => {
    const q = String(searchQuery || '').toLowerCase();

    return (sops || []).filter((sop) => {
      const matchesSearch =
        String(sop.judul || '').toLowerCase().includes(q) ||
        String(sop.deskripsi || '').toLowerCase().includes(q) ||
        String(sop.created_by || '').toLowerCase().includes(q);

      const matchesCategory = categoryFilter === 'all' || sop.kategori === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [sops, searchQuery, categoryFilter]);

  const openFile = (record) => {
    const url = record?.tipe_file === 'upload' ? record?.file_url : record?.link_url;
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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

      const id = deleteTarget?.id_sop ?? deleteTarget?.id;

      await onDelete?.(id || deleteTarget);

      AppMessage.success('SOP berhasil dihapus');
      closeDeleteConfirm();
    } catch (e) {
      AppMessage.error(e?.message || 'Gagal menghapus SOP');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'JUDUL DOKUMEN',
        dataIndex: 'judul',
        key: 'judul',
        width: 340,
        render: (text) => (
          <div className='min-w-0'>
            <AppTypography.Text size={13} weight={800} className='text-[#003A6F] block truncate' title={text}>
              {text}
            </AppTypography.Text>
          </div>
        ),
      },
      {
        title: 'KATEGORI',
        dataIndex: 'kategori',
        key: 'kategori',
        width: 200,
        render: (key) => {
          const name = getCategoryName(categoryMap, key);
          return (
            <AppTag tone='info' variant='soft'>
              <span className='inline-block max-w-[160px] align-middle truncate' title={name}>
                {name}
              </span>
            </AppTag>
          );
        },
      },
      {
        title: 'FILE',
        key: 'file',
        width: 260,
        render: (_, record) => {
          const isUpload = record?.tipe_file === 'upload';
          const label = isUpload ? 'Dokumen' : 'Link';
          const icon = isUpload ? <FilePdfOutlined /> : <LinkOutlined />;

          return (
            <div onClick={(e) => e.stopPropagation()} className='min-w-0'>
              <AppButton
                variant='link'
                icon={icon}
                className='!px-0 !h-auto !leading-normal !whitespace-normal text-left'
                onClick={() => openFile(record)}
              >
                <span className='inline-block max-w-[200px] truncate align-middle' title={label}>
                  {label}
                </span>
              </AppButton>
            </div>
          );
        },
      },
      {
        title: 'DIBUAT OLEH',
        dataIndex: 'created_by',
        key: 'created_by',
        width: 170,
        render: (t) => <span className='text-slate-700'>{t}</span>,
      },
      {
        title: 'AKSI',
        key: 'action',
        width: 90,
        align: 'center',
        render: (_, record) => {
          const items = [
            { key: 'open', label: 'Buka File/Link', onClick: () => openFile(record) },
            { key: 'view', label: 'Lihat Detail', onClick: () => onSelectSOP?.(record) },
            { key: 'edit', label: 'Edit', onClick: () => onEdit?.(record) },
            { type: 'divider' },
            {
              key: 'delete',
              label: 'Hapus',
              danger: true,
              onClick: () => openDeleteConfirm(record),
            },
          ];

          return (
            <div onClick={(e) => e.stopPropagation()}>
              <AppDropdown items={items} placement='bottomRight'>
                <AppButton
                  aria-label='Menu'
                  variant='ghost'
                  shape='circle'
                  className='!w-8 !h-8 !p-0'
                  icon={<MoreOutlined />}
                />
              </AppDropdown>
            </div>
          );
        },
      },
    ],
    [categoryMap, onSelectSOP, onEdit, onDelete]
  );

  const filterBar = (
    <div className='w-full flex flex-col gap-3'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
        <AppInput
          allowClear
          placeholder='Cari judul, deskripsi, atau pembuat…'
          prefixIcon={<SearchOutlined className='text-gray-400' />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <AppSelect
          allowClear
          placeholder='Filter kategori'
          value={categoryFilter === 'all' ? undefined : categoryFilter}
          onChange={(v) => setCategoryFilter(v ? String(v) : 'all')}
          options={activeCategories.map((c) => ({ value: c.key, label: c.name }))}
        />
      </div>
    </div>
  );

  return (
    <>
      <AppTable
        card
        title='Daftar SOP'
        subtitle='Klik baris untuk melihat detail'
        extra={filterBar}
        rowKey={(r) => r?.id_sop ?? r?.id}
        dataSource={filteredSOPs}
        columns={columns}
        sticky
        tableLayout='fixed'
        scroll={{ y: DEFAULT_SCROLL_Y }}
        onRow={(record) => ({
          onClick: () => onSelectSOP?.(record),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50, 100],
          showTotal: (t, range) => `${range[0]}-${range[1]} dari ${t} SOP`,
        }}
        emptyTitle='Belum ada SOP'
        emptyDescription='Tambahkan SOP baru untuk mulai mengelola dokumen.'
        emptyImage={<div className='text-3xl'>🧾</div>}
      />

      {/* ✅ Modal konfirmasi hapus */}
      <AppModal
        open={deleteOpen}
        onClose={closeDeleteConfirm}
        onCancel={closeDeleteConfirm}
        title='Konfirmasi Hapus SOP'
        width={520}
        footer={
          <div className='flex items-center justify-end gap-2'>
            {/* ✅ Batal jadi outlined merah (bukan biru) */}
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
        destroyOnClose
      >
        <div className='space-y-2'>
          <AppTypography.Text>Anda yakin ingin menghapus SOP berikut?</AppTypography.Text>

          <div className='rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3'>
            <AppTypography.Text weight={800} className='block text-slate-900 truncate' title={deleteTarget?.judul || ''}>
              {deleteTarget?.judul || '—'}
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
