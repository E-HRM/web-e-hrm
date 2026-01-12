'use client';

import React, { useMemo } from 'react';

import AppModal from '@/app/(view)/component_shared/AppModal';
import AppForm from '@/app/(view)/component_shared/AppForm';
import AppButton from '@/app/(view)/component_shared/AppButton';

export default function SOPCategoryFormModal({ open, category, onClose, onSave }) {
  const isEdit = Boolean(category?.key);

  const initialValues = useMemo(() => {
    if (!open) return {};

    if (isEdit) {
      return {
        nama_kategori: category?.name || '',
        deskripsi: category?.description || '',
      };
    }

    return {
      nama_kategori: '',
      deskripsi: '',
    };
  }, [open, isEdit, category]);

  const fields = useMemo(
    () => [
      {
        type: 'text',
        name: 'nama_kategori',
        label: 'Nama Kategori',
        placeholder: 'Contoh: HR, Finance, SOP Umum',
        rules: [{ required: true, message: 'Nama kategori wajib diisi' }],
      },
      {
        type: 'textarea',
        name: 'deskripsi',
        label: 'Deskripsi',
        placeholder: 'Opsional',
        controlProps: { rows: 3, maxLength: 200, showCount: true },
      },
    ],
    []
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      onCancel={onClose}
      title={isEdit ? 'Edit Kategori' : 'Tambah Kategori'}
      width={560}
      footer={false}
      destroyOnClose
    >
      <AppForm
        key={`${open}-${isEdit ? category?.key : 'new'}`}
        initialValues={initialValues}
        fields={fields}
        showSubmit={false}
        formProps={{
          onKeyDown: (e) => {
            if (e.key === 'Enter') e.preventDefault();
          },
        }}
        footer={({ submit }) => (
          <div className='flex items-center justify-end gap-2 pt-2'>
            {/* ✅ BATAL: outlined biru tua */}
            <AppButton
              variant='outline'
              onClick={onClose}
              className='!border-[#003A6F] !text-[#003A6F] hover:!border-[#003A6F] hover:!text-[#003A6F]'
            >
              Batal
            </AppButton>

            <AppButton variant='primary' onClick={submit}>
              {isEdit ? 'Update' : 'Tambah'}
            </AppButton>
          </div>
        )}
        onFinish={async (values) => {
          const payload = {
            id: isEdit ? String(category.key) : undefined,
            nama_kategori: String(values?.nama_kategori || '').trim(),
            deskripsi:
              values?.deskripsi === undefined || values?.deskripsi === null
                ? null
                : String(values.deskripsi).trim() || null,
          };

          await onSave?.(payload);
        }}
      />
    </AppModal>
  );
}
