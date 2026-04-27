'use client';

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
            label='Cari Periode'
            value={vm.searchText}
            onChange={(event) => vm.setSearchText(event.target.value)}
            placeholder='Cari bulan, tahun, status, catatan, atau aktivitas periode'
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
            label='Filter Tahun'
            value={vm.filterTahun}
            onChange={(value) => vm.setFilterTahun(value)}
            options={vm.tahunOptions}
            showSearch={false}
            selectClassName='!rounded-lg'
          />
        </div>
      </div>

      <div className='mt-4 flex items-center justify-between gap-4 flex-wrap'>
        <AppTypography.Text
          size={13}
          className='text-gray-500'
        >
          Menampilkan {vm.filteredList.length} dari {vm.periodeList.length} periode konsultan.
        </AppTypography.Text>

        <AppTypography.Text
          size={13}
          className='text-gray-500'
        >
          Total pencairan terhubung: {vm.formatCurrency(vm.summary.totalNominalPayout)}
        </AppTypography.Text>
      </div>
    </AppCard>
  );
}
