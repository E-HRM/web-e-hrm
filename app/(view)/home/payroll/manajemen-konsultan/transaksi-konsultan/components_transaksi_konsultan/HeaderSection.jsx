import { Fragment } from 'react';
import { DownloadOutlined, FilterOutlined, PlusOutlined, ReloadOutlined, RightOutlined, UploadOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { PeriodeStatusTag } from './SectionShared';

const BREADCRUMB_ITEMS = [
  {
    key: 'payroll',
    label: 'Payroll',
    href: '/home/payroll',
  },
  {
    key: 'manajemen-payroll-konsultan',
    label: 'Manajemen Payroll Konsultan',
    href: '/home/payroll/manajemen-konsultan',
  },
  {
    key: 'transaksi-konsultan',
    label: 'Transaksi Konsultan',
  },
];

function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className='mb-3 flex flex-wrap items-center gap-1.5'>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <Fragment key={item.key || item.href || item.label}>
            {index > 0 ? <RightOutlined className='text-[10px] text-slate-400' /> : null}

            {item.href && !isLast ? (
              <AppButton
                variant='text'
                href={item.href}
                className='!h-auto !px-0 !py-0 !text-xs !font-medium !text-slate-500 hover:!text-[#003A6F]'
              >
                {item.label}
              </AppButton>
            ) : (
              <AppTypography.Text
                size={12}
                weight={isLast ? 600 : 500}
                className={isLast ? 'text-slate-700' : 'text-slate-500'}
              >
                {item.label}
              </AppTypography.Text>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

export default function HeaderSection({ vm }) {
  return (
    <div className='mb-8'>
      <div className='mb-5'>
        <Breadcrumbs items={BREADCRUMB_ITEMS} />

        <AppTypography.Title
          level={3}
          className='!mb-1 !text-gray-900'
        >
          Transaksi Konsultan
        </AppTypography.Title>

        <div className='flex items-center gap-2 flex-wrap'>
          <AppTypography.Text className='text-gray-600'>Kelola transaksi, bagian konsultan, dan bagian OSS</AppTypography.Text>

          {vm.activePeriodeStatus ? (
            <PeriodeStatusTag
              status={vm.activePeriodeStatus}
              vm={vm}
            />
          ) : null}
        </div>
      </div>

      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <div className='flex items-center gap-3 flex-wrap'>
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
            title={vm.canCreateInActivePeriode ? 'Ambil transaksi dari Excel' : 'Periode aktif belum bisa digunakan untuk impor transaksi.'}
          >
            Impor Excel
          </AppButton>

          <AppButton
            variant='secondary'
            icon={<DownloadOutlined />}
            className='!h-10 !px-4 !rounded-lg !bg-green-600 hover:!bg-green-700 !border-green-600 hover:!border-green-700 !text-white'
            onClick={vm.handleExport}
            loading={vm.isExporting}
            disabled={vm.isExporting}
          >
            Ekspor Excel
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

        <AppSelect
          value={vm.filterPeriode || undefined}
          onChange={(value) => vm.setFilterPeriode(value || '')}
          options={vm.periodeOptions}
          prefixIcon={<FilterOutlined className='text-gray-500' />}
          className='w-full sm:!w-[260px] sm:!min-w-[260px] sm:!max-w-[260px]'
          placeholder='Pilih periode'
          showSearch={false}
          disabled={vm.loading && !vm.filterPeriode}
        />
      </div>
    </div>
  );
}
