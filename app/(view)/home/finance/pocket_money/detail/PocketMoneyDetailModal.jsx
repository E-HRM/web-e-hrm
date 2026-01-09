'use client';

import React, { useMemo, useState } from 'react';

import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppDivider from '@/app/(view)/component_shared/AppDivider';
import AppButton from '@/app/(view)/component_shared/AppButton';
import AppSpace from '@/app/(view)/component_shared/AppSpace';

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

export default function PocketMoneyDetailModal({ open, onClose, data, onApprove, onReject }) {
  const [action, setAction] = useState(null); // 'approve' | 'reject' | null

  const title = useMemo(() => {
    if (!data) return 'Detail Pocket Money';
    return `Pocket Money • ${data.number}`;
  }, [data]);

  const items = useMemo(() => data?.items || [], [data]);

  const footer = useMemo(() => {
    if (!data) return null;

    const isFinal = data.status === 'APPROVED' || data.status === 'REJECTED';

    return (
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
          {!isFinal ? (
            <>
            <AppButton
              variant='outline'
              className='!border-red-500 !text-red-600 hover:!border-red-600 hover:!text-red-700 hover:!bg-red-50 active:!bg-red-100'
              onClick={() => setAction('reject')}
            >
              Tolak
            </AppButton>

              <AppButton
                variant='primary'
                onClick={() => setAction('approve')}
              >
                Bayar & Upload Bukti
              </AppButton>
            </>
          ) : null}
        </AppSpace>
      </div>
    );
  }, [data, onClose]);

  return (
    <>
      <AppModal
        open={open}
        onClose={onClose}
        onCancel={onClose}
        title={title}
        subtitle={data ? `${data.employeeName} • ${data.department}` : undefined}
        footer={footer}
        width={860}
      >
        {!data ? null : (
          <div className='flex flex-col gap-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <div className='rounded-2xl ring-1 ring-slate-100 bg-white p-4'>
                <AppTypography.Text
                  weight={800}
                  className='block text-slate-900'
                >
                  Ringkasan
                </AppTypography.Text>
                <AppDivider className='my-3' />

                <div className='flex flex-col gap-2'>
                  <InfoRow
                    label='Metode'
                    value={data.method === 'TRANSFER' ? 'Transfer' : 'Cash'}
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
                    label='Total Estimasi'
                    value={`Rp ${formatIDR(data.totalAmount)}`}
                  />
                </div>
              </div>

              <div className='rounded-2xl ring-1 ring-slate-100 bg-white p-4'>
                <AppTypography.Text
                  weight={800}
                  className='block text-slate-900'
                >
                  Rekening
                </AppTypography.Text>
                <AppDivider className='my-3' />

                <div className='flex flex-col gap-2'>
                  <InfoRow
                    label='Bank'
                    value={data.bankName}
                  />
                  <InfoRow
                    label='Nama'
                    value={data.accountName}
                  />
                  <InfoRow
                    label='No. Rekening'
                    value={data.accountNumber}
                  />
                </div>
              </div>
            </div>

            <div className='rounded-2xl ring-1 ring-slate-100 bg-white p-4'>
              <AppTypography.Text
                weight={800}
                className='block text-slate-900'
              >
                Detail Estimasi
              </AppTypography.Text>
              <AppDivider className='my-3' />

              <div className='flex flex-col gap-2'>
                {items.length ? (
                  items.map((it, idx) => (
                    <div
                      key={`${it.name}-${idx}`}
                      className='flex items-center justify-between gap-3'
                    >
                      <AppTypography.Text className='text-slate-700'>{it.name}</AppTypography.Text>
                      <AppTypography.Text className='text-slate-900'>Rp {formatIDR(it.amount)}</AppTypography.Text>
                    </div>
                  ))
                ) : (
                  <AppTypography.Text tone='muted'>Tidak ada item.</AppTypography.Text>
                )}

                <AppDivider className='my-2' />

                <div className='flex items-center justify-between gap-3'>
                  <AppTypography.Text
                    weight={800}
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

                {data.note ? (
                  <>
                    <AppDivider className='my-2' />
                    <AppTypography.Text
                      size={12}
                      tone='muted'
                      className='text-slate-500'
                    >
                      Catatan
                    </AppTypography.Text>
                    <AppTypography.Text className='text-slate-700'>{data.note}</AppTypography.Text>
                  </>
                ) : null}

                {data.adminProof?.name ? (
                  <>
                    <AppDivider className='my-2' />
                    <AppTypography.Text
                      size={12}
                      tone='muted'
                      className='text-slate-500'
                    >
                      Bukti Pembayaran (Admin)
                    </AppTypography.Text>
                    <AppTypography.Text className='text-slate-700'>{data.adminProof.name}</AppTypography.Text>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </AppModal>

      <FinanceActionModal
        open={open && action === 'approve'}
        onClose={() => setAction(null)}
        mode='approve'
        requireProof={false}
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
