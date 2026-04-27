import { Fragment } from 'react';
import { RightOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

const BREADCRUMB_ITEMS = [
  {
    key: 'payroll',
    label: 'Payroll',
    href: '/home/payroll',
  },
  {
    key: 'master-data-payroll',
    label: 'Master Data Payroll',
    href: '/home/payroll/master-data',
  },
  {
    key: 'pajak-ter',
    label: 'Tarif Pajak TER',
  },
];

export default function PajakTERHeader() {
  return (
    <div className='mb-8'>
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
        level={2}
        className='!mb-2 !text-gray-900'
      >
        Tarif Pajak TER
      </AppTypography.Title>

      <AppTypography.Text
        size={16}
        className='text-gray-600'
      >
        Kelola tarif pajak penghasilan (PPh 21) berdasarkan Tarif Efektif Rata-rata (TER) dan kode kategori pajak terbaru.
      </AppTypography.Text>
    </div>
  );
}
