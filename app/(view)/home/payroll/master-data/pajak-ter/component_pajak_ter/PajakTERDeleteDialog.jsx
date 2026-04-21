import { DeleteOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

const SECONDARY_BUTTON_CLASS_NAME = '!h-10 !rounded-lg !border-gray-300 !px-4 !text-gray-700 hover:!border-gray-300 hover:!bg-gray-50 hover:!text-gray-700';

export default function PajakTERDeleteDialog({ vm }) {
  return (
    <AppModal
      open={vm.isDeleteDialogOpen}
      onClose={vm.closeDeleteDialog}
      title='Hapus Tarif Pajak TER'
      variant='danger'
      footer={null}
      width={520}
    >
      <div className='space-y-4'>
        <AppTypography.Text
          size={14}
          className='leading-relaxed text-gray-700'
        >
          Apakah Anda yakin ingin menghapus tarif pajak TER untuk <strong>{vm.formatKodeKategoriPajak(vm.selectedTarif?.kode_kategori_pajak)}</strong>?
        </AppTypography.Text>

        {vm.selectedTarif ? (
          <div className='rounded-xl border border-gray-200 bg-gray-50 p-4'>
            <div className='space-y-2'>
              <AppTypography.Text
                size={12}
                className='block text-gray-500'
              >
                Rentang penghasilan
              </AppTypography.Text>

              <AppTypography.Text
                size={14}
                weight={600}
                className='block text-gray-900'
              >
                {vm.formatIncomeRange(vm.selectedTarif.penghasilan_dari, vm.selectedTarif.penghasilan_sampai)}
              </AppTypography.Text>

              <AppTypography.Text
                size={12}
                className='block pt-2 text-gray-500'
              >
                Periode berlaku
              </AppTypography.Text>

              <AppTypography.Text
                size={14}
                weight={600}
                className='block text-gray-900'
              >
                {vm.formatDate(vm.selectedTarif.berlaku_mulai)}
                {vm.selectedTarif.berlaku_sampai ? ` s/d ${vm.formatDate(vm.selectedTarif.berlaku_sampai)}` : ' - Tidak terbatas'}
              </AppTypography.Text>
            </div>
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
