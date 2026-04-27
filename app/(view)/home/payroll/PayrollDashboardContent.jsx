// app/(view)/home/payroll/PayrollDashboardContent.jsx
'use client';

import { CalendarOutlined, CheckCircleOutlined, DollarCircleOutlined, FileTextOutlined, InfoCircleOutlined, ReloadOutlined, RiseOutlined, TeamOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import usePayrollDashboardViewModel from './usePayrollDashboardViewModel';

function SectionLink({ href, children }) {
  return (
    <AppButton
      variant='link'
      href={href}
      className='!p-0 !h-auto !text-sm !font-medium !text-blue-600 hover:!text-blue-700'
    >
      {children}
    </AppButton>
  );
}

function DetailIconButton({ href, label }) {
  return (
    <AppButton
      variant='text'
      href={href}
      shape='circle'
      size='middle'
      aria-label={label}
      className='!text-blue-600 hover:!text-blue-700'
      icon={<FileTextOutlined />}
    />
  );
}

function StatCard({ icon, iconWrapClassName, iconClassName, cornerLabel, value, label }) {
  return (
    <AppCard
      rounded='xl'
      shadow='none'
      ring={false}
      className='border border-gray-200'
      bodyStyle={{ padding: 24 }}
    >
      <div className='flex items-center justify-between mb-4'>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconWrapClassName}`}>
          <span className={iconClassName}>{icon}</span>
        </div>
        <AppTypography.Text
          size={14}
          className='text-gray-500'
        >
          {cornerLabel}
        </AppTypography.Text>
      </div>

      <AppTypography.Text
        size={30}
        weight={700}
        className='block text-gray-900 mb-1'
      >
        {value}
      </AppTypography.Text>

      <AppTypography.Text
        size={14}
        className='text-gray-600'
      >
        {label}
      </AppTypography.Text>
    </AppCard>
  );
}

export default function PayrollDashboardContent() {
  const vm = usePayrollDashboardViewModel();
  const payrollStatusDenominator = vm.totalPayrollKaryawan || vm.totalKaryawan;

  if (vm.loading) {
    return (
      <div className='p-8'>
        <AppCard
          rounded='xl'
          shadow='none'
          ring={false}
          className='border border-gray-200'
          bodyStyle={{ padding: 24 }}
        >
          <AppTypography.Text
            size={14}
            className='text-gray-600'
          >
            Memuat data dashboard payroll...
          </AppTypography.Text>
        </AppCard>
      </div>
    );
  }

  if (vm.error) {
    return (
      <div className='p-8'>
        <AppCard
          rounded='xl'
          shadow='none'
          ring={false}
          className='border border-red-200 bg-red-50'
          bodyStyle={{ padding: 24 }}
        >
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <AppTypography.Text
                size={16}
                weight={600}
                className='block text-red-900'
              >
                Data dashboard payroll gagal dimuat.
              </AppTypography.Text>

              <AppTypography.Text
                size={14}
                className='block mt-1 text-red-700'
              >
                {vm.error?.message || 'Silakan coba muat ulang data.'}
              </AppTypography.Text>
            </div>

            <AppButton
              variant='primary'
              icon={<ReloadOutlined />}
              onClick={() => vm.reloadData()}
              loading={vm.refreshing}
            >
              Muat Ulang
            </AppButton>
          </div>
        </AppCard>
      </div>
    );
  }

  if (!vm.currentPeriod) {
    return (
      <div className='p-8'>
        <AppCard
          rounded='xl'
          shadow='none'
          ring={false}
          className='border border-gray-200'
          bodyStyle={{ padding: 24 }}
        >
          <AppTypography.Text
            size={14}
            className='text-gray-600'
          >
            Data periode payroll belum tersedia. Buat periode payroll terlebih dahulu agar dashboard dapat menampilkan ringkasan penggajian.
          </AppTypography.Text>
        </AppCard>
      </div>
    );
  }

  return (
    <div className='p-8'>
      <div className='mb-8'>
        <AppTypography.Text
          size={30}
          weight={700}
          className='block text-gray-900'
        >
          Dashboard Payroll
        </AppTypography.Text>

        <AppTypography.Text
          size={14}
          className='block mt-1 text-gray-600'
        >
          Periode Aktif: {vm.formatBulan(vm.currentPeriod.bulan)} {vm.currentPeriod.tahun}
        </AppTypography.Text>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <StatCard
          icon={<TeamOutlined />}
          iconWrapClassName='bg-blue-100'
          iconClassName='text-blue-600 text-2xl'
          cornerLabel='Total'
          value={vm.totalKaryawan}
          label='Karyawan Aktif'
        />

        <StatCard
          icon={<DollarCircleOutlined />}
          iconWrapClassName='bg-green-100'
          iconClassName='text-green-600 text-2xl'
          cornerLabel='Bulan Ini'
          value={vm.formatCompactCurrency(vm.totalDibayarkan)}
          label='Total Payroll'
        />

        <StatCard
          icon={<CheckCircleOutlined />}
          iconWrapClassName='bg-purple-100'
          iconClassName='text-purple-600 text-2xl'
          cornerLabel='Status'
          value={`${vm.payrollDibayar}/${payrollStatusDenominator}`}
          label='Payroll Dibayar'
        />

        <StatCard
          icon={<RiseOutlined />}
          iconWrapClassName='bg-orange-100'
          iconClassName='text-orange-600 text-2xl'
          cornerLabel='Aktif'
          value={vm.pinjamanAktif}
          label='Pinjaman Berjalan'
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
        <AppCard
          rounded='xl'
          shadow='none'
          ring={false}
          className='border border-gray-200'
          bodyStyle={{ padding: 24 }}
        >
          <div className='flex items-center justify-between mb-6'>
            <AppTypography.Text
              size={18}
              weight={600}
              className='text-gray-900'
            >
              Periode Payroll Terbaru
            </AppTypography.Text>

            <SectionLink href='/home/payroll/payslip'>Lihat Semua</SectionLink>
          </div>

          <div className='space-y-4'>
            {vm.periodeList.slice(0, 3).length === 0 ? (
              <div className='p-4 bg-gray-50 rounded-lg'>
                <AppTypography.Text
                  size={14}
                  className='text-gray-500'
                >
                  Belum ada periode payroll.
                </AppTypography.Text>
              </div>
            ) : null}

            {vm.periodeList.slice(0, 3).map((periode) => {
              const statusFormat = vm.formatStatusPeriode(periode.status_periode);

              return (
                <div
                  key={periode.id_periode_payroll}
                  className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                >
                  <div className='flex items-center gap-4 min-w-0'>
                    <div className='w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200 shrink-0'>
                      <CalendarOutlined className='text-gray-600 text-lg' />
                    </div>

                    <div className='min-w-0'>
                      <AppTypography.Text
                        size={15}
                        weight={600}
                        className='block text-gray-900'
                      >
                        {vm.formatBulan(periode.bulan)} {periode.tahun}
                      </AppTypography.Text>

                      <AppTypography.Text
                        size={13}
                        className='block text-gray-500'
                      >
                        {periode.tanggal_mulai} - {periode.tanggal_selesai}
                      </AppTypography.Text>
                    </div>
                  </div>

                  <div className='flex items-center gap-3 shrink-0'>
                    <AppTag
                      tone={statusFormat.tone}
                      variant='soft'
                      size='sm'
                      className='!font-medium'
                    >
                      {statusFormat.label}
                    </AppTag>

                    <DetailIconButton
                      href={`/home/payroll/payslip?periode=${periode.id_periode_payroll}`}
                      label={`Lihat periode ${vm.formatBulan(periode.bulan)} ${periode.tahun}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </AppCard>

        <AppCard
          rounded='xl'
          shadow='none'
          ring={false}
          className='border border-gray-200'
          bodyStyle={{ padding: 24 }}
        >
          <div className='flex items-center justify-between mb-6'>
            <AppTypography.Text
              size={18}
              weight={600}
              className='text-gray-900'
            >
              Status Payroll Karyawan
            </AppTypography.Text>

            <SectionLink href={`/home/payroll/payslip?periode=${vm.currentPeriod.id_periode_payroll}`}>Lihat Detail</SectionLink>
          </div>

          <div className='space-y-4'>
            {vm.payrollList.length === 0 ? (
              <div className='p-4 bg-gray-50 rounded-lg'>
                <AppTypography.Text
                  size={14}
                  className='text-gray-500'
                >
                  Belum ada data payroll karyawan untuk periode ini.
                </AppTypography.Text>
              </div>
            ) : null}

            {vm.payrollList.map((payroll) => {
              const statusFormat = vm.formatStatusPayroll(payroll.status_payroll);

              return (
                <div
                  key={payroll.id_payroll_karyawan}
                  className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                >
                  <div className='flex items-center gap-4 min-w-0'>
                    <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold shrink-0'>{payroll.nama_karyawan_snapshot.charAt(0)}</div>

                    <div className='min-w-0'>
                      <AppTypography.Text
                        size={15}
                        weight={600}
                        className='block text-gray-900 truncate'
                      >
                        {payroll.nama_karyawan_snapshot}
                      </AppTypography.Text>

                      <AppTypography.Text
                        size={13}
                        className='block text-gray-500 truncate'
                      >
                        {payroll.nama_jabatan_snapshot}
                      </AppTypography.Text>
                    </div>
                  </div>

                  <div className='flex items-center gap-3 shrink-0'>
                    <div className='text-right'>
                      <AppTypography.Text
                        size={15}
                        weight={600}
                        className='block text-gray-900'
                      >
                        {vm.formatCurrency(payroll.total_dibayarkan)}
                      </AppTypography.Text>

                      <AppTag
                        tone={statusFormat.tone}
                        variant='soft'
                        size='sm'
                        className='!font-medium'
                      >
                        {statusFormat.label}
                      </AppTag>
                    </div>

                    <DetailIconButton
                      href={`/home/payroll/payslip?payroll=${payroll.id_payroll_karyawan}`}
                      label={`Lihat slip gaji ${payroll.nama_karyawan_snapshot}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </AppCard>
      </div>

      <AppCard
        rounded='xl'
        shadow='none'
        ring={false}
        className='bg-blue-50 border border-blue-200'
        bodyStyle={{ padding: 24 }}
      >
        <div className='flex gap-4'>
          <InfoCircleOutlined className='text-blue-600 text-2xl flex-shrink-0 mt-0.5' />

          <div>
            <AppTypography.Text
              size={16}
              weight={600}
              className='block text-blue-900 mb-1'
            >
              Informasi Periode Aktif
            </AppTypography.Text>

            <AppTypography.Text
              size={14}
              className='block text-blue-800 leading-relaxed'
            >
              Periode {vm.formatBulan(vm.currentPeriod.bulan)} {vm.currentPeriod.tahun} saat ini dalam status <strong>{vm.formatStatusPeriode(vm.currentPeriod.status_periode).label}</strong>. Terdapat {vm.payrollDraft} payroll yang masih berstatus DRAFT. Silakan review
              dan finalisasi sebelum tanggal {vm.currentPeriod.tanggal_selesai}.
            </AppTypography.Text>
          </div>
        </div>
      </AppCard>
    </div>
  );
}
