'use client';

import React, { useMemo } from 'react';

import AppModal from '../../../../component_shared/AppModal';
import AppForm from '../../../../component_shared/AppForm';

const ACCENT = '#D9A96F';

export default function EditDivisionModal({ open, initialName, onCancel, onSubmit, loading }) {
  const submitColors = useMemo(
    () => ({
      primary: ACCENT,
      primaryHover: '#C89257',
      primaryActive: '#B98248',
    }),
    []
  );

  return (
    <AppModal
      open={open}
      onClose={() => {
        onCancel?.();
      }}
      title='Ubah Divisi'
      subtitle='Perbarui nama divisi'
      footer={false}
      destroyOnClose
    >
      <AppForm
        key={initialName ?? ''}
        initialValues={{ name: initialName || '' }}
        loading={!!loading}
        submitText='Simpan Perubahan'
        submitVariant='primary'
        submitProps={{ size: 'large', colors: submitColors }}
        onFinish={async (values) => {
          await onSubmit?.(values?.name);
          onCancel?.();
        }}
        fields={[
          {
            type: 'text',
            name: 'name',
            label: 'Nama Divisi',
            placeholder: 'Contoh: Divisi HR',
            rules: [{ required: true, message: 'Nama divisi wajib diisi' }],
          },
        ]}
      />
    </AppModal>
  );
}
