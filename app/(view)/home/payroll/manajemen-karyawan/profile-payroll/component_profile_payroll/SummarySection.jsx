import { CheckCircleOutlined, CloseCircleOutlined, TeamOutlined } from '@ant-design/icons';

import StatCard from './StatCard';

export default function SummarySection({ vm }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
      <StatCard
        label='Total Profil'
        value={vm.totalProfil}
        icon={<TeamOutlined />}
        iconWrapClassName='bg-blue-100'
        iconClassName='text-blue-600 text-2xl'
      />

      <StatCard
        label='Payroll Aktif'
        value={vm.activeProfil}
        valueClassName='text-green-600'
        icon={<CheckCircleOutlined />}
        iconWrapClassName='bg-green-100'
        iconClassName='text-green-600 text-2xl'
      />

      <StatCard
        label='Non-Aktif'
        value={vm.inactiveProfil}
        valueClassName='text-red-600'
        icon={<CloseCircleOutlined />}
        iconWrapClassName='bg-red-100'
        iconClassName='text-red-600 text-2xl'
      />
    </div>
  );
}
