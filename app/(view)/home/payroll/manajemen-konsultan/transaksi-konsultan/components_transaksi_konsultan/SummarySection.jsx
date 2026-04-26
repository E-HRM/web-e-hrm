import { CheckCircleOutlined, ClockCircleOutlined, DollarCircleOutlined, RiseOutlined } from '@ant-design/icons';

import { SummaryCard } from './SectionShared';

export default function SummarySection({ vm }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-5 gap-6 mb-8'>
      <SummaryCard
        icon={<DollarCircleOutlined />}
        iconWrapClassName='bg-blue-100'
        iconClassName='text-blue-600 text-2xl'
        value={vm.formatCompactCurrency(vm.totalIncome)}
        label='Total Pendapatan'
      />

      <SummaryCard
        icon={<RiseOutlined />}
        iconWrapClassName='bg-green-100'
        iconClassName='text-green-600 text-2xl'
        value={vm.formatCompactCurrency(vm.totalShare)}
        label='Total Bagian Konsultan'
      />

      <SummaryCard
        icon={<DollarCircleOutlined />}
        iconWrapClassName='bg-purple-100'
        iconClassName='text-purple-600 text-2xl'
        value={vm.formatCompactCurrency(vm.totalOSS)}
        label='Total OSS (Office)'
      />

      <SummaryCard
        icon={<CheckCircleOutlined />}
        iconWrapClassName='bg-green-100'
        iconClassName='text-green-600 text-2xl'
        value={vm.sudahPosting}
        label='Sudah Masuk Payroll'
      />

      <SummaryCard
        icon={<ClockCircleOutlined />}
        iconWrapClassName='bg-orange-100'
        iconClassName='text-orange-600 text-2xl'
        value={vm.belumPosting}
        label='Belum Masuk Payroll'
      />
    </div>
  );
}
