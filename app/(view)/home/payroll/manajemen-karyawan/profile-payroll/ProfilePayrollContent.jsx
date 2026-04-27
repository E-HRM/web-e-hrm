'use client';

import HeaderSection from './component_profile_payroll/HeaderSection';
import SummarySection from './component_profile_payroll/SummarySection';
import FilterSection from './component_profile_payroll/FilterSection';
import DataTableSection from './component_profile_payroll/DataTableSection';
import CreateModalSection from './component_profile_payroll/CreateModalSection';
import EditModalSection from './component_profile_payroll/EditModalSection';
import DetailModalSection from './component_profile_payroll/DetailModalSection';
import DeleteModalSection from './component_profile_payroll/DeleteModalSection';
import useProfilPayrollViewModel from './useProfilePayrollViewModel';

export default function ProfilPayrollContent() {
  const vm = useProfilPayrollViewModel();
  const hasFetchError = Boolean(vm.error) && vm.filteredData.length === 0 && !vm.loading;

  return (
    <div className='p-8'>
      <HeaderSection vm={vm} />
      <SummarySection vm={vm} />
      <FilterSection vm={vm} />
      <DataTableSection
        vm={vm}
        hasFetchError={hasFetchError}
      />
      <CreateModalSection vm={vm} />
      <EditModalSection vm={vm} />
      <DetailModalSection vm={vm} />
      <DeleteModalSection vm={vm} />
    </div>
  );
}
