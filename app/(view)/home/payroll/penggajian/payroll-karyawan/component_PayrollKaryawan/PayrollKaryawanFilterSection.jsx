// app/(view)/home/payroll/payroll-karyawan/component_PayrollKaryawan/PayrollKaryawanFilterSection.jsx
'use client';

import { PlusOutlined, SearchOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSelect from '@/app/(view)/component_shared/AppSelect';

import { STATUS_PAYROLL_OPTIONS } from '../utils/payrollKaryawanUtils';

export default function PayrollKaryawanFilterSection({ vm }) {
  return (
    <AppCard
      rounded='lg'
      ring={false}
      shadow='none'
      className='border border-gray-200 mb-6'
      bodyStyle={{ padding: 24 }}
    >
      <div className='flex flex-col md:flex-row gap-4 items-start md:items-center justify-between'>
        <div className='flex flex-col md:flex-row gap-4 flex-1 w-full'>
          <AppInput
            value={vm.searchQuery}
            onChange={(event) => vm.setSearchQuery(event.target.value)}
            placeholder='Cari nama karyawan, departemen, jabatan...'
            prefixIcon={<SearchOutlined className='text-gray-400' />}
            className='flex-1'
            inputClassName='!rounded-lg'
          />

          <AppSelect
            value={vm.filterPeriode}
            onChange={(value) => vm.setFilterPeriode(value)}
            options={[{ value: 'ALL', label: 'Semua Periode' }, ...vm.periodeOptions]}
            placeholder='Semua Periode'
            showSearch={false}
            className='w-full md:w-[220px]'
            selectClassName='!rounded-lg'
          />

          <AppSelect
            value={vm.filterStatus}
            onChange={(value) => vm.setFilterStatus(value)}
            options={[{ value: 'ALL', label: 'Semua Status' }, ...STATUS_PAYROLL_OPTIONS]}
            placeholder='Semua Status'
            showSearch={false}
            className='w-full md:w-[220px]'
            selectClassName='!rounded-lg'
          />
        </div>

        <AppButton
          onClick={vm.openCreateModal}
          icon={<PlusOutlined />}
          className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white whitespace-nowrap'
        >
          Tambah Payroll
        </AppButton>
      </div>
    </AppCard>
  );
}
