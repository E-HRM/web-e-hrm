'use client';

import AppModal from '@/app/(view)/component_shared/AppModal';

import { ModalActionFooter, ProdukKonsultanForm } from './ProdukKonsultanShared';

export default function ProdukKonsultanEditModalSection({ vm }) {
  return (
    <AppModal
      open={vm.isEditModalOpen}
      onClose={vm.closeEditModal}
      title='Edit Produk Konsultan'
      footer={null}
      width={640}
    >
      <ProdukKonsultanForm
        formData={vm.formData}
        setFormValue={vm.setFormValue}
        disabled={vm.isSubmitting || vm.isPreparingEdit}
      />

      <ModalActionFooter
        onCancel={vm.closeEditModal}
        onSubmit={vm.handleEdit}
        submitLabel='Update'
        cancelDisabled={vm.isSubmitting || vm.isPreparingEdit}
        submitDisabled={vm.isSubmitting || vm.isPreparingEdit}
        submitLoading={vm.isSubmitting}
      />
    </AppModal>
  );
}
