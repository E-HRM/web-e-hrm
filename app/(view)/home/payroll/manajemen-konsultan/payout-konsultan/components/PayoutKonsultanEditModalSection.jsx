import AppButton from '@/app/(view)/component_shared/AppButton';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import PayoutKonsultanTransactionSelectionSection from './PayoutKonsultanTransactionSelectionSection';

const formatRupiahInput = (value) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const rawValue = String(value).replace(',', '.');
  const isNegative = rawValue.startsWith('-');
  const stringValue = rawValue.replace(/[^\d.]/g, '');
  const [integerPart, decimalPart] = stringValue.split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (!formattedInteger) {
    return '';
  }

  const prefix = isNegative ? '-Rp ' : 'Rp ';

  if (decimalPart !== undefined) {
    return `${prefix}${formattedInteger},${decimalPart}`;
  }

  return `${prefix}${formattedInteger}`;
};

const parseRupiahInput = (value) => {
  if (!value) {
    return '';
  }

  const stringValue = String(value);
  const isNegative = stringValue.trim().startsWith('-');

  const numericValue = stringValue
    .replace(/Rp\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.]/g, '');

  if (!numericValue) {
    return '';
  }

  return isNegative ? `-${numericValue}` : numericValue;
};

function PreviewItem({ label, value, accentClassName = 'text-gray-900' }) {
  return (
    <div>
      <AppTypography.Text
        size={12}
        className='block text-gray-500 mb-1'
      >
        {label}
      </AppTypography.Text>

      <AppTypography.Text
        size={16}
        weight={700}
        className={`block ${accentClassName}`}
      >
        {value}
      </AppTypography.Text>
    </div>
  );
}

export default function PayoutKonsultanEditModalSection({
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
  const consultantHint = 'Konsultan dan periode tidak dapat diubah setelah data pembayaran dibuat.';

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title='Ubah Pembayaran Konsultan'
      footer={null}
      width={920}
    >
      <div className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <AppSelect
            label='Konsultan'
            required
            value={formData.id_user || undefined}
            options={consultantOptions}
            onChange={(value) => setFormValue('id_user', value || '')}
            disabled
            placeholder='Pilih konsultan'
            hint={consultantHint}
            selectClassName='!rounded-lg'
          />

          <AppSelect
            label='Periode Konsultan'
            required
            value={formData.id_periode_konsultan || undefined}
            options={periodeOptions}
            onChange={(value) => setFormValue('id_periode_konsultan', value || '')}
            disabled
            placeholder='Pilih periode konsultan'
            selectClassName='!rounded-lg'
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <AppInput.Number
            label='Nominal yang Ditahan'
            value={formSummary.totalDitahan}
            disabled
            hint='Dihitung otomatis dari hak konsultan yang dipilih untuk ditahan.'
            inputClassName='!rounded-lg'
          />

          <AppInput.Number
            label='Nominal yang Akan Dibayarkan'
            value={formData.nominal_penyesuaian}
            onChange={(value) => setFormValue('nominal_penyesuaian', value ?? 0)}
            formatter={formatRupiahInput}
            parser={parseRupiahInput}
            placeholder='Rp 0'
            inputClassName='!rounded-lg'
          />
        </div>

        <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4'>
            <PreviewItem
              label='Transaksi Siap Dibayar'
              value={isPreviewLoading ? 'Memuat...' : `${formSummary.detailCount} transaksi`}
            />

            <PreviewItem
              label='Transaksi yang Ditahan'
              value={isPreviewLoading ? 'Memuat...' : `${formSummary.detailDitahanCount} transaksi`}
              accentClassName={formSummary.detailDitahanCount > 0 ? 'text-red-700' : 'text-gray-900'}
            />

            <PreviewItem
              label='Total Pendapatan'
              value={formatCurrency(formSummary.totalIncome)}
              accentClassName='text-blue-700'
            />

            <PreviewItem
              label='Hak Konsultan Otomatis'
              value={formatCurrency(formSummary.totalShare)}
              accentClassName='text-blue-700'
            />

            <PreviewItem
              label='Nominal yang Ditahan'
              value={formatCurrency(formSummary.totalDitahan)}
              accentClassName={formSummary.totalDitahan > 0 ? 'text-red-700' : 'text-gray-900'}
            />

            <PreviewItem
              label='Nominal yang Akan Dibayarkan'
              value={formatCurrency(nominalDibayarkanPreview)}
              accentClassName={nominalDibayarkanPreview >= 0 ? 'text-green-700' : 'text-red-700'}
            />
          </div>
        </div>

        <PayoutKonsultanTransactionSelectionSection
          transactions={eligibleTransactions}
          heldTransactionIds={formData.id_transaksi_konsultan_ditahan}
          onToggleHeldTransaction={toggleHeldTransaction}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          formatPeriodeKonsultanLabel={formatPeriodeKonsultanLabel}
          isLoading={isPreviewLoading}
        />

        <AppInput.TextArea
          label='Catatan'
          value={formData.catatan}
          onChange={(event) => setFormValue('catatan', event.target.value)}
          autoSize={{ minRows: 3, maxRows: 5 }}
          inputClassName='!rounded-lg'
        />
      </div>

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
          Simpan Perubahan
        </AppButton>
      </div>
    </AppModal>
  );
}
