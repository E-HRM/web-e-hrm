// app/(view)/home/finance/category_management/FinanceCategoryManagementContent.jsx
'use client';

import React, { useMemo } from 'react';
import { Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppTooltip from '@/app/(view)/component_shared/AppTooltip';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import useFinanceCategoryManagementViewModel from './useFinanceCategoryManagementViewModel';
import FinanceCategoryModal from './FinanceCategoryModal';

const DEFAULT_SCROLL_Y = 520;

function fmtDateTime(v) {
  try {
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID');
  } catch {
    return '-';
  }
}

export default function FinanceCategoryManagementContent() {
  const vm = useFinanceCategoryManagementViewModel();

  const columns = useMemo(() => {
    const offset = ((vm.pagination?.page ?? 1) - 1) * (vm.pagination?.pageSize ?? 10);

    return [
      {
        title: 'NO',
        key: 'no',
        width: 70,
        align: 'center',
        render: (_r, __, index) => (
          <AppTypography.Text size={12} weight={700} tone='muted'>
            {offset + index + 1}
          </AppTypography.Text>
        ),
      },
      {
        title: 'NAMA KEPERLUAN',
        dataIndex: 'nama',
        key: 'nama',
        ellipsis: true,
        render: (text) => (
          <AppTypography.Text size={13} weight={700} className='text-slate-900 block truncate' title={text}>
            {text}
          </AppTypography.Text>
        ),
      },
      {
        title: 'DIBUAT',
        key: 'created_at',
        width: 200,
        render: (r) => (
          <AppTypography.Text size={12} tone='muted'>
            {fmtDateTime(r?.created_at)}
          </AppTypography.Text>
        ),
      },
      {
        title: 'DIUPDATE',
        key: 'updated_at',
        width: 200,
        render: (r) => (
          <AppTypography.Text size={12} tone='muted'>
            {fmtDateTime(r?.updated_at)}
          </AppTypography.Text>
        ),
      },
      {
        title: 'AKSI',
        key: 'action',
        width: 160,
        align: 'center',
        render: (r) => (
          <AppSpace>
            <AppTooltip title='Edit'>
              <AppButton size='small' icon={<EditOutlined />} onClick={() => vm.openEdit(r)} />
            </AppTooltip>
            <AppTooltip title='Hapus'>
              <AppButton
                size='small'
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Konfirmasi Hapus',
                    content: `Hapus kategori "${r?.nama}" ?`,
                    okText: 'Hapus',
                    cancelText: 'Batal',
                    okButtonProps: { danger: true },
                    onOk: async () => {
                      await vm.deleteItem(r);
                    },
                  });
                }}
              />
            </AppTooltip>
          </AppSpace>
        ),
      },
    ];
  }, [vm]);

  return (
    <AppCard className='shadow-sm border-0'>
      <div className='flex items-center justify-between gap-2 flex-wrap mb-4'>
        <div>
          <AppTypography.Title level={4} className='!mb-0'>
            Manajemen Kategori Keperluan
          </AppTypography.Title>
          <AppTypography.Text tone='secondary'>
            Total: <b>{vm.pagination?.total ?? 0}</b>
          </AppTypography.Text>
        </div>

        <div className='flex items-center gap-2 flex-wrap'>
          <div className='w-72'>
            <AppInput
              allowClear
              placeholder='Cari kategori…'
              prefixIcon={<SearchOutlined className='text-gray-400' />}
              value={vm.search}
              onChange={(e) => vm.setSearch(e.target.value)}
            />
          </div>

          <AppButton variant='primary' icon={<PlusOutlined />} onClick={vm.openCreate}>
            Tambah Kategori
          </AppButton>
        </div>
      </div>

      <AppTable
        rowKey='id'
        dataSource={vm.items}
        columns={columns}
        sticky
        card
        tableLayout='fixed'
        scroll={{ y: DEFAULT_SCROLL_Y }}
        pagination={{
          current: vm.pagination?.page ?? 1,
          pageSize: vm.pagination?.pageSize ?? 10,
          total: vm.pagination?.total ?? 0,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50, 100],
          showTotal: (t, range) => `${range[0]}-${range[1]} dari ${t} data`,
          onChange: (p, ps) => vm.onPageChange(p, ps),
        }}
        emptyTitle='Belum ada kategori'
        emptyDescription='Tambahkan kategori untuk mulai mengelola data.'
        emptyImage={<div className='text-3xl'>🗂️</div>}
        rowClassName={() => 'no-hover-row'}
      />

      <FinanceCategoryModal
        open={vm.modalOpen}
        mode={vm.modalMode}
        initialName={vm.editingItem?.nama}
        loading={vm.isLoading}
        onCancel={vm.closeModal}
        onSubmit={vm.submitForm}
      />
    </AppCard>
  );
}
