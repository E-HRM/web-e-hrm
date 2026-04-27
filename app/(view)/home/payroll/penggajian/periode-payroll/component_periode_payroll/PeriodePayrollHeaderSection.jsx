'use client';

import { Fragment } from 'react';
import { PlusOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

const BREADCRUMB_ITEMS = [
  {
    key: 'payroll',
    label: 'Payroll',
    href: '/home/payroll',
  },
  {
    key: 'penggajian',
    label: 'Penggajian',
    href: '/home/payroll/penggajian',
  },
  {
    key: 'periode-payroll',
    label: 'Periode Payroll',
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

export default function PeriodePayrollHeaderSection({ vm }) {
  return (
    <div className='mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
      <div>
        <Breadcrumbs items={BREADCRUMB_ITEMS} />

        <AppTypography.Title
          level={2}
          className='!mb-1 !text-gray-900'
        >
          Periode Payroll
        </AppTypography.Title>

        <AppTypography.Text className='text-gray-600'>Kelola periode penggajian sebagai acuan proses payroll karyawan, payout konsultan, dan template slip gaji yang digunakan.</AppTypography.Text>
      </div>

      <div className='flex items-center gap-3'>
        <AppButton
          variant='outline'
          icon={<ReloadOutlined />}
          loading={vm.validating}
          onClick={vm.reloadData}
          className='!rounded-lg'
        >
          Muat Ulang
        </AppButton>

        <AppButton
          icon={<PlusOutlined />}
          onClick={vm.openCreateModal}
          className='!rounded-lg'
        >
          Buat Periode Baru
        </AppButton>
      </div>
    </div>
  );
}
