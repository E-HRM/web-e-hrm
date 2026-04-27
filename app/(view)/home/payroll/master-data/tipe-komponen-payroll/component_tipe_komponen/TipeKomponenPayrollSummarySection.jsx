import { CheckCircleOutlined, DeleteOutlined, TagsOutlined, UnorderedListOutlined } from '@ant-design/icons';

import TipeKomponenPayrollSummaryCard from './TipeKomponenPayrollSummaryCard';

export default function TipeKomponenPayrollSummarySection({ statistics }) {
  return (
    <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
      <TipeKomponenPayrollSummaryCard
        title='Total Tipe'
        subtitle='Semua data master'
        value={statistics.total}
        icon={<TagsOutlined />}
        iconClassName='text-xl text-sky-500'
      />

      <TipeKomponenPayrollSummaryCard
        title='Tipe Aktif'
        subtitle='Siap dipakai di definisi komponen'
        value={statistics.aktif}
        icon={<CheckCircleOutlined />}
        iconClassName='text-xl text-emerald-500'
      />

      <TipeKomponenPayrollSummaryCard
        title='Soft Delete'
        subtitle='Masih tersimpan untuk audit'
        value={statistics.terhapus}
        icon={<DeleteOutlined />}
        iconClassName='text-xl text-rose-500'
      />

      <TipeKomponenPayrollSummaryCard
        title='Total Referensi'
        subtitle='Dipakai definisi komponen'
        value={statistics.totalReferensi}
        icon={<UnorderedListOutlined />}
        iconClassName='text-xl text-violet-500'
      />
    </div>
  );
}
