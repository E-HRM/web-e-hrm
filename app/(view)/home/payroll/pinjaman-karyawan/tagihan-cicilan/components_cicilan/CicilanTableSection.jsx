'use client';

import { EyeOutlined, LinkOutlined, RollbackOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppTable from '@/app/(view)/component_shared/AppTable';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { StatusTag, UserMeta } from './SectionShared';

function formatCurrencySafe(vm, value, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback;
  return vm.formatCurrency(value);
}

function getPayrollStatusMeta(status) {
  const normalized = String(status || '')
    .trim()
    .toUpperCase();

  const map = {
    DIBAYAR: {
      label: 'Payroll Dibayar',
      tone: 'success',
      helper: 'Cicilan sudah diselesaikan lewat proses payroll.',
    },
    DIPROSES: {
      label: 'Payroll Diproses',
      tone: 'info',
      helper: 'Cicilan sudah masuk payroll periode berjalan.',
    },
    DISETUJUI: {
      label: 'Payroll Disetujui',
      tone: 'info',
      helper: 'Payroll sudah disetujui dan menunggu pembayaran.',
    },
    DRAFT: {
      label: 'Payroll Draft',
      tone: 'warning',
      helper: 'Cicilan sudah terhubung ke payroll, tetapi masih menunggu finalisasi.',
    },
  };

  if (map[normalized]) return map[normalized];

  if (!normalized) {
    return {
      label: 'Terhubung ke Payroll',
      tone: 'info',
      helper: 'Cicilan sudah dikaitkan ke payroll karyawan.',
    };
  }

  return {
    label: normalized
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
    tone: 'info',
    helper: 'Cicilan sudah dikaitkan ke payroll karyawan.',
  };
}

function PayrollInfo({ record }) {
  if (!record.id_payroll_karyawan) {
    return (
      <div className='min-w-[220px]'>
        <AppTag
          tone='warning'
          variant='soft'
          size='sm'
          className='!font-medium'
        >
          Belum Masuk Payroll
        </AppTag>

        <AppTypography.Text
          size={12}
          className='block text-gray-500 mt-2 leading-5'
        >
          Tagihan ini belum dimasukkan ke payroll periode yang sesuai.
        </AppTypography.Text>
      </div>
    );
  }

  const payrollMeta = getPayrollStatusMeta(record.payroll_status);

  return (
    <div className='min-w-[220px]'>
      <AppTypography.Text
        size={13}
        weight={700}
        className='block text-gray-900'
      >
        {record.periode_payroll_label || 'Periode payroll belum tersedia'}
      </AppTypography.Text>

      <AppTypography.Text
        size={12}
        className='block text-gray-500 mt-0.5'
      >
        Sudah masuk payroll karyawan
      </AppTypography.Text>

      <div className='mt-2'>
        <AppTag
          tone={payrollMeta.tone}
          variant='soft'
          size='sm'
          className='!font-medium'
        >
          {payrollMeta.label}
        </AppTag>
      </div>

      <AppTypography.Text
        size={12}
        className='block text-gray-500 mt-2 leading-5'
      >
        {payrollMeta.helper}
      </AppTypography.Text>
    </div>
  );
}

function PinjamanInfo({ record, vm }) {
  return (
    <div className='min-w-[240px]'>
      <AppTypography.Text
        size={14}
        weight={700}
        className='block text-gray-900'
      >
        {record.nama_pinjaman || 'Pinjaman Karyawan'}
      </AppTypography.Text>

      <AppTypography.Text
        size={12}
        className='block text-gray-500 mt-0.5'
      >
        Cicilan / bulan {formatCurrencySafe(vm, record.pinjaman_karyawan?.nominal_cicilan, 'belum tersedia')}
      </AppTypography.Text>

      <AppTypography.Text
        size={12}
        className='block text-gray-500'
      >
        Tenor {record.pinjaman_karyawan?.tenor_bulan || 0} bulan
      </AppTypography.Text>

      <AppTypography.Text
        size={12}
        className='block text-gray-500'
      >
        Sisa saldo {formatCurrencySafe(vm, record.pinjaman_karyawan?.sisa_saldo, 'belum tersedia')}
      </AppTypography.Text>
    </div>
  );
}

export default function CicilanTableSection({ vm }) {
  if (vm.error && vm.cicilanList.length === 0) {
    return (
      <AppEmpty.Card
        title='Data cicilan gagal dimuat'
        description={vm.error?.message || 'Terjadi kesalahan saat mengambil data cicilan pinjaman.'}
        action={
          <AppButton
            variant='outline'
            onClick={vm.reloadData}
            className='!rounded-lg'
          >
            Muat Ulang
          </AppButton>
        }
      />
    );
  }

  const columns = [
    {
      title: 'Karyawan',
      key: 'karyawan',
      width: 280,
      render: (_, record) =>
        record.user ? (
          <UserMeta
            user={record.user}
            vm={vm}
            compact
          />
        ) : (
          <div>
            <AppTypography.Text
              size={14}
              weight={700}
              className='block text-gray-900'
            >
              {record.nama_karyawan}
            </AppTypography.Text>

            <AppTypography.Text
              size={12}
              className='block text-gray-500'
            >
              {record.identitas_karyawan}
            </AppTypography.Text>
          </div>
        ),
    },
    {
      title: 'Pinjaman',
      key: 'pinjaman',
      width: 260,
      render: (_, record) => (
        <PinjamanInfo
          record={record}
          vm={vm}
        />
      ),
    },
    {
      title: 'Jatuh Tempo',
      dataIndex: 'jatuh_tempo',
      key: 'jatuh_tempo',
      width: 200,
      render: (value, record) => (
        <div>
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900'
          >
            {vm.formatDate(value)}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='block text-gray-500 mt-0.5'
          >
            Periode tagihan {record.periode_tagihan_label}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Nominal',
      key: 'nominal',
      width: 220,
      render: (_, record) => (
        <div>
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900'
          >
            {vm.formatCurrency(record.nominal_tagihan)}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='block text-gray-500 mt-0.5'
          >
            Terbayar {vm.formatCurrency(record.nominal_terbayar)}
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='block text-gray-500'
          >
            Sisa tagihan {vm.formatCurrency(record.outstanding_nominal)}
          </AppTypography.Text>
        </div>
      ),
    },
    {
      title: 'Payroll',
      key: 'payroll',
      width: 260,
      render: (_, record) => <PayrollInfo record={record} />,
    },
    {
      title: 'Status',
      key: 'status',
      width: 220,
      render: (_, record) => {
        const statusMeta = vm.getStatusCicilanMeta(record.status_cicilan);

        return (
          <div className='min-w-[180px]'>
            <StatusTag status={record.status_cicilan} />

            <AppTypography.Text
              size={12}
              className='block text-gray-500 mt-2 leading-5'
            >
              {statusMeta.helper}
            </AppTypography.Text>
          </div>
        );
      },
    },
    {
      title: 'Aksi',
      key: 'aksi',
      align: 'right',
      width: 340,
      render: (_, record) => {
        const isActionLoading = vm.actionLoadingId === record.id_cicilan_pinjaman_karyawan;

        return (
          <div className='flex items-center justify-end gap-2'>
            <AppButton
              variant='text'
              shape='circle'
              icon={<EyeOutlined />}
              aria-label='Lihat detail cicilan'
              className='!text-blue-600 hover:!text-blue-700'
              onClick={() => vm.openDetailModal(record)}
            />

            {vm.canPostToPayroll(record) ? (
              <AppButton
                size='small'
                icon={<LinkOutlined />}
                loading={isActionLoading}
                disabled={isActionLoading}
                onClick={() => vm.openPostModal(record)}
                className='!rounded-lg !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
              >
                Masukkan ke Payroll
              </AppButton>
            ) : null}

            {vm.canUnpostFromPayroll(record) ? (
              <AppButton
                size='small'
                variant='outline'
                icon={<RollbackOutlined />}
                loading={isActionLoading}
                disabled={isActionLoading}
                onClick={() => vm.handleUnpostFromPayroll(record)}
                className='!rounded-lg'
              >
                Lepas Posting
              </AppButton>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <AppTable
      title='Daftar Cicilan Pinjaman'
      subtitle='Pantau cicilan pinjaman karyawan, hubungan dengan payroll, dan tindak lanjut pembayarannya dari satu halaman.'
      columns={columns}
      dataSource={vm.dataSource}
      loading={vm.loading || vm.validating}
      rowKey='id_cicilan_pinjaman_karyawan'
      totalLabel='tagihan'
      emptyTitle='Tidak ada tagihan cicilan ditemukan'
      emptyDescription='Coba ubah filter pencarian atau periksa kembali data pinjaman yang aktif.'
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
    />
  );
}
