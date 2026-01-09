'use client';

import React, { useMemo, useState } from 'react';

import AppTable from '@/app/(view)/component_shared/AppTable';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppDropdown from '@/app/(view)/component_shared/AppDropdown';

import { SearchOutlined, MoreOutlined, FileTextOutlined, LinkOutlined } from '@ant-design/icons';

const DEFAULT_SCROLL_Y = 600;

export default function SOPTable({ sops, categories, onSelectSOP, onEdit, onDelete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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

  const columns = useMemo(
    () => [
      {
        title: 'JUDUL SOP',
        dataIndex: 'judul',
        key: 'judul',
        width: 360,
        render: (text, record) => (
          <div className='min-w-0'>
            <button type='button' onClick={() => onSelectSOP?.(record)} className='text-left w-full' title={text}>
              <AppTypography.Text size={13} weight={800} className='text-[#003A6F] block truncate'>
                {text}
              </AppTypography.Text>
            </button>
            <AppTypography.Text size={12} tone='muted' className='text-slate-500 block'>
              Versi {record.versi || '—'}
            </AppTypography.Text>
          </div>
        ),
      },
      {
        title: 'KATEGORI',
        dataIndex: 'kategori',
        key: 'kategori',
        width: 220,
        render: (key) => (
          <AppTag tone='info' variant='soft'>
            {categoryMap[key]?.name || key}
          </AppTag>
        ),
      },
      {
        title: 'TIPE',
        dataIndex: 'tipe_file',
        key: 'tipe_file',
        width: 90,
        align: 'center',
        render: (tipe) =>
          tipe === 'upload' ? (
            <FileTextOutlined style={{ fontSize: 18, color: '#10B981' }} />
          ) : (
            <LinkOutlined style={{ fontSize: 18, color: '#003A6F' }} />
          ),
      },
      {
        title: 'DIBUAT OLEH',
        dataIndex: 'created_by',
        key: 'created_by',
        width: 180,
        render: (t) => <span className='text-slate-700'>{t}</span>,
      },
      {
        title: 'AKSI',
        key: 'action',
        width: 90,
        align: 'center',
        render: (_, record) => {
          const items = [
            { key: 'view', label: 'Lihat Detail', onClick: () => onSelectSOP?.(record) },
            { key: 'edit', label: 'Edit', onClick: () => onEdit?.(record) },
            { type: 'divider' },
            {
              key: 'delete',
              label: 'Hapus',
              danger: true,
              onClick: () => {
                const ok = window.confirm('Apakah Anda yakin ingin menghapus SOP ini?');
                if (ok) onDelete?.(record.id_sop);
              },
            },
          ];

          return (
            <AppDropdown items={items} placement='bottomRight'>
              <AppButton aria-label='Menu' variant='ghost' shape='circle' className='!w-8 !h-8 !p-0' icon={<MoreOutlined />} />
            </AppDropdown>
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

      <div className='flex items-center justify-between gap-2 flex-wrap'>
        <AppTypography.Text tone='secondary'>
          Menampilkan <b>{filteredSOPs.length}</b> SOP
        </AppTypography.Text>

        <AppTag tone='neutral' variant='soft'>
          {activeCategories.length} kategori aktif
        </AppTag>
      </div>
    </div>
  );

  return (
    <AppTable
      card
      title='Daftar SOP'
      subtitle='Kelola SOP berdasarkan kategori'
      extra={filterBar}
      rowKey='id_sop'
      dataSource={filteredSOPs}
      columns={columns}
      sticky
      tableLayout='fixed'
      scroll={{ y: DEFAULT_SCROLL_Y }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: [5, 10, 20, 50, 100],
        showTotal: (t, range) => `${range[0]}-${range[1]} dari ${t} SOP`,
      }}
      emptyTitle='Belum ada SOP'
      emptyDescription='Tambahkan SOP baru untuk mulai mengelola dokumen.'
      emptyImage={<div className='text-3xl'>🧾</div>}
      rowClassName={() => 'no-hover-row'}
    />
  );
}
