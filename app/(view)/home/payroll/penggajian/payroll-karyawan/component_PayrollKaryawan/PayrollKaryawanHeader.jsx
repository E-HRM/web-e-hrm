// app/(view)/home/payroll/payroll-karyawan/component_PayrollKaryawan/PayrollKaryawanHeader.jsx
'use client';

import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function PayrollKaryawanHeader({ vm }) {
  return (
    <div className='mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
      <div>
        <AppTypography.Title
          level={2}
          className='!mb-2 !text-gray-900'
        >
          {vm.focusedPeriode ? `Detail Proses ${vm.getPeriodeInfo(vm.focusedPeriode.id_periode_payroll)}` : 'Payroll Karyawan'}
        </AppTypography.Title>

        <AppTypography.Text
          size={16}
          className='text-gray-600'
        >
          {vm.focusedPeriode ? 'Pantau payroll karyawan untuk periode terpilih lalu lanjutkan ke item komponen payroll.' : 'Kelola transaksi payroll per karyawan dan periode.'}
        </AppTypography.Text>
      </div>

      <div className='flex items-center gap-3'>
        {vm.focusedPeriode ? (
          <AppButton
            variant='outline'
            href='/home/payroll/penggajian/periode-payroll'
            icon={<ArrowLeftOutlined />}
            className='!rounded-lg'
          >
            Kembali ke Periode
          </AppButton>
        ) : null}

        <AppButton
          variant='outline'
          icon={<ReloadOutlined />}
          loading={vm.validating}
          onClick={vm.reloadData}
          className='!rounded-lg'
        >
          Muat Ulang
        </AppButton>
      </div>
    </div>
  );
}
