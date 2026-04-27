import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function StatCard({ label, value, valueClassName, icon, iconWrapClassName, iconClassName }) {
  return (
    <AppCard
      rounded='lg'
      ring={false}
      shadow='none'
      className='border border-gray-200'
      bodyStyle={{ padding: 24 }}
    >
      <div className='flex items-center justify-between'>
        <div>
          <AppTypography.Text
            size={14}
            className='text-gray-600'
          >
            {label}
          </AppTypography.Text>

          <AppTypography.Text
            size={30}
            weight={700}
            className={`block mt-1 ${valueClassName || 'text-gray-900'}`}
          >
            {value}
          </AppTypography.Text>
        </div>

        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconWrapClassName}`}>
          <span className={iconClassName}>{icon}</span>
        </div>
      </div>
    </AppCard>
  );
}
