import { DeleteOutlined, EditOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';

import AppAvatar from '@/app/(view)/component_shared/AppAvatar';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import StatusTag from './StatusTag';

export default function DataTableSection({ vm, hasFetchError }) {
  if (hasFetchError) {
    return (
      <AppEmpty.Card
        title='Gagal memuat profil payroll'
        description={vm.error?.message || 'Terjadi kesalahan saat mengambil data dari server.'}
        action={
          <AppButton
            onClick={vm.reloadData}
            icon={<ReloadOutlined />}
            className='!rounded-lg !px-4 !h-10'
          >
            Coba Lagi
          </AppButton>
        }
      />
    );
  }

  const columns = [
    {
      title: 'Karyawan',
      key: 'karyawan',
      width: 300,
      render: (_, profil) => (
        <div className='flex items-center gap-3 min-w-0'>
          <AppAvatar
            src={profil.foto_profil_user || profil.user?.foto_profil_user || undefined}
            name={profil.user_display_name}
            size='md'
          />

          <div className='min-w-0'>
            <AppTypography.Text
              size={14}
              weight={700}
              className='block text-gray-900 truncate'
            >
              {profil.user_display_name}
            </AppTypography.Text>

            <AppTypography.Text
              size={12}
              className='block text-gray-500 truncate'
            >
              {profil.user_identity}
            </AppTypography.Text>

            <AppTypography.Text
              size={12}
              className='block text-gray-400 truncate'
            >
              {[profil.user_role_or_job, profil.user_department].filter(Boolean).join(' • ') || '-'}
            </AppTypography.Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Jenis Hubungan Kerja',
      dataIndex: 'jenis_hubungan_kerja',
      key: 'jenis_hubungan_kerja',
      width: 180,
      render: (value) => (
        <AppTag
          tone='info'
          variant='soft'
          size='sm'
          className='!font-medium'
        >
          {vm.formatJenisHubungan(value)}
        </AppTag>
      ),
    },
    {
      title: 'Gaji Pokok',
      dataIndex: 'gaji_pokok',
      key: 'gaji_pokok',
      width: 180,
      render: (value) => (
        <AppTypography.Text
          size={14}
          weight={700}
          className='text-gray-900'
        >
          {vm.formatCurrency(value ?? 0)}
        </AppTypography.Text>
      ),
    },
    {
      title: 'Tunjangan BPJS',
      dataIndex: 'tunjangan_bpjs',
      key: 'tunjangan_bpjs',
      width: 180,
      render: (value) => (
        <AppTypography.Text
          size={14}
          weight={700}
          className='text-gray-900'
        >
          {vm.formatCurrency(value ?? 0)}
        </AppTypography.Text>
      ),
    },
    {
      title: 'Tanggal Mulai',
      dataIndex: 'tanggal_mulai_payroll',
      key: 'tanggal_mulai_payroll',
      width: 180,
      render: (value) => (
        <AppTypography.Text
          size={14}
          className='text-gray-900'
        >
          {value ? vm.formatDate(value) : '-'}
        </AppTypography.Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'payroll_aktif',
      key: 'payroll_aktif',
      width: 130,
      render: (value) => <StatusTag active={Boolean(value)} />,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 150,
      render: (_, profil) => (
        <div className='flex items-center gap-2'>
          <AppButton
            onClick={() => vm.openDetailModal(profil)}
            variant='text'
            shape='circle'
            size='middle'
            title='Lihat Detail'
            className='!text-blue-600 hover:!bg-blue-50'
            icon={<EyeOutlined />}
          />

          <AppButton
            onClick={() => vm.openEditModal(profil)}
            variant='text'
            shape='circle'
            size='middle'
            title='Edit'
            className='!text-yellow-600 hover:!bg-yellow-50'
            icon={<EditOutlined />}
          />

          <AppButton
            onClick={() => vm.openDeleteDialog(profil)}
            variant='text'
            shape='circle'
            size='middle'
            title='Hapus'
            className='!text-red-600 hover:!bg-red-50'
            icon={<DeleteOutlined />}
          />
        </div>
      ),
    },
  ];

  return (
    <AppTable
      dataSource={vm.filteredData}
      columns={columns}
      rowKey='id_profil_payroll'
      loading={vm.loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
      scroll={{ x: 1120 }}
      totalLabel='profil payroll'
      emptyTitle={vm.loading ? 'Memuat profil payroll...' : 'Tidak ada data profil payroll'}
      emptyDescription={vm.loading ? 'Data karyawan dan konfigurasi payroll sedang disiapkan.' : 'Coba ubah filter atau tambahkan profil payroll baru.'}
      className='border border-gray-200 shadow-none ring-0 overflow-hidden'
      tableClassName='profile-payroll-table'
    />
  );
}
