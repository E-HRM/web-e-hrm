'use client';

import React, { useMemo, useState } from 'react';

import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppDivider from '@/app/(view)/component_shared/AppDivider';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppInput from '@/app/(view)/component_shared/AppInput';

import FinanceStatusTag from '../../component_finance/FinanceStatusTag';
import FinanceActionModal from '../../component_finance/FinanceActionModal';

function formatIDR(num) {
  const n = Number(num || 0);
  return new Intl.NumberFormat('id-ID').format(Number.isFinite(n) ? n : 0);
}

function InfoRow({ label, value }) {
  return (
    <div className='flex items-start justify-between gap-3'>
      <AppTypography.Text
        size={12}
        tone='muted'
        className='text-slate-500'
      >
        {label}
      </AppTypography.Text>
      <AppTypography.Text className='text-slate-800 text-right'>{value ?? '—'}</AppTypography.Text>
    </div>
  );
}

function FileList({ title, files }) {
  const list = Array.isArray(files) ? files : files ? [files] : [];
  return (
    <div className='rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3'>
      <AppTypography.Text
        weight={800}
        className='block text-slate-900'
      >
        {title}
      </AppTypography.Text>
      <div className='mt-2 flex flex-col gap-1'>
        {list.length ? (
          list.map((f, idx) => (
            <AppTypography.Text
              key={idx}
              size={13}
              className='text-slate-700'
            >
              • {f?.name || 'file'}
            </AppTypography.Text>
          ))
        ) : (
          <AppTypography.Text
            size={12}
            tone='muted'
            className='text-slate-500'
          >
            Belum ada dokumen.
          </AppTypography.Text>
        )}
      </div>
    </div>
  );
}

export default function PaymentDetailModal({ open, onClose, data, onApprove, onReject, onMarkReceiptUploaded }) {
  const [action, setAction] = useState(null); // 'approve' | 'reject' | null
  const [receiptName, setReceiptName] = useState('');

  const title = useMemo(() => {
    if (!data) return 'Detail Payment';
    return `Payment • ${data.number}`;
  }, [data]);

  const items = useMemo(() => data?.items || [], [data]);

  const footer = useMemo(() => {
    if (!data) return null;

    const isFinalReject = data.status === 'REJECTED';
    const canApprove = data.status === 'PENDING' || data.status === 'IN_REVIEW';

    return (
      <div className='w-full flex flex-col gap-3'>
        <div className='w-full flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <FinanceStatusTag status={data.status} />
            {data?.rejectReason ? (
              <AppTypography.Text
                size={12}
                tone='muted'
                className='text-slate-500'
              >
                • {data.rejectReason}
              </AppTypography.Text>
            ) : null}
          </div>

          <AppSpace size='sm'>

            {!isFinalReject ? (
              <>
                <AppButton
                  variant='danger'
                  disabled={data.status === 'APPROVED'}
                  onClick={() => setAction('reject')}
                >
                  Reject
                </AppButton>

                <AppButton
                  variant='primary'
                  disabled={!canApprove}
                  onClick={() => setAction('approve')}
                >
                  Bayar
                </AppButton>
              </>
            ) : null}
          </AppSpace>
        </div>

        {data.status === 'APPROVED' ? (
          <div className='w-full rounded-xl bg-amber-50 ring-1 ring-amber-100 p-3 flex flex-col gap-2'>
            <AppTypography.Text
              weight={800}
              className='text-amber-900'
            >
              Tahap Setelah Transfer (Dummy)
            </AppTypography.Text>
            <AppTypography.Text className='text-amber-900'>
              Setelah admin upload bukti transfer, requester biasanya meng-upload kuitansi / bukti share ke vendor.
            </AppTypography.Text>

            <div className='flex flex-wrap items-end gap-2'>
              <AppInput
                label='Nama file kuitansi (simulasi)'
                value={receiptName}
                onChange={(e) => setReceiptName(e?.target?.value ?? '')}
                placeholder='contoh: kuitansi_vendor.pdf'
                className='min-w-[260px]'
              />

              <AppButton
                variant='secondary'
                disabled={!!data.requesterReceipt}
                onClick={async () => {
                  await onMarkReceiptUploaded?.({ id: data.id, receiptName: receiptName || 'kuitansi.pdf' });
                  setReceiptName('');
                }}
              >
                Upload Kuitansi
              </AppButton>
            </div>
          </div>
        ) : null}
      </div>
    );
  }, [data, onClose, receiptName, onMarkReceiptUploaded]);

  return (
    <>
      <AppModal
        open={open}
        onClose={onClose}
        onCancel={onClose}
        title={title}
        subtitle='Detail pengajuan payment (sponsorship/vendor)'
        footer={() => footer}
        width={900}
      >
        {!data ? null : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <div className='flex flex-col gap-3'>
              <div className='rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3'>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <AppTypography.Text
                      size={12}
                      tone='muted'
                      className='block text-slate-500'
                    >
                      Nomor Pengajuan
                    </AppTypography.Text>
                    <AppTypography.Text
                      weight={900}
                      className='block text-slate-900'
                    >
                      {data.number}
                    </AppTypography.Text>
                  </div>
                  <FinanceStatusTag status={data.status} />
                </div>
              </div>

              <div className='rounded-xl bg-white ring-1 ring-slate-100 p-3'>
                <AppTypography.Text
                  weight={800}
                  className='block text-slate-900 mb-2'
                >
                  Ringkasan
                </AppTypography.Text>

                <div className='flex flex-col gap-2'>
                  <InfoRow
                    label='Karyawan'
                    value={`${data.employeeName} • ${data.department}`}
                  />
                  <InfoRow
                    label='Tanggal'
                    value={data.dateLabel}
                  />
                  <InfoRow
                    label='Kategori'
                    value={data.category}
                  />
                  <InfoRow
                    label='Vendor/Instansi'
                    value={data.vendorName}
                  />
                  <InfoRow
                    label='Event'
                    value={data.eventName}
                  />
                  <InfoRow
                    label='Metode'
                    value={data.method}
                  />
                </div>

                {data.note ? (
                  <>
                    <AppDivider className='!my-3' />
                    <AppTypography.Text
                      size={12}
                      tone='muted'
                      className='block text-slate-500'
                    >
                      Catatan
                    </AppTypography.Text>
                    <AppTypography.Text className='text-slate-700'>{data.note}</AppTypography.Text>
                  </>
                ) : null}
              </div>

              <FileList
                title='Proposal (Requester)'
                files={data.proposalFiles}
              />
            </div>

            <div className='flex flex-col gap-3'>
              <div className='rounded-xl bg-white ring-1 ring-slate-100 p-3'>
                <AppTypography.Text
                  weight={800}
                  className='block text-slate-900 mb-2'
                >
                  Rincian Biaya
                </AppTypography.Text>

                <div className='flex flex-col gap-2'>
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className='flex items-center justify-between gap-3'
                    >
                      <AppTypography.Text className='text-slate-700'>{it.name}</AppTypography.Text>
                      <AppTypography.Text
                        weight={800}
                        className='text-slate-900'
                      >
                        Rp {formatIDR(it.amount)}
                      </AppTypography.Text>
                    </div>
                  ))}

                  <AppDivider className='!my-2' />

                  <div className='flex items-center justify-between gap-3'>
                    <AppTypography.Text
                      weight={900}
                      className='text-slate-900'
                    >
                      Total
                    </AppTypography.Text>
                    <AppTypography.Text
                      weight={900}
                      className='text-slate-900'
                    >
                      Rp {formatIDR(data.totalAmount)}
                    </AppTypography.Text>
                  </div>
                </div>
              </div>

              <FileList
                title='Bukti Transfer (Admin)'
                files={data.adminProof}
              />

              <FileList
                title='Kuitansi / Bukti Vendor (Requester)'
                files={data.requesterReceipt}
              />
            </div>
          </div>
        )}
      </AppModal>

      <FinanceActionModal
        open={open && action === 'approve'}
        onClose={() => setAction(null)}
        mode='approve'
        requireProof
        request={{
          number: data?.number,
          onSubmit: async ({ proofFiles }) => {
            await onApprove?.({ id: data?.id, proofFiles });
            setAction(null);
          },
        }}
      />

      <FinanceActionModal
        open={open && action === 'reject'}
        onClose={() => setAction(null)}
        mode='reject'
        request={{
          number: data?.number,
          onSubmit: async ({ reason }) => {
            await onReject?.({ id: data?.id, reason });
            setAction(null);
          },
        }}
      />
    </>
  );
}
