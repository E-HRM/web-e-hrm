// app/(view)/home/payroll/penggajian/payroll-karyawan/item-komponen/component_ItemKomponenPayroll/ItemKomponenPayrollHeader.jsx
'use client';

import { Fragment } from 'react';
import { PlusOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function ItemKomponenPayrollHeader({ vm }) {
  const breadcrumbItems = [
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
      key: 'payroll-karyawan',
      label: 'Gaji Karyawan',
      href: '/home/payroll/penggajian/payroll-karyawan',
    },
    {
      key: 'item-komponen',
      label: 'Rincian Gaji',
    },
  ];

  return (
    <div className='mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
      <div className='min-w-0 flex-1'>
        <ItemKomponenPayrollBreadcrumb items={breadcrumbItems} />

        <AppTypography.Title
          level={2}
          className='!mb-2 !text-gray-900'
        >
          Rincian Gaji Karyawan
        </AppTypography.Title>

        <AppTypography.Text
          size={16}
          className='text-gray-600'
        >
          Atur tambahan pendapatan dan potongan untuk karyawan yang dipilih.
        </AppTypography.Text>
      </div>

      <div className='flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end'>
        <AppButton
          variant='outline'
          icon={<ReloadOutlined />}
          onClick={vm.reload}
          loading={vm.isValidating}
          className='!h-10 !rounded-lg !px-4'
        >
          Muat Ulang
        </AppButton>

        <AppButton
          onClick={vm.openCreateModal}
          icon={<PlusOutlined />}
          disabled={vm.isReadonly}
          className='!h-10 !rounded-lg !border-blue-600 !bg-blue-600 !px-4 !text-white hover:!border-blue-700 hover:!bg-blue-700'
        >
          Tambah Rincian
        </AppButton>
      </div>
    </div>
  );
}

function ItemKomponenPayrollBreadcrumb({ items = [] }) {
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
