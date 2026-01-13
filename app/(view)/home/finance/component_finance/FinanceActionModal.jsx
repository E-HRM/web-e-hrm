'use client';

import React, { useEffect, useMemo, useState } from 'react';

import AppModal from '@/app/(view)/component_shared/AppModal';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppUpload from '@/app/(view)/component_shared/AppUpload';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppMessage from '@/app/(view)/component_shared/AppMessage';

/**
 * FinanceActionModal
 * - mode: 'approve' | 'reject'
 * - requireProof: boolean (untuk approve)
 */
export default function FinanceActionModal({ open, onClose, mode = 'approve', requireProof = false, title, subtitle, okText, request }) {
  const isApprove = mode === 'approve';
  const [reason, setReason] = useState('');
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    if (!open) return;
    setReason('');
    setFileList([]);
  }, [open]);

  const computedTitle = useMemo(() => {
    if (title) return title;
    return isApprove ? 'Konfirmasi Pembayaran' : 'Tolak Pengajuan';
  }, [title, isApprove]);

  const computedOkText = useMemo(() => {
    if (okText) return okText;
    return isApprove ? 'Simpan' : 'Tolak';
  }, [okText, isApprove]);

  const onSubmit = async () => {
    if (!request?.onSubmit) {
      onClose?.();
      return;
    }

    if (!isApprove) {
      const r = String(reason || '').trim();
      if (!r) {
        AppMessage.error('Alasan penolakan wajib diisi');
        return false;
      }
      await request.onSubmit({ mode, reason: r, proofFiles: [] });
      return true;
    }

    if (requireProof && (!Array.isArray(fileList) || fileList.length === 0)) {
      AppMessage.error('Bukti pembayaran wajib di-upload');
      return false;
    }

    await request.onSubmit({ mode, reason: '', proofFiles: fileList || [] });
    return true;
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      onCancel={onClose}
      title={computedTitle}
      subtitle={subtitle}
      okText={computedOkText}
      cancelText='Batal'
      onOk={onSubmit}
      variant={isApprove ? 'default' : 'danger'}
      width={640}
    >
      <div className='flex flex-col gap-4'>
        {isApprove ? (
          <>
            <AppTypography.Text className='text-slate-700'>
              Upload bukti pembayaran (JPG/PNG/PDF) untuk menyelesaikan proses pengajuan.
            </AppTypography.Text>

            <AppUpload
              label='Bukti Pembayaran'
              required={requireProof}
              listType='picture'
              maxCount={1}
              fileList={fileList}
              onChange={(info) => setFileList(info?.fileList || [])}
              beforeUpload={() => false}
              accept='.jpg,.jpeg,.png,.pdf'
            />
          </>
        ) : (
          <AppInput.TextArea
            label='Alasan penolakan'
            required
            value={reason}
            onChange={(e) => setReason(e?.target?.value ?? '')}
            placeholder='Tulis alasan yang jelas (contoh: nota tidak valid / data kurang lengkap)'
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        )}
      </div>
    </AppModal>
  );
}
