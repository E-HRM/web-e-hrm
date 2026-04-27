import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import DetailField from './DetailField';
import StatusTag from './StatusTag';
import UserMeta from './UserMeta';

export default function DetailModalSection({ vm }) {
  return (
    <AppModal
      open={vm.isDetailModalOpen}
      onClose={vm.closeDetailModal}
      title='Detail Profil Payroll'
      footer={null}
      width={680}
    >
      {vm.selectedProfil ? (
        <div className='space-y-5'>
          <UserMeta
            user={vm.selectedProfil.user}
            vm={vm}
          />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <DetailField
              label='Jenis Hubungan Kerja'
              children={
                <div className='mt-1'>
                  <AppTag
                    tone='info'
                    variant='soft'
                    size='sm'
                    className='!font-medium'
                  >
                    {vm.formatJenisHubungan(vm.selectedProfil.jenis_hubungan_kerja)}
                  </AppTag>
                </div>
              }
            />

            <DetailField
              label='Gaji Pokok'
              value={vm.formatCurrency(vm.selectedProfil.gaji_pokok ?? 0)}
            />

            <DetailField
              label='Tunjangan BPJS'
              value={vm.formatCurrency(vm.selectedProfil.tunjangan_bpjs ?? 0)}
            />
          </div>

          <div className='border-t border-gray-200 pt-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <DetailField
                label='Status Payroll'
                children={
                  <div className='mt-1'>
                    <StatusTag active={vm.selectedProfil.payroll_aktif} />
                  </div>
                }
              />

              <DetailField
                label='Tanggal Mulai Payroll'
                value={vm.selectedProfil.tanggal_mulai_payroll ? vm.formatDate(vm.selectedProfil.tanggal_mulai_payroll) : '-'}
              />
            </div>
          </div>

          {vm.selectedProfil.catatan ? (
            <div className='border-t border-gray-200 pt-4'>
              <AppTypography.Text
                size={12}
                className='block text-gray-500 mb-2'
              >
                Catatan
              </AppTypography.Text>

              <div className='bg-gray-50 rounded-lg p-3'>
                <AppTypography.Text
                  size={14}
                  className='text-gray-900'
                >
                  {vm.selectedProfil.catatan}
                </AppTypography.Text>
              </div>
            </div>
          ) : null}

          <div className='flex gap-3 pt-4'>
            <AppButton
              onClick={vm.openEditFromDetail}
              className='!flex-1 !rounded-lg !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
            >
              Edit Profil
            </AppButton>

            <AppButton
              onClick={vm.closeDetailModal}
              variant='secondary'
              className='!flex-1 !rounded-lg !h-10 !bg-gray-100 hover:!bg-gray-200 !border-gray-100 hover:!border-gray-200 !text-gray-700'
            >
              Tutup
            </AppButton>
          </div>
        </div>
      ) : null}
    </AppModal>
  );
}
