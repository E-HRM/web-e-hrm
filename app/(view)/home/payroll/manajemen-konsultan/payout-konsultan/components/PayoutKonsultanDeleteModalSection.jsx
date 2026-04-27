import { DeleteOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function PayoutKonsultanDeleteModalSection({ open, onClose, selectedPayout, isSubmitting = false, onSubmit }) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title='Hapus Payout'
      variant='danger'
      footer={null}
      width={520}
    >
      <AppTypography.Text
        size={14}
        className='text-gray-700 leading-relaxed'
      >
        Apakah Anda yakin ingin menghapus payout untuk <strong>{selectedPayout?.user_display_name || selectedPayout?.id_user || '-'}</strong> pada periode{' '}
        <strong>{selectedPayout?.periode_label || selectedPayout?.id_periode_konsultan || '-'}</strong>? Tindakan ini tidak dapat dibatalkan.
      </AppTypography.Text>

      <div className='flex items-center justify-end gap-3 pt-6'>
        <AppButton
          variant='outline'
          onClick={onClose}
          disabled={isSubmitting}
          className='!rounded-lg !px-4 !h-10 !border-gray-300 !text-gray-700 hover:!bg-gray-50 hover:!border-gray-300 hover:!text-gray-700'
        >
          Batal
        </AppButton>

        <AppButton
          variant='danger'
          icon={<DeleteOutlined />}
          onClick={onSubmit}
          loading={isSubmitting}
          className='!rounded-lg !px-4 !h-10'
        >
          Hapus
        </AppButton>
      </div>
    </AppModal>
  );
}
