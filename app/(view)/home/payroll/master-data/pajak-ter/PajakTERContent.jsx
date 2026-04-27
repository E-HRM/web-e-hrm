'use client';

import PajakTERCreateModal from './component_pajak_ter/PajakTERCreateModal';
import PajakTERDeleteDialog from './component_pajak_ter/PajakTERDeleteDialog';
import PajakTERDetailModal from './component_pajak_ter/PajakTERDetailModal';
import PajakTEREditModal from './component_pajak_ter/PajakTEREditModal';
import PajakTERFilterToolbar from './component_pajak_ter/PajakTERFilterToolbar';
import PajakTERHeader from './component_pajak_ter/PajakTERHeader';
import PajakTERSummarySection from './component_pajak_ter/PajakTERSummarySection';
import PajakTERTableSection from './component_pajak_ter/PajakTERTableSection';
import usePajakTERViewModel from './usePajakTERViewModel';

export default function PajakTERContent() {
  const vm = usePajakTERViewModel();

  return (
    <div className='p-8'>
      <PajakTERHeader />

      <PajakTERSummarySection statistics={vm.statistics} />

      <PajakTERFilterToolbar
        searchQuery={vm.searchQuery}
        setSearchQuery={vm.setSearchQuery}
        filterKategori={vm.filterKategori}
        setFilterKategori={vm.setFilterKategori}
        kategoriPajakOptions={vm.kategoriPajakOptions}
        reloadData={vm.reloadData}
        validating={vm.validating}
        loading={vm.loading}
        openCreateModal={vm.openCreateModal}
      />

      <PajakTERTableSection vm={vm} />

      <PajakTERCreateModal vm={vm} />

      <PajakTEREditModal vm={vm} />

      <PajakTERDetailModal vm={vm} />

      <PajakTERDeleteDialog vm={vm} />
    </div>
  );
}
