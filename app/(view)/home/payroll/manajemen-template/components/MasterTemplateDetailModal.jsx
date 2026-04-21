'use client';

import React from 'react';
import { DownloadOutlined, EditOutlined, FileTextOutlined, LinkOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function formatDateTime(value) {
  try {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

function DetailRow({ label, value, children }) {
  return (
    <div className='rounded-2xl border border-slate-200 bg-slate-50/70 p-4'>
      <AppTypography.Text size={11} weight={700} className='block uppercase tracking-[0.18em] text-slate-500'>
        {label}
      </AppTypography.Text>
      {children || (
        <AppTypography.Text className='mt-1 block text-slate-900'>
          {value || '-'}
        </AppTypography.Text>
      )}
    </div>
  );
}

export default function MasterTemplateDetailModal({ open, template, onClose, onEdit }) {
  const isUpload = template?.source_type !== 'link';

  return (
    <AppModal
      open={open}
      onClose={onClose}
      onCancel={onClose}
      title={template?.nama_template || 'Detail Template'}
      subtitle='Informasi lengkap file master template payroll'
      width={720}
      destroyOnClose
      footer={
        <div className='flex items-center justify-end gap-2'>
          <AppButton variant='outline' onClick={onClose}>
            Tutup
          </AppButton>
          <AppButton variant='outline' icon={<EditOutlined />} onClick={onEdit}>
            Edit
          </AppButton>
          <AppButton
            variant='primary'
            icon={<DownloadOutlined />}
            onClick={() => {
              const url = String(template?.file_template_url || '').trim();
              if (!url) return;
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
          >
            Buka Template
          </AppButton>
        </div>
      }
    >
      <div className='space-y-4'>
        <div className='rounded-3xl border border-[#003A6F]/10 bg-gradient-to-r from-[#F3F8FD] to-white p-5'>
          <div className='flex items-start justify-between gap-3 flex-wrap'>
            <div className='min-w-0'>
              <AppTypography.Text size={12} weight={700} className='block uppercase tracking-[0.22em] text-[#003A6F]'>
                Template Payroll
              </AppTypography.Text>
              <AppTypography.Title level={4} className='!mb-1 !mt-2 truncate text-[#0F172A]'>
                {template?.nama_template || '-'}
              </AppTypography.Title>
              <AppTypography.Text tone='secondary' className='block'>
                Gunakan file ini sebagai acuan untuk kebutuhan payroll dan dokumen turunannya.
              </AppTypography.Text>
            </div>

            <AppTag tone={isUpload ? 'info' : 'warning'} variant='soft' icon={isUpload ? <FileTextOutlined /> : <LinkOutlined />}>
              {isUpload ? 'File Upload' : 'URL Link'}
            </AppTag>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <DetailRow label='Nama Template' value={template?.nama_template} />
          <DetailRow label='Nama File' value={template?.file_name} />
          <DetailRow label='Dibuat' value={formatDateTime(template?.created_at)} />
          <DetailRow label='Diupdate' value={formatDateTime(template?.updated_at)} />
          <div className='md:col-span-2'>
            <DetailRow label='URL Template'>
              <div className='mt-1 flex items-start justify-between gap-3'>
                <AppTypography.Text className='block break-all text-slate-900'>
                  {template?.file_template_url || '-'}
                </AppTypography.Text>
                {template?.file_template_url ? (
                  <AppButton
                    variant='link'
                    className='!px-0 shrink-0'
                    onClick={() => window.open(template.file_template_url, '_blank', 'noopener,noreferrer')}
                  >
                    Buka
                  </AppButton>
                ) : null}
              </div>
            </DetailRow>
          </div>
        </div>
      </div>
    </AppModal>
  );
}
