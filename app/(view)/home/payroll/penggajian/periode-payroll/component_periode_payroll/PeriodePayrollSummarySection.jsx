'use client';

import { CalendarOutlined, CheckCircleOutlined, FileTextOutlined, WalletOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function SummaryCard({ title, subtitle, value, icon, iconClassName }) {
  return (
    <AppCard
      rounded='lg'
      ring={false}
      shadow='none'
      className='border border-gray-200'
      bodyStyle={{ padding: 24 }}
    >
      <div className='mb-2 flex items-center justify-between'>
        <AppTypography.Text
          size={14}
          weight={600}
          className='text-gray-600'
        >
          {title}
        </AppTypography.Text>

        <span className={iconClassName}>{icon}</span>
      </div>

      <AppTypography.Text
        size={28}
        weight={800}
        className='block text-gray-900'
      >
        {value}
      </AppTypography.Text>

      <AppTypography.Text
        size={12}
        className='mt-1 text-gray-500'
      >
        {subtitle}
      </AppTypography.Text>
    </AppCard>
  );
}

export default function PeriodePayrollSummarySection({ vm }) {
  return (
    <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
      <SummaryCard
        title='Total Periode'
        subtitle='Periode penggajian tercatat'
        value={vm.summary.totalPeriode}
        icon={<CalendarOutlined />}
        iconClassName='text-blue-500 text-xl'
      />

      <SummaryCard
        title='Dalam Persiapan'
        subtitle='Periode yang masih disiapkan'
        value={vm.summary.totalDraft}
        icon={<FileTextOutlined />}
        iconClassName='text-amber-500 text-xl'
      />

      <SummaryCard
        title='Selesai Diproses'
        subtitle='Periode final atau terkunci'
        value={vm.summary.totalFinal}
        icon={<CheckCircleOutlined />}
        iconClassName='text-green-500 text-xl'
      />

      <SummaryCard
        title='Payout Konsultan'
        subtitle={`${vm.summary.totalPayrollKaryawan} data payroll terhubung`}
        value={vm.summary.totalPayoutKonsultan}
        icon={<WalletOutlined />}
        iconClassName='text-indigo-500 text-xl'
      />
    </div>
  );
}
