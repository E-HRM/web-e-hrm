'use client';

import { ShoppingOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppGrid from '@/app/(view)/component_shared/AppGrid';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { DetailField, formatDateTime, formatPercent, StatusTag } from './ProdukKonsultanShared';

export default function ProdukKonsultanDetailModalSection({ vm }) {
  const selectedProduk = vm.selectedProduk;

  return (
    <AppModal
      open={vm.isDetailModalOpen}
      onClose={vm.closeDetailModal}
      title='Detail Produk Konsultan'
      footer={null}
      width={720}
    >
      {selectedProduk ? (
        <AppSpace
          direction='vertical'
          size='xl'
          block
          stretch
        >
          <div className='flex items-start gap-4 border-b border-gray-200 pb-4'>
            <div className='flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-100'>
              <ShoppingOutlined className='text-3xl text-blue-600' />
            </div>

            <div className='min-w-0 flex-1'>
              <AppTypography.Text
                size={22}
                weight={700}
                className='block text-gray-900'
              >
                {selectedProduk.nama_produk}
              </AppTypography.Text>

              <div className='mt-3'>
                <StatusTag aktif={selectedProduk.aktif} />
              </div>
            </div>
          </div>

          <AppGrid.Row gap={[16, 16]}>
            <AppGrid.Col
              xs={24}
              md={12}
            >
              <AppCard
                rounded='lg'
                ring={false}
                shadow='none'
                className='border border-purple-200 bg-purple-50'
                bodyStyle={{ padding: 20 }}
              >
                <DetailField label='Persentase Share Default'>
                  {selectedProduk.persen_share_default !== null && selectedProduk.persen_share_default !== undefined ? (
                    <>
                      <AppTypography.Text
                        size={32}
                        weight={800}
                        className='block text-purple-700'
                      >
                        {formatPercent(selectedProduk.persen_share_default)}%
                      </AppTypography.Text>

                      <AppTypography.Text
                        size={12}
                        className='mt-1 block text-purple-700'
                      >
                        Diterapkan sebagai default share konsultan pada transaksi baru.
                      </AppTypography.Text>
                    </>
                  ) : (
                    <AppTypography.Text className='text-gray-500'>Tidak diatur. Share akan ditentukan saat transaksi dibuat.</AppTypography.Text>
                  )}
                </DetailField>
              </AppCard>
            </AppGrid.Col>

            <AppGrid.Col
              xs={24}
              md={12}
            >
              <AppCard
                rounded='lg'
                ring={false}
                shadow='none'
                className='border border-blue-200 bg-blue-50'
                bodyStyle={{ padding: 20 }}
              >
                <DetailField label='Jumlah Transaksi Terkait'>
                  <AppTypography.Text
                    size={32}
                    weight={800}
                    className='block text-blue-700'
                  >
                    {selectedProduk?._count?.transaksi_konsultan ?? 0}
                  </AppTypography.Text>

                  <AppTypography.Text
                    size={12}
                    className='mt-1 block text-blue-700'
                  >
                    Digunakan sebagai referensi riwayat transaksi konsultan.
                  </AppTypography.Text>
                </DetailField>
              </AppCard>
            </AppGrid.Col>

            <AppGrid.Col xs={24}>
              <AppCard
                rounded='lg'
                ring={false}
                shadow='none'
                className='border border-gray-200'
                bodyStyle={{ padding: 20 }}
              >
                <DetailField label='Catatan'>
                  <AppTypography.Text className='block leading-7 text-gray-700'>{selectedProduk.catatan || '-'}</AppTypography.Text>
                </DetailField>
              </AppCard>
            </AppGrid.Col>

            <AppGrid.Col
              xs={24}
              md={12}
            >
              <AppCard
                rounded='lg'
                ring={false}
                shadow='none'
                className='border border-gray-200'
                bodyStyle={{ padding: 20 }}
              >
                <DetailField label='Dibuat Pada'>
                  <AppTypography.Text className='text-gray-700'>{formatDateTime(selectedProduk.created_at)}</AppTypography.Text>
                </DetailField>
              </AppCard>
            </AppGrid.Col>

            <AppGrid.Col
              xs={24}
              md={12}
            >
              <AppCard
                rounded='lg'
                ring={false}
                shadow='none'
                className='border border-gray-200'
                bodyStyle={{ padding: 20 }}
              >
                <DetailField label='Diperbarui Pada'>
                  <AppTypography.Text className='text-gray-700'>{formatDateTime(selectedProduk.updated_at)}</AppTypography.Text>
                </DetailField>
              </AppCard>
            </AppGrid.Col>
          </AppGrid.Row>

          <AppCard
            rounded='lg'
            ring={false}
            shadow='none'
            className='border border-amber-200 bg-amber-50'
            bodyStyle={{ padding: 20 }}
          >
            <DetailField label='Informasi Penggunaan'>
              <ul className='list-disc space-y-1 pl-5 text-sm text-amber-900'>
                <li>Produk aktif dapat dipilih saat membuat transaksi konsultan.</li>
                <li>Share default masih bisa diubah manual per transaksi.</li>
                <li>Perubahan master tidak mengubah data historis transaksi yang sudah tersimpan.</li>
              </ul>
            </DetailField>
          </AppCard>

          <div className='flex justify-end pt-2'>
            <AppButton
              variant='outline'
              onClick={vm.closeDetailModal}
              className='!h-10 !rounded-lg !px-4 whitespace-nowrap'
            >
              Tutup
            </AppButton>
          </div>
        </AppSpace>
      ) : (
        <div className='rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center'>
          <AppTypography.Text
            size={14}
            className='text-gray-600'
          >
            Detail produk konsultan tidak tersedia.
          </AppTypography.Text>
        </div>
      )}
    </AppModal>
  );
}
