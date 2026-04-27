import { FilterOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function PayoutKonsultanHeaderSection({ filterPeriode, setFilterPeriode, periodeOptions = [], activePeriode = null, formatPeriodeKonsultanLabel, onCreate, onReload, loading = false, refreshing = false }) {
  const periodeLabel = formatPeriodeKonsultanLabel?.(activePeriode) || 'Semua Periode';

  return (
    <div className='flex items-center justify-between mb-8 gap-4 flex-wrap'>
      <div className='min-w-0'>
        <AppTypography.Title
          level={3}
          className='!mb-1 !text-gray-900'
        >
          Pembayaran Konsultan
        </AppTypography.Title>

        <AppTypography.Text className='text-gray-600'>
          Kelola pembayaran hak konsultan sebelum dimasukkan ke penggajian.
          {activePeriode ? ` - ${periodeLabel}` : ''}
        </AppTypography.Text>
      </div>

      <div className='flex flex-1 items-center justify-end gap-3 flex-wrap min-w-[320px]'>
        <AppSelect
          value={filterPeriode || undefined}
          onChange={(value) => setFilterPeriode?.(value || '')}
          options={periodeOptions}
          prefixIcon={<FilterOutlined className='text-gray-500' />}
          className='w-full sm:!w-[240px] sm:!min-w-[240px] sm:!max-w-[240px]'
          placeholder='Pilih periode'
          showSearch={false}
          disabled={loading && !filterPeriode}
        />

        <AppButton
          variant='outline'
          icon={<ReloadOutlined />}
          onClick={onReload}
          loading={refreshing && !loading}
          className='!rounded-lg !px-4 !h-10'
        >
          Muat Ulang
        </AppButton>

        <AppButton
          onClick={onCreate}
          icon={<PlusOutlined />}
          className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
        >
          Buat Pembayaran Baru
        </AppButton>
      </div>
    </div>
  );
}
