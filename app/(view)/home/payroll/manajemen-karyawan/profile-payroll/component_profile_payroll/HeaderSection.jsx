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
    key: 'manajemen-karyawan',
    label: 'Manajemen Karyawan',
    href: '/home/payroll/manajemen-karyawan',
  },
  {
    key: 'profil-payroll-karyawan',
    label: 'Profil Payroll Karyawan',
  },
];

export default function HeaderSection({ vm }) {
  return (
    <div className='mb-8 flex flex-wrap items-center justify-between gap-4'>
      <div>
        <div className='mb-3 flex flex-wrap items-center gap-1.5'>
          {BREADCRUMB_ITEMS.map((item, index) => {
            const isLast = index === BREADCRUMB_ITEMS.length - 1;

            return (
              <Fragment key={item.key}>
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

        <AppTypography.Title
          level={3}
          className='!mb-1 !text-gray-900'
        >
          Profil Payroll Karyawan
        </AppTypography.Title>

        <AppTypography.Text className='text-gray-600'>Kelola profil dan konfigurasi payroll karyawan</AppTypography.Text>
      </div>

      <div className='flex items-center gap-3'>
        <AppButton
          onClick={vm.reloadData}
          variant='outline'
          loading={vm.validating && !vm.loading}
          icon={<ReloadOutlined />}
          className='!h-10 !rounded-lg !px-4'
        >
          Muat Ulang
        </AppButton>

        <AppButton
          onClick={vm.openCreateModal}
          icon={<PlusOutlined />}
          className='!h-10 !rounded-lg !border-blue-600 !bg-blue-600 !px-4 !text-white hover:!border-blue-700 hover:!bg-blue-700'
        >
          Tambah Profil
        </AppButton>
      </div>
    </div>
  );
}
