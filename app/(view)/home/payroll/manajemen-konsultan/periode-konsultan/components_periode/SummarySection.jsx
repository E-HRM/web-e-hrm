'use client';

import { CalendarOutlined, CheckCircleOutlined, DollarCircleOutlined, ShopOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function SummaryCard({ icon, iconWrapClassName, iconClassName, value, label, helper }) {
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
        weight={700}
        className='block text-gray-700'
      >
        {label}
      </AppTypography.Text>

      {helper ? (
        <AppTypography.Text
          size={12}
          className='block text-gray-500 mt-2 leading-5'
        >
          {helper}
        </AppTypography.Text>
      ) : null}
    </AppCard>
  );
}

export default function SummarySection({ vm }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8'>
      <SummaryCard
        icon={<CalendarOutlined />}
        iconWrapClassName='bg-blue-100'
        iconClassName='text-blue-600'
        value={vm.summary.totalPeriode}
        label='Total Periode'
        helper='Jumlah keseluruhan periode konsultan aktif yang tercatat pada sistem.'
      />

      <SummaryCard
        icon={<CheckCircleOutlined />}
        iconWrapClassName='bg-emerald-100'
        iconClassName='text-emerald-600'
        value={vm.summary.totalDisetujui}
        label='Periode Disetujui'
        helper='Periode yang sudah siap dipakai untuk proses operasional konsultan.'
      />

      <SummaryCard
        icon={<ShopOutlined />}
        iconWrapClassName='bg-purple-100'
        iconClassName='text-purple-600'
        value={vm.summary.totalTransaksi}
        label='Total Transaksi'
        helper='Akumulasi transaksi konsultan yang sudah masuk ke seluruh periode yang tersedia.'
      />

      <SummaryCard
        icon={<DollarCircleOutlined />}
        iconWrapClassName='bg-amber-100'
        iconClassName='text-amber-600'
        value={vm.formatCurrency(vm.summary.totalNominalPayout)}
        label='Total Dibayarkan'
        helper='Akumulasi nominal payout konsultan yang sudah tercatat dari seluruh batch payout.'
      />
    </div>
  );
}
