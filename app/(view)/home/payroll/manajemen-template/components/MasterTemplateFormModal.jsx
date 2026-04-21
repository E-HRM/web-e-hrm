'use client';

import React, { useMemo, useState } from 'react';
import { Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppForm from '@/app/(view)/component_shared/AppForm';
import AppMessage from '@/app/(view)/component_shared/AppMessage';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function MasterTemplateFormModal({ open, template, onClose, onSave }) {
  const [submitting, setSubmitting] = useState(false);

  const initialValues = useMemo(() => {
    if (!open) return {};

    if (template) {
      return {
        nama_template: template.nama_template || '',
        source_type: template.source_type || 'upload',
        link_url: template.source_type === 'link' ? template.file_template_url || '' : '',
        fileList:
          template.source_type !== 'link' && template.file_template_url
            ? [
                {
                  uid: '-1',
                  name: template.file_name || 'template-file',
                  status: 'done',
                  url: template.file_template_url,
                },
              ]
            : [],
      };
    }

    return {
      nama_template: '',
      source_type: 'upload',
      link_url: '',
      fileList: [],
    };
  }, [open, template]);

  const fields = useMemo(
    () => [
      {
        type: 'text',
        name: 'nama_template',
        label: 'Nama Template',
        placeholder: 'Masukkan nama template payroll',
        rules: [{ required: true, message: 'Nama template wajib diisi' }],
      },
      {
        type: 'radio-group',
        name: 'source_type',
        label: 'Sumber File',
        options: [
          { value: 'upload', label: 'Upload File' },
          { value: 'link', label: 'URL / Link' },
        ],
        rules: [{ required: true, message: 'Pilih sumber file' }],
      },
      {
        type: 'custom',
        name: 'fileList',
        label: 'Upload Template',
        watch: ['source_type'],
        hidden: (ctx) => ctx?.values?.source_type !== 'upload',
        valuePropName: 'fileList',
        getValueFromEvent: () => (event) => {
          if (Array.isArray(event)) return event;
          if (Array.isArray(event?.fileList)) return event.fileList;
          return [];
        },
        normalize: () => (value) => {
          if (Array.isArray(value)) return value;
          if (Array.isArray(value?.fileList)) return value.fileList;
          return [];
        },
        getValueProps: () => (value) => {
          const fileList = Array.isArray(value) ? value : Array.isArray(value?.fileList) ? value.fileList : [];
          return { fileList };
        },
        rules: [
          {
            validator: async (_rule, value, ctx) => {
              if (ctx?.getValue?.('source_type') !== 'upload') return Promise.resolve();

              const hasExisting = Boolean(template?.file_template_url && template?.source_type !== 'link');
              const fileList = Array.isArray(value) ? value : [];
              if (!hasExisting && fileList.length === 0) {
                return Promise.reject(new Error('File template wajib diupload'));
              }
              return Promise.resolve();
            },
          },
        ],
        extra: (ctx) => {
          if (ctx?.values?.source_type !== 'upload') return null;
          if (!template?.file_template_url || template?.source_type === 'link') return null;

          return (
            <AppTypography.Text tone='muted' className='block mt-2'>
              File saat ini: <b>{template.file_name || 'template-file'}</b> (jika tidak memilih file baru, file lama tetap digunakan)
            </AppTypography.Text>
          );
        },
        render: (ctx) => (
          <Upload.Dragger
            className='w-full'
            maxCount={1}
            multiple={false}
            disabled={Boolean(ctx?.disabled)}
            beforeUpload={(file) => {
              const maxMB = 15;
              const fileSizeMB = (file?.size || 0) / (1024 * 1024);
              if (fileSizeMB > maxMB) {
                AppMessage.error(`Ukuran file terlalu besar. Maksimal ${maxMB}MB.`);
                return Upload.LIST_IGNORE;
              }
              return false;
            }}
            showUploadList={{ showRemoveIcon: !Boolean(ctx?.disabled) }}
          >
            <div className='py-4'>
              <div className='text-3xl mb-2'>
                <InboxOutlined />
              </div>
              <AppTypography.Text className='block'>
                <b>Klik</b> atau <b>drag & drop</b> file template ke sini
              </AppTypography.Text>
              <AppTypography.Text tone='muted' className='block mt-1'>
                Semua format file didukung, maksimal 15MB, dan hanya 1 file.
              </AppTypography.Text>
            </div>
          </Upload.Dragger>
        ),
      },
      {
        type: 'text',
        name: 'link_url',
        label: 'Link Template',
        placeholder: 'https://example.com/template',
        watch: ['source_type'],
        hidden: (ctx) => ctx?.values?.source_type !== 'link',
        rules: [
          {
            validator: async (_rule, value, ctx) => {
              if (ctx?.getValue?.('source_type') !== 'link') return Promise.resolve();
              if (!value) return Promise.reject(new Error('Link template wajib diisi'));

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
    [template]
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      onCancel={onClose}
      title={template ? 'Edit Template' : 'Tambah Template Baru'}
      footer={false}
      width={720}
      destroyOnClose
    >
      <AppForm
        key={`${open}-${template?.id_master_template || 'new'}`}
        initialValues={initialValues}
        showSubmit={false}
        loading={submitting}
        fields={fields}
        footer={({ submit }) => (
          <div className='flex items-center justify-end gap-2 pt-2'>
            <AppButton
              variant='outline'
              onClick={onClose}
              disabled={submitting}
              className='!border-[#003A6F] !text-[#003A6F] hover:!border-[#003A6F] hover:!text-[#003A6F]'
            >
              Batal
            </AppButton>
            <AppButton variant='primary' onClick={submit} loading={submitting}>
              {template ? 'Update' : 'Simpan'}
            </AppButton>
          </div>
        )}
        onFinish={async (values) => {
          const payload = {
            id_master_template: template?.id_master_template,
            nama_template: values?.nama_template,
            source_type: values?.source_type,
            fileList: values?.source_type === 'upload' ? (Array.isArray(values?.fileList) ? values.fileList : []) : [],
            file_template_url: values?.source_type === 'upload' ? template?.file_template_url : undefined,
            link_url: values?.source_type === 'link' ? values?.link_url : undefined,
          };

          try {
            setSubmitting(true);
            await onSave?.(payload);
            AppMessage.success(template ? 'Template berhasil diperbarui' : 'Template berhasil ditambahkan');
          } catch (error) {
            AppMessage.error(error?.message || 'Gagal menyimpan template');
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </AppModal>
  );
}
