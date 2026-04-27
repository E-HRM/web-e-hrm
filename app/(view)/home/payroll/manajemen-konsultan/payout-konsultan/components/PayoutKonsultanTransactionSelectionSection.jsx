'use client';

import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function TransactionMeta({ label, value, accentClassName = 'text-gray-900' }) {
  return (
    <div>
      <AppTypography.Text
        size={11}
        className='block text-gray-500 mb-1'
      >
        {label}
      </AppTypography.Text>

      <AppTypography.Text
        size={13}
        weight={700}
        className={`block ${accentClassName}`}
      >
        {value}
      </AppTypography.Text>
    </div>
  );
}

export default function PayoutKonsultanTransactionSelectionSection({ transactions = [], heldTransactionIds = [], onToggleHeldTransaction, formatCurrency, formatDate, formatPeriodeKonsultanLabel, isLoading = false }) {
  const heldIdSet = new Set(heldTransactionIds);

  return (
    <div className='rounded-xl border border-gray-200 bg-white'>
      <div className='border-b border-gray-200 px-4 py-3'>
        <AppTypography.Text
          size={14}
          weight={700}
          className='block text-gray-900'
        >
          Daftar Transaksi Konsultan
        </AppTypography.Text>

        <AppTypography.Text
          size={12}
          className='block text-gray-500 mt-1'
        >
          Centang transaksi yang pembayarannya ingin ditahan. Transaksi yang ditahan dari periode sebelumnya juga muncul di daftar ini.
        </AppTypography.Text>
      </div>

      {isLoading ? (
        <div className='px-4 py-6'>
          <AppEmpty
            image={AppEmpty.Simple}
            title='Memuat transaksi yang siap dibayar'
            description='Sistem sedang menyiapkan daftar transaksi konsultan.'
            centered
          />
        </div>
      ) : transactions.length === 0 ? (
        <div className='px-4 py-6'>
          <AppEmpty
            image={AppEmpty.Simple}
            title='Belum ada transaksi yang siap dibayar'
            description='Pilih konsultan dan periode yang memiliki transaksi aktif.'
            centered
          />
        </div>
      ) : (
        <div className='max-h-[320px] overflow-y-auto divide-y divide-gray-200'>
          {transactions.map((item) => {
            const transaksiId = item.id_transaksi_konsultan;
            const isHeld = heldIdSet.has(transaksiId);
            const productName = item?.jenis_produk?.nama_produk || '-';
            const clientName = item?.nama_klien || 'Klien tanpa nama';
            const description = item?.deskripsi || 'Tidak ada deskripsi transaksi.';
            const periodeLabel = formatPeriodeKonsultanLabel?.(item?.periode_konsultan || item?.id_periode_konsultan) || '-';
            const isCarryForward = Boolean(item?.is_carry_forward);

            return (
              <label
                key={transaksiId}
                className={`flex items-start gap-3 px-4 py-4 cursor-pointer transition-colors ${isHeld ? 'bg-rose-50/70' : 'hover:bg-gray-50'}`}
              >
                <input
                  type='checkbox'
                  checked={isHeld}
                  onChange={(event) => onToggleHeldTransaction?.(transaksiId, event.target.checked)}
                  className='mt-1 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500'
                />

                <div className='min-w-0 flex-1'>
                  <div className='flex items-start justify-between gap-3 flex-wrap'>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <AppTypography.Text
                          size={14}
                          weight={700}
                          className='text-gray-900'
                        >
                          {clientName}
                        </AppTypography.Text>

                        <AppTag
                          tone={isHeld ? 'danger' : 'success'}
                          variant='soft'
                          size='sm'
                        >
                          {isHeld ? 'Ditahan' : 'Dibayarkan'}
                        </AppTag>

                        {isCarryForward ? (
                          <AppTag
                            tone='warning'
                            variant='soft'
                            size='sm'
                          >
                            Dibawa dari Periode Sebelumnya
                          </AppTag>
                        ) : null}
                      </div>

                      <AppTypography.Text
                        size={12}
                        className='block text-gray-500 mt-1'
                      >
                        {periodeLabel} - {productName} - {formatDate(item.tanggal_transaksi)}
                      </AppTypography.Text>

                      <AppTypography.Text
                        size={12}
                        className='block text-gray-600 mt-2'
                      >
                        {description}
                      </AppTypography.Text>
                    </div>

                    <div className='grid grid-cols-2 gap-3 sm:min-w-[260px]'>
                      <TransactionMeta
                        label='Total Pendapatan'
                        value={formatCurrency(item.total_income)}
                        accentClassName='text-slate-700'
                      />

                      <TransactionMeta
                        label='Hak Konsultan'
                        value={formatCurrency(item.nominal_share)}
                        accentClassName={isHeld ? 'text-rose-700' : 'text-blue-700'}
                      />
                    </div>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
