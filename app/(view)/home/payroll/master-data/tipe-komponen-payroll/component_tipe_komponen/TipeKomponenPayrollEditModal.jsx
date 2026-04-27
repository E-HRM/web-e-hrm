import { LoadingOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import TipeKomponenPayrollForm from './TipeKomponenPayrollForm';

const PRIMARY_BUTTON_CLASS_NAME = '!h-10 !rounded-lg !border-blue-600 !bg-blue-600 !px-4 !text-white hover:!border-blue-700 hover:!bg-blue-700';

export default function TipeKomponenPayrollEditModal({ vm }) {
  return (
    <AppModal
      open={vm.isEditModalOpen}
      onClose={vm.closeEditModal}
      title='Edit Tipe Komponen Payroll'
      footer={null}
      width={640}
    >
      {vm.isPreparingEdit ? (
        <div className='grid min-h-[220px] place-items-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center'>
          <div className='space-y-2'>
            <LoadingOutlined className='text-2xl text-blue-600' />

            <AppTypography.Text
              size={14}
              className='block text-gray-700'
            >
              Memuat data tipe komponen payroll...
            </AppTypography.Text>
          </div>
        </div>
      ) : (
        <TipeKomponenPayrollForm
          formData={vm.formData}
          setFormValue={vm.setFormValue}
          disabled={vm.isSubmitting}
        />
      )}

      <div className='flex justify-end gap-3 pt-4'>
        <AppButton
          variant='text'
          onClick={vm.closeEditModal}
          className='!text-gray-700 hover:!text-gray-900'
          disabled={vm.isSubmitting || vm.isPreparingEdit}
        >
          Batal
        </AppButton>

        <AppButton
          onClick={vm.handleEdit}
          loading={vm.isSubmitting}
          disabled={vm.isPreparingEdit}
          className={PRIMARY_BUTTON_CLASS_NAME}
        >
          Simpan Perubahan
        </AppButton>
      </div>
    </AppModal>
  );
}
