'use client';

import { CheckCircleOutlined, ExclamationCircleOutlined, LineChartOutlined } from '@ant-design/icons';

import { SummaryCard } from './SectionShared';

export default function SummarySection({ vm }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
      <SummaryCard
        icon={<LineChartOutlined />}
        iconWrapClassName='bg-orange-100'
        iconClassName='text-orange-600 text-2xl'
        value={vm.summary.totalAktif}
        label='Pinjaman Aktif'
      />

      <SummaryCard
        icon={<ExclamationCircleOutlined />}
        iconWrapClassName='bg-red-100'
        iconClassName='text-red-600 text-2xl'
        value={vm.formatCurrency(vm.summary.totalNominalAktif)}
        label='Total Sisa Saldo'
      />

      <SummaryCard
        icon={<CheckCircleOutlined />}
        iconWrapClassName='bg-green-100'
        iconClassName='text-green-600 text-2xl'
        value={vm.summary.totalLunas}
        label='Pinjaman Lunas'
      />
    </div>
  );
}
