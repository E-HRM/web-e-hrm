import { SearchOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppInput from '@/app/(view)/component_shared/AppInput';

import FilterButton from './FilterButton';

export default function FilterSection({ vm }) {
  return (
    <AppCard
      rounded='lg'
      ring={false}
      shadow='none'
      className='border border-gray-200 mb-6'
      bodyStyle={{ padding: 16 }}
    >
      <div className='flex items-center gap-4 flex-col lg:flex-row'>
        <div className='flex-1 w-full'>
          <AppInput
            value={vm.searchQuery}
            onChange={(e) => vm.setSearchQuery(e.target.value)}
            placeholder='Cari nama karyawan, NIK, email, jabatan, departemen, gaji pokok, atau tunjangan BPJS...'
            allowClear
            prefixIcon={<SearchOutlined className='text-gray-400' />}
            inputClassName='!rounded-lg'
          />
        </div>

        <div className='flex gap-2 w-full lg:w-auto'>
          <FilterButton
            active={vm.filter === 'ALL'}
            onClick={() => vm.setFilter('ALL')}
            activeClassName='!bg-blue-600 !border-blue-600 hover:!bg-blue-700 hover:!border-blue-700 !text-white'
            inactiveClassName='!bg-gray-100 !border-gray-100 hover:!bg-gray-200 hover:!border-gray-200 !text-gray-700'
          >
            Semua
          </FilterButton>

          <FilterButton
            active={vm.filter === 'ACTIVE'}
            onClick={() => vm.setFilter('ACTIVE')}
            activeClassName='!bg-green-600 !border-green-600 hover:!bg-green-700 hover:!border-green-700 !text-white'
            inactiveClassName='!bg-gray-100 !border-gray-100 hover:!bg-gray-200 hover:!border-gray-200 !text-gray-700'
          >
            Aktif
          </FilterButton>

          <FilterButton
            active={vm.filter === 'INACTIVE'}
            onClick={() => vm.setFilter('INACTIVE')}
            activeClassName='!bg-red-600 !border-red-600 hover:!bg-red-700 hover:!border-red-700 !text-white'
            inactiveClassName='!bg-gray-100 !border-gray-100 hover:!bg-gray-200 hover:!border-gray-200 !text-gray-700'
          >
            Non-Aktif
          </FilterButton>
        </div>
      </div>
    </AppCard>
  );
}
