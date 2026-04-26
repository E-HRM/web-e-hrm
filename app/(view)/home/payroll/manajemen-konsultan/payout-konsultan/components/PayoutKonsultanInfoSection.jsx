import { ExclamationCircleOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function PayoutKonsultanInfoSection() {
  return (
    <AppCard
      rounded='xl'
      ring={false}
      shadow='none'
      className='mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
      bodyStyle={{ padding: 24 }}
    >
      <div className='flex items-center gap-2 mb-4'>
        <ExclamationCircleOutlined className='text-blue-700 text-lg' />
        <AppTypography.Text
          size={18}
          weight={700}
          className='text-blue-900'
        >
          Status Pembayaran Konsultan
        </AppTypography.Text>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6 text-sm text-blue-800'>
        <div>
          <AppTypography.Text
            size={15}
            weight={700}
            className='block text-blue-900 mb-3'
          >
            Arti Status:
          </AppTypography.Text>

          <ol className='space-y-2 ml-4 list-decimal'>
            <li>
              <strong>Belum Disetujui:</strong> Data pembayaran masih disiapkan dan belum disetujui.
            </li>
            <li>
              <strong>Disetujui:</strong> Pembayaran sudah diperiksa dan disetujui oleh manajemen.
            </li>
            <li>
              <strong>Sudah Masuk Penggajian:</strong> Pembayaran sudah dimasukkan ke proses penggajian.
            </li>
            <li>
              <strong>Ditahan:</strong> Pembayaran belum dilanjutkan karena masih perlu ditahan sementara.
            </li>
          </ol>
        </div>

        <div>
          <AppTypography.Text
            size={15}
            weight={700}
            className='block text-blue-900 mb-3'
          >
            Rincian Pembayaran:
          </AppTypography.Text>

          <ul className='space-y-2 ml-4 list-disc'>
            <li>
              <strong>Hak Konsultan:</strong> Dihitung otomatis dari transaksi yang siap dibayarkan.
            </li>
            <li>
              <strong>Nominal yang Ditahan:</strong> Jumlah pembayaran yang belum akan dibayarkan.
            </li>
            <li>
              <strong>Nominal yang Akan Dibayarkan:</strong> Nominal akhir yang akan dibayarkan kepada konsultan.
            </li>
            <li>
              <strong>Nominal Dibayarkan:</strong> Mengikuti nominal akhir yang sudah disimpan.
            </li>
          </ul>
        </div>
      </div>
    </AppCard>
  );
}
