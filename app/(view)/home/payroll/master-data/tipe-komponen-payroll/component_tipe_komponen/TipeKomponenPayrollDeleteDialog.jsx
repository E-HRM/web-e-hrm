import { DeleteOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

const SECONDARY_BUTTON_CLASS_NAME = '!h-10 !rounded-lg !border-gray-300 !px-4 !text-gray-700 hover:!border-gray-300 hover:!bg-gray-50 hover:!text-gray-700';

export default function TipeKomponenPayrollDeleteDialog({ vm }) {
  return (
    <AppModal
      open={vm.isDeleteDialogOpen}
      onClose={vm.closeDeleteDialog}
      title='Hapus Tipe Komponen Payroll'
      variant='danger'
      footer={null}
      width={520}
    >
      <div className='space-y-4'>
        <AppTypography.Text
          size={14}
          className='leading-relaxed text-gray-700'
        >
          Apakah Anda yakin ingin menghapus tipe komponen <strong>"{vm.selectedTipeKomponen?.nama_tipe_komponen || '-'}"</strong>?
        </AppTypography.Text>

        <AppTypography.Text
          size={13}
          className='block leading-relaxed text-gray-600'
        >
          Tipe komponen yang dihapus tidak akan tampil dalam daftar aktif dan tidak dapat digunakan kembali, namun data histori dan relasi ke definisi komponen tetap tersimpan untuk keperluan audit.
        </AppTypography.Text>

        {vm.selectedTipeKomponen ? (
          <div className='rounded-xl border border-amber-200 bg-amber-50 p-4'>
            <AppTypography.Text
              size={12}
              className='block text-amber-700'
            >
              Jumlah referensi definisi komponen: {vm.selectedTipeKomponen.definisi_komponen_count}
            </AppTypography.Text>
          </div>
        ) : null}
      </div>

      <div className='flex justify-end gap-3 pt-6'>
        <AppButton
          variant='outline'
          onClick={vm.closeDeleteDialog}
          className={SECONDARY_BUTTON_CLASS_NAME}
          disabled={vm.isSubmitting}
        >
          Batal
        </AppButton>

        <AppButton
          variant='danger'
          icon={<DeleteOutlined />}
          onClick={vm.handleDelete}
          loading={vm.isSubmitting}
          className='!h-10 !rounded-lg !px-4'
        >
          Hapus
        </AppButton>
      </div>
    </AppModal>
  );
}
