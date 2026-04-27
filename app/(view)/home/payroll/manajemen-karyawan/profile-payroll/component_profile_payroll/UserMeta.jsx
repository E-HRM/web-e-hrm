import AppAvatar from '@/app/(view)/component_shared/AppAvatar';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function UserMeta({ user, vm, compact = false }) {
  const name = vm.getUserDisplayName(user);
  const identity = vm.getUserIdentity(user);
  const roleOrJob = vm.getUserRoleOrJob(user);
  const department = vm.getUserDepartment(user);
  const subtitle = [roleOrJob, department].filter(Boolean).join(' • ');

  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'p-4 rounded-xl bg-gray-50 border border-gray-200'}`}>
      <AppAvatar
        src={vm.getUserPhoto(user) || undefined}
        name={name}
        size={compact ? 'md' : 'lg'}
      />

      <div className='min-w-0'>
        <AppTypography.Text
          size={15}
          weight={700}
          className='block text-gray-900 truncate'
        >
          {name}
        </AppTypography.Text>

        <AppTypography.Text
          size={13}
          className='block text-gray-500 truncate'
        >
          {identity}
        </AppTypography.Text>

        {!compact ? (
          <AppTypography.Text
            size={13}
            className='block text-gray-500 truncate mt-1'
          >
            {subtitle || 'Data jabatan/departemen belum tersedia'}
          </AppTypography.Text>
        ) : null}
      </div>
    </div>
  );
}
