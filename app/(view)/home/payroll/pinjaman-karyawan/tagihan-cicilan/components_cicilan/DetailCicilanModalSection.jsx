'use client';

import { LinkOutlined, RollbackOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { DetailField, StatusTag, UserMeta } from './SectionShared';

function formatCurrencySafe(vm, value, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback;
  return vm.formatCurrency(value);
}

function getPayrollStatusMeta(status) {
  const normalized = String(status || '')
    .trim()
    .toUpperCase();

  const map = {
    DIBAYAR: {
      label: 'Payroll Dibayar',
      tone: 'success',
      helper: 'Cicilan sudah terselesaikan melalui pembayaran payroll.',
    },
    DIPROSES: {
      label: 'Payroll Diproses',
      tone: 'info',
      helper: 'Cicilan sudah masuk payroll periode berjalan.',
    },
    DISETUJUI: {
      label: 'Payroll Disetujui',
      tone: 'info',
      helper: 'Payroll sudah disetujui dan menunggu pencairan pembayaran.',
    },
    DRAFT: {
      label: 'Payroll Draft',
      tone: 'warning',
      helper: 'Payroll sudah dibuat, tetapi masih menunggu finalisasi.',
    },
  };

  if (map[normalized]) return map[normalized];

  if (!normalized) {
    return {
      label: 'Terhubung ke Payroll',
      tone: 'info',
      helper: 'Cicilan sudah dikaitkan ke payroll karyawan.',
    };
  }

  return {
    label: normalized
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
    tone: 'info',
    helper: 'Cicilan sudah dikaitkan ke payroll karyawan.',
  };
}

function SummaryCard({ label, value, helper, valueClassName = 'text-gray-900', helperClassName = 'text-gray-500' }) {
  return (
    <div className='rounded-2xl border border-gray-200 bg-gray-50 p-5'>
      <AppTypography.Text
        size={12}
        className='block text-gray-500 mb-2'
      >
        {label}
      </AppTypography.Text>

      <div className={valueClassName}>{value}</div>

      {helper ? (
        <AppTypography.Text
          size={12}
          className={`block mt-3 leading-5 ${helperClassName}`}
        >
          {helper}
        </AppTypography.Text>
      ) : null}
    </div>
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

export default function DetailCicilanModalSection({ vm }) {
  const cicilan = vm.selectedCicilan;
  const statusMeta = vm.selectedStatusMeta;
  const payrollMeta = getPayrollStatusMeta(cicilan?.payroll_status);

  return (
    <AppModal
      open={vm.isDetailModalOpen}
      onClose={vm.closeDetailModal}
      title={cicilan ? `Detail Tagihan Cicilan - ${cicilan.nama_karyawan}` : 'Detail Tagihan Cicilan'}
      subtitle='Lihat rincian cicilan, status pembayaran, dan informasi payroll terkait.'
      width={860}
      footer={({ close }) => (
        <div className='flex items-center justify-end gap-3'>
          <AppButton
            variant='secondary'
            onClick={close}
          >
            Tutup
          </AppButton>

          {vm.canPostToPayroll(cicilan) ? (
            <AppButton
              icon={<LinkOutlined />}
              loading={vm.actionLoadingId === cicilan?.id_cicilan_pinjaman_karyawan}
              onClick={() => {
                const opened = vm.openPostModal(cicilan);
                if (opened) close();
              }}
              className='!bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
            >
              Masukkan ke Payroll
            </AppButton>
          ) : null}

          {vm.canUnpostFromPayroll(cicilan) ? (
            <AppButton
              variant='outline'
              icon={<RollbackOutlined />}
              loading={vm.actionLoadingId === cicilan?.id_cicilan_pinjaman_karyawan}
              onClick={async () => {
                const unposted = await vm.handleUnpostFromPayroll(cicilan);
                if (unposted) close();
              }}
              className='!rounded-lg'
            >
              Lepas Posting
            </AppButton>
          ) : null}
        </div>
      )}
    >
      {cicilan ? (
        <div className='space-y-6'>
          <div>
            {cicilan.user ? (
              <UserMeta
                user={cicilan.user}
                vm={vm}
              />
            ) : (
              <div className='rounded-xl border border-gray-200 bg-gray-50 p-4'>
                <AppTypography.Text
                  size={14}
                  weight={700}
                  className='block text-gray-900'
                >
                  {cicilan.nama_karyawan}
                </AppTypography.Text>

                <AppTypography.Text
                  size={13}
                  className='block text-gray-500 mt-1'
                >
                  {cicilan.identitas_karyawan}
                </AppTypography.Text>
              </div>
            )}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <SummaryCard
              label='Status Cicilan'
              value={
                <div className='mt-1'>
                  <StatusTag status={cicilan.status_cicilan} />
                </div>
              }
              helper={statusMeta?.helper}
            />

            <SummaryCard
              label='Periode Tagihan'
              value={
                <AppTypography.Text
                  size={18}
                  weight={800}
                  className='block text-gray-900'
                >
                  {cicilan.periode_tagihan_label || 'Periode belum tersedia'}
                </AppTypography.Text>
              }
              helper='Periode ini menjadi acuan tagihan cicilan yang harus ditindaklanjuti.'
            />

            <SummaryCard
              label='Jatuh Tempo'
              value={
                <AppTypography.Text
                  size={18}
                  weight={800}
                  className='block text-gray-900'
                >
                  {vm.formatDate(cicilan.jatuh_tempo)}
                </AppTypography.Text>
              }
              helper='Gunakan tanggal jatuh tempo untuk menentukan cicilan mana yang perlu diproses lebih dulu.'
            />
          </div>

          <SectionBlock
            title='Informasi Cicilan'
            subtitle='Informasi utama cicilan karyawan.'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <DetailField
                label='Nama Pinjaman'
                value={cicilan.nama_pinjaman || 'Pinjaman Karyawan'}
              />

              <DetailField
                label='Karyawan'
                value={`${cicilan.nama_karyawan} • ${cicilan.identitas_karyawan}`}
              />

              <DetailField
                label='Periode Tagihan'
                value={cicilan.periode_tagihan_label || 'Periode belum tersedia'}
              />

              <DetailField
                label='Terakhir Diperbarui'
                value={vm.formatDateTime(cicilan.updated_at)}
              />
            </div>
          </SectionBlock>

          <SectionBlock
            title='Rincian Nominal'
            subtitle='Nominal yang perlu dimonitor untuk memastikan pembayaran cicilan tetap akurat.'
          >
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='rounded-2xl bg-gray-50 p-5'>
                <AppTypography.Text
                  size={12}
                  className='block text-gray-500 mb-2'
                >
                  Nominal Tagihan
                </AppTypography.Text>

                <AppTypography.Text
                  size={22}
                  weight={800}
                  className='block text-gray-900'
                >
                  {vm.formatCurrency(cicilan.nominal_tagihan)}
                </AppTypography.Text>
              </div>

              <div className='rounded-2xl bg-gray-50 p-5'>
                <AppTypography.Text
                  size={12}
                  className='block text-gray-500 mb-2'
                >
                  Nominal Terbayar
                </AppTypography.Text>

                <AppTypography.Text
                  size={22}
                  weight={800}
                  className='block text-green-600'
                >
                  {vm.formatCurrency(cicilan.nominal_terbayar)}
                </AppTypography.Text>
              </div>

              <div className='rounded-2xl bg-gray-50 p-5'>
                <AppTypography.Text
                  size={12}
                  className='block text-gray-500 mb-2'
                >
                  Sisa Tagihan
                </AppTypography.Text>

                <AppTypography.Text
                  size={22}
                  weight={800}
                  className='block text-red-600'
                >
                  {vm.formatCurrency(cicilan.outstanding_nominal)}
                </AppTypography.Text>
              </div>
            </div>
          </SectionBlock>

          <SectionBlock
            title='Payroll Terkait'
            subtitle='Status ini membantu menentukan apakah cicilan sudah masuk payroll atau masih perlu diproses.'
          >
            {cicilan.id_payroll_karyawan ? (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <DetailField
                  label='Periode Payroll'
                  value={cicilan.periode_payroll_label || 'Periode payroll belum tersedia'}
                />

                <div>
                  <AppTypography.Text
                    size={12}
                    className='block text-gray-500 mb-1'
                  >
                    Status Payroll
                  </AppTypography.Text>

                  <AppTag
                    tone={payrollMeta.tone}
                    variant='soft'
                    size='sm'
                    className='!font-semibold'
                  >
                    {payrollMeta.label}
                  </AppTag>
                </div>

                <DetailField
                  label='Keterangan'
                  value={payrollMeta.helper}
                  valueClassName='text-gray-700'
                  weight={500}
                />
              </div>
            ) : (
              <div className='rounded-2xl bg-amber-50 border border-amber-100 p-4'>
                <AppTypography.Text
                  size={13}
                  weight={700}
                  className='block text-amber-800'
                >
                  Belum masuk payroll
                </AppTypography.Text>

                <AppTypography.Text
                  size={13}
                  className='block text-amber-700 mt-1 leading-6'
                >
                  Tagihan ini belum dimasukkan ke payroll periode yang sesuai.
                </AppTypography.Text>
              </div>
            )}
          </SectionBlock>

          <SectionBlock
            title='Riwayat Proses'
            subtitle='Riwayat waktu pembayaran, masuk payroll, dan pembaruan data cicilan.'
          >
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <DetailField
                label='Dibayar Pada'
                value={vm.formatDateTime(cicilan.dibayar_pada)}
              />

              <DetailField
                label='Masuk Payroll Pada'
                value={vm.formatDateTime(cicilan.diposting_pada)}
              />

              <DetailField
                label='Terakhir Diperbarui'
                value={vm.formatDateTime(cicilan.updated_at)}
              />
            </div>
          </SectionBlock>

          <SectionBlock
            title='Ringkasan Pinjaman'
            subtitle='Gambaran pinjaman asal tagihan untuk membantu validasi nominal cicilan.'
          >
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
              <DetailField
                label='Nominal Pinjaman'
                value={formatCurrencySafe(vm, cicilan.pinjaman_karyawan?.nominal_pinjaman)}
              />

              <DetailField
                label='Tenor'
                value={`${cicilan.pinjaman_karyawan?.tenor_bulan || 0} bulan`}
              />

              <DetailField
                label='Cicilan / Bulan'
                value={formatCurrencySafe(vm, cicilan.pinjaman_karyawan?.nominal_cicilan)}
              />

              <DetailField
                label='Sisa Saldo Pinjaman'
                value={formatCurrencySafe(vm, cicilan.pinjaman_karyawan?.sisa_saldo)}
              />
            </div>
          </SectionBlock>

          <SectionBlock
            title='Catatan'
            subtitle='Keterangan tambahan dari proses cicilan atau payroll.'
          >
            <div className='rounded-2xl bg-gray-50 p-5'>
              <AppTypography.Text
                size={13}
                className='block whitespace-pre-line leading-6 text-gray-600'
              >
                {cicilan.catatan || 'Belum ada catatan tambahan untuk tagihan cicilan ini.'}
              </AppTypography.Text>
            </div>
          </SectionBlock>
        </div>
      ) : null}
    </AppModal>
  );
}
