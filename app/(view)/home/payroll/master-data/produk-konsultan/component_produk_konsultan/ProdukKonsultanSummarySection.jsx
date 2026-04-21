'use client';

import { CheckCircleOutlined, PercentageOutlined, ShoppingOutlined, StopOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppGrid from '@/app/(view)/component_shared/AppGrid';
import AppStatistic from '@/app/(view)/component_shared/AppStatistic';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { formatPercent } from './ProdukKonsultanShared';

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

      <AppStatistic
        card={false}
        value={String(value)}
        valueStyle={{
          fontSize: 28,
          color: '#111827',
        }}
      />

      <AppTypography.Text
        size={12}
        className='mt-1 text-gray-500'
      >
        {subtitle}
      </AppTypography.Text>
    </AppCard>
  );
}

export default function ProdukKonsultanSummarySection({ statistics }) {
  return (
    <AppGrid.Row
      className='mb-8'
      gap={[24, 24]}
    >
      <AppGrid.Col
        xs={24}
        md={12}
        xl={6}
      >
        <SummaryCard
          title='Total Produk'
          subtitle='Semua master produk konsultan'
          value={statistics.total}
          icon={<ShoppingOutlined />}
          iconClassName='text-xl text-sky-500'
        />
      </AppGrid.Col>

      <AppGrid.Col
        xs={24}
        md={12}
        xl={6}
      >
        <SummaryCard
          title='Produk Aktif'
          subtitle='Siap dipakai di transaksi'
          value={statistics.aktif}
          icon={<CheckCircleOutlined />}
          iconClassName='text-xl text-emerald-500'
        />
      </AppGrid.Col>

      <AppGrid.Col
        xs={24}
        md={12}
        xl={6}
      >
        <SummaryCard
          title='Tidak Aktif'
          subtitle='Tidak tampil di transaksi baru'
          value={statistics.tidakAktif}
          icon={<StopOutlined />}
          iconClassName='text-xl text-rose-500'
        />
      </AppGrid.Col>

      <AppGrid.Col
        xs={24}
        md={12}
        xl={6}
      >
        <SummaryCard
          title='Rata-rata Share'
          subtitle='Default share konsultan'
          value={`${formatPercent(statistics.rataRataShare)}%`}
          icon={<PercentageOutlined />}
          iconClassName='text-xl text-violet-500'
        />
      </AppGrid.Col>
    </AppGrid.Row>
  );
}
