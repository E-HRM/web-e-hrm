import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function SummaryCard({ value, label, icon, iconWrapClassName, cardClassName }) {
  return (
    <AppCard
      rounded='xl'
      ring={false}
      shadow='none'
      className={cardClassName}
      bodyStyle={{ padding: 24 }}
    >
      <div className='flex items-center gap-4'>
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconWrapClassName}`}>
          <span className='text-2xl text-white'>{icon}</span>
        </div>

        <div>
          <AppTypography.Text
            size={30}
            weight={700}
            className='block text-gray-900'
          >
            {value}
          </AppTypography.Text>

          <AppTypography.Text
            size={14}
            className='text-gray-600'
          >
            {label}
          </AppTypography.Text>
        </div>
      </div>
    </AppCard>
  );
}
