import { CheckCircleOutlined, ExclamationCircleOutlined, FileTextOutlined } from '@ant-design/icons';

import AppTypography from '@/app/(view)/component_shared/AppTypography';

function StatusCountCard({ toneClassName, icon, iconClassName, count, label, countClassName, labelClassName }) {
  return (
    <div className={`rounded-lg p-4 border ${toneClassName}`}>
      <div className='flex items-center gap-3'>
        <span className={iconClassName}>{icon}</span>

        <div>
          <AppTypography.Text
            size={24}
            weight={800}
            className={`block ${countClassName}`}
          >
            {count}
          </AppTypography.Text>

          <AppTypography.Text
            size={14}
            className={labelClassName}
          >
            {label}
          </AppTypography.Text>
        </div>
      </div>
    </div>
  );
}

export default function PayoutKonsultanStatusCountSection({ statusCounts }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8'>
      <StatusCountCard
        toneClassName='bg-gray-50 border-gray-200'
        icon={<FileTextOutlined />}
        iconClassName='text-gray-600 text-xl'
        count={statusCounts.draft}
        label='Belum Disetujui'
        countClassName='text-gray-900'
        labelClassName='text-gray-600'
      />

      <StatusCountCard
        toneClassName='bg-blue-50 border-blue-200'
        icon={<CheckCircleOutlined />}
        iconClassName='text-blue-600 text-xl'
        count={statusCounts.disetujui}
        label='Disetujui'
        countClassName='text-blue-900'
        labelClassName='text-blue-700'
      />

      <StatusCountCard
        toneClassName='bg-green-50 border-green-200'
        icon={<CheckCircleOutlined />}
        iconClassName='text-green-600 text-xl'
        count={statusCounts.diposting}
        label='Masuk Penggajian'
        countClassName='text-green-900'
        labelClassName='text-green-700'
      />

      <StatusCountCard
        toneClassName='bg-red-50 border-red-200'
        icon={<ExclamationCircleOutlined />}
        iconClassName='text-red-600 text-xl'
        count={statusCounts.ditahan}
        label='Ditahan'
        countClassName='text-red-900'
        labelClassName='text-red-700'
      />
    </div>
  );
}
