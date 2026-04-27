'use client';

import { CheckCircleOutlined, FileDoneOutlined, InfoCircleOutlined, StopOutlined } from '@ant-design/icons';

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

export default function PersetujuanPayrollSummarySection({ vm }) {
  return (
    <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
      <SummaryCard
        title='Total Approval'
        subtitle={`${vm.summary.totalPeriodeTercover} periode tercover`}
        value={vm.summary.totalPersetujuan}
        icon={<FileDoneOutlined />}
        iconClassName='text-blue-500 text-xl'
      />

      <SummaryCard
        title='Menunggu'
        subtitle='Belum diputuskan'
        value={vm.summary.totalPending}
        icon={<InfoCircleOutlined />}
        iconClassName='text-amber-500 text-xl'
      />

      <SummaryCard
        title='Disetujui'
        subtitle='Approval positif'
        value={vm.summary.totalDisetujui}
        icon={<CheckCircleOutlined />}
        iconClassName='text-green-500 text-xl'
      />

      <SummaryCard
        title='Ditolak'
        subtitle='Perlu tindak lanjut'
        value={vm.summary.totalDitolak}
        icon={<StopOutlined />}
        iconClassName='text-red-500 text-xl'
      />
    </div>
  );
}
