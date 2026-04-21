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
        Sistem Pembagian Hasil (Share)
      </AppTypography.Text>

      <div className='space-y-3'>
        <StepItem number='1'>
          <strong>Persen Share Default:</strong> Persentase bagi hasil standar sesuai kontrak atau kebijakan yang berlaku
        </StepItem>

        <StepItem number='2'>
          <strong>Persen Share Override:</strong> Persentase alternatif bila transaksi memerlukan penyesuaian khusus
        </StepItem>

        <StepItem number='3'>
          <strong>Nominal Share:</strong> Bagian konsultan dihitung ulang oleh server dari total income dan persentase share
        </StepItem>

        <StepItem number='4'>
          <strong>Nominal OSS:</strong> Bagian office/perusahaan dari transaksi
        </StepItem>
      </div>
    </AppCard>
  );
}
