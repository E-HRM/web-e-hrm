'use client';

import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppGrid from '@/app/(view)/component_shared/AppGrid';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSelect from '@/app/(view)/component_shared/AppSelect';

import { STATUS_FILTER_OPTIONS } from './ProdukKonsultanShared';

export default function ProdukKonsultanFilterSection({
  searchQuery,
  onSearchQueryChange,
  filterStatus,
  onFilterStatusChange,
  onReload,
  onCreate,
  loading = false,
}) {
  return (
    <AppCard
      rounded='lg'
      ring={false}
      shadow='none'
      className='mb-6 border border-gray-200'
      bodyStyle={{ padding: 24 }}
    >
      <div className='flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
        <div className='w-full flex-1'>
          <AppGrid.Row gap={[16, 16]}>
            <AppGrid.Col
              xs={24}
              lg={16}
            >
              <AppInput
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder='Cari nama produk atau catatan...'
                prefixIcon={<SearchOutlined className='text-gray-400' />}
                className='w-full'
                inputClassName='!rounded-lg'
              />
            </AppGrid.Col>

            <AppGrid.Col
              xs={24}
              lg={8}
            >
              <AppSelect
                value={filterStatus}
                onChange={(value) => onFilterStatusChange(value)}
                options={STATUS_FILTER_OPTIONS}
                placeholder='Filter status'
                showSearch={false}
                className='w-full'
                selectClassName='!rounded-lg'
              />
            </AppGrid.Col>
          </AppGrid.Row>
        </div>

        <div className='flex w-full flex-col gap-3 sm:flex-row xl:w-auto xl:shrink-0'>
          <AppButton
            variant='outline'
            onClick={onReload}
            loading={loading}
            icon={<ReloadOutlined />}
            className='!h-10 !rounded-lg !px-4 whitespace-nowrap'
          >
            Muat Ulang
          </AppButton>

          <AppButton
            onClick={onCreate}
            icon={<PlusOutlined />}
            className='!h-10 !rounded-lg !border-blue-600 !bg-blue-600 !px-4 !text-white whitespace-nowrap hover:!border-blue-700 hover:!bg-blue-700'
          >
            Tambah Produk
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
}
