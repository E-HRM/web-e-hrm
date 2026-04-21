import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function SectionHeader({ icon, iconWrapClassName, iconClassName, title, count, tagTone }) {
  return (
    <div className='mb-4 flex flex-wrap items-center gap-3'>
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconWrapClassName}`}>
        <span className={iconClassName}>{icon}</span>
      </div>

      <AppTypography.Text
        size={18}
        weight={700}
        className='text-gray-900'
      >
        {title}
      </AppTypography.Text>

      <AppTag
        tone={tagTone}
        variant='soft'
        size='sm'
        className='!font-medium'
      >
        {count} komponen
      </AppTag>
    </div>
  );
}
