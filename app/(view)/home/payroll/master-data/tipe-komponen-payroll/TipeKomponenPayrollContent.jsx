'use client';

import TipeKomponenPayrollCreateModal from './component_tipe_komponen/TipeKomponenPayrollCreateModal';
import TipeKomponenPayrollDeleteDialog from './component_tipe_komponen/TipeKomponenPayrollDeleteDialog';
import TipeKomponenPayrollDetailModal from './component_tipe_komponen/TipeKomponenPayrollDetailModal';
import TipeKomponenPayrollEditModal from './component_tipe_komponen/TipeKomponenPayrollEditModal';
import TipeKomponenPayrollFilterToolbar from './component_tipe_komponen/TipeKomponenPayrollFilterToolbar';
import TipeKomponenPayrollHeader from './component_tipe_komponen/TipeKomponenPayrollHeader';
import TipeKomponenPayrollSummarySection from './component_tipe_komponen/TipeKomponenPayrollSummarySection';
import TipeKomponenPayrollTableSection from './component_tipe_komponen/TipeKomponenPayrollTableSection';
import useTipeKomponenPayrollViewModel from './useTipeKomponenPayrollViewModel';

export default function TipeKomponenPayrollContent() {
  const vm = useTipeKomponenPayrollViewModel();

  return (
    <div className='p-8'>
      <TipeKomponenPayrollHeader />

      <TipeKomponenPayrollSummarySection statistics={vm.statistics} />

      <TipeKomponenPayrollFilterToolbar
        searchQuery={vm.searchQuery}
        setSearchQuery={vm.setSearchQuery}
        statusFilter={vm.statusFilter}
        setStatusFilter={vm.setStatusFilter}
        reloadData={vm.reloadData}
        validating={vm.validating}
        loading={vm.loading}
        openCreateModal={vm.openCreateModal}
      />

      <TipeKomponenPayrollTableSection vm={vm} />

      <TipeKomponenPayrollCreateModal vm={vm} />

      <TipeKomponenPayrollEditModal vm={vm} />

      <TipeKomponenPayrollDetailModal vm={vm} />

      <TipeKomponenPayrollDeleteDialog vm={vm} />
    </div>
  );
}
