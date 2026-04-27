'use client';

import { DeleteOutlined, EditOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMemo } from 'react';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { ShareTag, StatusTag } from './ProdukKonsultanShared';

export default function ProdukKonsultanTableSection({ vm }) {
  const columns = useMemo(
    () => [
      {
        title: 'Nama Produk',
        dataIndex: 'nama_produk',
        key: 'nama_produk',
        render: (value) => (
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900'
          >
            {value}
          </AppTypography.Text>
        ),
      },
      {
        title: 'Share Default',
        dataIndex: 'persen_share_default',
        key: 'persen_share_default',
        width: 180,
        render: (value) => <ShareTag value={value} />,
      },
      {
        title: 'Status',
        dataIndex: 'aktif',
        key: 'aktif',
        width: 160,
        render: (value) => <StatusTag aktif={value} />,
      },
      {
        title: 'Catatan',
        dataIndex: 'catatan',
        key: 'catatan',
        ellipsis: true,
        render: (value) => (
          <AppTypography.Text
            size={13}
            className='text-gray-600'
          >
            {value || '-'}
          </AppTypography.Text>
        ),
      },
      {
        title: 'Aksi',
        key: 'action',
        width: 140,
        render: (_, item) => (
          <AppSpace size='xs'>
            <AppButton
              variant='text'
              shape='circle'
              size='middle'
              aria-label='Detail'
              className='!text-blue-600 hover:!bg-blue-50'
              icon={<EyeOutlined />}
              onClick={() => vm.openDetailModal(item)}
            />

            <AppButton
              variant='text'
              shape='circle'
              size='middle'
              aria-label='Edit'
              className='!text-yellow-600 hover:!bg-yellow-50'
              icon={<EditOutlined />}
              onClick={() => vm.openEditModal(item)}
            />

            <AppButton
              variant='text'
              shape='circle'
              size='middle'
              aria-label='Hapus'
              className='!text-red-600 hover:!bg-red-50'
              icon={<DeleteOutlined />}
              onClick={() => vm.openDeleteDialog(item)}
            />
          </AppSpace>
        ),
      },
    ],
    [vm],
  );

  const hasFetchError = Boolean(vm.error) && vm.filteredData.length === 0 && !vm.loading;

  if (hasFetchError) {
    return (
      <AppEmpty.Card
        title='Gagal memuat data produk konsultan'
        description={vm.error?.message || 'Terjadi kesalahan saat mengambil data dari server.'}
        action={
          <AppButton
            onClick={vm.reloadData}
            icon={<ReloadOutlined />}
            className='!h-10 !rounded-lg !px-4'
          >
            Coba Lagi
          </AppButton>
        }
      />
    );
  }

  if (vm.filteredData.length === 0 && !vm.loading) {
    return (
      <AppEmpty.Card
        title='Belum ada produk konsultan'
        description='Tambahkan produk pertama untuk mulai menyusun master transaksi konsultan.'
      />
    );
  }

  return (
    <AppTable
      title='Daftar Produk Konsultan'
      subtitle='Master produk konsultan yang aktif dapat digunakan pada transaksi baru.'
      columns={columns}
      dataSource={vm.filteredData}
      rowKey='id_jenis_produk_konsultan'
      loading={vm.loading || vm.refreshing || vm.isPreparingEdit}
      totalLabel='produk konsultan'
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
      emptyTitle='Belum ada produk konsultan'
      emptyDescription='Belum ada data yang sesuai dengan filter saat ini.'
    />
  );
}
