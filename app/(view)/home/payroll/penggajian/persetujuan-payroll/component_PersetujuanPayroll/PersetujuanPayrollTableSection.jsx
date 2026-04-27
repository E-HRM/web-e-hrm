'use client';

import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { formatDateTime, getKeputusanMeta } from '../utils/persetujuanPayrollUtils';

function KeputusanTag({ keputusan }) {
  const meta = getKeputusanMeta(keputusan);

  return (
    <AppTag
      tone={meta.tone}
      variant='soft'
      size='sm'
      className='!font-medium'
    >
      {meta.label}
    </AppTag>
  );
}

export default function PersetujuanPayrollTableSection({ vm }) {
  const columns = [
    {
      title: 'Periode',
      key: 'periode',
      width: 220,
      render: (_, record) => (
        <div>
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900'
          >
            {record.periode_label}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='mt-0.5 block text-gray-500'
          >
            Level {record.level}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Penyetuju',
      key: 'penyetuju',
      width: 280,
      render: (_, record) => (
        <div>
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900'
          >
            {record.approver_display_name}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='mt-0.5 block text-gray-500'
          >
            {record.penyetuju?.email || 'Persetujuan berbasis role'}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Keputusan',
      key: 'keputusan',
      width: 220,
      render: (_, record) => {
        const meta = getKeputusanMeta(record.keputusan);

        return (
          <div className='min-w-[180px]'>
            <KeputusanTag keputusan={record.keputusan} />

            <AppTypography.Text
              size={12}
              className='mt-2 block leading-5 text-gray-500'
            >
              {meta.helper}
            </AppTypography.Text>
          </div>
        );
      },
    },
    {
      title: 'Diputuskan',
      key: 'diputuskan_pada',
      width: 220,
      render: (_, record) => (
        <AppTypography.Text
          size={13}
          className='block leading-6 text-gray-600'
        >
          {formatDateTime(record.diputuskan_pada)}
        </AppTypography.Text>
      ),
    },
    {
      title: 'Catatan',
      dataIndex: 'catatan',
      key: 'catatan',
      width: 260,
      render: (value) => (
        <AppTypography.Text
          size={13}
          className='block leading-6 text-gray-600 line-clamp-3'
        >
          {value || 'Belum ada catatan approval.'}
        </AppTypography.Text>
      ),
    },
    {
      title: 'Aksi',
      key: 'aksi',
      align: 'right',
      width: 200,
      render: (_, record) => (
        <div className='flex items-center justify-end gap-2'>
          <AppButton
            variant='text'
            shape='circle'
            icon={<EyeOutlined />}
            aria-label='Lihat detail approval'
            className='!text-blue-600 hover:!text-blue-700'
            onClick={() => vm.openDetailModal(record)}
          />

          <AppButton
            variant='text'
            shape='circle'
            icon={<EditOutlined />}
            aria-label='Edit approval'
            className='!text-gray-600 hover:!text-gray-700'
            onClick={() => vm.openEditModal(record)}
          />

          <AppButton
            variant='text'
            shape='circle'
            danger
            icon={<DeleteOutlined />}
            aria-label='Hapus approval'
            className='!text-red-600 hover:!text-red-700'
            loading={vm.actionLoadingId === record.id_persetujuan_periode_payroll}
            confirm={{
              title: 'Hapus persetujuan payroll',
              content: `Approval level ${record.level} untuk periode ${record.periode_label} akan di-soft delete. Lanjutkan?`,
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
      title='Daftar Persetujuan Payroll'
      subtitle='Lacak approval per level, approver, keputusan, dan waktu keputusan untuk setiap periode payroll.'
      columns={columns}
      dataSource={vm.dataSource}
      loading={vm.loading}
      rowKey='id_persetujuan_periode_payroll'
      totalLabel='approval'
      emptyTitle='Belum ada persetujuan payroll'
      emptyDescription='Buat approval baru untuk mulai membangun jalur persetujuan payroll per periode.'
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
    />
  );
}
