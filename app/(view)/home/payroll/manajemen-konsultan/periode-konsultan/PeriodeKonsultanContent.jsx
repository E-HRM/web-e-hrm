'use client';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';

import CreatePeriodeModalSection from './components_periode/CreatePeriodeModalSection';
import DetailPeriodeModalSection from './components_periode/DetailPeriodeModalSection';
import EditPeriodeModalSection from './components_periode/EditPeriodeModalSection';
import FilterSection from './components_periode/FilterSection';
import HeaderSection from './components_periode/HeaderSection';
import PeriodeTableSection from './components_periode/PeriodeTableSection';
import SummarySection from './components_periode/SummarySection';
import usePeriodeKonsultanViewModel from './usePeriodeKonsultanViewModel';

export default function PeriodeKonsultanContent() {
  const vm = usePeriodeKonsultanViewModel();

  if (vm.error && vm.periodeList.length === 0) {
    return (
      <AppEmpty.Card
        title='Data periode konsultan gagal dimuat'
        description={vm.error?.message || 'Terjadi kesalahan saat mengambil data periode konsultan.'}
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
      <HeaderSection vm={vm} />
      <SummarySection vm={vm} />
      <FilterSection vm={vm} />
      <PeriodeTableSection vm={vm} />
      <CreatePeriodeModalSection vm={vm} />
      <EditPeriodeModalSection vm={vm} />
      <DetailPeriodeModalSection vm={vm} />
    </div>
  );
}
