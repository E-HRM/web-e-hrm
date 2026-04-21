import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';

import PayoutKonsultanFormFields from './PayoutKonsultanFormFields';

export default function PayoutKonsultanCreateModalSection({
  open,
  onClose,
  formData,
  consultantOptions,
  periodeOptions,
  setFormValue,
  formSummary,
  eligibleTransactions,
  toggleHeldTransaction,
  nominalDibayarkanPreview,
  formatCurrency,
  formatDate,
  formatPeriodeKonsultanLabel,
  isPreviewLoading = false,
  isSubmitting = false,
  onSubmit,
}) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title='Buat Payout Baru'
      footer={null}
      width={920}
    >
      <PayoutKonsultanFormFields
        formData={formData}
        consultantOptions={consultantOptions}
        periodeOptions={periodeOptions}
        setFormValue={setFormValue}
        formSummary={formSummary}
        eligibleTransactions={eligibleTransactions}
        toggleHeldTransaction={toggleHeldTransaction}
        nominalDibayarkanPreview={nominalDibayarkanPreview}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        formatPeriodeKonsultanLabel={formatPeriodeKonsultanLabel}
        isPreviewLoading={isPreviewLoading}
      />

      <div className='flex items-center justify-end gap-3 pt-4'>
        <AppButton
          variant='outline'
          onClick={onClose}
          disabled={isSubmitting}
          className='!rounded-lg !px-4 !h-10 !border-gray-300 !text-gray-700 hover:!bg-gray-50 hover:!border-gray-300 hover:!text-gray-700'
        >
          Batal
        </AppButton>

        <AppButton
          onClick={onSubmit}
          loading={isSubmitting}
          className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
        >
          Buat Payout
        </AppButton>
      </div>
    </AppModal>
  );
}
