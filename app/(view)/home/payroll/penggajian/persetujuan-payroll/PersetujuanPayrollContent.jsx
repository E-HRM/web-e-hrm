'use client';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';

import CreatePersetujuanModal from './component_PersetujuanPayroll/CreatePersetujuanModal';
import DetailPersetujuanModal from './component_PersetujuanPayroll/DetailPersetujuanModal';
import EditPersetujuanModal from './component_PersetujuanPayroll/EditPersetujuanModal';
import PersetujuanPayrollFilterSection from './component_PersetujuanPayroll/PersetujuanPayrollFilterSection';
import PersetujuanPayrollHeader from './component_PersetujuanPayroll/PersetujuanPayrollHeader';
import PersetujuanPayrollSummarySection from './component_PersetujuanPayroll/PersetujuanPayrollSummarySection';
import PersetujuanPayrollTableSection from './component_PersetujuanPayroll/PersetujuanPayrollTableSection';
import usePersetujuanPayrollViewModel from './usePersetujuanPayrollViewModel';

export default function PersetujuanPayrollContent() {
  const vm = usePersetujuanPayrollViewModel();

  if (vm.error && vm.persetujuanList.length === 0) {
    return (
      <AppEmpty.Card
        title='Data persetujuan payroll gagal dimuat'
        description={vm.error?.message || 'Terjadi kesalahan saat mengambil data persetujuan payroll.'}
        action={
          <AppButton
            variant='outline'
            onClick={vm.reloadData}
            className='!rounded-lg'
          >
            Muat Ulang
          </AppButton>
        }
      />
    );
  }

  return (
    <div className='p-6 md:p-8'>
      <PersetujuanPayrollHeader vm={vm} />
      <PersetujuanPayrollSummarySection vm={vm} />
      <PersetujuanPayrollFilterSection vm={vm} />
      <PersetujuanPayrollTableSection vm={vm} />

      <CreatePersetujuanModal vm={vm} />
      <EditPersetujuanModal vm={vm} />
      <DetailPersetujuanModal vm={vm} />
    </div>
  );
}
