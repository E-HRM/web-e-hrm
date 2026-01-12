'use client';

import React, { useMemo } from 'react';

import AppModal from '@/app/(view)/component_shared/AppModal';
import AppDivider from '@/app/(view)/component_shared/AppDivider';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppSpace from '@/app/(view)/component_shared/AppSpace';

import { LinkOutlined, FilePdfOutlined, EditOutlined } from '@ant-design/icons';

function InfoRow({ label, value }) {
  return (
    <div className='flex items-start justify-between gap-4'>
      <AppTypography.Text tone='muted' className='min-w-[120px]'>
        {label}
      </AppTypography.Text>
      <AppTypography.Text className='text-slate-800 text-right break-all'>{value ?? '—'}</AppTypography.Text>
    </div>
  );
}

function TruncatedText({ text, maxWidthClass = 'max-w-[360px]' }) {
  const t = String(text || '—');
  return (
    <span className={`inline-block ${maxWidthClass} truncate align-middle`} title={t}>
      {t}
    </span>
  );
}

export default function SOPDetailModal({ open, sop, categoryMap, onClose, onEdit }) {
  const categoryName = useMemo(() => {
    if (!sop?.kategori) return '—';
    return categoryMap?.[sop.kategori]?.name || sop.kategori;
  }, [sop?.kategori, categoryMap]);

  const isUpload = sop?.tipe_file === 'upload';
  const primaryLabel = isUpload ? 'Buka Dokumen' : 'Buka Link';
  const primaryIcon = isUpload ? <FilePdfOutlined /> : <LinkOutlined />;

  const handleOpen = () => {
    if (!sop) return;
    const url = sop.tipe_file === 'upload' ? sop.file_url : sop.link_url;
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const footer = (
    <div className='w-full flex items-center justify-between gap-3 flex-wrap'>
      <AppSpace size='sm'>
        <AppButton
          variant='outline'
          icon={<EditOutlined />}
          className='!border-[#003A6F] !text-[#003A6F] hover:!border-[#003A6F]'
          onClick={onEdit}
          disabled={!sop}
        >
          Edit
        </AppButton>

        <AppButton variant='primary' icon={primaryIcon} onClick={handleOpen} disabled={!sop}>
          {primaryLabel}
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
            <AppTypography.Text className='text-slate-700 whitespace-pre-wrap'>
              {sop.deskripsi || '—'}
            </AppTypography.Text>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='rounded-2xl ring-1 ring-slate-100 bg-white p-4'>
              <AppTypography.Text weight={800} className='block text-slate-900'>
                Informasi
              </AppTypography.Text>
              <AppDivider className='my-3' />
              <div className='flex flex-col gap-2'>
                <InfoRow label='Kategori' value={<TruncatedText text={categoryName} maxWidthClass='max-w-[280px]' />} />
                <InfoRow label='Dibuat Oleh' value={sop.created_by || '—'} />
                <InfoRow label='Diupdate Oleh' value={sop.last_updated_by || '—'} />
              </div>
            </div>

            <div className='rounded-2xl ring-1 ring-slate-100 bg-white p-4'>
              <AppTypography.Text weight={800} className='block text-slate-900'>
                File / Link
              </AppTypography.Text>
              <AppDivider className='my-3' />
              <div className='flex flex-col gap-3'>
                <div className='rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3 flex items-center justify-between gap-3'>
                  <div className='min-w-0'>
                    <AppTypography.Text weight={800} className='block text-slate-900'>
                      {isUpload ? 'Dokumen' : 'Link'}
                    </AppTypography.Text>
                    <AppTypography.Text tone='muted' className='block'>
                      Klik tombol di kanan untuk membuka
                    </AppTypography.Text>
                  </div>

                  <AppButton
                    variant='outline'
                    icon={isUpload ? <FilePdfOutlined /> : <LinkOutlined />}
                    className='!border-slate-200 !text-slate-800'
                    onClick={handleOpen}
                    disabled={!sop}
                    title={isUpload ? sop.file_url || '' : sop.link_url || ''}
                  >
                    {isUpload ? 'Dokumen' : 'Link'}
                  </AppButton>
                </div>

                <div className='flex flex-col gap-2'>
                  <InfoRow label='Tipe' value={isUpload ? 'PDF' : 'URL'} />
                  <InfoRow
                    label='Sumber'
                    value={
                      <span
                        className='inline-flex items-center gap-2 max-w-[280px] truncate align-middle'
                        title={isUpload ? sop.file_url || '' : sop.link_url || ''}
                      >
                        {isUpload ? <FilePdfOutlined /> : <LinkOutlined />}
                        {isUpload ? 'Dokumen' : 'Link'}
                      </span>
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppModal>
  );
}
