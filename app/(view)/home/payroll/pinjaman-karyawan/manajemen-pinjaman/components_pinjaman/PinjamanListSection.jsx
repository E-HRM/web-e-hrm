'use client';

import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { DetailField, StatusTag, UserMeta } from './SectionShared';

export default function PinjamanListSection({ vm }) {
  if (vm.error && vm.pinjamanList.length === 0) {
    return (
      <AppEmpty.Card
        title='Data pinjaman gagal dimuat'
        description={vm.error?.message || 'Terjadi kesalahan saat mengambil data pinjaman.'}
        action={
          <AppButton
            variant='outline'
            onClick={vm.reloadData}
            className='!rounded-lg'
          >
            Muat Ulang
          </AppButton>
        }
      />
    );
  }

  if (vm.loading && vm.pinjamanList.length === 0) {
    return (
      <AppCard
        rounded='xl'
        ring={false}
        shadow='none'
        className='border border-gray-200'
        bodyStyle={{ padding: 24 }}
      >
        <div className='flex items-center justify-center min-h-[120px]'>
          <AppTypography.Text
            size={14}
            className='text-gray-600 text-center'
          >
            Memuat data pinjaman karyawan...
          </AppTypography.Text>
        </div>
      </AppCard>
    );
  }

  if (vm.pinjamanList.length === 0) {
    return (
      <AppEmpty.Card
        title='Belum ada data pinjaman'
        description='Tambahkan pinjaman pertama untuk mulai mengelola cicilan karyawan.'
      />
    );
  }

  return (
    <div className='space-y-4'>
      {vm.pinjamanList.map((pinjaman) => {
        const progress = vm.calculateProgress(pinjaman);
        const user = pinjaman.user;

        return (
          <AppCard
            key={pinjaman.id_pinjaman_karyawan}
            rounded='xl'
            ring={false}
            shadow='none'
            className='border border-gray-200 hover:shadow-md transition-shadow'
            bodyStyle={{ padding: 24 }}
          >
            <div className='flex items-start justify-between gap-6'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-4 flex-wrap'>
                  <AppTypography.Text
                    size={18}
                    weight={700}
                    className='text-gray-900'
                  >
                    {pinjaman.nama_pinjaman}
                  </AppTypography.Text>

                  <StatusTag status={pinjaman.status_pinjaman} />
                </div>

                <div className='mb-4'>
                  {user ? (
                    <UserMeta
                      user={user}
                      vm={vm}
                      compact
                    />
                  ) : (
                    <div className='rounded-lg bg-gray-50 border border-gray-200 px-4 py-3'>
                      <AppTypography.Text
                        size={14}
                        weight={600}
                        className='block text-gray-900'
                      >
                        {pinjaman.id_user}
                      </AppTypography.Text>

                      <AppTypography.Text
                        size={12}
                        className='text-gray-500'
                      >
                        Data karyawan belum tersedia.
                      </AppTypography.Text>
                    </div>
                  )}
                </div>

                <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-4'>
                  <DetailField
                    label='Total Pinjaman'
                    value={vm.formatCurrency(pinjaman.nominal_pinjaman)}
                  />

                  <DetailField
                    label='Cicilan / Bulan'
                    value={vm.formatCurrency(pinjaman.nominal_cicilan)}
                  />

                  <DetailField
                    label='Sisa Saldo'
                    value={vm.formatCurrency(pinjaman.sisa_saldo)}
                    valueClassName='text-red-600'
                    weight={700}
                  />

                  <DetailField
                    label='Jumlah Cicilan'
                    value={`${pinjaman.jumlah_cicilan || 0} item`}
                  />
                </div>

                {pinjaman.status_pinjaman === 'AKTIF' ? (
                  <div className='mb-3'>
                    <div className='flex items-center justify-between mb-2'>
                      <AppTypography.Text
                        size={14}
                        className='text-gray-600'
                      >
                        Progress Pembayaran
                      </AppTypography.Text>

                      <AppTypography.Text
                        size={14}
                        weight={600}
                        className='text-gray-900'
                      >
                        {progress.toFixed(1)}%
                      </AppTypography.Text>
                    </div>

                    <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
                      <div
                        className='bg-green-500 h-2 rounded-full transition-all'
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className='flex items-center gap-6 text-sm text-gray-600 flex-wrap'>
                  <AppTypography.Text
                    size={14}
                    className='text-gray-600'
                  >
                    Mulai: {vm.formatDate(pinjaman.tanggal_mulai)}
                  </AppTypography.Text>

                  {pinjaman.tanggal_selesai ? (
                    <AppTypography.Text
                      size={14}
                      className='text-gray-600'
                    >
                      Selesai: {vm.formatDate(pinjaman.tanggal_selesai)}
                    </AppTypography.Text>
                  ) : null}
                </div>

                {pinjaman.catatan ? (
                  <AppTypography.Text
                    size={14}
                    className='block text-gray-600 mt-3 italic'
                  >
                    {pinjaman.catatan}
                  </AppTypography.Text>
                ) : null}
              </div>

              <div className='flex items-center gap-2 shrink-0'>
                <AppButton
                  variant='text'
                  shape='circle'
                  size='middle'
                  aria-label='Detail'
                  className='!text-gray-600 hover:!bg-gray-50'
                  icon={<EyeOutlined />}
                  onClick={() => vm.openDetailModal(pinjaman)}
                />

                <AppButton
                  variant='text'
                  shape='circle'
                  size='middle'
                  aria-label='Edit'
                  className='!text-blue-600 hover:!bg-blue-50'
                  icon={<EditOutlined />}
                  onClick={() => vm.openEditModal(pinjaman)}
                />

                <AppButton
                  variant='text'
                  shape='circle'
                  size='middle'
                  aria-label='Hapus'
                  className='!text-red-600 hover:!bg-red-50'
                  icon={<DeleteOutlined />}
                  onClick={() => vm.openDeleteDialog(pinjaman)}
                />
              </div>
            </div>
          </AppCard>
        );
      })}
    </div>
  );
}
