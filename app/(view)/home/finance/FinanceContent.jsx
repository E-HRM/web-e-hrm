'use client';

import React, { useMemo } from 'react';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTabs from '@/app/(view)/component_shared/AppTabs';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppButton from '@/app/(view)/component_shared/AppButton';

import useFinanceViewModel from './useFinanceViewModel';

import FinanceFiltersBar from './component_finance/FinanceFiltersBar';

import PocketMoneyContent from './pocket_money/PocketMoneyContent';
import ReimbursesContent from './reimburses/ReimbursesContent';
import PaymentContent from './payment/PaymentContent';

import FinanceCategoryManagementContent from './category_management/FinanceCategoryManagementContent';

function TabLabel({ text, count }) {
  const badgeClass = 'bg-slate-100 text-slate-600';

  return (
    <span className='inline-flex items-center gap-3 whitespace-nowrap'>
      <span className='font-semibold'>{text}</span>
      <span
        className={`inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full text-xs font-semibold ${badgeClass}`}
      >
        {count}
      </span>
    </span>
  );
}

function MissingComponent({ name }) {
  return (
    <div className='p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
      Komponen <b>{name}</b> terdeteksi <b>undefined / bukan component</b>.
      <br />
      Penyebab paling sering: export/import salah (default vs named) atau nama file/path typo.
    </div>
  );
}

function isReactComponent(comp) {
  if (typeof comp === 'function') return true;
  if (typeof comp === 'object' && comp && comp.$$typeof) return true; // memo/forwardRef
  return false;
}

export default function FinanceContent() {
  const vm = useFinanceViewModel();

  const tabs = useMemo(() => {
    const pmCount = vm.tabCounts?.pocket_money ?? 0;
    const rbCount = vm.tabCounts?.reimburses ?? 0;
    const pyCount = vm.tabCounts?.payment ?? 0;

    const filtersBar = (
      <div className='mb-4'>
        <FinanceFiltersBar
          search={vm.search}
          onSearchChange={vm.setSearch}
          status={vm.status}
          onStatusChange={vm.setStatus}
          dateMode={vm.dateMode}
          onDateModeChange={vm.setDateMode}
          dateRange={vm.dateRange}
          onDateRangeChange={vm.setDateRange}
        />
      </div>
    );

    return [
      {
        key: 'pocket_money',
        label: <TabLabel text='Pocket Money' count={pmCount} />,
        children: (
          <div className='mt-6'>
            {filtersBar}
            <PocketMoneyContent filters={vm.filters} />
          </div>
        ),
      },
      {
        key: 'reimburses',
        label: <TabLabel text='Reimburse' count={rbCount} />,
        children: (
          <div className='mt-6'>
            {filtersBar}
            <ReimbursesContent filters={vm.filters} />
          </div>
        ),
      },
      {
        key: 'payment',
        label: <TabLabel text='Payment' count={pyCount} />,
        children: (
          <div className='mt-6'>
            {filtersBar}
            <PaymentContent filters={vm.filters} />
          </div>
        ),
      },
    ];
  }, [
    vm.search,
    vm.status,
    vm.dateMode,
    vm.dateRange,
    vm.filters,
    vm.tabCounts?.pocket_money,
    vm.tabCounts?.reimburses,
    vm.tabCounts?.payment,
  ]);

  const guards = [
    { name: 'FinanceFiltersBar', comp: FinanceFiltersBar },
    { name: 'PocketMoneyContent', comp: PocketMoneyContent },
    { name: 'ReimbursesContent', comp: ReimbursesContent },
    { name: 'PaymentContent', comp: PaymentContent },
    { name: 'FinanceCategoryManagementContent', comp: FinanceCategoryManagementContent },
  ];

  const broken = guards.find((x) => !isReactComponent(x.comp));

  const header = (
    <div className='mb-6 flex items-start justify-between gap-3 flex-wrap'>
      <div>
        <AppTypography.Title level={3} className='!mb-1'>
          Finance
        </AppTypography.Title>
        {vm.viewMode === 'category' ? (
          <AppTypography.Text tone='secondary'>
            Manajemen kategori untuk Payment, Pocket Money, dan Reimburse
          </AppTypography.Text>
        ) : (
          <AppTypography.Text tone='secondary'>
            Kelola Pocket Money, Reimburse (Rembus), dan Payment dalam satu tempat
          </AppTypography.Text>
        )}
      </div>

      <div className='flex items-center gap-2'>
        {vm.viewMode === 'category' ? (
          <AppButton
            variant='secondary'
            className='!bg-[#003A6F] !text-white hover:!bg-[#002f59] active:!bg-[#002746]'
            style={{ borderColor: '#003A6F' }}
            onClick={() => vm.setViewMode('request')}
          >
            Kembali ke Pengajuan
          </AppButton>
        ) : (
          <AppButton
            variant='secondary'
            className='!bg-[#003A6F] !text-white hover:!bg-[#002f59] active:!bg-[#002746]'
            style={{ borderColor: '#003A6F' }}
            onClick={() => vm.setViewMode('category')}
          >
            Manajemen Kategori
          </AppButton>
        )}
      </div>
    </div>
  );

  const content = broken ? (
    <MissingComponent name={broken.name} />
  ) : vm.viewMode === 'category' ? (
    <FinanceCategoryManagementContent />
  ) : (
    <AppCard className='shadow-sm border-0'>
      <AppTabs
        className='finance-tabs'
        activeKey={vm.activeTab}
        onChange={vm.setActiveTab}
        variant='line'
        size='large'
        tabBarGutter={40}
        items={tabs}
      />

      <style jsx global>{`
        .finance-tabs .ant-tabs-nav {
          margin: 0 !important;
        }
        .finance-tabs .ant-tabs-tab {
          margin: 0 !important;
          padding: 12px 22px !important;
        }
        .finance-tabs .ant-tabs-tab-btn {
          display: inline-flex !important;
          align-items: center !important;
        }
      `}</style>
    </AppCard>
  );

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      {header}
      {content}
    </div>
  );
}
