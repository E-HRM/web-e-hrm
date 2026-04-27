import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function DetailField({ label, value, valueClassName = 'text-gray-900', valueSize = 14, weight = 700, subValue }) {
  return (
    <div>
      <AppTypography.Text
        size={12}
        className='mb-1 block text-gray-500'
      >
        {label}
      </AppTypography.Text>

      <AppTypography.Text
        size={valueSize}
        weight={weight}
        className={`block ${valueClassName}`}
      >
        {value}
      </AppTypography.Text>

      {subValue ? (
        <AppTypography.Text
          size={12}
          className='mt-1 text-gray-500'
        >
          {subValue}
        </AppTypography.Text>
      ) : null}
    </div>
  );
}
