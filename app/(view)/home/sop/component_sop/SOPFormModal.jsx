'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

import AppModal from '@/app/(view)/component_shared/AppModal';
import AppForm from '@/app/(view)/component_shared/AppForm';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppMessage from '@/app/(view)/component_shared/AppMessage';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function normalizeUploadList(input) {
  if (Array.isArray(input)) return input;
  if (input && typeof input === 'object') {
    if (typeof input.length === 'number') {
      try {
        return Array.from(input);
      } catch {
        return [];
      }
    }
    if (Array.isArray(input.fileList)) return input.fileList;
  }
  return [];
}

export default function SOPFormModal({ open, sop, activeCategories, onClose, onSave, nowISO }) {
  const [uploadFileList, setUploadFileList] = useState([]);

  useEffect(() => {
    if (!open) {
      setUploadFileList([]);
      return;
    }

    if (sop?.file_name && sop?.file_url && (sop?.tipe_file === 'upload' || !sop?.tipe_file)) {
      setUploadFileList([{ uid: '-1', name: sop.file_name, status: 'done', url: sop.file_url }]);
    } else {
      setUploadFileList([]);
    }
  }, [open, sop?.id_sop]);

  const initialValues = useMemo(() => {
    if (!open) return {};

    if (sop) {
      return {
        judul: sop.judul,
        kategori: sop.kategori,
        deskripsi: sop.deskripsi,
        tipe_file: sop.tipe_file || 'upload',
        link_url: sop.link_url || '',
      };
    }

    return {
      judul: '',
      kategori: undefined,
      deskripsi: '',
      tipe_file: 'upload',
      link_url: '',
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

      // Upload (managed by local state)
      {
        type: 'custom',
        name: '__upload_pdf_ui__',
        label: 'Upload File PDF',
        watch: ['tipe_file'],
        hidden: (ctx) => ctx?.values?.tipe_file !== 'upload',
        extra: () => {
          if (!sop?.file_url) return null;
          return (
            <AppTypography.Text tone='muted' className='block mt-2'>
              File saat ini: <b>{sop.file_name || 'PDF'}</b> (kalau tidak memilih file baru, file lama tetap digunakan)
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
              fileList={normalizeUploadList(uploadFileList)}
              onChange={(info) => {
                const next = normalizeUploadList(info?.fileList);
                setUploadFileList(next.slice(-1));
              }}
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

                return false; // manual upload at submit
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
    [activeCategories, sop, uploadFileList]
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
            {/* ✅ Batal jadi outlined biru tua */}
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
          if (tipe_file === 'upload') {
            const list = normalizeUploadList(uploadFileList);
            const hasExisting = Boolean(sop?.file_url) && list.some((f) => f?.status === 'done' && f?.url);
            const newFiles = list.filter((f) => !!f?.originFileObj);

            if (!hasExisting && newFiles.length === 0) {
              AppMessage.error('File PDF wajib diupload');
              return;
            }

            const payload = {
              id_sop: sop?.id_sop,
              judul: values?.judul,
              kategori: values?.kategori,
              deskripsi: values?.deskripsi,
              tipe_file,
              fileList: newFiles,
              file_url: sop?.file_url,
              file_name: sop?.file_name,
              link_url: undefined,
              created_at: sop?.created_at || now,
              updated_at: now,
            };

            await onSave?.(payload);
            return;
          }

          // tipe link
          const payload = {
            id_sop: sop?.id_sop,
            judul: values?.judul,
            kategori: values?.kategori,
            deskripsi: values?.deskripsi,
            tipe_file,
            fileList: [],
            file_url: undefined,
            file_name: undefined,
            link_url: values?.link_url,
            created_at: sop?.created_at || now,
            updated_at: now,
          };

          await onSave?.(payload);
        }}
      />
    </AppModal>
  );
}
