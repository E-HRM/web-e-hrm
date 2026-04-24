'use client';

import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { getPeriodePayrollStatusMeta } from '../utils/periodePayrollUtils';

function StatusTag({ status }) {
  const meta = getPeriodePayrollStatusMeta(status);

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

export default function PeriodePayrollTableSection({ vm }) {
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
            {vm.formatPeriodeLabel(record)}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='mt-0.5 block text-gray-500'
          >
            Tahun {record.tahun}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Rentang Tanggal',
      key: 'tanggal',
      width: 240,
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
            className='mt-0.5 block text-gray-500'
          >
            s/d {vm.formatDate(record.tanggal_selesai)}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Data Terkait',
      key: 'aktivitas',
      width: 240,
      render: (_, record) => (
        <div>
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900'
          >
            {record?._count?.payroll_karyawan || 0} data payroll
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='mt-0.5 block text-gray-500'
          >
            {record?._count?.payout_konsultan ?? record?._count?.payoutKonsultans ?? 0} payout konsultan
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 240,
      render: (_, record) => {
        const meta = getPeriodePayrollStatusMeta(record.status_periode);

        return (
          <div className='min-w-[180px]'>
            <StatusTag status={record.status_periode} />

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
      title: 'Template Slip Gaji',
      key: 'template',
      width: 240,
      render: (_, record) => (
        <div>
          <AppTypography.Text
            size={13}
            weight={700}
            className='block text-gray-900'
          >
            {vm.resolveTemplateLabel(record)}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='mt-0.5 block text-gray-500'
          >
            {record?.master_template?.file_template_url ? 'Template slip gaji sudah dipilih' : 'Belum memilih template slip gaji'}
          </AppTypography.Text>
        </div>
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
          {value || 'Belum ada catatan.'}
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
            aria-label='Lihat detail periode payroll'
            className='!text-blue-600 hover:!text-blue-700'
            onClick={() => vm.openDetailModal(record)}
          />

          <AppButton
            variant='text'
            shape='circle'
            icon={<EditOutlined />}
            aria-label='Edit periode payroll'
            className='!text-gray-600 hover:!text-gray-700'
            onClick={() => vm.openEditModal(record)}
          />

          <AppButton
            variant='text'
            shape='circle'
            danger
            icon={<DeleteOutlined />}
            aria-label='Hapus periode payroll'
            className='!text-red-600 hover:!text-red-700'
            loading={vm.actionLoadingId === record.id_periode_payroll}
            confirm={{
              title: 'Hapus periode payroll',
              content: `Periode ${vm.formatPeriodeLabel(record)} akan dihapus permanen. ${record?._count?.payroll_karyawan || 0} data payroll karyawan yang terkait akan ikut dihapus dan ${record?._count?.payout_konsultan ?? record?._count?.payoutKonsultans ?? 0} payout konsultan akan dilepaskan dari periode ini. Lanjutkan?`,
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
      title='Daftar Periode Payroll'
      subtitle='Pantau rentang tanggal, status proses, template slip gaji, data payroll karyawan, dan payout konsultan dalam satu tampilan.'
      columns={columns}
      dataSource={vm.dataSource}
      loading={vm.loading}
      rowKey='id_periode_payroll'
      totalLabel='periode'
      emptyTitle='Belum ada periode payroll'
      emptyDescription='Buat periode payroll untuk mulai mengelompokkan proses penggajian.'
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
    />
  );
}
