import { FilterOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function PayoutKonsultanHeaderSection({
  filterPeriode,
  setFilterPeriode,
  periodeOptions = [],
  activePeriode = null,
  formatPeriodeKonsultanLabel,
  onCreate,
  onReload,
  loading = false,
  refreshing = false,
}) {
  const periodeLabel = formatPeriodeKonsultanLabel?.(activePeriode) || 'Semua periode';

  return (
    <div className='flex items-center justify-between mb-8 gap-4 flex-wrap'>
      <div>
        <AppTypography.Title
          level={3}
          className='!mb-1 !text-gray-900'
        >
          Payout Konsultan
        </AppTypography.Title>

        <AppTypography.Text className='text-gray-600'>
          Kelola pembayaran share konsultan ke payroll
          {activePeriode ? ` - ${periodeLabel}` : ''}
        </AppTypography.Text>
      </div>

      <div className='flex items-center gap-3 flex-wrap'>
        <AppSelect
          value={filterPeriode || undefined}
          onChange={(value) => setFilterPeriode?.(value || '')}
          options={periodeOptions}
          prefixIcon={<FilterOutlined className='text-gray-500' />}
          className='min-w-[260px]'
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
          Buat Payout Baru
        </AppButton>
      </div>
    </div>
  );
}
