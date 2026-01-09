'use client';

import React, { useMemo } from 'react';

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
        versi: sop.versi,
        tipe_file: sop.tipe_file,
        link_url: sop.link_url,
        fileList:
          sop.tipe_file === 'upload' && sop.file_name
            ? [{ uid: '-1', name: sop.file_name, status: 'done', url: sop.file_url }]
            : [],
      };
    }
    return { tipe_file: 'upload', versi: '1.0', fileList: [] };
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
        type: 'text',
        name: 'versi',
        label: 'Versi',
        placeholder: 'contoh: 1.0, 2.1',
        rules: [{ required: true, message: 'Versi wajib diisi' }],
      },
      {
        type: 'radio-group',
        name: 'tipe_file',
        label: 'Tipe File',
        options: [
          { value: 'upload', label: 'Upload PDF' },
          { value: 'link', label: 'Link Eksternal' },
        ],
        rules: [{ required: true, message: 'Pilih tipe file' }],
      },
      {
        type: 'upload',
        name: 'fileList',
        label: 'Upload File PDF',
        hidden: (ctx) => ctx?.values?.tipe_file !== 'upload',
        valuePropName: 'fileList',
        getValueFromEvent: (e) => e?.fileList,
        rules: [
          {
            validator: async (_rule, value, ctx) => {
              const tipe = ctx?.getValue?.('tipe_file');
              if (tipe !== 'upload') return Promise.resolve();
              const hasExisting = Boolean(sop?.file_url);
              const hasNew = Array.isArray(value) && value.length > 0;
              if (!hasExisting && !hasNew) return Promise.reject(new Error('File PDF wajib diupload'));
              return Promise.resolve();
            },
          },
        ],
        controlProps: {
          accept: '.pdf',
          maxCount: 1,
          beforeUpload: () => false,
          listType: 'text',
        },
        uploadText: 'Pilih File PDF',
      },
      {
        type: 'text',
        name: 'link_url',
        label: 'Link URL',
        placeholder: 'https://docs.google.com/…',
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
            <AppButton variant='secondary' onClick={onClose}>
              Batal
            </AppButton>
            <AppButton variant='primary' onClick={submit}>
              {sop ? 'Update' : 'Simpan'}
            </AppButton>
          </div>
        )}
        onFinish={async (values) => {
          const now = nowISO?.() || new Date().toISOString();

          // simulasi upload
          let file_url = sop?.file_url;
          let file_name = sop?.file_name;

          if (values.tipe_file === 'upload') {
            const list = Array.isArray(values.fileList) ? values.fileList : [];
            const f0 = list?.[0];
            if (f0?.name) {
              file_name = f0.name;
              file_url = f0.url || `https://example.com/sop/${encodeURIComponent(f0.name)}`;
            }
          }

          const payload = {
            id_sop: sop?.id_sop || `sop-${Date.now()}`,
            judul: values.judul,
            kategori: values.kategori,
            deskripsi: values.deskripsi,
            versi: values.versi,
            tipe_file: values.tipe_file,
            file_url: values.tipe_file === 'upload' ? file_url : undefined,
            file_name: values.tipe_file === 'upload' ? file_name : undefined,
            link_url: values.tipe_file === 'link' ? values.link_url : undefined,
            created_by: sop?.created_by || 'Current User',
            created_at: sop?.created_at || now,
            updated_at: now,
            last_updated_by: 'Current User',
          };

          onSave?.(payload);
          AppMessage.success(sop ? 'SOP berhasil diupdate' : 'SOP berhasil dibuat');
        }}
      />

      <AppTypography.Text size={12} tone='muted' className='block mt-3 text-slate-500'>
        Upload masih simulasi (dummy). Nanti API tinggal sambungkan upload + link.
      </AppTypography.Text>
    </AppModal>
  );
}
