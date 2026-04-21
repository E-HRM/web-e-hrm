'use client';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { formatDateTime, getKeputusanMeta } from '../utils/persetujuanPayrollUtils';

function DetailField({ label, value, valueClassName = 'text-gray-900', weight = 600 }) {
  return (
    <div>
      <AppTypography.Text
        size={12}
        className='mb-1 block text-gray-500'
      >
        {label}
      </AppTypography.Text>

      <AppTypography.Text
        size={14}
        weight={weight}
        className={`block ${valueClassName}`}
      >
        {value || '-'}
      </AppTypography.Text>
    </div>
  );
}

function KeputusanTag({ keputusan }) {
  const meta = getKeputusanMeta(keputusan);

  return (
    <AppTag
      tone={meta.tone}
      variant='soft'
      size='sm'
      className='!font-medium'
    >
      {meta.label}
    </AppTag>
  );
}

export default function DetailPersetujuanModal({ vm }) {
  const persetujuan = vm.selectedPersetujuan;
  const keputusanMeta = getKeputusanMeta(persetujuan?.keputusan);

  return (
    <AppModal
      open={vm.isDetailModalOpen}
      onClose={vm.closeDetailModal}
      title='Detail Persetujuan Payroll'
      footer={null}
      width={900}
    >
      {persetujuan ? (
        <div className='space-y-6'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <AppCard
              rounded='xl'
              ring={false}
              shadow='none'
              className='border border-gray-200'
              bodyStyle={{ padding: 20 }}
            >
              <AppTypography.Text
                size={12}
                className='mb-2 block text-gray-500'
              >
                Keputusan
              </AppTypography.Text>

              <KeputusanTag keputusan={persetujuan.keputusan} />

              <AppTypography.Text
                size={12}
                className='mt-3 block leading-5 text-gray-500'
              >
                {keputusanMeta.helper}
              </AppTypography.Text>
            </AppCard>

            <AppCard
              rounded='xl'
              ring={false}
              shadow='none'
              className='border border-gray-200'
              bodyStyle={{ padding: 20 }}
            >
              <AppTypography.Text
                size={12}
                className='mb-2 block text-gray-500'
              >
                Periode Payroll
              </AppTypography.Text>

              <AppTypography.Text
                size={20}
                weight={800}
                className='block text-gray-900'
              >
                {persetujuan.periode_label}
              </AppTypography.Text>

              <AppTypography.Text
                size={12}
                className='mt-3 block leading-5 text-gray-500'
              >
                Level approval {persetujuan.level}.
              </AppTypography.Text>
            </AppCard>

            <AppCard
              rounded='xl'
              ring={false}
              shadow='none'
              className='border border-gray-200'
              bodyStyle={{ padding: 20 }}
            >
              <AppTypography.Text
                size={12}
                className='mb-2 block text-gray-500'
              >
                Penyetuju
              </AppTypography.Text>

              <AppTypography.Text
                size={18}
                weight={800}
                className='block text-gray-900'
              >
                {persetujuan.approver_display_name}
              </AppTypography.Text>

              <AppTypography.Text
                size={12}
                className='mt-3 block leading-5 text-gray-500'
              >
                User dan role approval yang direkam pada baris ini.
              </AppTypography.Text>
            </AppCard>
          </div>

          <div className='rounded-2xl border border-gray-200 p-5'>
            <AppTypography.Text
              size={14}
              weight={700}
              className='mb-4 block text-gray-900'
            >
              Ringkasan Persetujuan
            </AppTypography.Text>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <DetailField
                label='Periode Payroll'
                value={persetujuan.periode_label}
              />
              <DetailField
                label='Level'
                value={`Level ${persetujuan.level}`}
              />
              <DetailField
                label='User Penyetuju'
                value={persetujuan.penyetuju?.nama_pengguna || '-'}
              />
              <DetailField
                label='Role Penyetuju'
                value={vm.formatRolePenyetuju(persetujuan.role_penyetuju)}
              />
              <DetailField
                label='Keputusan'
                value={vm.formatKeputusanPersetujuan(persetujuan.keputusan)}
              />
              <DetailField
                label='Diputuskan Pada'
                value={formatDateTime(persetujuan.diputuskan_pada)}
              />
            </div>
          </div>

          <div className='rounded-2xl border border-gray-200 p-5'>
            <AppTypography.Text
              size={14}
              weight={700}
              className='mb-4 block text-gray-900'
            >
              Catatan
            </AppTypography.Text>

            <AppTypography.Text
              size={13}
              className='block whitespace-pre-line leading-6 text-gray-600'
            >
              {persetujuan.catatan || 'Belum ada catatan approval.'}
            </AppTypography.Text>
          </div>

          <div className='flex justify-end gap-3 pt-2'>
            <AppButton
              variant='secondary'
              onClick={vm.closeDetailModal}
              className='!rounded-lg !h-10'
            >
              Tutup
            </AppButton>

            <AppButton
              onClick={() => {
                vm.closeDetailModal();
                vm.openEditModal(persetujuan);
              }}
              className='!rounded-lg !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
            >
              Edit Approval
            </AppButton>
          </div>
        </div>
      ) : null}
    </AppModal>
  );
}
