import AppSwitch from '@/app/(view)/component_shared/AppSwitch';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function SwitchCard({ label, checked, onChange, disabled = false }) {
  return (
    <div className='flex min-h-[88px] items-center justify-between gap-4 rounded-lg border border-gray-300 px-4 py-4 transition-colors hover:bg-gray-50'>
      <div className='min-w-0 flex-1 pr-2'>
        <AppTypography.Text
          size={14}
          weight={600}
          className='block leading-6 text-gray-900'
        >
          {label}
        </AppTypography.Text>
      </div>

      <div className='shrink-0'>
        <AppSwitch
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          showStateLabel={false}
          tone='primary'
        />
      </div>
    </div>
  );
}
