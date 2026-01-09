'use client';

import React, { useMemo } from 'react';

import AppModal from '@/app/(view)/component_shared/AppModal';
import AppDivider from '@/app/(view)/component_shared/AppDivider';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppTag from '@/app/(view)/component_shared/AppTag';

import { LinkOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons';

function InfoRow({ label, value }) {
  return (
    <div className='flex items-start justify-between gap-4'>
      <AppTypography.Text size={12} tone='muted' className='text-slate-500'>
        {label}
      </AppTypography.Text>
      <AppTypography.Text className='text-slate-800 text-right'>{value ?? '—'}</AppTypography.Text>
    </div>
  );
}

export default function SOPDetailModal({ open, sop, categoryMap, onClose, onEdit }) {
  const categoryName = useMemo(() => {
    if (!sop?.kategori) return '—';
    return categoryMap?.[sop.kategori]?.name || sop.kategori;
  }, [sop?.kategori, categoryMap]);

  const actionLabel = sop?.tipe_file === 'upload' ? 'Download PDF' : 'Buka Link';
  const actionIcon = sop?.tipe_file === 'upload' ? <DownloadOutlined /> : <LinkOutlined />;

  const handleOpen = () => {
    if (!sop) return;
    const url = sop.tipe_file === 'upload' ? sop.file_url : sop.link_url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const footer = (
    <div className='w-full flex items-center justify-between gap-3 flex-wrap'>
      <div className='flex items-center gap-2 flex-wrap'>
        <AppTag tone='info' variant='soft'>
          {categoryName}
        </AppTag>
        {sop?.versi ? (
          <AppTag tone='neutral' variant='soft'>
            Versi {sop.versi}
          </AppTag>
        ) : null}
      </div>

      <AppSpace size='sm'>
        <AppButton variant='secondary' icon={<EditOutlined />} onClick={onEdit}>
          Edit
        </AppButton>
        <AppButton variant='primary' icon={actionIcon} onClick={handleOpen} disabled={!sop}>
          {actionLabel}
        </AppButton>
        <AppButton variant='outline' onClick={onClose}>
          Tutup
        </AppButton>
      </AppSpace>
    </div>
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      onCancel={onClose}
      title={sop ? sop.judul : 'Detail SOP'}
      subtitle={sop ? `${sop.created_by || '—'}` : undefined}
      footer={footer}
      width={860}
    >
      {!sop ? null : (
        <div className='flex flex-col gap-4'>
          <div className='rounded-2xl ring-1 ring-slate-100 bg-white p-4'>
            <AppTypography.Text weight={800} className='block text-slate-900'>
              Deskripsi
            </AppTypography.Text>
            <AppDivider className='my-3' />
            <AppTypography.Text className='text-slate-700'>{sop.deskripsi}</AppTypography.Text>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            <div className='rounded-2xl ring-1 ring-slate-100 bg-white p-4'>
              <AppTypography.Text weight={800} className='block text-slate-900'>
                Informasi Dokumen
              </AppTypography.Text>
              <AppDivider className='my-3' />
              <div className='flex flex-col gap-2'>
                <InfoRow label='Kategori' value={categoryName} />
                <InfoRow label='Dibuat Oleh' value={sop.created_by || '—'} />
                <InfoRow label='Diupdate Oleh' value={sop.last_updated_by || '—'} />
              </div>
            </div>

            <div className='rounded-2xl ring-1 ring-slate-100 bg-white p-4'>
              <AppTypography.Text weight={800} className='block text-slate-900'>
                File / Link
              </AppTypography.Text>
              <AppDivider className='my-3' />
              <div className='flex flex-col gap-2'>
                <InfoRow label='Tipe' value={sop.tipe_file === 'upload' ? 'Upload PDF' : 'Link Eksternal'} />
                {sop.tipe_file === 'upload' ? (
                  <>
                    <InfoRow label='Nama File' value={sop.file_name || '—'} />
                    <InfoRow label='URL' value={sop.file_url || '—'} />
                  </>
                ) : (
                  <InfoRow label='URL' value={sop.link_url || '—'} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppModal>
  );
}
