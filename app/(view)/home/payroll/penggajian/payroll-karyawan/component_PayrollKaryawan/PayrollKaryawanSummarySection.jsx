// app/(view)/home/payroll/payroll-karyawan/component_PayrollKaryawan/PayrollKaryawanSummarySection.jsx
'use client';

import { DollarOutlined, FileTextOutlined, RiseOutlined, TeamOutlined } from '@ant-design/icons';

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

export default function PayrollKaryawanSummarySection({ vm }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8'>
      <SummaryCard
        title='Total Data Penggajian'
        subtitle='Periode berjalan'
        value={vm.statistics.totalPayroll}
        icon={<TeamOutlined />}
        iconClassName='text-blue-500 text-xl'
      />

      <SummaryCard
        title='Menunggu Persetujuan'
        subtitle='Masih menunggu persetujuan'
        value={vm.statistics.totalApprovalPending}
        icon={<FileTextOutlined />}
        iconClassName='text-amber-500 text-xl'
      />

      <SummaryCard
        title='Sudah Dibayar'
        subtitle={`Dari ${vm.statistics.totalPayroll} karyawan`}
        value={vm.statistics.totalDibayar}
        icon={<RiseOutlined />}
        iconClassName='text-blue-500 text-xl'
      />

      <SummaryCard
        title='Total Dibayarkan'
        subtitle='Gaji bersih setelah potongan'
        value={vm.formatCurrency(vm.statistics.totalDibayarkan)}
        icon={<DollarOutlined />}
        iconClassName='text-green-500 text-xl'
      />
    </div>
  );
}
