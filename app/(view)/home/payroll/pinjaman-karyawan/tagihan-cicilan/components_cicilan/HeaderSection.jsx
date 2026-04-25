'use client';

import { ReloadOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function HeaderSection({ vm }) {
  return (
    <div className='flex items-start justify-between mb-8 gap-4 flex-wrap'>
      <div>
        <AppTypography.Title
          level={3}
          className='!mb-1 !text-gray-900'
        >
          Tagihan & Cicilan Pinjaman
        </AppTypography.Title>

        <AppTypography.Text className='block max-w-3xl text-gray-600 leading-6'>Pantau cicilan pinjaman karyawan berdasarkan jatuh tempo, status pembayaran, dan hubungan dengan payroll.</AppTypography.Text>
      </div>

      <div className='flex items-center gap-3 flex-wrap'>
        <AppButton
          href='/home/payroll/pinjaman-karyawan/manajemen-pinjaman'
          variant='outline'
          className='!rounded-lg !px-4 !h-10'
        >
          Lihat Daftar Pinjaman
        </AppButton>

        <AppButton
          onClick={vm.reloadData}
          loading={vm.validating}
          icon={<ReloadOutlined />}
          className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
        >
          Muat Ulang
        </AppButton>
      </div>
    </div>
  );
}
