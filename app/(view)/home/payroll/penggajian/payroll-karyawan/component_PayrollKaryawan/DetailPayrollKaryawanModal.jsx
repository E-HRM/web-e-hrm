// app/(view)/home/payroll/payroll-karyawan/component_PayrollKaryawan/DetailPayrollKaryawanModal.jsx
'use client';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function DetailField({ label, value, valueClassName = 'text-gray-900', valueSize = 14, weight = 600 }) {
  return (
    <div>
      <AppTypography.Text
        size={12}
        className='block text-gray-600 mb-1'
      >
        {label}
      </AppTypography.Text>

      <AppTypography.Text
        size={valueSize}
        weight={weight}
        className={`block ${valueClassName}`}
      >
        {value}
      </AppTypography.Text>
    </div>
  );
}

export default function DetailPayrollKaryawanModal({ vm, buildItemKomponenHref }) {
  return (
    <AppModal
      open={vm.isDetailModalOpen}
      onClose={vm.closeDetailModal}
      title='Detail Payroll Karyawan'
      footer={null}
      width={760}
    >
      {vm.selectedPayroll ? (
        <div className='space-y-6'>
          <div className='border-b border-gray-200 pb-4'>
            <AppTypography.Text
              size={18}
              weight={700}
              className='block text-gray-900 mb-4'
            >
              Informasi Karyawan
            </AppTypography.Text>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <DetailField
                label='Nama Karyawan'
                value={vm.selectedPayroll.nama_karyawan_snapshot}
              />

              <DetailField
                label='Jenis Hubungan'
                value={vm.formatJenisHubungan(vm.selectedPayroll.jenis_hubungan_snapshot)}
              />

              <DetailField
                label='Departemen'
                value={vm.selectedPayroll.nama_departement_snapshot || '-'}
              />

              <DetailField
                label='Jabatan'
                value={vm.selectedPayroll.nama_jabatan_snapshot || '-'}
              />

              <DetailField
                label='Bank'
                value={vm.selectedPayroll.nama_bank_snapshot || '-'}
              />

              <DetailField
                label='No. Rekening'
                value={vm.selectedPayroll.nomor_rekening_snapshot || '-'}
              />
            </div>
          </div>

          <div className='border-b border-gray-200 pb-4'>
            <AppTypography.Text
              size={18}
              weight={700}
              className='block text-gray-900 mb-4'
            >
              Ringkasan Keuangan
            </AppTypography.Text>

            <div className='space-y-3'>
              <div className='flex justify-between'>
                <AppTypography.Text
                  size={14}
                  className='text-gray-600'
                >
                  Pendapatan Tetap
                </AppTypography.Text>

                <AppTypography.Text
                  size={14}
                  weight={600}
                  className='text-gray-900'
                >
                  {vm.formatCurrency(vm.selectedPayroll.total_pendapatan_tetap)}
                </AppTypography.Text>
              </div>

              <div className='flex justify-between'>
                <AppTypography.Text
                  size={14}
                  className='text-gray-600'
                >
                  Pendapatan Variabel
                </AppTypography.Text>

                <AppTypography.Text
                  size={14}
                  weight={600}
                  className='text-gray-900'
                >
                  {vm.formatCurrency(vm.selectedPayroll.total_pendapatan_variabel)}
                </AppTypography.Text>
              </div>

              <div className='flex justify-between border-t pt-2'>
                <AppTypography.Text
                  size={14}
                  weight={700}
                  className='text-gray-900'
                >
                  Total Bruto Kena Pajak
                </AppTypography.Text>

                <AppTypography.Text
                  size={14}
                  weight={700}
                  className='text-gray-900'
                >
                  {vm.formatCurrency(vm.selectedPayroll.total_bruto_kena_pajak)}
                </AppTypography.Text>
              </div>

              <div className='flex justify-between'>
                <AppTypography.Text
                  size={14}
                  className='text-red-600'
                >
                  PPh 21 ({vm.selectedPayroll.persen_pajak}%)
                </AppTypography.Text>

                <AppTypography.Text
                  size={14}
                  weight={600}
                  className='text-red-600'
                >
                  -{vm.formatCurrency(vm.selectedPayroll.total_pajak)}
                </AppTypography.Text>
              </div>

              <div className='flex justify-between'>
                <AppTypography.Text
                  size={14}
                  className='text-red-600'
                >
                  Potongan Lain
                </AppTypography.Text>

                <AppTypography.Text
                  size={14}
                  weight={600}
                  className='text-red-600'
                >
                  -{vm.formatCurrency(vm.selectedPayroll.total_potongan_lain)}
                </AppTypography.Text>
              </div>

              <div className='flex justify-between border-t pt-2'>
                <AppTypography.Text
                  size={18}
                  weight={700}
                  className='text-gray-900'
                >
                  Take Home Pay
                </AppTypography.Text>

                <AppTypography.Text
                  size={18}
                  weight={800}
                  className='text-green-600'
                >
                  {vm.formatCurrency(vm.selectedPayroll.total_dibayarkan)}
                </AppTypography.Text>
              </div>
            </div>
          </div>

          <div>
            <AppTypography.Text
              size={18}
              weight={700}
              className='block text-gray-900 mb-4'
            >
              Status & Catatan
            </AppTypography.Text>

            <div className='space-y-3'>
              <div>
                <AppTypography.Text
                  size={12}
                  className='block text-gray-600 mb-1'
                >
                  Status Payroll
                </AppTypography.Text>

                <AppTag
                  tone={vm.formatStatusPayroll(vm.selectedPayroll.status_payroll).tone}
                  variant='soft'
                  size='sm'
                  className='!font-medium'
                >
                  {vm.formatStatusPayroll(vm.selectedPayroll.status_payroll).label}
                </AppTag>
              </div>

              {vm.selectedPayroll.dibayar_pada ? (
                <DetailField
                  label='Tanggal Dibayar'
                  value={vm.formatDate(vm.selectedPayroll.dibayar_pada)}
                />
              ) : null}

              <DetailField
                label='Jumlah Item Komponen'
                value={String(vm.selectedPayroll.item_komponen_count || 0)}
              />

              {vm.selectedPayroll.catatan ? (
                <DetailField
                  label='Catatan'
                  value={vm.selectedPayroll.catatan}
                  weight={400}
                />
              ) : null}
            </div>
          </div>

          <div className='flex justify-end gap-3 pt-4'>
            <AppButton
              variant='outline'
              href={buildItemKomponenHref(vm.selectedPayroll)}
              className='!rounded-lg !px-4 !h-10'
            >
              Buka Item Komponen
            </AppButton>

            <AppButton
              variant='secondary'
              onClick={vm.closeDetailModal}
              className='!rounded-lg !px-4 !h-10'
            >
              Tutup
            </AppButton>
          </div>
        </div>
      ) : null}
    </AppModal>
  );
}
