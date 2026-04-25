import { DownloadOutlined, FilterOutlined, PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { PeriodeStatusTag } from './SectionShared';

export default function HeaderSection({ vm }) {
  return (
    <div className='flex items-center justify-between mb-8 gap-4 flex-wrap'>
      <div>
        <AppTypography.Title
          level={3}
          className='!mb-1 !text-gray-900'
        >
          Transaksi Konsultan
        </AppTypography.Title>

        <div className='flex items-center gap-2 flex-wrap'>
          <AppTypography.Text className='text-gray-600'>Kelola transaksi dan pembagian hasil konsultan</AppTypography.Text>

          {vm.activePeriodeStatus ? (
            <PeriodeStatusTag
              status={vm.activePeriodeStatus}
              vm={vm}
            />
          ) : null}
        </div>
      </div>

      <div className='flex items-center gap-3 flex-wrap'>
        <AppSelect
          value={vm.filterPeriode || undefined}
          onChange={(value) => vm.setFilterPeriode(value || '')}
          options={vm.periodeOptions}
          prefixIcon={<FilterOutlined className='text-gray-500' />}
          className='min-w-[260px]'
          placeholder='Pilih periode'
          showSearch={false}
          disabled={vm.loading && !vm.filterPeriode}
        />

        <AppButton
          variant='outline'
          icon={<ReloadOutlined />}
          className='!h-10 !px-4 !rounded-lg'
          onClick={vm.reloadData}
          loading={vm.validating && !vm.loading}
        >
          Muat Ulang
        </AppButton>

        <AppButton
          variant='secondary'
          icon={<UploadOutlined />}
          className='!h-10 !px-4 !rounded-lg !bg-indigo-600 hover:!bg-indigo-700 !border-indigo-600 hover:!border-indigo-700 !text-white'
          onClick={vm.openImportModal}
          disabled={!vm.canCreateInActivePeriode || vm.loading}
          title={vm.canCreateInActivePeriode ? 'Import transaksi dari Excel' : 'Periode aktif belum bisa digunakan untuk import transaksi.'}
        >
          Import Excel
        </AppButton>

        <AppButton
          variant='secondary'
          icon={<DownloadOutlined />}
          className='!h-10 !px-4 !rounded-lg !bg-green-600 hover:!bg-green-700 !border-green-600 hover:!border-green-700 !text-white'
          onClick={vm.handleExport}
          loading={vm.isExporting}
          disabled={vm.isExporting}
        >
          Export Excel
        </AppButton>

        <AppButton
          icon={<PlusOutlined />}
          className='!h-10 !px-4 !rounded-lg !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
          onClick={vm.openCreateModal}
          disabled={!vm.canCreateInActivePeriode || vm.loading}
          title={vm.canCreateInActivePeriode ? 'Tambah transaksi' : 'Periode aktif belum bisa digunakan untuk transaksi baru.'}
        >
          Tambah Transaksi
        </AppButton>
      </div>
    </div>
  );
}
