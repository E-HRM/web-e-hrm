import AppAvatar from '@/app/(view)/component_shared/AppAvatar';

export default function UserOptionLabel({ user, vm }) {
  const name = vm.getUserDisplayName(user);
  const identity = vm.getUserIdentity(user);
  const subtitle = [vm.getUserRoleOrJob(user), vm.getUserDepartment(user)].filter(Boolean).join(' • ');

  return (
    <div className='flex items-center gap-3 py-1'>
      <AppAvatar
        src={vm.getUserPhoto(user) || undefined}
        name={name}
        size='sm'
      />

      <div className='min-w-0'>
        <div className='text-sm font-semibold text-gray-900 truncate'>{name}</div>
        <div className='text-xs text-gray-500 truncate'>{identity}</div>
        <div className='text-xs text-gray-400 truncate'>{subtitle || '-'}</div>
      </div>
    </div>
  );
}
