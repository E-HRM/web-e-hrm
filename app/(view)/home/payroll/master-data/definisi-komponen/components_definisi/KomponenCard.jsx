import { DeleteOutlined, EditOutlined, EyeOutlined, FallOutlined, RiseOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import DirectionTag from './DirectionTag';
import DotInfo from './DotInfo';
import StatusTag from './StatusTag';

export default function KomponenCard({ komponen, onDetail, onEdit, onDelete, formatKomponenLabel }) {
  const isPotongan = komponen.arah_komponen === 'POTONGAN';

  return (
    <AppCard
      rounded='lg'
      ring={false}
      shadow='none'
      className='border border-gray-200 transition-shadow hover:shadow-md'
      bodyStyle={{ padding: 16 }}
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0 flex-1'>
          <div className='mb-2 flex items-center gap-3'>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isPotongan ? 'bg-red-100' : 'bg-green-100'}`}>
              <span className={`text-lg ${isPotongan ? 'text-red-600' : 'text-green-600'}`}>{isPotongan ? <FallOutlined /> : <RiseOutlined />}</span>
            </div>

            <div className='min-w-0 flex-1'>
              <AppTypography.Text
                size={15}
                weight={700}
                className='block text-gray-900'
              >
                {komponen.nama_komponen}
              </AppTypography.Text>

              <AppTypography.Text
                size={12}
                className='text-gray-500'
              >
                {formatKomponenLabel(komponen.tipe_komponen)}
              </AppTypography.Text>
            </div>
          </div>

          <div className='mb-3'>
            <AppTypography.Text
              size={12}
              className='mb-1 block text-gray-500'
            >
              Tipe master payroll
            </AppTypography.Text>
          </div>

          <div className='mb-3 grid grid-cols-1 gap-2'>
            <DotInfo
              active={komponen.berulang_default}
              label='Berulang'
              activeClassName='bg-green-500'
            />
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <StatusTag active={komponen.aktif} />
            <DirectionTag value={komponen.arah_komponen} />
          </div>
        </div>

        <div className='flex shrink-0 items-center gap-1'>
          <AppButton
            variant='text'
            shape='circle'
            size='middle'
            aria-label='Detail'
            className='!text-gray-600 hover:!bg-gray-50'
            icon={<EyeOutlined />}
            onClick={() => onDetail(komponen)}
          />

          <AppButton
            variant='text'
            shape='circle'
            size='middle'
            aria-label='Edit'
            className='!text-blue-600 hover:!bg-blue-50'
            icon={<EditOutlined />}
            onClick={() => onEdit(komponen)}
          />

          <AppButton
            variant='text'
            shape='circle'
            size='middle'
            aria-label='Hapus'
            className='!text-red-600 hover:!bg-red-50'
            icon={<DeleteOutlined />}
            onClick={() => onDelete(komponen)}
          />
        </div>
      </div>
    </AppCard>
  );
}
