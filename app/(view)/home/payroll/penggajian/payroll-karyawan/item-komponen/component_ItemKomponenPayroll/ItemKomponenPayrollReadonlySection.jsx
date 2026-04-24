// app/(view)/home/payroll/payroll-karyawan/item-komponen/component_ItemKomponenPayroll/ItemKomponenPayrollReadonlySection.jsx
'use client';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function ItemKomponenPayrollReadonlySection({ vm }) {
  return (
    <AppCard
      rounded='lg'
      ring={false}
      shadow='none'
      className='border border-amber-200 bg-amber-50'
      bodyStyle={{ padding: 20 }}
    >
      <AppTypography.Text
        size={13}
        weight={700}
        className='block text-amber-800'
      >
        Rincian gaji tidak dapat diubah
      </AppTypography.Text>

      <AppTypography.Text
        size={13}
        className='block text-amber-700 mt-1'
      >
        {vm.readonlyReason}
      </AppTypography.Text>
    </AppCard>
  );
}
