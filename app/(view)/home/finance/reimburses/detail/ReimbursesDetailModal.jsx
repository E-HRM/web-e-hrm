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

function FileList({ files }) {
  const list = Array.isArray(files) ? files : [];
  if (!list.length) {
    return (
      <AppTypography.Text
        size={12}
        tone='muted'
        className='text-slate-500'
      >
        Tidak ada dokumen
      </AppTypography.Text>
    );
  }

  return (
    <ul className='list-disc pl-5'>
      {list.map((f, idx) => (
        <li key={`${f?.name || 'file'}-${idx}`}>
          <AppTypography.Text className='text-slate-700'>{f?.name || 'Dokumen'}</AppTypography.Text>
        </li>
      ))}
    </ul>
  );
}

export default function ReimbursesDetailModal({ open, onClose, data, onApprove, onReject }) {
  const [action, setAction] = useState(null);

  const title = useMemo(() => {
    if (!data) return 'Detail Reimburse';
    return `Reimburse • ${data.number}`;
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
                variant='danger'
                onClick={() => setAction('reject')}
              >
                Tolak
              </AppButton>
              <AppButton
                variant='primary'
                onClick={() => setAction('approve')}
              >
                Bayar
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
        width={860}
        footer={footer}
      >
        {!data ? null : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <div className='flex flex-col gap-3'>
              <AppTypography.Text
                weight={900}
                className='text-slate-900'
              >
                Informasi Pengajuan
              </AppTypography.Text>

              <div className='rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3 flex flex-col gap-2'>
                <InfoRow label='Nomor' value={data.number} />
                <InfoRow label='Karyawan' value={`${data.employeeName} • ${data.department}`} />
                <InfoRow label='Kategori' value={data.category} />
                <InfoRow label='Tanggal' value={data.dateLabel} />
                <InfoRow label='Metode' value={data.method === 'TRANSFER' ? 'Transfer' : 'Cash'} />

                {data.method === 'TRANSFER' ? (
                  <>
                    <InfoRow label='Bank' value={data.bankName} />
                    <InfoRow label='Nama Rekening' value={data.accountName} />
                    <InfoRow label='No Rekening' value={data.accountNumber} />
                  </>
                ) : null}
              </div>

              <div className='rounded-xl ring-1 ring-slate-100 p-3'>
                <AppTypography.Text
                  weight={800}
                  className='text-slate-900 block'
                >
                  Catatan
                </AppTypography.Text>
                <AppTypography.Text className='text-slate-700'>{data.note || '—'}</AppTypography.Text>
              </div>

              <div className='rounded-xl ring-1 ring-slate-100 p-3'>
                <AppTypography.Text
                  weight={800}
                  className='text-slate-900 block'
                >
                  Nota / Dokumen
                </AppTypography.Text>
                <FileList files={data.receipts} />
              </div>
            </div>

            <div className='flex flex-col gap-3'>
              <AppTypography.Text
                weight={900}
                className='text-slate-900'
              >
                Detail Pengeluaran
              </AppTypography.Text>

              <div className='rounded-xl ring-1 ring-slate-100 p-3'>
                <div className='flex flex-col gap-2'>
                  {(items || []).map((it, idx) => (
                    <div
                      key={`${it?.name || 'item'}-${idx}`}
                      className='flex items-center justify-between gap-4'
                    >
                      <AppTypography.Text className='text-slate-700'>{it?.name || '—'}</AppTypography.Text>
                      <AppTypography.Text
                        weight={800}
                        className='text-slate-900'
                      >
                        Rp {formatIDR(it?.amount)}
                      </AppTypography.Text>
                    </div>
                  ))}

                  <AppDivider className='!my-2' />

                  <div className='flex items-center justify-between gap-4'>
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

              <div className='rounded-xl ring-1 ring-slate-100 p-3'>
                <AppTypography.Text
                  weight={800}
                  className='text-slate-900 block'
                >
                  Bukti Pembayaran (Admin)
                </AppTypography.Text>
                {data.adminProof?.name ? (
                  <AppTypography.Text className='text-slate-700'>{data.adminProof.name}</AppTypography.Text>
                ) : (
                  <AppTypography.Text
                    size={12}
                    tone='muted'
                    className='text-slate-500'
                  >
                    Belum ada
                  </AppTypography.Text>
                )}
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
