'use client';

import AppModal from '@/app/(view)/component_shared/AppModal';

import PeriodeFormSection from './PeriodeFormSection';

export default function CreatePeriodeModalSection({ vm }) {
  return (
    <AppModal
      open={vm.isCreateModalOpen}
      onClose={vm.closeCreateModal}
      title='Buat Periode Konsultan Baru'
      subtitle='Tentukan bulan, rentang tanggal, dan status awal periode sebelum dipakai oleh tim operasional.'
      width={720}
      onOk={vm.handleCreate}
      okText='Simpan Periode'
      cancelText='Batal'
      okLoading={vm.isSubmitting}
    >
      <PeriodeFormSection
        vm={vm}
        mode='create'
      />
    </AppModal>
  );
}
