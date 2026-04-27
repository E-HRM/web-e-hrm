'use client';

import { useEffect, useState } from 'react';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppMessage from '@/app/(view)/component_shared/AppMessage';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function ApprovePayrollKaryawanModal({
  open,
  onClose,
  onSubmit,
  onRequestOtp,
  payroll,
  getApprovalStep,
  submitting = false,
  requestingOtp = false,
}) {
  const [note, setNote] = useState('');
  const [kodeOtp, setKodeOtp] = useState('');

  useEffect(() => {
    if (!open) return;

    setNote('');
    setKodeOtp('');
  }, [open, payroll?.id_payroll_karyawan]);

  const resolveApprovalStep = () => {
    const approvalStep = getApprovalStep?.(payroll);

    if (!approvalStep?.id_approval_payroll_karyawan) {
      AppMessage.error('Persetujuan Anda tidak ditemukan atau sudah diproses.');
      return null;
    }

    return approvalStep;
  };

  const handleRequestOtp = async () => {
    const approvalStep = resolveApprovalStep();
    if (!approvalStep) return false;

    if (typeof onRequestOtp !== 'function') return false;
    return onRequestOtp();
  };

  const handleSubmit = async () => {
    const approvalStep = resolveApprovalStep();
    if (!approvalStep) return false;

    const normalizedOtp = String(kodeOtp || '').trim();
    if (!/^\d{6}$/.test(normalizedOtp)) {
      AppMessage.error('Kode OTP wajib 6 digit.');
      return false;
    }

    if (typeof onSubmit !== 'function') return true;

    return onSubmit({
      kodeOtp: normalizedOtp,
      note,
    });
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      onCancel={onClose}
      title='Setujui Penggajian Karyawan'
      okText='Verifikasi & Setujui'
      cancelText='Batal'
      onOk={handleSubmit}
      okLoading={submitting}
      width={520}
    >
      <div className='flex flex-col gap-5'>
        <div className='rounded-xl border border-slate-200 bg-slate-50 px-4 py-3'>
          <div className='flex items-center justify-between gap-3'>
            <div className='min-w-0'>
              <AppTypography.Text
                weight={700}
                className='block text-slate-800'
              >
                Kode OTP Approval
              </AppTypography.Text>
              <AppTypography.Text
                size={12}
                className='block text-slate-500'
              >
                Kode dikirim ke email approver yang dipilih.
              </AppTypography.Text>
            </div>
            <AppButton
              variant='outline'
              size='small'
              loading={requestingOtp}
              disabled={submitting}
              onClick={handleRequestOtp}
            >
              Kirim OTP
            </AppButton>
          </div>
        </div>

        <AppInput
          label='Kode OTP'
          value={kodeOtp}
          onChange={(event) => setKodeOtp(String(event?.target?.value || '').replace(/\D/g, '').slice(0, 6))}
          placeholder='6 digit'
          maxLength={6}
          inputMode='numeric'
          size='large'
        />

        <AppInput.TextArea
          label='Catatan Persetujuan'
          value={note}
          onChange={(event) => setNote(event?.target?.value ?? '')}
          placeholder='Tambahkan catatan bila diperlukan.'
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </div>
    </AppModal>
  );
}
