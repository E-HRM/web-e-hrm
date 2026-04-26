'use client';

import { ArrowLeftOutlined, FileTextOutlined, MailOutlined, ReloadOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import usePayslipViewModel from './usePayslipViewModel';

export default function PayslipContent() {
  const vm = usePayslipViewModel();

  if (!vm.hasFilters) {
    return (
      <div className='p-6 md:p-8'>
        <AppEmpty.Card
          title='Slip payroll belum dipilih'
          description='Buka halaman ini dari daftar payroll karyawan atau dari periode payroll agar slip yang ingin dipreview bisa diketahui.'
          action={
            <AppButton
              variant='outline'
              href='/home/payroll/penggajian/payroll-karyawan'
              className='!rounded-lg'
            >
              Buka Payroll Karyawan
            </AppButton>
          }
        />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-100 p-6 md:p-8'>
      <div className='mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div>
          <AppTypography.Title
            level={2}
            className='!mb-1 !text-slate-900'
          >
            Payslip Payroll
          </AppTypography.Title>

          <AppTypography.Text
            size={15}
            className='text-slate-600'
          >
            Preview tunggal memakai PDF hasil akhir, yaitu template payslip dan data payroll yang sudah digabung dalam satu file.
          </AppTypography.Text>
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <AppButton
            variant='outline'
            href={vm.backHref}
            icon={<ArrowLeftOutlined />}
            className='!rounded-lg'
          >
            Kembali
          </AppButton>

          <AppButton
            variant='outline'
            onClick={vm.reloadData}
            loading={vm.validating || vm.pdfPreviewLoading}
            icon={<ReloadOutlined />}
            className='!rounded-lg'
          >
            Muat Ulang
          </AppButton>

          {vm.slip ? (
            <AppButton
              variant='outline'
              href={vm.buildItemKomponenHref(vm.slip.payroll)}
              icon={<FileTextOutlined />}
              className='!rounded-lg'
            >
              Item Komponen
            </AppButton>
          ) : null}

          {vm.pdfPreviewUrl ? (
            <AppButton
              variant='outline'
              icon={<FileTextOutlined />}
              onClick={vm.openPdfPreview}
              className='!rounded-lg'
            >
              Buka PDF
            </AppButton>
          ) : null}

          {vm.slip ? (
            <AppButton
              variant='primary'
              icon={<MailOutlined />}
              onClick={vm.openEmailModal}
              disabled={!vm.canSendPayslipEmail}
              loading={vm.emailSending}
              className='!rounded-lg'
            >
              Kirim Payslip
            </AppButton>
          ) : null}
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${vm.payrollList.length > 0 ? 'xl:grid-cols-[320px_minmax(0,1fr)]' : ''}`}>
        {vm.payrollList.length > 0 ? (
          <AppCard
            rounded='xl'
            ring={false}
            shadow='none'
            className='border border-slate-200'
            bodyStyle={{ padding: 0 }}
          >
            <div className='border-b border-slate-200 px-5 py-4'>
              <AppTypography.Text
                size={15}
                weight={800}
                className='block text-slate-900'
              >
                Slip Per Periode
              </AppTypography.Text>

              <AppTypography.Text
                size={12}
                className='mt-1 block text-slate-500'
              >
                Pilih payroll untuk melihat satu preview PDF hasil gabungan template dan data.
              </AppTypography.Text>
            </div>

            <div className='divide-y divide-slate-100'>
              {vm.payrollList.map((item) => {
                const isActive = vm.activePayrollId === item.id_payroll_karyawan;

                return (
                  <button
                    key={item.id_payroll_karyawan}
                    type='button'
                    onClick={() => vm.selectPayroll(item.id_payroll_karyawan)}
                    className={`w-full px-5 py-4 text-left transition ${isActive ? 'bg-[#EDF5FF]' : 'bg-white hover:bg-slate-50'}`}
                  >
                    <AppTypography.Text
                      size={14}
                      weight={800}
                      className='block truncate text-slate-900'
                    >
                      {item.nama_karyawan}
                    </AppTypography.Text>

                    <AppTypography.Text
                      size={12}
                      className='mt-1 block text-slate-500'
                    >
                      {item.period_label}
                    </AppTypography.Text>

                    <AppTypography.Text
                      size={12}
                      className='mt-1 block text-slate-400'
                    >
                      {item.issue_number || 'Nomor slip belum tersedia'}
                    </AppTypography.Text>
                  </button>
                );
              })}
            </div>
          </AppCard>
        ) : null}

        <div className='min-w-0'>
          {vm.loading && !vm.slip ? (
            <AppCard
              rounded='xl'
              ring={false}
              shadow='none'
              className='border border-slate-200'
              bodyStyle={{ padding: 24 }}
            >
              <AppTypography.Text
                size={14}
                className='text-slate-600'
              >
                Menyiapkan data slip payroll...
              </AppTypography.Text>
            </AppCard>
          ) : null}

          {!vm.loading && vm.pdfPreviewLoading ? (
            <AppCard
              rounded='xl'
              ring={false}
              shadow='none'
              className='border border-slate-200'
              bodyStyle={{ padding: 24 }}
            >
              <AppTypography.Text
                size={14}
                className='text-slate-600'
              >
                Menyusun preview PDF slip payroll...
              </AppTypography.Text>
            </AppCard>
          ) : null}

          {!vm.pdfPreviewLoading && vm.pdfPreviewError ? (
            <AppEmpty.Card
              title='Preview PDF tidak tersedia'
              description={vm.pdfPreviewError}
            />
          ) : null}

          {vm.pdfPreviewUrl ? (
            <AppCard
              rounded='xl'
              ring={false}
              shadow='none'
              className='overflow-hidden border border-slate-200'
              bodyStyle={{ padding: 0 }}
            >
              <div className='border-b border-slate-200 px-5 py-4'>
                <AppTypography.Text
                  size={15}
                  weight={800}
                  className='block text-slate-900'
                >
                  Preview PDF Final
                </AppTypography.Text>

                <AppTypography.Text
                  size={12}
                  className='mt-1 block text-slate-500'
                >
                  File ini sudah menggabungkan template periode aktif dan data slip payroll dalam satu preview.
                </AppTypography.Text>
              </div>

              <iframe
                title='Slip Payroll PDF'
                src={vm.pdfPreviewUrl}
                className='h-[85vh] min-h-[760px] w-full border-0 bg-white'
              />
            </AppCard>
          ) : null}

          {!vm.loading && !vm.pdfPreviewLoading && !vm.pdfPreviewError && !vm.pdfPreviewUrl ? (
            <AppEmpty.Card
              title='Preview PDF belum tersedia'
              description='Slip payroll untuk data yang dipilih belum berhasil dirender menjadi PDF.'
            />
          ) : null}
        </div>
      </div>

      <AppModal
        open={vm.emailModalOpen}
        title='Kirim Payslip'
        subtitle='Payslip akan dikirim ke email karyawan sebagai PDF attachment.'
        okText='Kirim Payslip'
        cancelText='Batal'
        okLoading={vm.emailSending}
        okDisabled={!vm.canSendPayslipEmail}
        cancelDisabled={vm.emailSending}
        onClose={vm.closeEmailModal}
        onOk={vm.sendPayslipEmail}
        width={560}
      >
        <div className='space-y-4'>
          <AppInput
            label='To'
            value={vm.payslipEmailTo || '-'}
            disabled
            hint='Penerima utama otomatis memakai email karyawan dari data user.'
          />

          <AppInput
            label='CC'
            value={vm.emailForm.cc}
            onChange={(event) => vm.updateEmailForm('cc', event.target.value)}
            placeholder='contoh: hrd@company.com, direktur@company.com'
            allowClear
            hint='Opsional. Pisahkan beberapa email dengan koma, titik koma, atau baris baru.'
            disabled={vm.emailSending}
          />

          <AppInput.TextArea
            label='Pesan tambahan'
            value={vm.emailForm.message}
            onChange={(event) => vm.updateEmailForm('message', event.target.value)}
            placeholder='Tambahkan pesan singkat bila diperlukan.'
            allowClear
            autoSize={{ minRows: 4, maxRows: 7 }}
            disabled={vm.emailSending}
            hint='Opsional. Detail nominal tetap hanya berada di PDF attachment.'
          />
        </div>
      </AppModal>
    </div>
  );
}
