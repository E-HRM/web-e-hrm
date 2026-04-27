'use client';

import React, { useMemo, useState } from 'react';
import { DownloadOutlined, FileTextOutlined, LinkOutlined, MoreOutlined, SearchOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppDropdown from '@/app/(view)/component_shared/AppDropdown';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppMessage from '@/app/(view)/component_shared/AppMessage';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

const DEFAULT_SCROLL_Y = 600;

function formatDateTime(value) {
  try {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

function openTemplateFile(record) {
  const url = String(record?.file_template_url || '').trim();
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function MasterTemplateTable({ templates, loading, onSelectTemplate, onEdit, onDelete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredTemplates = useMemo(() => {
    const needle = String(searchQuery || '')
      .trim()
      .toLowerCase();
    if (!needle) return templates || [];

    return (templates || []).filter((item) => {
      return (
        String(item?.nama_template || '')
          .toLowerCase()
          .includes(needle) ||
        String(item?.file_name || '')
          .toLowerCase()
          .includes(needle) ||
        String(item?.file_template_url || '')
          .toLowerCase()
          .includes(needle)
      );
    });
  }, [templates, searchQuery]);

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
      await onDelete?.(deleteTarget);
      AppMessage.success('Template berhasil dihapus');
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      AppMessage.error(error?.message || 'Gagal menghapus template');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'NAMA TEMPLATE',
        dataIndex: 'nama_template',
        key: 'nama_template',
        width: 240,
        render: (text) => (
          <div className='min-w-0'>
            <AppTypography.Text
              size={13}
              weight={800}
              className='block truncate text-[#003A6F]'
              title={text}
            >
              {text}
            </AppTypography.Text>
          </div>
        ),
      },
      {
        title: 'SUMBER',
        dataIndex: 'source_type',
        key: 'source_type',
        width: 120,
        render: (value) => {
          const isUpload = value !== 'link';
          return (
            <AppTag
              tone={isUpload ? 'info' : 'warning'}
              variant='soft'
            >
              {isUpload ? 'Upload' : 'Link'}
            </AppTag>
          );
        },
      },
      {
        title: 'FILE TEMPLATE',
        key: 'file',
        width: 240,
        render: (_, record) => {
          const isUpload = record?.source_type !== 'link';
          const icon = isUpload ? <FileTextOutlined /> : <LinkOutlined />;
          const label = isUpload ? record?.file_name || 'Buka file' : 'Buka link';

          return (
            <div
              onClick={(event) => event.stopPropagation()}
              className='min-w-0'
            >
              <AppButton
                variant='link'
                icon={icon}
                className='!px-0 !h-auto !leading-normal !whitespace-normal text-left'
                onClick={() => openTemplateFile(record)}
              >
                {/* <span className='inline-block max-w-[180px] truncate align-middle' title={label}>
                  {label}
                </span> */}
              </AppButton>
            </div>
          );
        },
      },
      {
        title: 'DIBUAT',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 170,
        render: (value) => (
          <AppTypography.Text
            size={12}
            tone='muted'
          >
            {formatDateTime(value)}
          </AppTypography.Text>
        ),
      },
      {
        title: 'DIUPDATE',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 170,
        render: (value) => (
          <AppTypography.Text
            size={12}
            tone='muted'
          >
            {formatDateTime(value)}
          </AppTypography.Text>
        ),
      },
      {
        title: 'AKSI',
        key: 'action',
        width: 60,
        align: 'center',
        render: (_, record) => {
          const items = [
            { key: 'open', label: 'Buka Template', onClick: () => openTemplateFile(record) },
            { key: 'view', label: 'Lihat Detail', onClick: () => onSelectTemplate?.(record) },
            { key: 'edit', label: 'Edit', onClick: () => onEdit?.(record) },
            { type: 'divider' },
            { key: 'delete', label: 'Hapus', danger: true, onClick: () => openDeleteConfirm(record) },
          ];

          return (
            <div onClick={(event) => event.stopPropagation()}>
              <AppDropdown
                items={items}
                placement='bottomRight'
              >
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
    [onEdit, onDelete, onSelectTemplate],
  );

  const filterBar = (
    <div className='w-full'>
      <AppInput
        allowClear
        placeholder='Cari nama template atau nama file...'
        prefixIcon={<SearchOutlined className='text-gray-400' />}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
      />
    </div>
  );

  return (
    <>
      <AppTable
        card
        title='Daftar Template'
        subtitle='Klik baris untuk melihat detail template'
        extra={filterBar}
        rowKey={(record) => record?.id_master_template || record?.id}
        dataSource={filteredTemplates}
        columns={columns}
        loading={loading}
        sticky
        tableLayout='fixed'
        scroll={{ y: DEFAULT_SCROLL_Y }}
        onRow={(record) => ({
          onClick: () => onSelectTemplate?.(record),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50, 100],
          showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} template`,
        }}
        emptyTitle='Belum ada template'
        emptyDescription='Tambahkan template baru untuk mulai mengelola file payroll.'
        emptyImage={<DownloadOutlined className='text-3xl text-slate-300' />}
      />

      <AppModal
        open={deleteOpen}
        onClose={closeDeleteConfirm}
        onCancel={closeDeleteConfirm}
        title='Konfirmasi Hapus Template'
        width={520}
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
        destroyOnClose
      >
        <div className='space-y-2'>
          <AppTypography.Text>Anda yakin ingin menghapus template berikut?</AppTypography.Text>

          <div className='rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3'>
            <AppTypography.Text
              weight={800}
              className='block text-slate-900 truncate'
              title={deleteTarget?.nama_template || ''}
            >
              {deleteTarget?.nama_template || '-'}
            </AppTypography.Text>
            <AppTypography.Text
              tone='muted'
              className='block'
            >
              Template akan disembunyikan dari daftar aktif.
            </AppTypography.Text>
          </div>
        </div>
      </AppModal>
    </>
  );
}
