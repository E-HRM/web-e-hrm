'use client';

import AppModal from '@/app/(view)/component_shared/AppModal';

import { ModalActionFooter, ProdukKonsultanForm } from './ProdukKonsultanShared';

export default function ProdukKonsultanCreateModalSection({ vm }) {
  return (
    <AppModal
      open={vm.isCreateModalOpen}
      onClose={vm.closeCreateModal}
      title='Tambah Produk Konsultan'
      footer={null}
      width={640}
    >
      <ProdukKonsultanForm
        formData={vm.formData}
        setFormValue={vm.setFormValue}
        disabled={vm.isSubmitting}
      />

      <ModalActionFooter
        onCancel={vm.closeCreateModal}
        onSubmit={vm.handleCreate}
        submitLabel='Simpan'
        cancelDisabled={vm.isSubmitting}
        submitDisabled={vm.isSubmitting}
        submitLoading={vm.isSubmitting}
      />
    </AppModal>
  );
}
