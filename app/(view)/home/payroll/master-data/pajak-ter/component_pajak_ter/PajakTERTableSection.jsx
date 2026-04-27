import { DeleteOutlined, EditOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function PajakTERTableSection({ vm }) {
  const columns = [
    {
      title: 'Kode Kategori Pajak',
      dataIndex: 'kode_kategori_pajak',
      key: 'kode_kategori_pajak',
      render: (_, tarif) => (
        <div>
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900'
          >
            {vm.formatKodeKategoriPajak(tarif.kode_kategori_pajak)}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Penghasilan Dari',
      dataIndex: 'penghasilan_dari',
      key: 'penghasilan_dari',
      render: (value) => (
        <AppTypography.Text
          size={14}
          className='text-gray-900'
        >
          {vm.formatCurrency(value)}
        </AppTypography.Text>
      ),
    },
    {
      title: 'Penghasilan Sampai',
      dataIndex: 'penghasilan_sampai',
      key: 'penghasilan_sampai',
      render: (value) => (
        <AppTypography.Text
          size={14}
          className='text-gray-900'
        >
          {value === null || value === undefined || value === '' ? 'Tidak terbatas' : vm.formatCurrency(value)}
        </AppTypography.Text>
      ),
    },
    {
      title: 'Tarif Pajak',
      dataIndex: 'persen_tarif',
      key: 'persen_tarif',
      render: (value) => (
        <AppTag
          tone='info'
          variant='soft'
          size='sm'
          className='!font-semibold'
        >
          {vm.formatPercent(value)}%
        </AppTag>
      ),
    },
    {
      title: 'Periode Berlaku',
      key: 'periode_berlaku',
      render: (_, tarif) => (
        <div>
          <AppTypography.Text
            size={14}
            className='block text-gray-900'
          >
            {vm.formatDate(tarif.berlaku_mulai)}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='text-gray-500'
          >
            {tarif.berlaku_sampai ? `s/d ${vm.formatDate(tarif.berlaku_sampai)}` : 'Tidak terbatas'}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 140,
      render: (_, tarif) => (
        <div className='flex items-center gap-2'>
          <AppButton
            variant='text'
            shape='circle'
            size='middle'
            aria-label='Detail'
            className='!text-blue-600 hover:!bg-blue-50'
            icon={<EyeOutlined />}
            onClick={() => vm.openDetailModal(tarif)}
          />

          <AppButton
            variant='text'
            shape='circle'
            size='middle'
            aria-label='Edit'
            className='!text-yellow-600 hover:!bg-yellow-50'
            icon={<EditOutlined />}
            onClick={() => vm.openEditModal(tarif)}
          />

          <AppButton
            variant='text'
            shape='circle'
            size='middle'
            aria-label='Hapus'
            className='!text-red-600 hover:!bg-red-50'
            icon={<DeleteOutlined />}
            onClick={() => vm.openDeleteDialog(tarif)}
          />
        </div>
      ),
    },
  ];

  const hasFetchError = Boolean(vm.error) && vm.sortedData.length === 0 && !vm.loading;

  if (hasFetchError) {
    return (
      <AppEmpty.Card
        title='Gagal memuat data tarif pajak TER'
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

  if (vm.sortedData.length === 0 && !vm.loading) {
    return (
      <AppEmpty.Card
        title='Tidak ada data tarif pajak TER'
        description='Ubah filter atau tambahkan tarif baru untuk mulai mengelola data TER.'
      />
    );
  }

  return (
    <AppTable
      card
      rowKey='id_tarif_pajak_ter'
      columns={columns}
      dataSource={vm.sortedData}
      loading={vm.loading || vm.validating || vm.isPreparingEdit}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
      totalLabel='tarif'
      emptyTitle='Tidak ada data tarif pajak TER'
      emptyDescription='Belum ada data yang sesuai dengan filter.'
    />
  );
}
