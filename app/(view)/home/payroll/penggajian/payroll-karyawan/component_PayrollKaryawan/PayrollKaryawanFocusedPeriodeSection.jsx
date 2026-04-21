// app/(view)/home/payroll/payroll-karyawan/component_PayrollKaryawan/PayrollKaryawanFocusedPeriodeSection.jsx
'use client';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function PayrollKaryawanFocusedPeriodeSection({ vm }) {
  return (
    <AppCard
      rounded='lg'
      ring={false}
      shadow='none'
      className='border border-blue-200 bg-blue-50 mb-6'
      bodyStyle={{ padding: 20 }}
    >
      <AppTypography.Text
        size={14}
        weight={700}
        className='block text-blue-900'
      >
        Periode aktif: {vm.getPeriodeInfo(vm.focusedPeriode.id_periode_payroll)}
      </AppTypography.Text>

      <AppTypography.Text
        size={13}
        className='block text-blue-700 mt-1'
      >
        Gunakan daftar ini untuk menambah payroll per karyawan, mengatur approval payroll, lalu lanjut ke item komponen payroll.
      </AppTypography.Text>
    </AppCard>
  );
}
