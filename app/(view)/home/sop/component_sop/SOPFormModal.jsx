'use client';

/**
 * FILE: app/(view)/home/sop/component_sop/SOPFormModal.jsx
 */

import React, { useMemo } from 'react';
import { Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

import AppModal from '@/app/(view)/component_shared/AppModal';
import AppForm from '@/app/(view)/component_shared/AppForm';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppMessage from '@/app/(view)/component_shared/AppMessage';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function SOPFormModal({ open, sop, activeCategories, onClose, onSave, nowISO }) {
  const initialValues = useMemo(() => {
    if (!open) return {};

    if (sop) {
      return {
        judul: sop.judul,
        kategori: sop.kategori,
        deskripsi: sop.deskripsi,
        tipe_file: sop.tipe_file || 'upload',
        link_url: sop.link_url || '',
        fileList:
          (sop.tipe_file === 'upload' || !sop.tipe_file) && sop.file_name
            ? [{ uid: '-1', name: sop.file_name, status: 'done', url: sop.file_url }]
            : [],
      };
    }

    return {
      judul: '',
      kategori: undefined,
      deskripsi: '',
      tipe_file: 'upload',
      link_url: '',
      fileList: [],
    };
  }, [open, sop]);

  const fields = useMemo(
    () => [
      {
        type: 'text',
        name: 'judul',
        label: 'Judul SOP',
        placeholder: 'Masukkan judul SOP',
        rules: [{ required: true, message: 'Judul SOP wajib diisi' }],
      },
      {
        type: 'select',
        name: 'kategori',
        label: 'Kategori',
        placeholder: 'Pilih kategori SOP',
        options: (activeCategories || []).map((c) => ({ value: c.key, label: c.name })),
        rules: [{ required: true, message: 'Kategori wajib dipilih' }],
      },
      {
        type: 'textarea',
        name: 'deskripsi',
        label: 'Deskripsi',
        placeholder: 'Masukkan deskripsi SOP',
        controlProps: { rows: 4, maxLength: 500, showCount: true },
        rules: [{ required: true, message: 'Deskripsi wajib diisi' }],
      },
      {
        type: 'radio-group',
        name: 'tipe_file',
        label: 'Tipe File',
        options: [
          { value: 'upload', label: 'Upload PDF' },
          { value: 'link', label: 'URL / Link' },
        ],
        rules: [{ required: true, message: 'Pilih tipe file' }],
      },

      // ✅ FIX: Upload fileList harus selalu array + handler harus (ctx) => fn
      {
        type: 'custom',
        name: 'fileList',
        label: 'Upload File PDF',
        watch: ['tipe_file'],
        hidden: (ctx) => ctx?.values?.tipe_file !== 'upload',
        valuePropName: 'fileList',

        getValueFromEvent: (_ctx) => (e) => {
          if (Array.isArray(e)) return e;
          if (Array.isArray(e?.fileList)) return e.fileList;
          return [];
        },

        normalize: (_ctx) => (value) => {
          if (Array.isArray(value)) return value;
          if (Array.isArray(value?.fileList)) return value.fileList;
          return [];
        },

        getValueProps: (_ctx) => (value) => {
          const list = Array.isArray(value) ? value : Array.isArray(value?.fileList) ? value.fileList : [];
          return { fileList: list };
        },

        rules: [
          {
            validator: async (_rule, value, ctx) => {
              const tipe = ctx?.getValue?.('tipe_file');
              if (tipe !== 'upload') return Promise.resolve();

              const hasExisting = Boolean(sop?.file_url);
              const list = Array.isArray(value) ? value : [];
              const hasNew = list.length > 0;

              if (!hasExisting && !hasNew) return Promise.reject(new Error('File PDF wajib diupload'));

              if (hasNew) {
                const f0 = list[0];
                const name = String(f0?.name || '').toLowerCase();
                const type = String(f0?.type || '').toLowerCase();
                const isPdf = type === 'application/pdf' || name.endsWith('.pdf');
                if (!isPdf) return Promise.reject(new Error('Hanya file PDF yang diperbolehkan'));
              }

              return Promise.resolve();
            },
          },
        ],
        extra: (ctx) => {
          if (ctx?.values?.tipe_file !== 'upload') return null;
          if (!sop?.file_url) return null;

          return (
            <AppTypography.Text tone='muted' className='block mt-2'>
              File saat ini: <b>{sop.file_name || 'PDF'}</b> (jika tidak memilih file baru, file lama tetap digunakan)
            </AppTypography.Text>
          );
        },
        render: (ctx) => {
          const disabled = Boolean(ctx?.disabled);

          return (
            <Upload.Dragger
              className='w-full'
              accept='.pdf,application/pdf'
              maxCount={1}
              multiple={false}
              disabled={disabled}
              beforeUpload={(file) => {
                const name = String(file?.name || '').toLowerCase();
                const type = String(file?.type || '').toLowerCase();
                const isPdf = type === 'application/pdf' || name.endsWith('.pdf');

                if (!isPdf) {
                  AppMessage.error('Hanya file PDF yang diperbolehkan.');
                  return Upload.LIST_IGNORE;
                }

                const maxMB = 10;
                const sizeMB = (file?.size || 0) / (1024 * 1024);
                if (sizeMB > maxMB) {
                  AppMessage.error(`Ukuran file terlalu besar. Maksimal ${maxMB}MB.`);
                  return Upload.LIST_IGNORE;
                }

                return false;
              }}
              showUploadList={{ showRemoveIcon: !disabled }}
            >
              <div className='py-4'>
                <div className='text-3xl mb-2'>
                  <InboxOutlined />
                </div>
                <AppTypography.Text className='block'>
                  <b>Klik</b> atau <b>drag & drop</b> file PDF ke sini
                </AppTypography.Text>
                <AppTypography.Text tone='muted' className='block mt-1'>
                  Format: PDF • Maks: 10MB • Maks 1 file
                </AppTypography.Text>
              </div>
            </Upload.Dragger>
          );
        },
      },

      {
        type: 'text',
        name: 'link_url',
        label: 'Link URL',
        placeholder: 'https://docs.google.com/…',
        watch: ['tipe_file'],
        hidden: (ctx) => ctx?.values?.tipe_file !== 'link',
        rules: [
          {
            validator: async (_rule, value, ctx) => {
              const tipe = ctx?.getValue?.('tipe_file');
              if (tipe !== 'link') return Promise.resolve();

              if (!value) return Promise.reject(new Error('Link URL wajib diisi'));
              try {
                new URL(String(value));
                return Promise.resolve();
              } catch {
                return Promise.reject(new Error('URL tidak valid'));
              }
            },
          },
        ],
      },
    ],
    [activeCategories, sop]
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      onCancel={onClose}
      title={sop ? 'Edit SOP' : 'Tambah SOP Baru'}
      footer={false}
      width={720}
      destroyOnClose
    >
      <AppForm
        key={`${open}-${sop?.id_sop || 'new'}`}
        initialValues={initialValues}
        showSubmit={false}
        fields={fields}
        footer={({ submit }) => (
          <div className='flex items-center justify-end gap-2 pt-2'>
            <AppButton
              variant='outline'
              onClick={onClose}
              className='!border-[#003A6F] !text-[#003A6F] hover:!border-[#003A6F] hover:!text-[#003A6F]'
            >
              Batal
            </AppButton>
            <AppButton variant='primary' onClick={submit}>
              {sop ? 'Update' : 'Simpan'}
            </AppButton>
          </div>
        )}
        onFinish={async (values) => {
          const now = nowISO ? nowISO() : new Date().toISOString();
          const tipe_file = values?.tipe_file;
          const fileList = Array.isArray(values?.fileList) ? values.fileList : [];

          const payload = {
            id_sop: sop?.id_sop,
            judul: values?.judul,
            kategori: values?.kategori,
            deskripsi: values?.deskripsi,
            tipe_file,
            fileList: tipe_file === 'upload' ? fileList : [],
            file_url: tipe_file === 'upload' ? sop?.file_url : undefined,
            file_name: tipe_file === 'upload' ? sop?.file_name : undefined,
            link_url: tipe_file === 'link' ? values?.link_url : undefined,
            created_at: sop?.created_at || now,
            updated_at: now,
          };

          await onSave?.(payload);
        }}
      />
    </AppModal>
  );
}
