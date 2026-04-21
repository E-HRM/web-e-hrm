import { LoadingOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function DetailRow({ label, value, emphasize = false }) {
  return (
    <div className='space-y-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3'>
      <AppTypography.Text
        size={12}
        className='block text-gray-500'
      >
        {label}
      </AppTypography.Text>

      <AppTypography.Text
        size={emphasize ? 18 : 14}
        weight={emphasize ? 700 : 600}
        className='block text-gray-900'
      >
        {value || '-'}
      </AppTypography.Text>
    </div>
  );
}

export default function TipeKomponenPayrollDetailModal({ vm }) {
  return (
    <AppModal
      open={vm.isDetailModalOpen}
      onClose={vm.closeDetailModal}
      title='Detail Tipe Komponen Payroll'
      footer={null}
      width={640}
    >
      {vm.selectedTipeKomponen ? (
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

          <DetailRow
            label='Nama Tipe Komponen'
            value={vm.selectedTipeKomponen.nama_tipe_komponen}
            emphasize
          />

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <DetailRow
              label='Jumlah Referensi Definisi'
              value={vm.selectedTipeKomponen.definisi_komponen_count}
            />

            <DetailRow
              label='Status Data'
              value={vm.selectedTipeKomponen.deleted_at ? 'Soft Delete' : 'Aktif'}
            />
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <DetailRow
              label='Dibuat Pada'
              value={vm.formatDateTime(vm.selectedTipeKomponen.created_at)}
            />

            <DetailRow
              label='Diupdate Pada'
              value={vm.formatDateTime(vm.selectedTipeKomponen.updated_at)}
            />
          </div>

          <div className='flex justify-end pt-2'>
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
            Detail tipe komponen payroll tidak tersedia.
          </AppTypography.Text>
        </div>
      )}
    </AppModal>
  );
}
