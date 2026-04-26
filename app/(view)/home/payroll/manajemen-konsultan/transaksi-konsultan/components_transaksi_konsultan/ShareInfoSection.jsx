import { RiseOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { StepItem } from './SectionShared';

export default function ShareInfoSection() {
  return (
    <AppCard
      rounded='xl'
      ring={false}
      shadow='none'
      className='bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200'
      bodyStyle={{ padding: 24 }}
    >
      <AppTypography.Text
        size={18}
        weight={600}
        className='flex items-center gap-2 text-blue-900 mb-4'
      >
        <RiseOutlined />
        Panduan Pembagian Hasil
      </AppTypography.Text>

      <div className='space-y-3'>
        <StepItem number='1'>
          <strong>Persentase Share Standar:</strong> Persentase bagi hasil yang biasa digunakan sesuai kontrak atau kebijakan yang berlaku
        </StepItem>

        <StepItem number='2'>
          <strong>Persentase Share Khusus:</strong> Persentase pengganti jika transaksi memerlukan penyesuaian khusus
        </StepItem>

        <StepItem number='3'>
          <strong>Bagian Konsultan:</strong> Dihitung otomatis dari total pendapatan dan persentase share yang digunakan
        </StepItem>

        <StepItem number='4'>
          <strong>Bagian OSS:</strong> Bagian office atau perusahaan dari transaksi
        </StepItem>
      </div>
    </AppCard>
  );
}
