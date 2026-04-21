import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';

import TransaksiFormFields from './TransaksiFormFields';

export default function EditModalSection({ vm }) {
  return (
    <AppModal
      open={vm.isEditModalOpen}
      onClose={vm.closeEditModal}
      title='Edit Transaksi Konsultan'
      footer={null}
      width={760}
    >
      <TransaksiFormFields
        formData={vm.formData}
        setFormValue={vm.setFormValue}
        setProdukValue={vm.setProdukValue}
        periodeOptions={vm.periodeOptions}
        konsultanOptions={vm.konsultanOptions}
        produkOptions={vm.produkOptions}
        mode='edit'
        disabled={vm.isSubmitting}
      />

      <div className='flex items-center justify-end gap-3 pt-4'>
        <AppButton
          onClick={vm.closeEditModal}
          variant='secondary'
          className='!rounded-lg !px-4 !h-10 !border-gray-300 !text-gray-700 hover:!bg-gray-50'
          disabled={vm.isSubmitting}
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
