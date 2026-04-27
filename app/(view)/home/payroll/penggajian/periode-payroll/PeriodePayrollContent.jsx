'use client';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';

import CreatePeriodeModal from './component_periode_payroll/CreatePeriodeModal';
import DetailPeriodeModal from './component_periode_payroll/DetailPeriodeModal';
import EditPeriodeModal from './component_periode_payroll/EditPeriodeModal';
import PeriodePayrollFilterSection from './component_periode_payroll/PeriodePayrollFilterSection';
import PeriodePayrollHeaderSection from './component_periode_payroll/PeriodePayrollHeaderSection';
import PeriodePayrollSummarySection from './component_periode_payroll/PeriodePayrollSummarySection';
import PeriodePayrollTableSection from './component_periode_payroll/PeriodePayrollTableSection';
import usePeriodePayrollViewModel from './usePeriodePayrollViewModel';

export default function PeriodePayrollContent() {
  const vm = usePeriodePayrollViewModel();

  if (vm.error && vm.periodeList.length === 0) {
    return (
      <AppEmpty.Card
        title='Data periode payroll gagal dimuat'
        description={vm.error?.message || 'Terjadi kesalahan saat mengambil data periode payroll.'}
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
      <PeriodePayrollHeaderSection vm={vm} />
      <PeriodePayrollSummarySection vm={vm} />
      <PeriodePayrollFilterSection vm={vm} />
      <PeriodePayrollTableSection vm={vm} />

      <CreatePeriodeModal vm={vm} />
      <EditPeriodeModal vm={vm} />
      <DetailPeriodeModal vm={vm} />
    </div>
  );
}
