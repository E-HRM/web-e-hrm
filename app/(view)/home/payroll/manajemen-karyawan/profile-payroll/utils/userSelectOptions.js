import UserOptionLabel from '../component_profile_payroll/UserOptionLabel';
import { getUserSelectLabel } from './profilePayrollUtils';

export function buildUserSelectOptions(users, vm) {
  return users.map((user) => ({
    value: user.id_user,
    label: (
      <UserOptionLabel
        user={user}
        vm={vm}
      />
    ),
    plainLabel: getUserSelectLabel(user),
    title: getUserSelectLabel(user),
    searchText: [vm.getUserDisplayName(user), vm.getUserIdentity(user), user?.email, vm.getUserRoleOrJob(user), vm.getUserDepartment(user), user?.id_user].filter(Boolean).join(' '),
  }));
}

export function filterUserOption(input, option) {
  return String(option?.searchText || '')
    .toLowerCase()
    .includes(String(input || '').toLowerCase());
}
