'use client';

import { FileTextOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { getPeriodePayrollStatusMeta } from '../utils/periodePayrollUtils';

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

function StatusTag({ status }) {
  const meta = getPeriodePayrollStatusMeta(status);

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

function buildDetailProsesHref(periode, vm) {
  const query = new URLSearchParams({
    id_periode_payroll: periode?.id_periode_payroll || '',
    periode_label: vm.formatPeriodeLabel(periode),
  });

  return `/home/payroll/penggajian/payroll-karyawan?${query.toString()}`;
}

function openTemplateFile(template) {
  const url = String(template?.file_template_url || '').trim();

  if (!url || typeof window === 'undefined') return;

  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function DetailPeriodeModal({ vm }) {
  const periode = vm.selectedPeriode;
  const statusMeta = getPeriodePayrollStatusMeta(periode?.status_periode);

  return (
    <AppModal
      open={vm.isDetailModalOpen}
      onClose={vm.closeDetailModal}
      title={periode ? `Detail ${vm.formatPeriodeLabel(periode)}` : 'Detail Periode Payroll'}
      footer={null}
      width={920}
    >
      {periode ? (
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
                Status Periode
              </AppTypography.Text>

              <StatusTag status={periode.status_periode} />

              <AppTypography.Text
                size={12}
                className='mt-3 block leading-5 text-gray-500'
              >
                {statusMeta.helper}
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
                Payroll Karyawan
              </AppTypography.Text>

              <AppTypography.Text
                size={22}
                weight={800}
                className='block text-gray-900'
              >
                {periode?._count?.payroll_karyawan || 0}
              </AppTypography.Text>

              <AppTypography.Text
                size={12}
                className='mt-3 block leading-5 text-gray-500'
              >
                Total data penggajian karyawan yang terhubung ke periode ini.
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
                Payout Konsultan
              </AppTypography.Text>

              <AppTypography.Text
                size={22}
                weight={800}
                className='block text-gray-900'
              >
                {periode?._count?.payout_konsultan ?? periode?._count?.payoutKonsultans ?? 0}
              </AppTypography.Text>

              <AppTypography.Text
                size={12}
                className='mt-3 block leading-5 text-gray-500'
              >
                Total payout konsultan yang terhubung ke periode ini.
              </AppTypography.Text>
            </AppCard>
          </div>

          <div className='rounded-2xl border border-gray-200 p-5'>
            <AppTypography.Text
              size={14}
              weight={700}
              className='mb-4 block text-gray-900'
            >
              Ringkasan Periode
            </AppTypography.Text>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <DetailField
                label='Periode'
                value={vm.formatPeriodeLabel(periode)}
              />

              <DetailField
                label='Status'
                value={statusMeta.label}
              />

              <DetailField
                label='Tanggal Mulai'
                value={vm.formatDate(periode.tanggal_mulai)}
              />

              <DetailField
                label='Tanggal Selesai'
                value={vm.formatDate(periode.tanggal_selesai)}
              />

              <DetailField
                label='Template Slip Gaji'
                value={vm.resolveTemplateLabel(periode)}
              />
            </div>

            {periode?.master_template?.file_template_url ? (
              <div className='mt-4'>
                <AppButton
                  variant='outline'
                  icon={<FileTextOutlined />}
                  onClick={() => openTemplateFile(periode.master_template)}
                  className='!rounded-lg !h-10'
                >
                  Buka Template Slip Gaji
                </AppButton>
              </div>
            ) : null}
          </div>

          <div className='rounded-2xl border border-gray-200 p-5'>
            <AppTypography.Text
              size={14}
              weight={700}
              className='mb-4 block text-gray-900'
            >
              Catatan Periode
            </AppTypography.Text>

            <AppTypography.Text
              size={13}
              className='block whitespace-pre-line leading-6 text-gray-600'
            >
              {periode.catatan || 'Belum ada catatan untuk periode ini.'}
            </AppTypography.Text>
          </div>

          <div className='flex justify-end gap-3 pt-2'>
            <AppButton
              variant='outline'
              href={buildDetailProsesHref(periode, vm)}
              className='!rounded-lg !h-10'
            >
              Buka Data Payroll Karyawan
            </AppButton>

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
                vm.openEditModal(periode);
              }}
              className='!rounded-lg !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
            >
              Edit Periode
            </AppButton>
          </div>
        </div>
      ) : null}
    </AppModal>
  );
}
