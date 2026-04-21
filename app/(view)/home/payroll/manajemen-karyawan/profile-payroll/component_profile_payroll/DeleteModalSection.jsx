import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import UserMeta from './UserMeta';

export default function DeleteModalSection({ vm }) {
  return (
    <AppModal
      open={vm.isDeleteDialogOpen}
      onClose={vm.closeDeleteDialog}
      title='Hapus Profil Payroll'
      variant='danger'
      footer={null}
      width={480}
    >
      <div className='space-y-4'>
        {vm.selectedProfil?.user ? (
          <UserMeta
            user={vm.selectedProfil.user}
            vm={vm}
            compact
          />
        ) : null}

        <AppTypography.Text
          size={14}
          className='text-gray-700 leading-relaxed'
        >
          Apakah Anda yakin ingin menghapus profil payroll untuk <strong>{vm.selectedProfil?.user_display_name || 'karyawan ini'}</strong>?
        </AppTypography.Text>
      </div>

      <div className='flex gap-3 pt-6'>
        <AppButton
          onClick={vm.handleDelete}
          variant='danger'
          loading={vm.isSubmitting}
          className='!flex-1 !rounded-lg !h-10'
        >
          Hapus
        </AppButton>

        <AppButton
          onClick={vm.closeDeleteDialog}
          variant='secondary'
          disabled={vm.isSubmitting}
          className='!flex-1 !rounded-lg !h-10 !bg-gray-100 hover:!bg-gray-200 !border-gray-100 hover:!border-gray-200 !text-gray-700'
        >
          Batal
        </AppButton>
      </div>
    </AppModal>
  );
}
