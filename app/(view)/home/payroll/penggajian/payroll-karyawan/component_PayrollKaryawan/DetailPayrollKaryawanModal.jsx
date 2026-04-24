// app/(view)/home/payroll/payroll-karyawan/component_PayrollKaryawan/DetailPayrollKaryawanModal.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppUpload from '@/app/(view)/component_shared/AppUpload';

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
  const [proofFileList, setProofFileList] = useState([]);
  const payroll = vm.selectedPayroll;
  const proofUrl = String(payroll?.bukti_bayar_url || '').trim();
  const isImageProof = useMemo(() => /\.(png|jpe?g|webp)(\?|#|$)/i.test(proofUrl), [proofUrl]);

  useEffect(() => {
    if (!vm.isDetailModalOpen) return;

    setProofFileList([]);
  }, [vm.isDetailModalOpen, payroll?.id_payroll_karyawan]);

  const handleUploadBuktiBayar = async () => {
    const uploaded = await vm.handleUploadBuktiBayar?.({
      proofFiles: proofFileList,
    });

    if (uploaded) {
      setProofFileList([]);
    }
  };

  return (
    <AppModal
      open={vm.isDetailModalOpen}
      onClose={vm.closeDetailModal}
      title='Detail Penggajian Karyawan'
      footer={null}
      width={760}
    >
      {payroll ? (
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
                value={payroll.nama_karyawan_snapshot}
              />

              <DetailField
                label='Jenis Hubungan'
                value={vm.formatJenisHubungan(payroll.jenis_hubungan_snapshot)}
              />

              <DetailField
                label='Departemen'
                value={payroll.nama_departement_snapshot || '-'}
              />

              <DetailField
                label='Jabatan'
                value={payroll.nama_jabatan_snapshot || '-'}
              />

              <DetailField
                label='Bank'
                value={payroll.nama_bank_snapshot || '-'}
              />

              <DetailField
                label='Nomor Rekening'
                value={payroll.nomor_rekening_snapshot || '-'}
              />
            </div>
          </div>

          <div className='border-b border-gray-200 pb-4'>
            <AppTypography.Text
              size={18}
              weight={700}
              className='block text-gray-900 mb-4'
            >
              Informasi Dokumen
            </AppTypography.Text>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <DetailField
                label='Nomor Slip'
                value={payroll.issue_number || '-'}
              />

              <DetailField
                label='Tanggal Slip'
                value={payroll.issued_at ? vm.formatDateTime(payroll.issued_at) : '-'}
              />

              <DetailField
                label='Nama Perusahaan'
                value={payroll.company_name_snapshot || '-'}
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
                  {vm.formatCurrency(payroll.total_pendapatan_tetap)}
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
                  {vm.formatCurrency(payroll.total_pendapatan_variabel)}
                </AppTypography.Text>
              </div>

              <div className='flex justify-between border-t pt-2'>
                <AppTypography.Text
                  size={14}
                  weight={700}
                  className='text-gray-900'
                >
                  Gaji Kotor Kena Pajak
                </AppTypography.Text>

                <AppTypography.Text
                  size={14}
                  weight={700}
                  className='text-gray-900'
                >
                  {vm.formatCurrency(payroll.total_bruto_kena_pajak)}
                </AppTypography.Text>
              </div>

              <div className='flex justify-between'>
                <AppTypography.Text
                  size={14}
                  className='text-red-600'
                >
                  PPh 21 ({payroll.persen_pajak}%)
                </AppTypography.Text>

                <AppTypography.Text
                  size={14}
                  weight={600}
                  className='text-red-600'
                >
                  -{vm.formatCurrency(payroll.total_pajak)}
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
                  -{vm.formatCurrency(payroll.total_potongan_lain)}
                </AppTypography.Text>
              </div>

              <div className='flex justify-between border-t pt-2'>
                <AppTypography.Text
                  size={18}
                  weight={700}
                  className='text-gray-900'
                >
                  Gaji Bersih Diterima
                </AppTypography.Text>

                <AppTypography.Text
                  size={18}
                  weight={800}
                  className='text-green-600'
                >
                  {vm.formatCurrency(payroll.total_dibayarkan)}
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
                  Status Penggajian
                </AppTypography.Text>

                <AppTag
                  tone={vm.formatStatusPayroll(payroll.status_payroll).tone}
                  variant='soft'
                  size='sm'
                  className='!font-medium'
                >
                  {vm.formatStatusPayroll(payroll.status_payroll).label}
                </AppTag>
              </div>

              <div>
                <AppTypography.Text
                  size={12}
                  className='block text-gray-600 mb-1'
                >
                  Status Persetujuan
                </AppTypography.Text>

                <AppTag
                  tone={vm.formatStatusApproval(payroll.status_approval).tone}
                  variant='soft'
                  size='sm'
                  className='!font-medium'
                >
                  {vm.formatStatusApproval(payroll.status_approval).label}
                </AppTag>

                <AppTypography.Text
                  size={12}
                  className='block text-gray-500 mt-2'
                >
                  {payroll.approval_progress_label}
                </AppTypography.Text>

                <AppTypography.Text
                  size={12}
                  className='block text-gray-500 mt-1'
                >
                  {payroll.current_approval_label}
                </AppTypography.Text>
              </div>

              {payroll.finalized_at ? (
                <DetailField
                  label='Tanggal Finalisasi'
                  value={vm.formatDateTime(payroll.finalized_at)}
                />
              ) : null}

              <DetailField
                label='Jumlah Rincian Gaji'
                value={String(payroll.item_komponen_count || 0)}
              />

              {payroll.catatan ? (
                <DetailField
                  label='Catatan'
                  value={payroll.catatan}
                  weight={400}
                />
              ) : null}
            </div>
          </div>

          <div>
            <AppTypography.Text
              size={18}
              weight={700}
              className='block text-gray-900 mb-4'
            >
              Daftar Penyetuju
            </AppTypography.Text>

            <div className='space-y-3'>
              {Array.isArray(payroll.approval_steps) && payroll.approval_steps.length > 0 ? (
                payroll.approval_steps.map((step) => (
                  <div
                    key={step.id_approval_payroll_karyawan || `${step.level}-${step.approver_user_id || step.approver_display_name}`}
                    className='rounded-2xl border border-gray-200 p-4'
                  >
                    <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
                      <div>
                        <AppTypography.Text
                          size={14}
                          weight={700}
                          className='block text-gray-900'
                        >
                          Tahap {step.level} - {step.approver_display_name}
                        </AppTypography.Text>

                        <AppTypography.Text
                          size={12}
                          className='mt-1 block text-gray-500'
                        >
                          {step.approver_role_label}
                        </AppTypography.Text>
                      </div>

                      <AppTag
                        tone={step.decision_meta.tone}
                        variant='soft'
                        size='sm'
                        className='!font-medium'
                      >
                        {step.decision_meta.label}
                      </AppTag>
                    </div>
                  </div>
                ))
              ) : (
                <AppTypography.Text
                  size={13}
                  className='block text-gray-500'
                >
                  Belum ada penyetuju yang ditambahkan untuk penggajian ini.
                </AppTypography.Text>
              )}
            </div>
          </div>

          <div className='border-t border-gray-200 pt-4'>
            <AppTypography.Text
              size={18}
              weight={700}
              className='block text-gray-900 mb-4'
            >
              Bukti Pembayaran
            </AppTypography.Text>

            {proofUrl ? (
              <div className='space-y-3 rounded-2xl border border-green-100 bg-green-50 p-4'>
                <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                  <div>
                    <AppTag
                      tone='success'
                      variant='soft'
                      size='sm'
                      className='!font-medium'
                    >
                      Bukti bayar terunggah
                    </AppTag>

                    <AppTypography.Text
                      size={12}
                      className='mt-2 block text-green-700'
                    >
                      Finalisasi: {payroll.finalized_at ? vm.formatDateTime(payroll.finalized_at) : '-'}
                    </AppTypography.Text>
                  </div>

                  <AppButton
                    variant='outline'
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.open(proofUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className='!rounded-lg !px-4 !h-10'
                  >
                    Lihat Bukti
                  </AppButton>
                </div>

                {isImageProof ? (
                  <div className='flex max-h-[260px] items-center justify-center overflow-hidden rounded-xl border border-green-100 bg-white'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofUrl}
                      alt='Bukti pembayaran payroll'
                      className='max-h-[260px] max-w-full object-contain'
                    />
                  </div>
                ) : null}
              </div>
            ) : payroll.can_upload_bukti_bayar ? (
              <div className='space-y-4 rounded-2xl border border-gray-200 p-4'>
                <AppUpload
                  label='Upload Bukti Bayar'
                  required
                  maxCount={1}
                  listType='picture'
                  fileList={proofFileList}
                  onChange={(info) => setProofFileList(info?.fileList || [])}
                  beforeUpload={() => false}
                  accept='.jpg,.jpeg,.png,.pdf'
                  hint='Format yang didukung: JPG, PNG, atau PDF.'
                />

                <div className='flex justify-end'>
                  <AppButton
                    onClick={handleUploadBuktiBayar}
                    loading={vm.isSubmitting}
                    disabled={!proofFileList.length || vm.isSubmitting}
                    className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
                  >
                    Simpan Bukti Bayar
                  </AppButton>
                </div>
              </div>
            ) : (
              <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
                <AppTypography.Text
                  size={13}
                  className='block text-gray-500'
                >
                  Bukti bayar belum tersedia.
                </AppTypography.Text>
              </div>
            )}
          </div>

          <div className='flex justify-end gap-3 pt-4'>
            <AppButton
              variant='outline'
              href={buildItemKomponenHref(payroll)}
              className='!rounded-lg !px-4 !h-10'
            >
              Buka Rincian Gaji
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
