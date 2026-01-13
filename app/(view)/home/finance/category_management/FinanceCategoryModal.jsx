// app/(view)/home/finance/category_management/FinanceCategoryModal.jsx
'use client';

import React, { useEffect, useMemo } from 'react';
import { Form } from 'antd';

import AppModal from '@/app/(view)/component_shared/AppModal';
import AppForm from '@/app/(view)/component_shared/AppForm';
import AppButton from '@/app/(view)/component_shared/AppButton';

export default function FinanceCategoryModal({
  open,
  mode,
  initialName,
  onCancel,
  onSubmit,
  loading,
}) {
  const isEdit = mode === 'edit';
  const [form] = Form.useForm();

  const initialValues = useMemo(() => {
    return { nama_keperluan: initialName || '' };
  }, [initialName]);

  const fields = useMemo(
    () => [
      {
        type: 'text',
        name: 'nama_keperluan',
        label: 'Nama Keperluan',
        placeholder: 'Contoh: Transport / Konsumsi / Operasional',
        rules: [{ required: true, message: 'Nama keperluan wajib diisi' }],
      },
    ],
    []
  );

  useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [open, form, initialValues]);

  return (
    <AppModal
      open={open}
      title={isEdit ? 'Edit Kategori Keperluan' : 'Tambah Kategori Keperluan'}
      onCancel={onCancel}
      destroyOnClose
      width={520}
      footer={[
        <AppButton
          key="cancel"
          variant="outline" // ✅ Batal jadi outlined biru tua
          onClick={() => onCancel?.()}
          disabled={loading}
        >
          Batal
        </AppButton>,
        <AppButton
          key="submit"
          variant="primary" // ✅ Tambah/Ubah tetap primary
          loading={loading}
          onClick={() => form.submit()}
        >
          {isEdit ? 'Ubah' : 'Tambah'}
        </AppButton>,
      ]}
    >
      <AppForm
        form={form}
        layout="vertical"
        initialValues={initialValues}
        fields={fields}
        showSubmit={false}
        onFinish={async (values) => {
          const payload = {
            ...values,
            nama_keperluan: String(values?.nama_keperluan || '').trim(),
          };
          await onSubmit?.(payload);
        }}
      />
    </AppModal>
  );
}
