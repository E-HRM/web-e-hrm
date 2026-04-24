// app/(view)/home/payroll/payroll-karyawan/item-komponen/component_ItemKomponenPayroll/ItemKomponenPayrollSummarySection.jsx
'use client';

import { DeleteOutlined, DollarOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';

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
      <div className='flex items-center justify-between mb-2'>
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
        className='text-gray-500 mt-1'
      >
        {subtitle}
      </AppTypography.Text>
    </AppCard>
  );
}

export default function ItemKomponenPayrollSummarySection({ vm }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6'>
      <SummaryCard
        title='Jumlah Rincian'
        subtitle='Rincian yang sedang digunakan'
        value={vm.statistics.totalItems}
        icon={<DollarOutlined />}
        iconClassName='text-blue-500 text-xl'
      />

      <SummaryCard
        title='Total Pemasukan'
        subtitle='Jumlah tambahan pendapatan'
        value={vm.formatCurrency(vm.statistics.totalPemasukan)}
        icon={<PlusOutlined />}
        iconClassName='text-green-500 text-xl'
      />

      <SummaryCard
        title='Total Potongan'
        subtitle='Jumlah potongan gaji'
        value={vm.formatCurrency(vm.statistics.totalPotongan)}
        icon={<DeleteOutlined />}
        iconClassName='text-red-500 text-xl'
      />

      <SummaryCard
        title='Masuk Perhitungan Pajak'
        subtitle='Total rincian yang dihitung untuk pajak'
        value={vm.formatCurrency(vm.statistics.totalKenaPajak)}
        icon={<EyeOutlined />}
        iconClassName='text-amber-500 text-xl'
      />
    </div>
  );
}
