import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';

import ProfilFormFields from './ProfilFormFields';

export default function EditModalSection({ vm }) {
  return (
    <AppModal
      open={vm.isEditModalOpen}
      onClose={vm.closeEditModal}
      title='Edit Profil Payroll'
      footer={null}
      width={680}
    >
      <ProfilFormFields
        vm={vm}
        formData={vm.formData}
        setFormValue={vm.setFormValue}
        jenisHubunganOptions={vm.jenisHubunganOptions}
        mode='edit'
        disabled={vm.isSubmitting}
        loadingUsers={vm.loadingUsers}
      />

      <div className='flex gap-3 pt-4'>
        <AppButton
          onClick={vm.handleEdit}
          loading={vm.isSubmitting}
          className='!flex-1 !rounded-lg !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
        >
          Update
        </AppButton>

        <AppButton
          onClick={vm.closeEditModal}
          variant='secondary'
          disabled={vm.isSubmitting}
          className='!flex-1 !rounded-lg !h-10 !bg-gray-100 hover:!bg-gray-200 !border-gray-100 hover:!border-gray-200 !text-gray-700'
        >
          Batal
        </AppButton>
      </div>
    </AppModal>
  );
}
