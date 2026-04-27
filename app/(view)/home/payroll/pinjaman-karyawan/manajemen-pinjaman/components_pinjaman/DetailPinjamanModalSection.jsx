'use client';

import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { DetailField, StatusTag, UserMeta } from './SectionShared';

export default function DetailPinjamanModalSection({ vm }) {
  return (
    <AppModal
      open={vm.isDetailModalOpen}
      onClose={vm.closeDetailModal}
      title='Detail Pinjaman'
      footer={null}
      width={760}
    >
      {vm.selectedPinjaman ? (
        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <AppTypography.Text
                size={12}
                className='block text-gray-500 mb-1'
              >
                Nama Pinjaman
              </AppTypography.Text>

              <AppTypography.Text
                size={18}
                weight={700}
                className='text-gray-900'
              >
                {vm.selectedPinjaman.nama_pinjaman}
              </AppTypography.Text>
            </div>

            <div>
              <AppTypography.Text
                size={12}
                className='block text-gray-500 mb-1'
              >
                Status
              </AppTypography.Text>

              <StatusTag status={vm.selectedPinjaman.status_pinjaman} />
            </div>
          </div>

          {vm.selectedPinjaman.user ? (
            <div>
              <AppTypography.Text
                size={12}
                className='block text-gray-500 mb-2'
              >
                Karyawan
              </AppTypography.Text>

              <UserMeta
                user={vm.selectedPinjaman.user}
                vm={vm}
              />
            </div>
          ) : (
            <DetailField
              label='ID Karyawan'
              value={vm.selectedPinjaman.id_user}
            />
          )}

          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 p-4 bg-gray-50 rounded-lg'>
            <DetailField
              label='Total Pinjaman'
              value={vm.formatCurrency(vm.selectedPinjaman.nominal_pinjaman)}
              valueSize={22}
              weight={800}
            />

            <DetailField
              label='Tenor'
              value={`${vm.selectedPinjaman.tenor_bulan || 0} bulan`}
              valueClassName='text-blue-600'
              valueSize={22}
              weight={800}
            />

            <DetailField
              label='Cicilan / Bulan'
              value={vm.formatCurrency(vm.selectedPinjaman.nominal_cicilan)}
              valueClassName='text-blue-600'
              valueSize={22}
              weight={800}
            />

            <DetailField
              label='Sisa Saldo'
              value={vm.formatCurrency(vm.selectedPinjaman.sisa_saldo)}
              valueClassName='text-red-600'
              valueSize={22}
              weight={800}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <DetailField
              label='Tanggal Mulai'
              value={vm.formatDate(vm.selectedPinjaman.tanggal_mulai)}
            />

            <DetailField
              label='Tanggal Selesai'
              value={vm.formatDate(vm.selectedPinjaman.tanggal_selesai)}
            />

            <DetailField
              label='Jumlah Cicilan'
              value={`${vm.selectedPinjaman.jumlah_cicilan || 0} kali`}
            />
          </div>

          {vm.selectedPinjaman.status_pinjaman === 'AKTIF' ? (
            <div>
              <div className='flex items-center justify-between mb-2'>
                <AppTypography.Text
                  size={14}
                  className='text-gray-600'
                >
                  Progres Pembayaran
                </AppTypography.Text>

                <AppTypography.Text
                  size={14}
                  weight={600}
                  className='text-gray-900'
                >
                  {vm.calculateProgress(vm.selectedPinjaman).toFixed(1)}%
                </AppTypography.Text>
              </div>

              <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
                <div
                  className='bg-green-500 h-2 rounded-full transition-all'
                  style={{
                    width: `${vm.calculateProgress(vm.selectedPinjaman)}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          {vm.selectedPinjaman.catatan ? (
            <div>
              <AppTypography.Text
                size={12}
                className='block text-gray-500 mb-2'
              >
                Catatan
              </AppTypography.Text>

              <div className='bg-gray-50 p-4 rounded-lg'>
                <AppTypography.Text
                  size={14}
                  className='text-gray-900'
                >
                  {vm.selectedPinjaman.catatan}
                </AppTypography.Text>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </AppModal>
  );
}
