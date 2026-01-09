'use client';

import React, { useMemo } from 'react';

import AppModal from '@/app/(view)/component_shared/AppModal';
import AppForm from '@/app/(view)/component_shared/AppForm';
import AppButton from '@/app/(view)/component_shared/AppButton';

export default function FinanceCategoryModal({
  open,
  mode, // 'create' | 'edit'
  kind, // 'payment' | 'pocket_money' | 'reimburses'
  initialName,
  initialDesc,
  onCancel,
  onSubmit,
}) {
  const kindLabel = kind === 'payment' ? 'Payment' : kind === 'pocket_money' ? 'Pocket Money' : 'Reimburse';

  const submitText = mode === 'create' ? 'Simpan' : 'Simpan Perubahan';

  const fields = useMemo(
    () => [
      {
        type: 'text',
        name: 'nama_kategori',
        label: 'Nama Kategori',
        placeholder: 'Contoh: Sponsorship Event / ATK / Transport',
        rules: [{ required: true, message: 'Nama kategori wajib diisi' }],
      },
      {
        type: 'text',
        name: 'deskripsi',
        label: 'Deskripsi (opsional)',
        placeholder: 'Contoh: Untuk pembayaran sponsorship event sekolah',
        rules: [],
      },
    ],
    []
  );

  return (
    <AppModal
      open={open}
      onClose={() => onCancel?.()}
      title={mode === 'create' ? `Tambah Kategori ${kindLabel}` : `Edit Kategori ${kindLabel}`}
      footer={false}
      destroyOnClose
    >
      <AppForm
        key={`${mode}-${kind}-${initialName ?? ''}-${initialDesc ?? ''}-${String(open)}`}
        initialValues={{
          nama_kategori: initialName || '',
          deskripsi: initialDesc || '',
        }}
        showSubmit={false}
        fields={fields}
        footer={({ submit }) => (
          <div className='flex items-center justify-end gap-2 pt-2'>
            <AppButton
              variant='secondary'
              onClick={() => onCancel?.()}
            >
              Batal
            </AppButton>
            <AppButton
              variant='primary'
              onClick={submit}
            >
              {submitText}
            </AppButton>
          </div>
        )}
        onFinish={async (values) => {
          await onSubmit?.(values);
        }}
      />
    </AppModal>
  );
}
