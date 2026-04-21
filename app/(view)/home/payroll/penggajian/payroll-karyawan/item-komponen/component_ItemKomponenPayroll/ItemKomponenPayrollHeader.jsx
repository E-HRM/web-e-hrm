// app/(view)/home/payroll/payroll-karyawan/item-komponen/component_ItemKomponenPayroll/ItemKomponenPayrollHeader.jsx
'use client';

import { LeftOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function buildStatusTone(status) {
  const normalized = String(status || '').toUpperCase();

  if (normalized === 'DIBAYAR') return 'success';
  if (normalized === 'DISETUJUI') return 'warning';
  if (normalized === 'TERSIMPAN') return 'info';
  return 'neutral';
}

export default function ItemKomponenPayrollHeader({ vm }) {
  return (
    <div className='flex items-start justify-between gap-4 flex-wrap'>
      <div>
        <div className='flex items-center gap-2 flex-wrap mb-4'>
          <AppButton
            variant='outline'
            icon={<LeftOutlined />}
            href='/home/payroll/penggajian/payroll-karyawan'
            className='!rounded-lg !h-10'
          >
            Kembali
          </AppButton>

          <AppTag
            tone={vm.isReadonly ? 'warning' : 'success'}
            variant='soft'
          >
            {vm.isReadonly ? 'Read Only' : 'Editable'}
          </AppTag>

          <AppTag
            tone={buildStatusTone(vm.currentPayroll.status_payroll)}
            variant='soft'
          >
            {vm.formatEnumLabel(vm.currentPayroll.status_payroll)}
          </AppTag>
        </div>

        <AppTypography.Title
          level={2}
          className='!mb-2 !text-gray-900'
        >
          Item Komponen Payroll
        </AppTypography.Title>

        <AppTypography.Text
          size={16}
          className='text-gray-600'
        >
          Kelola rincian pemasukan dan potongan untuk payroll karyawan terpilih.
        </AppTypography.Text>
      </div>

      <div className='flex items-center gap-2'>
        <AppButton
          variant='outline'
          icon={<ReloadOutlined />}
          onClick={vm.reload}
          loading={vm.isValidating}
          className='!rounded-lg !h-10'
        >
          Refresh
        </AppButton>

        <AppButton
          onClick={vm.openCreateModal}
          icon={<PlusOutlined />}
          disabled={vm.isReadonly}
          className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
        >
          Tambah Komponen
        </AppButton>
      </div>
    </div>
  );
}
