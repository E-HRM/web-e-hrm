import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function TipeKomponenPayrollSummaryCard({ title, subtitle, value, icon, iconClassName }) {
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

      <AppTypography.Text
        size={28}
        weight={800}
        className='block text-gray-900'
      >
        {value}
      </AppTypography.Text>

      <AppTypography.Text
        size={12}
        className='mt-1 text-gray-500'
      >
        {subtitle}
      </AppTypography.Text>
    </AppCard>
  );
}
