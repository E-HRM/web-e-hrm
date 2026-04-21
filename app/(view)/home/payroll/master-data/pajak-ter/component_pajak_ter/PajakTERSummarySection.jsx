import { CalendarOutlined, CalculatorOutlined, CheckCircleOutlined, TagsOutlined } from '@ant-design/icons';

import PajakTERSummaryCard from './PajakTERSummaryCard';

export default function PajakTERSummarySection({ statistics }) {
  return (
    <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
      <PajakTERSummaryCard
        title='Total Tarif'
        subtitle='Semua bracket tarif'
        value={statistics.totalTarif}
        icon={<CalculatorOutlined />}
        iconClassName='text-xl text-blue-500'
      />

      <PajakTERSummaryCard
        title='Kode Kategori'
        subtitle='Kode pajak unik terdaftar'
        value={statistics.totalKategoriPajak}
        icon={<TagsOutlined />}
        iconClassName='text-xl text-green-500'
      />

      <PajakTERSummaryCard
        title='Aktif Hari Ini'
        subtitle='Berlaku pada tanggal sekarang'
        value={statistics.tarifAktifHariIni}
        icon={<CheckCircleOutlined />}
        iconClassName='text-xl text-yellow-500'
      />

      <PajakTERSummaryCard
        title='Tanpa Batas Akhir'
        subtitle='Belum punya tanggal selesai'
        value={statistics.tarifTanpaBatasAkhir}
        icon={<CalendarOutlined />}
        iconClassName='text-xl text-purple-500'
      />
    </div>
  );
}
