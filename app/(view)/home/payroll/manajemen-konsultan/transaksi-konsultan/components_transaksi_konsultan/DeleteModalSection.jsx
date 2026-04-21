import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function DeleteModalSection({ vm }) {
  return (
    <AppModal
      open={vm.isDeleteDialogOpen}
      onClose={vm.closeDeleteDialog}
      title='Hapus Transaksi Konsultan'
      variant='danger'
      footer={null}
      width={480}
    >
      <AppTypography.Text
        size={14}
        className='text-gray-700 leading-relaxed'
      >
        Apakah Anda yakin ingin menghapus transaksi "<strong>{vm.selectedTransaksi?.deskripsi || '-'}</strong>"? Penghapusan dari UI ini menggunakan soft delete sehingga data masih dapat dipulihkan melalui proses backend.
      </AppTypography.Text>

      <div className='flex items-center justify-end gap-3 pt-6'>
        <AppButton
          onClick={vm.closeDeleteDialog}
          variant='secondary'
          className='!rounded-lg !px-4 !h-10 !border-gray-300 !text-gray-700 hover:!bg-gray-50'
          disabled={vm.isSubmitting}
        >
          Batal
        </AppButton>

        <AppButton
          onClick={vm.handleDelete}
          variant='danger'
          loading={vm.isSubmitting}
          className='!rounded-lg !px-4 !h-10'
        >
          Hapus
        </AppButton>
      </div>
    </AppModal>
  );
}
