import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import PayoutKonsultanTransactionSelectionSection from './PayoutKonsultanTransactionSelectionSection';

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

export default function PayoutKonsultanFormFields({
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
  readOnlyIdentity = false,
}) {
  const consultantHint = readOnlyIdentity
    ? 'Konsultan dan periode tidak dapat diubah setelah data pembayaran dibuat.'
    : 'Pilih konsultan yang memiliki transaksi siap dibayarkan pada periode ini. Transaksi yang ditahan dari periode sebelumnya juga akan ditampilkan.';

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppSelect
          label='Konsultan'
          required
          value={formData.id_user || undefined}
          options={consultantOptions}
          onChange={(value) => setFormValue('id_user', value || '')}
          disabled={readOnlyIdentity}
          placeholder='Pilih konsultan'
          hint={consultantHint}
          selectClassName={readOnlyIdentity ? '!rounded-lg' : '!rounded-lg'}
        />

        <AppSelect
          label='Periode Konsultan'
          required
          value={formData.id_periode_konsultan || undefined}
          options={periodeOptions}
          onChange={(value) => setFormValue('id_periode_konsultan', value || '')}
          disabled={readOnlyIdentity}
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
  );
}
