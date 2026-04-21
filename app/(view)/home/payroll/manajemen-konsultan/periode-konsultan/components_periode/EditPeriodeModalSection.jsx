'use client';

import AppModal from '@/app/(view)/component_shared/AppModal';

import PeriodeFormSection from './PeriodeFormSection';

export default function EditPeriodeModalSection({ vm }) {
  return (
    <AppModal
      open={vm.isEditModalOpen}
      onClose={vm.closeEditModal}
      title={vm.selectedPeriode ? `Edit Periode ${vm.formatPeriodeLabel(vm.selectedPeriode)}` : 'Edit Periode Konsultan'}
      subtitle='Perbarui informasi periode untuk menyesuaikan proses review, persetujuan, atau penguncian data.'
      width={720}
      onOk={vm.handleUpdate}
      okText='Simpan Perubahan'
      cancelText='Batal'
      okLoading={vm.isSubmitting}
    >
      <PeriodeFormSection
        vm={vm}
        mode='edit'
      />
    </AppModal>
  );
}
