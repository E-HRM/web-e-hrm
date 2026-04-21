'use client';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function InfoCard({ label, value, valueClassName = 'text-gray-900' }) {
  return (
    <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
      <AppTypography.Text
        size={12}
        className='block text-gray-500 mb-1'
      >
        {label}
      </AppTypography.Text>

      <AppTypography.Text
        size={15}
        weight={700}
        className={`block ${valueClassName}`}
      >
        {value}
      </AppTypography.Text>
    </div>
  );
}

export default function PostToPayrollModalSection({ vm }) {
  const cicilan = vm.selectedPostCicilan;
  const isSubmitting = vm.actionLoadingId === cicilan?.id_cicilan_pinjaman_karyawan;
  const hasOptions = vm.payrollOptions.length > 0;
  const componentSnapshot = vm.selectedPostComponentSnapshot;

  let selectHint = 'Posting akan membuat atau memperbarui item komponen payroll pinjaman pada payroll karyawan yang dipilih.';

  if (vm.payrollTargetsError) {
    selectHint = vm.payrollTargetsError?.message || 'Data payroll tujuan belum berhasil dimuat.';
  } else if (!vm.payrollTargetsLoading && !hasOptions) {
    selectHint = 'Belum ada payroll mutable untuk karyawan ini. Buat payroll karyawan terlebih dahulu.';
  }

  return (
    <AppModal
      open={vm.isPostModalOpen}
      onClose={vm.closePostModal}
      title={cicilan ? `Posting ke Payroll - ${cicilan.nama_karyawan}` : 'Posting ke Payroll'}
      subtitle='Pilih payroll tujuan agar tagihan cicilan diposting sebagai komponen potongan payroll.'
      footer={null}
      width={820}
    >
      {cicilan ? (
        <div className='space-y-5'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <InfoCard
              label='Karyawan'
              value={cicilan.nama_karyawan || '-'}
            />

            <InfoCard
              label='Identitas'
              value={cicilan.identitas_karyawan || '-'}
            />

            <InfoCard
              label='Pinjaman'
              value={cicilan.nama_pinjaman || 'Pinjaman Karyawan'}
            />

            <InfoCard
              label='Jatuh Tempo'
              value={vm.formatDate(cicilan.jatuh_tempo)}
            />

            <InfoCard
              label='Periode Tagihan'
              value={cicilan.periode_tagihan_label || '-'}
            />

            <InfoCard
              label='Nominal Tagihan'
              value={vm.formatCurrency(cicilan.nominal_tagihan)}
              valueClassName='text-green-700'
            />
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
                label='Payroll Tujuan'
                required
                value={vm.postFormData.id_payroll_karyawan || undefined}
                options={vm.payrollOptions}
                loading={vm.payrollTargetsLoading || vm.payrollTargetsValidating}
                disabled={isSubmitting || !hasOptions}
                onChange={(value) => vm.setPostFormValue('id_payroll_karyawan', value || '')}
                placeholder='Pilih payroll karyawan tujuan'
                hint={selectHint}
                selectClassName='!rounded-lg'
              />

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <InfoCard
                  label='Tipe Komponen'
                  value='Pinjaman'
                />

                <InfoCard
                  label='Nama Komponen'
                  value={componentSnapshot?.nama_komponen || 'Pinjaman'}
                />

                <InfoCard
                  label='Arah Komponen'
                  value='Potongan'
                />

                <InfoCard
                  label='Nominal Item Payroll'
                  value={vm.formatCurrency(componentSnapshot?.nominal ?? cicilan.nominal_tagihan)}
                  valueClassName='text-green-700'
                />
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <AppInput.Number
                  label='Urutan Tampil'
                  required
                  value={vm.postFormData.urutan_tampil}
                  onChange={(value) => vm.setPostFormValue('urutan_tampil', value ?? 0)}
                  min={0}
                  step={1}
                  precision={0}
                  disabled={isSubmitting}
                  hint='Nilai ini akan disimpan ke field urutan_tampil pada item komponen payroll hasil posting cicilan pinjaman.'
                  inputClassName='!rounded-lg'
                />

                <div className='rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3'>
                  <AppTypography.Text
                    size={12}
                    weight={600}
                    className='block text-blue-700'
                  >
                    Snapshot komponen payroll
                  </AppTypography.Text>

                  <AppTypography.Text
                    size={12}
                    className='block text-blue-600 mt-1 leading-5'
                  >
                    Tipe komponen tetap Pinjaman, nama komponen mengikuti nama pinjaman, arah komponen tetap Potongan, dan nominal mengikuti nominal tagihan.
                  </AppTypography.Text>
                </div>
              </div>

              <AppInput.TextArea
                label='Catatan'
                value={vm.postFormData.catatan_item_payroll}
                onChange={(event) => vm.setPostFormValue('catatan_item_payroll', event?.target?.value || '')}
                disabled={isSubmitting}
                autoSize={{ minRows: 3, maxRows: 5 }}
                placeholder='Tambahkan catatan opsional untuk item komponen payroll hasil posting'
                hint='Catatan ini akan disimpan pada item komponen payroll hasil posting cicilan pinjaman.'
                inputClassName='!rounded-lg'
              />
            </div>
          </div>

          <div className='flex items-center justify-end gap-3 pt-2'>
            <AppButton
              variant='outline'
              onClick={vm.closePostModal}
              disabled={isSubmitting}
              className='!rounded-lg !px-4 !h-10 !border-gray-300 !text-gray-700 hover:!bg-gray-50 hover:!border-gray-300 hover:!text-gray-700'
            >
              Batal
            </AppButton>

            <AppButton
              onClick={vm.handlePostToPayroll}
              loading={isSubmitting}
              disabled={isSubmitting || !hasOptions}
              className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
            >
              Posting ke Payroll
            </AppButton>
          </div>
        </div>
      ) : null}
    </AppModal>
  );
}
