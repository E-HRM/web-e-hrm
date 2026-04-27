'use client';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function ProdukKonsultanDeleteModalSection({ vm }) {
  return (
    <AppModal
      open={vm.isDeleteDialogOpen}
      onClose={vm.closeDeleteDialog}
      title='Hapus Produk Konsultan'
      footer={null}
      width={560}
    >
      <AppSpace
        direction='vertical'
        size='lg'
        block
        stretch
      >
        <AppTypography.Text className='block leading-6 text-gray-700'>
          Apakah Anda yakin ingin menghapus produk <span className='font-semibold text-gray-900'>{vm.selectedProduk?.nama_produk || '-'}</span>?
        </AppTypography.Text>

        <AppCard
          rounded='lg'
          ring={false}
          shadow='none'
          className='border border-yellow-200 bg-yellow-50'
          bodyStyle={{ padding: 16 }}
        >
          <AppTypography.Text
            size={13}
            className='block leading-6 text-yellow-800'
          >
            Produk yang dihapus tidak akan tampil dalam daftar aktif dan tidak dapat digunakan kembali, namun histori transaksi yang sudah terkait tetap tersimpan.
          </AppTypography.Text>
        </AppCard>

        <div className='flex justify-end gap-3 pt-2'>
          <AppButton
            variant='text'
            onClick={vm.closeDeleteDialog}
            className='!text-gray-700 hover:!text-gray-900'
            disabled={vm.isSubmitting}
          >
            Batal
          </AppButton>

          <AppButton
            onClick={vm.handleDelete}
            loading={vm.isSubmitting}
            className='!h-10 !rounded-lg !border-red-600 !bg-red-600 !px-4 !text-white hover:!border-red-700 hover:!bg-red-700'
          >
            Hapus Produk
          </AppButton>
        </div>
      </AppSpace>
    </AppModal>
  );
}
