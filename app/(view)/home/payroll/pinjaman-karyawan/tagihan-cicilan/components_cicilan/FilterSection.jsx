'use client';

import { SearchOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function FilterSection({ vm }) {
  return (
    <AppCard
      rounded='xl'
      ring={false}
      shadow='none'
      className='border border-gray-200 mb-6'
      bodyStyle={{ padding: 24 }}
    >
      <div className='grid grid-cols-1 xl:grid-cols-4 gap-4'>
        <div className='xl:col-span-2'>
          <AppInput
            label='Cari Tagihan Cicilan'
            value={vm.searchText}
            onChange={(event) => vm.setSearchText(event.target.value)}
            placeholder='Cari nama karyawan, NIK, nama pinjaman, periode, atau status'
            prefix={<SearchOutlined className='text-gray-400' />}
            allowClear
            inputClassName='!rounded-lg'
          />
        </div>

        <div>
          <AppSelect
            label='Filter Status'
            value={vm.filterStatus}
            onChange={(value) => vm.setFilterStatus(value)}
            options={vm.statusOptions}
            showSearch={false}
            selectClassName='!rounded-lg'
          />
        </div>

        <div>
          <AppSelect
            label='Filter Karyawan'
            value={vm.filterKaryawan}
            onChange={(value) => vm.setFilterKaryawan(value)}
            options={vm.karyawanOptions}
            placeholder='Semua Karyawan'
            selectClassName='!rounded-lg'
          />
        </div>
      </div>

      <div className='mt-4 flex items-center justify-between gap-4 flex-wrap'>
        <AppTypography.Text
          size={13}
          className='text-gray-500'
        >
          Menampilkan {vm.dataSource.length} dari {vm.cicilanList.length} tagihan cicilan.
        </AppTypography.Text>

        <AppTypography.Text
          size={13}
          className='text-gray-500'
        >
          Total nilai tagihan berjalan: {vm.formatCurrency(vm.summary.totalNominalTagihan)}
        </AppTypography.Text>
      </div>
    </AppCard>
  );
}
