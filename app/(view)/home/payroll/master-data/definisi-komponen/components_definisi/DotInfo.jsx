import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function DotInfo({ active, label, activeClassName }) {
  return (
    <div className='flex items-center gap-1.5'>
      <span className={`h-2 w-2 rounded-full ${active ? activeClassName : 'bg-gray-300'}`} />

      <AppTypography.Text
        size={12}
        className='text-gray-600'
      >
        {label}
      </AppTypography.Text>
    </div>
  );
}
