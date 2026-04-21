'use client';

import AppAlert from '@/app/(view)/component_shared/AppAlert';
import LoadingSplash from '@/app/(view)/component_shared/LoadingSplash';

import ProdukKonsultanCreateModalSection from './component_produk_konsultan/ProdukKonsultanCreateModalSection';
import ProdukKonsultanDeleteModalSection from './component_produk_konsultan/ProdukKonsultanDeleteModalSection';
import ProdukKonsultanDetailModalSection from './component_produk_konsultan/ProdukKonsultanDetailModalSection';
import ProdukKonsultanEditModalSection from './component_produk_konsultan/ProdukKonsultanEditModalSection';
import ProdukKonsultanFilterSection from './component_produk_konsultan/ProdukKonsultanFilterSection';
import ProdukKonsultanHeaderSection from './component_produk_konsultan/ProdukKonsultanHeaderSection';
import ProdukKonsultanSummarySection from './component_produk_konsultan/ProdukKonsultanSummarySection';
import ProdukKonsultanTableSection from './component_produk_konsultan/ProdukKonsultanTableSection';
import useProdukKonsultanViewModel from './useProdukKonsultanViewModel';

export default function ProdukKonsultanContent() {
  const vm = useProdukKonsultanViewModel();

  if (vm.auth.isLoading) {
    return (
      <div className='p-8'>
        <ProdukKonsultanHeaderSection />

        <div className='grid min-h-[260px] place-items-center rounded-2xl border border-gray-200 bg-white'>
          <LoadingSplash
            label='Memuat halaman'
            brand='#003A6F'
            size={96}
            fullscreen={false}
          />
        </div>
      </div>
    );
  }

  if (!vm.auth.isLoggedIn) {
    return (
      <div className='p-8'>
        <ProdukKonsultanHeaderSection />

        <AppAlert
          card
          type='warning'
          title='Sesi login tidak ditemukan'
          description='Silakan login kembali untuk mengakses master produk konsultan.'
        />
      </div>
    );
  }

  if (!vm.canAccess) {
    return (
      <div className='p-8'>
        <ProdukKonsultanHeaderSection />

        <AppAlert
          card
          type='error'
          title='Akses ditolak'
          description='Role Anda tidak memiliki izin untuk membuka modul produk konsultan.'
        />
      </div>
    );
  }

  return (
    <div className='p-8'>
      <ProdukKonsultanHeaderSection />

      <ProdukKonsultanSummarySection statistics={vm.statistics} />

      <ProdukKonsultanFilterSection
        searchQuery={vm.searchQuery}
        onSearchQueryChange={vm.setSearchQuery}
        filterStatus={vm.filterStatus}
        onFilterStatusChange={vm.setFilterStatus}
        onReload={vm.reloadData}
        onCreate={vm.openCreateModal}
        loading={vm.refreshing && !vm.loading}
      />

      <ProdukKonsultanTableSection vm={vm} />

      <ProdukKonsultanCreateModalSection vm={vm} />

      <ProdukKonsultanEditModalSection vm={vm} />

      <ProdukKonsultanDetailModalSection vm={vm} />

      <ProdukKonsultanDeleteModalSection vm={vm} />
    </div>
  );
}
