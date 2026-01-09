'use client';

import React, { useMemo } from 'react';

import AppModal from '@/app/(view)/component_shared/AppModal';
import AppForm from '@/app/(view)/component_shared/AppForm';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppAlert from '@/app/(view)/component_shared/AppAlert';

export default function SOPCategoryFormModal({ open, category, existingKeys, onClose, onSave, toSnakeCaseKey, nowISO }) {
  const initialValues = useMemo(() => {
    if (!open) return {};
    if (category) {
      return {
        name: category.name,
        key: category.key,
        description: category.description,
        is_active: Boolean(category.is_active),
      };
    }
    return { is_active: true };
  }, [open, category]);

  const fields = useMemo(
    () => [
      {
        type: 'custom',
        name: '__info__',
        render: () => (
          <AppAlert
            type='info'
            showIcon
            message='Info'
            description='Key kategori akan dipakai sebagai identifier unik. Gunakan format snake_case (contoh: admin_center, design_sosmed)'
          />
        ),
      },
      {
        type: 'text',
        name: 'name',
        label: 'Nama Kategori',
        placeholder: 'contoh: SOP Admin Center',
        rules: [
          { required: true, message: 'Nama kategori wajib diisi' },
          { min: 3, message: 'Nama minimal 3 karakter' },
        ],
      },
      {
        type: 'text',
        name: 'key',
        label: 'Key Kategori',
        placeholder: 'contoh: admin_center',
        rules: [
          { required: true, message: 'Key kategori wajib diisi' },
          {
            validator: async (_rule, value) => {
              const normalized = toSnakeCaseKey?.(value) || '';
              if (!normalized) return Promise.reject(new Error('Key kategori tidak valid'));

              const dup = (existingKeys || []).some((k) => k === normalized && (!category || category.key !== normalized));
              if (dup) return Promise.reject(new Error('Key kategori sudah digunakan'));

              return Promise.resolve();
            },
          },
        ],
        extra: 'Gunakan huruf kecil dan underscore (snake_case).',
      },
      {
        type: 'textarea',
        name: 'description',
        label: 'Deskripsi',
        placeholder: 'Deskripsi singkat tentang kategori ini',
        controlProps: { rows: 3, maxLength: 200, showCount: true },
        rules: [{ required: true, message: 'Deskripsi wajib diisi' }],
      },
      {
        type: 'switch',
        name: 'is_active',
        label: 'Status',
        valuePropName: 'checked',
        controlProps: { checkedChildren: 'Active', unCheckedChildren: 'Inactive' },
      },
    ],
    [existingKeys, category, toSnakeCaseKey]
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      onCancel={onClose}
      title={category ? 'Edit Kategori' : 'Tambah Kategori Baru'}
      footer={false}
      width={620}
      destroyOnClose
    >
      <AppForm
        key={`${open}-${category?.id || 'new'}`}
        initialValues={initialValues}
        showSubmit={false}
        fields={fields}
        footer={({ submit }) => (
          <div className='flex items-center justify-end gap-2 pt-2'>
            <AppButton variant='secondary' onClick={onClose}>
              Batal
            </AppButton>
            <AppButton variant='primary' onClick={submit}>
              {category ? 'Update' : 'Simpan'}
            </AppButton>
          </div>
        )}
        onFinish={async (values) => {
          const now = nowISO?.() || new Date().toISOString();
          const normalizedKey = toSnakeCaseKey?.(values.key) || values.key;

          onSave?.({
            id: category?.id || `cat-${Date.now()}`,
            key: normalizedKey,
            name: values.name,
            description: values.description,
            is_active: Boolean(values.is_active),
            created_at: category?.created_at || now,
            updated_at: now,
          });
        }}
      />
    </AppModal>
  );
}
