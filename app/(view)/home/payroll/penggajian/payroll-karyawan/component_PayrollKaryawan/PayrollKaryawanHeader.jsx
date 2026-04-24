// app/(view)/home/payroll/penggajian/payroll-karyawan/component_PayrollKaryawan/PayrollKaryawanHeader.jsx
'use client';

import { Fragment } from 'react';
import { ArrowLeftOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function PayrollKaryawanHeader({ vm }) {
  const periodeLabel = vm.focusedPeriode ? vm.getPeriodeInfo(vm.focusedPeriode.id_periode_payroll) : null;

  const titleText = periodeLabel ? `Penggajian Periode ${periodeLabel}` : 'Penggajian Karyawan';

  const descriptionText = periodeLabel ? 'Pantau penggajian karyawan untuk periode terpilih, atur persetujuan, lalu lengkapi rincian gaji.' : 'Kelola data penggajian per karyawan, proses persetujuan, dan status pembayaran setiap periode.';

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
    ...(periodeLabel
      ? [
          {
            key: 'periode-payroll',
            label: 'Periode Penggajian',
            href: '/home/payroll/penggajian/periode-payroll',
          },
        ]
      : []),
    {
      key: 'payroll-karyawan',
      label: titleText,
    },
  ];

  return (
    <div className='mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
      <div className='min-w-0 flex-1'>
        <PayrollKaryawanBreadcrumb items={breadcrumbItems} />

        <AppTypography.Title
          level={2}
          className='!mb-2 !text-gray-900'
        >
          {titleText}
        </AppTypography.Title>

        <AppTypography.Text
          size={16}
          className='text-gray-600'
        >
          {descriptionText}
        </AppTypography.Text>
      </div>

      <div className='flex items-center gap-3'>
        {vm.focusedPeriode ? (
          <AppButton
            variant='outline'
            href='/home/payroll/penggajian/periode-payroll'
            icon={<ArrowLeftOutlined />}
            className='!rounded-lg'
          >
            Kembali ke Periode Penggajian
          </AppButton>
        ) : null}

        <AppButton
          variant='outline'
          icon={<ReloadOutlined />}
          loading={vm.validating}
          onClick={vm.reloadData}
          className='!rounded-lg'
        >
          Muat Ulang
        </AppButton>
      </div>
    </div>
  );
}

function PayrollKaryawanBreadcrumb({ items = [] }) {
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
