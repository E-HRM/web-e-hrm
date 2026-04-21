import { TeamOutlined } from '@ant-design/icons';

import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { StepItem } from './SectionShared';

export default function PayoutInfoSection() {
  return (
    <AppCard
      rounded='xl'
      ring={false}
      shadow='none'
      className='bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200'
      bodyStyle={{ padding: 24 }}
    >
      <AppTypography.Text
        size={18}
        weight={600}
        className='flex items-center gap-2 text-purple-900 mb-4'
      >
        <TeamOutlined />
        Proses Payout Konsultan
      </AppTypography.Text>

      <div className='space-y-3'>
        <StepItem
          number='1'
          tone='purple'
        >
          Transaksi konsultan dicatat beserta income, share, dan bagian OSS
        </StepItem>

        <StepItem
          number='2'
          tone='purple'
        >
          Sistem mengakumulasi share konsultan pada periode yang dipilih
        </StepItem>

        <StepItem
          number='3'
          tone='purple'
        >
          Share yang sudah final dapat diproses ke payout dan diposting ke payroll
        </StepItem>

        <StepItem
          number='4'
          tone='purple'
        >
          Transaksi yang sudah diposting atau periodenya terkunci tidak dapat diubah dari UI ini
        </StepItem>
      </div>
    </AppCard>
  );
}
