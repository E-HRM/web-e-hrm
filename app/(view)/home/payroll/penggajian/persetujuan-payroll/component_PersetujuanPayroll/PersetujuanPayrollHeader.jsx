'use client';

import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function PersetujuanPayrollHeader({ vm }) {
  return (
    <div className='mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
      <div>
        <AppTypography.Title
          level={2}
          className='!mb-1 !text-gray-900'
        >
          Persetujuan Payroll
        </AppTypography.Title>

        <AppTypography.Text className='text-gray-600'>Kelola approval berjenjang untuk setiap periode payroll dengan referensi langsung ke schema `PersetujuanPeriodePayroll`.</AppTypography.Text>
      </div>

      <div className='flex items-center gap-3'>
        <AppButton
          variant='outline'
          icon={<ReloadOutlined />}
          loading={vm.validating}
          onClick={vm.reloadData}
          className='!rounded-lg'
        >
          Muat Ulang
        </AppButton>

        <AppButton
          icon={<PlusOutlined />}
          onClick={vm.openCreateModal}
          className='!rounded-lg'
        >
          Buat Approval
        </AppButton>
      </div>
    </div>
  );
}
