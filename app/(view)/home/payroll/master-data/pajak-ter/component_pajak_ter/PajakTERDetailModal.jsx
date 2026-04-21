import { LoadingOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import DetailField from './DetailField';

export default function PajakTERDetailModal({ vm }) {
  return (
    <AppModal
      open={vm.isDetailModalOpen}
      onClose={vm.closeDetailModal}
      title='Detail Tarif Pajak TER'
      footer={null}
      width={640}
    >
      {vm.selectedTarif ? (
        <div className='space-y-6'>
          {vm.isDetailLoading ? (
            <div className='flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3'>
              <LoadingOutlined className='text-blue-600' />
              <AppTypography.Text
                size={12}
                className='text-blue-700'
              >
                Memuat detail terbaru...
              </AppTypography.Text>
            </div>
          ) : null}

          <div className='border-b border-gray-200 pb-4'>
            <AppTypography.Text
              size={18}
              weight={700}
              className='mb-4 block text-gray-900'
            >
              Informasi Tarif
            </AppTypography.Text>

            <div className='space-y-3'>
              <DetailField
                label='Kode Kategori Pajak'
                value={vm.formatKodeKategoriPajak(vm.selectedTarif.kode_kategori_pajak)}
              />

              <DetailField
                label='Rentang Penghasilan'
                value={vm.formatIncomeRange(vm.selectedTarif.penghasilan_dari, vm.selectedTarif.penghasilan_sampai)}
              />

              <DetailField
                label='Persentase Tarif Pajak'
                value={`${vm.formatPercent(vm.selectedTarif.persen_tarif)}%`}
                valueClassName='text-blue-600'
                valueSize={28}
              />
            </div>
          </div>

          <div>
            <AppTypography.Text
              size={18}
              weight={700}
              className='mb-4 block text-gray-900'
            >
              Periode Berlaku
            </AppTypography.Text>

            <div className='space-y-3'>
              <DetailField
                label='Berlaku Mulai'
                value={vm.formatDate(vm.selectedTarif.berlaku_mulai)}
              />

              <DetailField
                label='Berlaku Sampai'
                value={vm.selectedTarif.berlaku_sampai ? vm.formatDate(vm.selectedTarif.berlaku_sampai) : 'Tidak terbatas'}
              />
            </div>
          </div>

          <div className='flex justify-end pt-4'>
            <AppButton
              variant='secondary'
              onClick={vm.closeDetailModal}
              className='!h-10 !rounded-lg !px-4'
            >
              Tutup
            </AppButton>
          </div>
        </div>
      ) : (
        <div className='rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center'>
          <AppTypography.Text
            size={14}
            className='text-gray-600'
          >
            Detail tarif pajak TER tidak tersedia.
          </AppTypography.Text>
        </div>
      )}
    </AppModal>
  );
}
