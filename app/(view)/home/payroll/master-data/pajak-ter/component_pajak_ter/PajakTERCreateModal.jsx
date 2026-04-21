import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';

import TarifForm from './TarifForm';

const PRIMARY_BUTTON_CLASS_NAME = '!h-10 !rounded-lg !border-blue-600 !bg-blue-600 !px-4 !text-white hover:!border-blue-700 hover:!bg-blue-700';

export default function PajakTERCreateModal({ vm }) {
  return (
    <AppModal
      open={vm.isCreateModalOpen}
      onClose={vm.closeCreateModal}
      title='Tambah Tarif Pajak TER'
      footer={null}
      width={720}
    >
      <TarifForm
        formData={vm.formData}
        setFormValue={vm.setFormValue}
        disabled={vm.isSubmitting}
      />

      <div className='flex justify-end gap-3 pt-4'>
        <AppButton
          variant='text'
          onClick={vm.closeCreateModal}
          className='!text-gray-700 hover:!text-gray-900'
          disabled={vm.isSubmitting}
        >
          Batal
        </AppButton>

        <AppButton
          onClick={vm.handleCreate}
          loading={vm.isSubmitting}
          className={PRIMARY_BUTTON_CLASS_NAME}
        >
          Simpan
        </AppButton>
      </div>
    </AppModal>
  );
}
