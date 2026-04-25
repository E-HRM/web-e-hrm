'use client';

import { PlusOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function HeaderSection({ vm }) {
  return (
    <div className='flex items-center justify-between mb-8 gap-4 flex-wrap'>
      <div>
        <AppTypography.Title
          level={3}
          className='!mb-1 !text-gray-900'
        >
          Daftar Pinjaman Karyawan
        </AppTypography.Title>

        <AppTypography.Text className='text-gray-600'>Kelola pengajuan pinjaman, nominal cicilan, dan sisa saldo karyawan.</AppTypography.Text>
      </div>

      <AppButton
        onClick={vm.openCreateModal}
        icon={<PlusOutlined />}
        className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
      >
        Tambah Pinjaman
      </AppButton>
    </div>
  );
}
