import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function DetailField({ label, value, children }) {
  return (
    <div>
      <AppTypography.Text
        size={12}
        className='text-gray-500'
      >
        {label}
      </AppTypography.Text>

      {children || (
        <AppTypography.Text
          size={15}
          weight={600}
          className='block text-gray-900'
        >
          {value}
        </AppTypography.Text>
      )}
    </div>
  );
}
