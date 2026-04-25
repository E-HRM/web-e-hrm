import AppButton from '@/app/(view)/component_shared/AppButton';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function ReadonlyField({ label, value, accentClassName = 'text-gray-900' }) {
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
        className={accentClassName}
      >
        {value}
      </AppTypography.Text>
    </div>
  );
}

export default function PayoutKonsultanPostModalSection({
  open,
  onClose,
  selectedPayout,
  postingSummary,
  postFormData,
  payrollOptions,
  definisiKomponenOptions,
  selectedDefinition,
  setPostFormValue,
  formatCurrency,
  isDefinisiKomponenLoading = false,
  isSubmitting = false,
  onSubmit,
}) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title='Posting ke Payroll'
      footer={null}
      width={680}
    >
      <div className='space-y-4'>
        <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900 mb-3'
          >
            Sumber Payout
          </AppTypography.Text>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <ReadonlyField
              label='Konsultan'
              value={selectedPayout?.user_display_name || selectedPayout?.id_user || '-'}
            />

            <ReadonlyField
              label='Periode Konsultan'
              value={selectedPayout?.periode_label || selectedPayout?.id_periode_konsultan || '-'}
            />

            <ReadonlyField
              label='Jumlah Transaksi Diposting'
              value={`${postingSummary?.detailPostingCount || 0} transaksi`}
            />

            <ReadonlyField
              label='Jumlah Transaksi Ditahan'
              value={`${postingSummary?.detailDitahanCount || 0} transaksi`}
              accentClassName={postingSummary?.detailDitahanCount ? 'text-red-700' : 'text-gray-900'}
            />

            <ReadonlyField
              label='Nominal Dibayarkan'
              value={formatCurrency(postingSummary?.nominalDibayarkan ?? selectedPayout?.nominal_dibayarkan)}
              accentClassName='text-green-700'
            />
          </div>
        </div>

        <div className='rounded-lg border border-gray-200 bg-white p-4'>
          <AppTypography.Text
            size={14}
            weight={700}
            className='block text-gray-900 mb-3'
          >
            Pengaturan Posting
          </AppTypography.Text>

          <div className='space-y-4'>
            <AppSelect
              label='Periode Payroll'
              required
              value={postFormData.id_periode_payroll || undefined}
              options={payrollOptions}
              onChange={(value) => setPostFormValue('id_periode_payroll', value || '')}
              placeholder='Pilih periode payroll tujuan'
              hint='Menentukan payroll tujuan tempat item komponen hasil posting payout akan ditempelkan.'
              selectClassName='!rounded-lg'
            />

            <AppSelect
              label='Definisi Komponen'
              required
              value={postFormData.id_definisi_komponen_payroll || undefined}
              options={definisiKomponenOptions}
              onChange={(value) => setPostFormValue('id_definisi_komponen_payroll', value || '')}
              placeholder='Pilih definisi komponen payroll'
              loading={isDefinisiKomponenLoading}
              hint='Nama komponen, tipe komponen, dan arah komponen akan mengikuti definisi yang dipilih.'
              selectClassName='!rounded-lg'
            />

            {selectedDefinition ? (
              <div className='rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3'>
                <AppTypography.Text
                  size={12}
                  weight={600}
                  className='block text-blue-700'
                >
                  Snapshot item mengikuti definisi terpilih
                </AppTypography.Text>

                <AppTypography.Text
                  size={12}
                  className='block text-blue-600 mt-1'
                >
                  {selectedDefinition.nama_komponen} - {selectedDefinition.tipe_komponen} - {selectedDefinition.arah_komponen}
                </AppTypography.Text>
              </div>
            ) : null}

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <AppInput.Number
                label='Nominal'
                value={postingSummary?.nominalDibayarkan ?? selectedPayout?.nominal_dibayarkan ?? 0}
                disabled
                hint='Nilai otomatis mengikuti nominal dibayarkan dari payout konsultan.'
                inputClassName='!rounded-lg'
              />

              <AppInput.Number
                label='Urutan Tampil'
                required
                value={postFormData.urutan_tampil}
                onChange={(value) => setPostFormValue('urutan_tampil', value ?? 0)}
                min={0}
                step={1}
                precision={0}
                hint='Nilai ini akan disimpan ke field urutan_tampil pada item komponen payroll hasil posting payout.'
                inputClassName='!rounded-lg'
              />
            </div>
          </div>
        </div>
      </div>

      <div className='flex items-center justify-end gap-3 pt-6'>
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
          className='!rounded-lg !px-4 !h-10 !bg-green-600 hover:!bg-green-700 !border-green-600 hover:!border-green-700 !text-white'
        >
          Posting Sekarang
        </AppButton>
      </div>
    </AppModal>
  );
}
