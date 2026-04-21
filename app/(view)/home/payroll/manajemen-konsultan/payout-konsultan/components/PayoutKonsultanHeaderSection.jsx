import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function PayoutKonsultanHeaderSection({ onCreate, onReload, loading = false }) {
  return (
    <div className='flex items-center justify-between mb-8 gap-4 flex-wrap'>
      <div>
        <AppTypography.Title
          level={3}
          className='!mb-1 !text-gray-900'
        >
          Payout Konsultan
        </AppTypography.Title>

        <AppTypography.Text className='text-gray-600'>Kelola pembayaran share konsultan ke payroll</AppTypography.Text>
      </div>

      <div className='flex items-center gap-3 flex-wrap'>
        <AppButton
          variant='outline'
          icon={<ReloadOutlined />}
          onClick={onReload}
          loading={loading}
          className='!rounded-lg !px-4 !h-10'
        >
          Muat Ulang
        </AppButton>

        <AppButton
          onClick={onCreate}
          icon={<PlusOutlined />}
          className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
        >
          Buat Payout Baru
        </AppButton>
      </div>
    </div>
  );
}
