'use client';

import { CheckCircleOutlined, DeleteOutlined, EditOutlined, EyeOutlined, FileTextOutlined, InfoCircleOutlined, LockOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function getStatusMeta(status) {
  const map = {
    DRAFT: {
      label: 'Draft',
      tone: 'warning',
      icon: <FileTextOutlined />,
      helper: 'Periode masih disiapkan dan belum digunakan untuk proses transaksi.',
    },
    DIREVIEW: {
      label: 'Dalam Review',
      tone: 'info',
      icon: <InfoCircleOutlined />,
      helper: 'Periode sedang diperiksa sebelum disetujui atau dikunci.',
    },
    DISETUJUI: {
      label: 'Disetujui',
      tone: 'success',
      icon: <CheckCircleOutlined />,
      helper: 'Periode sudah siap digunakan untuk transaksi dan pencairan konsultan.',
    },
    TERKUNCI: {
      label: 'Terkunci',
      tone: 'neutral',
      icon: <LockOutlined />,
      helper: 'Periode sudah dikunci agar data tidak berubah setelah proses selesai.',
    },
  };

  return map[String(status || '').toUpperCase()] || map.DRAFT;
}

function StatusTag({ status }) {
  const meta = getStatusMeta(status);

  return (
    <AppTag
      tone={meta.tone}
      variant='soft'
      size='sm'
      icon={meta.icon}
      className='!font-medium'
    >
      {meta.label}
    </AppTag>
  );
}

export default function PeriodeTableSection({ vm }) {
  const columns = [
    {
      title: 'Periode',
      key: 'periode',
      width: 250,
      render: (_, record) => (
        <div>
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900'
          >
            {vm.formatPeriodeLabel(record)}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='block text-gray-500 mt-0.5'
          >
            Tahun buku {record.tahun}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Rentang Tanggal',
      key: 'tanggal',
      width: 260,
      render: (_, record) => (
        <div>
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900'
          >
            {vm.formatDate(record.tanggal_mulai)}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='block text-gray-500 mt-0.5'
          >
            s/d {vm.formatDate(record.tanggal_selesai)}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Aktivitas',
      key: 'aktivitas',
      width: 220,
      render: (_, record) => (
        <div>
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900'
          >
            {record?._count?.transaksi_konsultan || 0} transaksi
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='block text-gray-500 mt-0.5'
          >
            {record?._count?.payout_konsultan || 0} proses pencairan
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 220,
      render: (_, record) => {
        const meta = getStatusMeta(record.status_periode);

        return (
          <div className='min-w-[180px]'>
            <StatusTag status={record.status_periode} />

            <AppTypography.Text
              size={12}
              className='block text-gray-500 mt-2 leading-5'
            >
              {meta.helper}
            </AppTypography.Text>
          </div>
        );
      },
    },
    {
      title: 'Catatan',
      dataIndex: 'catatan',
      key: 'catatan',
      width: 260,
      render: (value) => (
        <AppTypography.Text
          size={13}
          className='block text-gray-600 leading-6 line-clamp-3'
        >
          {value || 'Belum ada catatan operasional.'}
        </AppTypography.Text>
      ),
    },
    {
      title: 'Aksi',
      key: 'aksi',
      align: 'right',
      width: 220,
      render: (_, record) => (
        <div className='flex items-center justify-end gap-2'>
          <AppButton
            variant='text'
            shape='circle'
            icon={<EyeOutlined />}
            aria-label='Lihat detail periode'
            className='!text-blue-600 hover:!text-blue-700'
            onClick={() => vm.openDetailModal(record)}
          />

          <AppButton
            variant='text'
            shape='circle'
            icon={<EditOutlined />}
            aria-label='Edit periode'
            className='!text-gray-600 hover:!text-gray-700'
            onClick={() => vm.openEditModal(record)}
          />

          <AppButton
            variant='text'
            shape='circle'
            danger
            icon={<DeleteOutlined />}
            aria-label='Hapus periode'
            className='!text-red-600 hover:!text-red-700'
            loading={vm.actionLoadingId === record.id_periode_konsultan}
            confirm={{
              title: 'Hapus periode konsultan',
              content: `Periode ${vm.formatPeriodeLabel(record)} akan dihapus dari daftar aktif. ${record?._count?.transaksi_konsultan || 0} transaksi dan ${record?._count?.payout_konsultan || 0} pencairan yang terhubung juga akan ikut dinonaktifkan. Lanjutkan?`,
              okText: 'Hapus',
              cancelText: 'Batal',
              okType: 'danger',
            }}
            onClick={() => vm.handleDelete(record)}
          />
        </div>
      ),
    },
  ];

  return (
    <AppTable
      title='Daftar Periode Konsultan'
      subtitle='Pantau status periode, rentang tanggal, transaksi, dan pencairan konsultan dalam satu tampilan.'
      columns={columns}
      dataSource={vm.dataSource}
      loading={vm.loading}
      rowKey='id_periode_konsultan'
      totalLabel='periode'
      emptyTitle='Belum ada periode konsultan'
      emptyDescription='Buat periode baru untuk mulai mengelola transaksi dan pencairan konsultan.'
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
    />
  );
}
