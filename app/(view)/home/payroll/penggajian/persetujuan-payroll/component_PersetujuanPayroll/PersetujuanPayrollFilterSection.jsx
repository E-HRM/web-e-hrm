'use client';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function PersetujuanPayrollFilterSection({ vm }) {
  return (
    <AppCard
      rounded='xl'
      ring={false}
      shadow='none'
      className='mb-6 border border-gray-200'
      bodyStyle={{ padding: 24 }}
    >
      <div className='grid grid-cols-1 gap-4 xl:grid-cols-5'>
        <div className='xl:col-span-2'>
          <AppInput
            label='Cari Approval'
            value={vm.searchText}
            onChange={(event) => vm.setSearchText(event.target.value)}
            placeholder='Cari periode, approver, email, role, catatan, atau level'
            allowClear
            inputClassName='!rounded-lg'
          />
        </div>

        <div>
          <AppSelect
            label='Filter Keputusan'
            value={vm.filterKeputusan}
            onChange={(value) => vm.setFilterKeputusan(value)}
            options={vm.keputusanOptions}
            showSearch={false}
            selectClassName='!rounded-lg'
          />
        </div>

        <div>
          <AppSelect
            label='Filter Role'
            value={vm.filterRole}
            onChange={(value) => vm.setFilterRole(value)}
            options={vm.roleOptions}
            showSearch={false}
            selectClassName='!rounded-lg'
          />
        </div>

        <div>
          <AppSelect
            label='Filter Periode'
            value={vm.filterPeriode}
            onChange={(value) => vm.setFilterPeriode(value)}
            options={vm.periodeFilterOptions}
            showSearch
            optionFilterProp='label'
            selectClassName='!rounded-lg'
          />
        </div>
      </div>

      <div className='mt-4 flex flex-wrap items-center justify-between gap-4'>
        <AppTypography.Text
          size={13}
          className='text-gray-500'
        >
          Menampilkan {vm.filteredList.length} dari {vm.persetujuanList.length} persetujuan payroll.
        </AppTypography.Text>

        <AppTypography.Text
          size={13}
          className='text-gray-500'
        >
          Approval pending: {vm.summary.totalPending}
        </AppTypography.Text>
      </div>
    </AppCard>
  );
}
