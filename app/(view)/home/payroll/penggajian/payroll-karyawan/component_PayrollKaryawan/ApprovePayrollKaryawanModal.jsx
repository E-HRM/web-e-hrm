'use client';

import { useEffect, useState } from 'react';

import AppInput from '@/app/(view)/component_shared/AppInput';
import AppMessage from '@/app/(view)/component_shared/AppMessage';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppUpload from '@/app/(view)/component_shared/AppUpload';

export default function ApprovePayrollKaryawanModal({ open, onClose, onSubmit, payroll, getApprovalStep, submitting = false }) {
  const [note, setNote] = useState('');
  const [fileList, setFileList] = useState([]);
  const [previewSrc, setPreviewSrc] = useState('');

  useEffect(() => {
    if (!open) return;

    setNote('');
    setFileList([]);
    setPreviewSrc('');
  }, [open, payroll?.id_payroll_karyawan]);

  useEffect(() => {
    if (!open) return undefined;

    const fileObj = fileList?.[0]?.originFileObj;
    if (fileObj && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const objectUrl = URL.createObjectURL(fileObj);
      setPreviewSrc(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    setPreviewSrc('');
    return undefined;
  }, [fileList, open]);

  const handleSubmit = async () => {
    const approvalStep = getApprovalStep?.(payroll);

    if (!approvalStep?.id_approval_payroll_karyawan) {
      AppMessage.error('Persetujuan Anda tidak ditemukan atau sudah diproses.');
      return false;
    }

    if (!Array.isArray(fileList) || fileList.length === 0) {
      AppMessage.error('Tanda tangan persetujuan wajib diunggah.');
      return false;
    }

    if (typeof onSubmit !== 'function') return true;

    return onSubmit({
      ttdFiles: fileList,
      note,
    });
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      onCancel={onClose}
      title='Setujui Penggajian Karyawan'
      okText='Simpan Persetujuan'
      cancelText='Batal'
      onOk={handleSubmit}
      okLoading={submitting}
      width={560}
    >
      <div className='flex flex-col gap-5'>
        <div className='flex flex-col gap-3'>
          <AppUpload
            label='Tanda Tangan Persetujuan'
            required
            maxCount={1}
            listType='picture'
            fileList={fileList}
            onChange={(info) => setFileList(info?.fileList || [])}
            beforeUpload={() => false}
            accept='.jpg,.jpeg,.png,.webp'
            hint='Unggah gambar tanda tangan.'
          />

          <div className='space-y-2'>
            <AppTypography.Text
              size={12}
              weight={600}
              className='block text-gray-700'
            >
              Pratinjau:
            </AppTypography.Text>

            <div className='flex h-[160px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3'>
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt='Pratinjau tanda tangan'
                  className='max-h-full max-w-full object-contain'
                />
              ) : (
                <AppTypography.Text
                  size={12}
                  className='text-gray-400'
                >
                  Belum ada gambar tanda tangan.
                </AppTypography.Text>
              )}
            </div>
          </div>
        </div>

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
