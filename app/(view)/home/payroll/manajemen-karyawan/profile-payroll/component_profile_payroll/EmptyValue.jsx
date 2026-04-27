import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function EmptyValue({ children = 'Tidak ada' }) {
  return (
    <AppTypography.Text
      size={14}
      className='text-gray-400 italic'
    >
      {children}
    </AppTypography.Text>
  );
}
