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
          Status Payout Konsultan
        </AppTypography.Text>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6 text-sm text-blue-800'>
        <div>
          <AppTypography.Text
            size={15}
            weight={700}
            className='block text-blue-900 mb-3'
          >
            Alur Status:
          </AppTypography.Text>

          <ol className='space-y-2 ml-4 list-decimal'>
            <li>
              <strong>DRAFT:</strong> Payout dibuat dari akumulasi transaksi konsultan aktif yang belum terhubung ke payout lain
            </li>
            <li>
              <strong>DISETUJUI:</strong> Payout telah direview dan disetujui oleh manajemen
            </li>
            <li>
              <strong>DIPOSTING_KE_PAYROLL:</strong> Payout telah diposting sebagai komponen insentif konsultan di payroll
            </li>
            <li>
              <strong>DITAHAN:</strong> Pembayaran ditahan sementara dengan alasan tertentu
            </li>
          </ol>
        </div>

        <div>
          <AppTypography.Text
            size={15}
            weight={700}
            className='block text-blue-900 mb-3'
          >
            Komponen Payout:
          </AppTypography.Text>

          <ul className='space-y-2 ml-4 list-disc'>
            <li>
              <strong>Total Share:</strong> Dihitung otomatis dari nominal share transaksi eligible, bukan diinput manual
            </li>
            <li>
              <strong>Nominal Ditahan:</strong> Jumlah yang ditahan dari pembayaran
            </li>
            <li>
              <strong>Nominal Penyesuaian:</strong> Nominal akhir payout yang diinput manual pada modal buat atau edit payout
            </li>
            <li>
              <strong>Nominal Dibayarkan:</strong> Mengikuti nilai nominal penyesuaian yang disimpan
            </li>
          </ul>
        </div>
      </div>
    </AppCard>
  );
}
