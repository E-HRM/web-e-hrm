'use client';

import { CheckCircleOutlined, ClockCircleOutlined, DollarOutlined, WalletOutlined } from '@ant-design/icons';

import { SummaryCard } from './SectionShared';

export default function SummarySection({ vm }) {
  return (
    <>
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8'>
        <SummaryCard
          icon={<WalletOutlined />}
          iconWrapClassName='bg-blue-100'
          iconClassName='text-blue-600 text-2xl'
          value={vm.summary.totalCicilan}
          label='Total Cicilan'
          helper='Seluruh cicilan aktif yang tercatat di sistem.'
        />

        <SummaryCard
          icon={<CheckCircleOutlined />}
          iconWrapClassName='bg-green-100'
          iconClassName='text-green-600 text-2xl'
          value={vm.summary.totalDibayar}
          label='Sudah Dibayar'
          helper='Cicilan yang sudah dibayar.'
        />

        <SummaryCard
          icon={<ClockCircleOutlined />}
          iconWrapClassName='bg-amber-100'
          iconClassName='text-amber-600 text-2xl'
          value={vm.summary.totalPerluTindakLanjut}
          label='Perlu Tindak Lanjut'
          helper='Cicilan yang masih perlu diproses atau ditindaklanjuti.'
        />

        <SummaryCard
          icon={<DollarOutlined />}
          iconWrapClassName='bg-red-100'
          iconClassName='text-red-600 text-2xl'
          value={vm.formatCurrency(vm.summary.totalOutstanding)}
          label='Total Sisa Tagihan'
          helper='Total cicilan yang masih perlu dibayar.'
        />
      </div>

      {vm.summary.totalPerluTindakLanjut > 0 ? (
        <div className='mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4'>
          <div className='flex flex-col gap-1'>
            <p className='text-sm font-semibold text-amber-900'>Masih ada cicilan yang belum selesai</p>
            <p className='text-sm text-amber-800'>
              Belum masuk payroll <strong>{vm.summary.totalMenunggu}</strong>, sudah masuk payroll <strong>{vm.summary.totalDiposting}</strong>, dan terlewat <strong>{vm.summary.totalDilewati}</strong> dengan total sisa tagihan{' '}
              <strong>{vm.formatCurrency(vm.summary.totalOutstanding)}</strong>.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
