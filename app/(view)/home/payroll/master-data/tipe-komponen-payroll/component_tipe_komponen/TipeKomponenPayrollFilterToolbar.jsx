import { FilterOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSelect from '@/app/(view)/component_shared/AppSelect';

const PRIMARY_BUTTON_CLASS_NAME = '!h-10 !rounded-lg !border-blue-600 !bg-blue-600 !px-4 !text-white whitespace-nowrap hover:!border-blue-700 hover:!bg-blue-700';
const OUTLINE_BUTTON_CLASS_NAME = '!h-10 !rounded-lg !px-4 whitespace-nowrap';

export default function TipeKomponenPayrollFilterToolbar({ searchQuery, setSearchQuery, statusFilter, setStatusFilter, reloadData, validating, loading, openCreateModal }) {
  return (
    <AppCard
      rounded='lg'
      ring={false}
      shadow='none'
      className='mb-6 border border-gray-200'
      bodyStyle={{ padding: 24 }}
    >
      <div className='flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
        <div className='grid w-full flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]'>
          <AppInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder='Cari nama tipe komponen atau status data...'
            prefixIcon={<SearchOutlined className='text-gray-400' />}
            className='w-full'
            inputClassName='!rounded-lg'
          />

          <div className='flex w-full items-center gap-3'>
            <span className='shrink-0 text-gray-400'>
              <FilterOutlined />
            </span>

            <AppSelect
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { value: 'ALL', label: 'Semua Status' },
                { value: 'ACTIVE', label: 'Aktif' },
                { value: 'DELETED', label: 'Soft Delete' },
              ]}
              placeholder='Filter status'
              showSearch={false}
              className='w-full'
              selectClassName='!rounded-lg'
            />
          </div>
        </div>

        <div className='flex w-full flex-col gap-3 sm:flex-row xl:w-auto xl:shrink-0'>
          <AppButton
            variant='outline'
            onClick={reloadData}
            loading={validating && !loading}
            className={OUTLINE_BUTTON_CLASS_NAME}
            icon={<ReloadOutlined />}
          >
            Muat Ulang
          </AppButton>

          <AppButton
            onClick={openCreateModal}
            icon={<PlusOutlined />}
            className={PRIMARY_BUTTON_CLASS_NAME}
          >
            Tambah Tipe
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
}
