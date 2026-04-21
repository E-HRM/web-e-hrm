// app/(view)/home/payroll/payroll-karyawan/component_PayrollKaryawan/DeletePayrollKaryawanDialog.jsx
'use client';

import { DeleteOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function DeletePayrollKaryawanDialog({ vm }) {
  return (
    <AppModal
      open={vm.isDeleteDialogOpen}
      onClose={vm.closeDeleteDialog}
      title='Hapus Payroll Karyawan'
      variant='danger'
      footer={null}
      width={520}
    >
      <AppTypography.Text
        size={14}
        className='text-gray-700 leading-relaxed'
      >
        Apakah Anda yakin ingin menghapus payroll untuk <strong>{vm.selectedPayroll?.nama_karyawan_snapshot || '-'}</strong>? Item komponen dan approval payroll yang terkait akan ikut terdampak.
      </AppTypography.Text>

      <div className='flex justify-end gap-3 pt-6'>
        <AppButton
          variant='outline'
          onClick={vm.closeDeleteDialog}
          className='!rounded-lg !px-4 !h-10 !border-gray-300 !text-gray-700 hover:!bg-gray-50 hover:!border-gray-300 hover:!text-gray-700'
        >
          Batal
        </AppButton>

        <AppButton
          variant='danger'
          icon={<DeleteOutlined />}
          onClick={vm.handleDelete}
          className='!rounded-lg !px-4 !h-10'
        >
          Hapus
        </AppButton>
      </div>
    </AppModal>
  );
}
