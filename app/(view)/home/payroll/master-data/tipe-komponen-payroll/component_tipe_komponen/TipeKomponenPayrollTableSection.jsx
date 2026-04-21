import { DeleteOutlined, EditOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function TipeKomponenPayrollTableSection({ vm }) {
  const columns = [
    {
      title: 'Nama Tipe Komponen',
      dataIndex: 'nama_tipe_komponen',
      key: 'nama_tipe_komponen',
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
      title: 'Referensi Definisi',
      dataIndex: 'definisi_komponen_count',
      key: 'definisi_komponen_count',
      width: 180,
      render: (value) => (
        <AppTypography.Text
          size={14}
          weight={600}
          className='text-gray-900'
        >
          {value}
        </AppTypography.Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'deleted_at',
      key: 'deleted_at',
      width: 160,
      render: (value) =>
        value ? (
          <AppTag
            tone='danger'
            variant='soft'
          >
            Soft Delete
          </AppTag>
        ) : (
          <AppTag
            tone='success'
            variant='soft'
          >
            Aktif
          </AppTag>
        ),
    },
    {
      title: 'Diupdate',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 200,
      render: (value) => (
        <AppTypography.Text
          size={14}
          className='text-gray-900'
        >
          {vm.formatDateTime(value)}
        </AppTypography.Text>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 140,
      render: (_, item) => (
        <div className='flex items-center gap-2'>
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
        </div>
      ),
    },
  ];

  const hasFetchError = Boolean(vm.error) && vm.filteredData.length === 0 && !vm.loading;

  if (hasFetchError) {
    return (
      <AppEmpty.Card
        title='Gagal memuat data tipe komponen payroll'
        description={vm.error?.message || 'Terjadi kesalahan saat mengambil data dari server.'}
        action={
          <AppButton
            variant='outline'
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

  return (
    <AppTable
      title='Daftar Tipe Komponen Payroll'
      subtitle='Data master ini digunakan sebagai referensi di form definisi komponen payroll.'
      columns={columns}
      dataSource={vm.filteredData}
      loading={vm.loading}
      totalLabel='tipe komponen'
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
      emptyTitle='Belum ada tipe komponen payroll'
      emptyDescription='Tambahkan tipe komponen pertama untuk mulai membangun struktur definisi komponen payroll.'
    />
  );
}
