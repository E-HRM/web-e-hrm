// app/(view)/home/payroll/payroll-karyawan/item-komponen/component_ItemKomponenPayroll/ItemKomponenPayrollDeleteDialog.jsx
'use client';

import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function ItemKomponenPayrollDeleteDialog({ vm }) {
  return (
    <AppModal
      open={vm.isDeleteDialogOpen}
      onClose={vm.closeDeleteDialog}
      title='Hapus Item Komponen Payroll'
      subtitle='Data yang dihapus akan memengaruhi total payroll karyawan.'
      variant='danger'
      okText='Hapus'
      onOk={vm.handleDelete}
      closeOnOk={false}
      okLoading={vm.isSubmitting}
    >
      <AppTypography.Text
        size={14}
        className='block text-gray-700'
      >
        Anda akan menghapus item komponen <span className='font-semibold text-gray-900'>{vm.selectedItem?.nama_komponen || '-'}</span>. Lanjutkan?
      </AppTypography.Text>
    </AppModal>
  );
}
