// app/(view)/home/payroll/payroll-karyawan/item-komponen/ItemKomponenPayrollContent.jsx
'use client';

import { LeftOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';

import ItemKomponenPayrollDataSection from './component_ItemKomponenPayroll/ItemKomponenPayrollDataSection';
import ItemKomponenPayrollDeleteDialog from './component_ItemKomponenPayroll/ItemKomponenPayrollDeleteDialog';
import ItemKomponenPayrollDetailModal from './component_ItemKomponenPayroll/ItemKomponenPayrollDetailModal';
import ItemKomponenPayrollFilterSection from './component_ItemKomponenPayroll/ItemKomponenPayrollFilterSection';
import ItemKomponenPayrollFormModal from './component_ItemKomponenPayroll/ItemKomponenPayrollFormModal';
import ItemKomponenPayrollHeader from './component_ItemKomponenPayroll/ItemKomponenPayrollHeader';
import ItemKomponenPayrollReadonlySection from './component_ItemKomponenPayroll/ItemKomponenPayrollReadonlySection';
import ItemKomponenPayrollSummarySection from './component_ItemKomponenPayroll/ItemKomponenPayrollSummarySection';
import ItemKomponenPayrollContextSection from './component_ItemKomponenPayroll/ItemKomponenPayrollContextSection';
import useItemKomponenPayrollViewModel from './useItemKomponenPayrollViewModel';

export default function ItemKomponenPayrollContent() {
  const vm = useItemKomponenPayrollViewModel();

  if (!vm.payrollId) {
    return (
      <div className='p-8 space-y-6'>
        <AppButton
          variant='outline'
          icon={<LeftOutlined />}
          href='/home/payroll/penggajian/payroll-karyawan'
          className='!rounded-lg !h-10'
        >
          Kembali ke Payroll Karyawan
        </AppButton>

        <AppEmpty.Card
          title='Payroll karyawan belum dipilih'
          description='Buka halaman ini dari daftar payroll karyawan agar context payroll yang sedang dikelola dapat diketahui.'
        />
      </div>
    );
  }

  return (
    <div className='p-8 space-y-6'>
      <ItemKomponenPayrollHeader vm={vm} />

      {vm.isReadonly ? <ItemKomponenPayrollReadonlySection vm={vm} /> : null}

      <ItemKomponenPayrollContextSection vm={vm} />
      <ItemKomponenPayrollSummarySection vm={vm} />
      <ItemKomponenPayrollFilterSection vm={vm} />
      <ItemKomponenPayrollDataSection vm={vm} />

      <ItemKomponenPayrollFormModal vm={vm} />
      <ItemKomponenPayrollDetailModal vm={vm} />
      <ItemKomponenPayrollDeleteDialog vm={vm} />
    </div>
  );
}
