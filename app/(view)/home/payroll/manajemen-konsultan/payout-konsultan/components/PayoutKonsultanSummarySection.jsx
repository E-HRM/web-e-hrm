import { CheckCircleOutlined, MinusCircleOutlined, WalletOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function SummaryCard({ icon, iconWrapClassName, iconClassName, value, label }) {
  return (
    <AppCard
      rounded='xl'
      ring={false}
      shadow='none'
      className='border border-gray-200'
      bodyStyle={{ padding: 24 }}
    >
      <div className='flex items-center justify-between mb-4'>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconWrapClassName}`}>
          <span className={iconClassName}>{icon}</span>
        </div>
      </div>

      <AppTypography.Text
        size={24}
        weight={800}
        className='block text-gray-900 mb-1'
      >
        {value}
      </AppTypography.Text>

      <AppTypography.Text
        size={14}
        className='text-gray-600'
      >
        {label}
      </AppTypography.Text>
    </AppCard>
  );
}

export default function PayoutKonsultanSummarySection({ summary, formatCurrency }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8'>
      <SummaryCard
        icon={<WalletOutlined />}
        iconWrapClassName='bg-blue-100'
        iconClassName='text-blue-600 text-2xl'
        value={formatCurrency(summary.totalShare)}
        label='Total Hak Konsultan'
      />

      <SummaryCard
        icon={<MinusCircleOutlined />}
        iconWrapClassName='bg-red-100'
        iconClassName='text-red-600 text-2xl'
        value={formatCurrency(summary.totalDitahan)}
        label='Total yang Ditahan'
      />

      <SummaryCard
        icon={<CheckCircleOutlined />}
        iconWrapClassName='bg-green-100'
        iconClassName='text-green-600 text-2xl'
        value={formatCurrency(summary.totalDibayarkan)}
        label='Total yang Akan Dibayarkan'
      />
    </div>
  );
}
