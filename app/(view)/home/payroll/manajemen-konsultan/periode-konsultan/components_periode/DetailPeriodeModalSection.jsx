'use client';

import { CheckCircleOutlined, EditOutlined, FileTextOutlined, InfoCircleOutlined, LockOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function getStatusMeta(status) {
  const map = {
    DRAFT: {
      label: 'Draft',
      tone: 'warning',
      icon: <FileTextOutlined />,
      helper: 'Periode masih dalam tahap persiapan dan belum dipakai sebagai acuan final.',
    },
    DIREVIEW: {
      label: 'Direview',
      tone: 'info',
      icon: <InfoCircleOutlined />,
      helper: 'Periode sedang ditinjau sebelum dikunci atau disetujui untuk proses berikutnya.',
    },
    DISETUJUI: {
      label: 'Disetujui',
      tone: 'success',
      icon: <CheckCircleOutlined />,
      helper: 'Periode siap digunakan sebagai acuan transaksi dan payout konsultan.',
    },
    TERKUNCI: {
      label: 'Terkunci',
      tone: 'neutral',
      icon: <LockOutlined />,
      helper: 'Periode sudah dikunci untuk menjaga konsistensi data payroll konsultan.',
    },
  };

  return map[String(status || '').toUpperCase()] || map.DRAFT;
}

function StatusTag({ status }) {
  const meta = getStatusMeta(status);

  return (
    <AppTag
      tone={meta.tone}
      variant='soft'
      size='sm'
      icon={meta.icon}
      className='!font-medium'
    >
      {meta.label}
    </AppTag>
  );
}

function SectionBlock({ title, subtitle, children }) {
  return (
    <div className='rounded-2xl border border-gray-200 p-5'>
      <div className='mb-4'>
        <AppTypography.Text
          size={14}
          weight={700}
          className='block text-gray-900'
        >
          {title}
        </AppTypography.Text>

        {subtitle ? (
          <AppTypography.Text
            size={12}
            className='block text-gray-500 mt-1'
          >
            {subtitle}
          </AppTypography.Text>
        ) : null}
      </div>

      {children}
    </div>
  );
}

function DetailField({ label, value, valueClassName = 'text-gray-900', weight = 600 }) {
  return (
    <div>
      <AppTypography.Text
        size={12}
        className='block text-gray-500 mb-1'
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

export default function DetailPeriodeModalSection({ vm }) {
  const periode = vm.selectedPeriode;
  const statusMeta = getStatusMeta(periode?.status_periode);

  return (
    <AppModal
      open={vm.isDetailModalOpen}
      onClose={vm.closeDetailModal}
      title={periode ? `Detail Periode ${vm.formatPeriodeLabel(periode)}` : 'Detail Periode Konsultan'}
      subtitle='Ringkasan periode konsultan untuk monitoring operasional, validasi transaksi, dan tindak lanjut payout.'
      width={860}
      footer={({ close }) => (
        <div className='flex items-center justify-end gap-3'>
          <AppButton
            variant='secondary'
            onClick={close}
          >
            Tutup
          </AppButton>

          {periode ? (
            <AppButton
              variant='outline'
              icon={<EditOutlined />}
              onClick={() => {
                close();
                vm.openEditModal(periode);
              }}
            >
              Edit Periode
            </AppButton>
          ) : null}
        </div>
      )}
    >
      {periode ? (
        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <AppCard
              rounded='xl'
              ring={false}
              shadow='none'
              className='border border-gray-200'
              bodyStyle={{ padding: 20 }}
            >
              <AppTypography.Text
                size={12}
                className='block text-gray-500 mb-2'
              >
                Status Periode
              </AppTypography.Text>

              <StatusTag status={periode.status_periode} />

              <AppTypography.Text
                size={12}
                className='block text-gray-500 mt-3 leading-5'
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
                className='block text-gray-500 mb-2'
              >
                Rentang Periode
              </AppTypography.Text>

              <AppTypography.Text
                size={18}
                weight={800}
                className='block text-gray-900'
              >
                {vm.formatPeriodeLabel(periode)}
              </AppTypography.Text>

              <AppTypography.Text
                size={12}
                className='block text-gray-500 mt-3 leading-5'
              >
                Berlaku {vm.formatDate(periode.tanggal_mulai)} sampai {vm.formatDate(periode.tanggal_selesai)}.
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
                className='block text-gray-500 mb-2'
              >
                Aktivitas Terkait
              </AppTypography.Text>

              <AppTypography.Text
                size={18}
                weight={800}
                className='block text-gray-900'
              >
                {periode?._count?.transaksi_konsultan || 0} transaksi
              </AppTypography.Text>

              <AppTypography.Text
                size={12}
                className='block text-gray-500 mt-3 leading-5'
              >
                {periode?._count?.payout_konsultan || 0} payout batch tercatat pada periode ini.
              </AppTypography.Text>
            </AppCard>
          </div>

          <SectionBlock
            title='Ringkasan Periode'
            subtitle='Informasi utama periode yang dibutuhkan tim payroll konsultan.'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <DetailField
                label='Nama Periode'
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
            </div>
          </SectionBlock>

          <SectionBlock
            title='Aktivitas Periode'
            subtitle='Gambaran volume aktivitas yang sudah tercatat di periode ini.'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <DetailField
                label='Total Transaksi Konsultan'
                value={`${periode?._count?.transaksi_konsultan || 0} transaksi`}
              />

              <DetailField
                label='Total Batch Payout'
                value={`${periode?._count?.payout_konsultan || 0} payout`}
              />
            </div>
          </SectionBlock>

          <SectionBlock
            title='Catatan Operasional'
            subtitle='Catatan tambahan untuk review, persetujuan, atau locking periode.'
          >
            <div className='rounded-2xl bg-gray-50 p-5'>
              <AppTypography.Text
                size={13}
                className='block whitespace-pre-line leading-6 text-gray-600'
              >
                {periode.catatan || 'Belum ada catatan operasional untuk periode ini.'}
              </AppTypography.Text>
            </div>
          </SectionBlock>

          <SectionBlock
            title='Timeline Data'
            subtitle='Waktu pembentukan dan pembaruan data periode.'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <DetailField
                label='Dibuat Pada'
                value={vm.formatDateTime(periode.created_at)}
              />

              <DetailField
                label='Terakhir Diperbarui'
                value={vm.formatDateTime(periode.updated_at)}
              />
            </div>
          </SectionBlock>
        </div>
      ) : null}
    </AppModal>
  );
}
