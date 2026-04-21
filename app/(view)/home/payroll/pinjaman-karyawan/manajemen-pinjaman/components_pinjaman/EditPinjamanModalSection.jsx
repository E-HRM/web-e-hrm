'use client';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';

import { PinjamanForm } from './SectionShared';

export default function EditPinjamanModalSection({ vm }) {
  return (
    <AppModal
      open={vm.isEditModalOpen}
      onClose={vm.closeEditModal}
      title='Edit Pinjaman'
      footer={null}
      width={680}
    >
      <PinjamanForm
        vm={vm}
        formData={vm.formData}
        setFormValue={vm.setFormValue}
        duplicateNameForUser={vm.duplicateNameForUser}
        disableUserField
      />

      <div className='flex items-center justify-end gap-3 pt-4'>
        <AppButton
          variant='outline'
          onClick={vm.closeEditModal}
          disabled={vm.isSubmitting}
          className='!rounded-lg !px-4 !h-10 !border-gray-300 !text-gray-700 hover:!bg-gray-50 hover:!border-gray-300 hover:!text-gray-700'
        >
          Batal
        </AppButton>

        <AppButton
          onClick={vm.handleEdit}
          loading={vm.isSubmitting}
          className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
        >
          Simpan Perubahan
        </AppButton>
      </div>
    </AppModal>
  );
}
