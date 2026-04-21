'use client';

import { DeleteOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function DeletePinjamanModalSection({ vm }) {
  return (
    <AppModal
      open={vm.isDeleteDialogOpen}
      onClose={vm.closeDeleteDialog}
      title='Hapus Pinjaman'
      variant='danger'
      footer={null}
      width={520}
    >
      <div className='space-y-3'>
        <AppTypography.Text
          size={14}
          className='text-gray-700 leading-relaxed'
        >
          Apakah Anda yakin ingin menghapus pinjaman <strong>"{vm.selectedPinjaman?.nama_pinjaman || '-'}"</strong>?
        </AppTypography.Text>

        <AppTypography.Text
          size={13}
          className='block text-gray-500 leading-relaxed'
        >
          Penghapusan hanya diizinkan untuk pinjaman berstatus <strong>DRAFT</strong> atau <strong>DIBATALKAN</strong>. Jika masih ada cicilan terkait, data cicilan akan ikut ditandai terhapus.
        </AppTypography.Text>
      </div>

      <div className='flex items-center justify-end gap-3 pt-6'>
        <AppButton
          variant='outline'
          onClick={vm.closeDeleteDialog}
          disabled={vm.isSubmitting}
          className='!rounded-lg !px-4 !h-10 !border-gray-300 !text-gray-700 hover:!bg-gray-50 hover:!border-gray-300 hover:!text-gray-700'
        >
          Batal
        </AppButton>

        <AppButton
          variant='danger'
          onClick={vm.handleDelete}
          loading={vm.isSubmitting}
          icon={<DeleteOutlined />}
          className='!rounded-lg !px-4 !h-10'
        >
          Hapus
        </AppButton>
      </div>
    </AppModal>
  );
}
