'use client';

import { ArrowLeftOutlined, FileTextOutlined, MailOutlined, ReloadOutlined } from '@ant-design/icons';
import { Checkbox } from 'antd';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppEmpty from '@/app/(view)/component_shared/AppEmpty';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
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

          {vm.payrollList.length > 0 ? (
            <AppButton
              variant='primary'
              icon={<MailOutlined />}
              onClick={vm.openBulkEmailModal}
              disabled={!vm.canOpenBulkEmailModal}
              loading={vm.bulkEmailSending}
              className='!rounded-lg'
            >
              Kirim Massal ({vm.bulkEligibleSelectedPayrolls.length})
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
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
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

                <Checkbox
                  checked={vm.allBulkSelectableChecked}
                  indeterminate={vm.selectedPayrollIds.length > 0 && !vm.allBulkSelectableChecked}
                  onChange={(event) => vm.toggleAllPayrollSelection(event.target.checked)}
                  disabled={!vm.payrollList.some((item) => item.has_valid_email) || vm.bulkEmailSending}
                >
                  <span className='text-xs font-semibold text-slate-600'>Semua</span>
                </Checkbox>
              </div>
            </div>

            <div className='divide-y divide-slate-100'>
              {vm.payrollList.map((item) => {
                const isActive = vm.activePayrollId === item.id_payroll_karyawan;

                return (
                  <div
                    key={item.id_payroll_karyawan}
                    className={`flex items-stretch gap-3 transition ${isActive ? 'bg-[#EDF5FF]' : 'bg-white hover:bg-slate-50'}`}
                  >
                    <div className='flex items-center pl-5'>
                      <Checkbox
                        checked={vm.selectedPayrollIdSet.has(item.id_payroll_karyawan)}
                        onChange={(event) => vm.togglePayrollSelection(item.id_payroll_karyawan, event.target.checked)}
                        disabled={!item.has_valid_email || vm.bulkEmailSending}
                        aria-label={`Pilih payslip ${item.nama_karyawan}`}
                      />
                    </div>

                    <button
                      type='button'
                      onClick={() => vm.selectPayroll(item.id_payroll_karyawan)}
                      className='min-w-0 flex-1 bg-transparent py-4 pr-5 text-left'
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
                        className={`mt-1 block truncate ${item.has_valid_email ? 'text-slate-400' : 'text-rose-500'}`}
                      >
                        {item.has_valid_email ? item.email : 'Email belum tersedia atau tidak valid'}
                      </AppTypography.Text>

                      <AppTypography.Text
                        size={12}
                        className='mt-1 block text-slate-400'
                      >
                        {item.issue_number || 'Nomor slip belum tersedia'}
                      </AppTypography.Text>
                    </button>
                  </div>
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

          <AppSelect
            label='CC'
            mode='tags'
            value={vm.emailForm.cc}
            options={vm.ccUserOptions}
            onChange={(value) => vm.updateEmailForm('cc', value)}
            placeholder='Ketik email atau pilih user'
            allowClear
            tokenSeparators={[',', ';', '\n']}
            maxTagCount='responsive'
            maxTagTextLength={36}
            loading={vm.ccUserOptionsLoading}
            hint='Opsional. Ketik email manual atau pilih user dari dropdown.'
            disabled={vm.emailSending}
          />

          <AppInput.TextArea
            label='Pesan tambahan'
            value={vm.emailForm.message}
            onChange={(event) => vm.updateEmailForm('message', event.target.value)}
            placeholder='Tambahkan pesan singkat bila diperlukan.'
            allowClear
            autoSize={{ minRows: 8, maxRows: 12 }}
            disabled={vm.emailSending}
            hint='Opsional. Detail nominal tetap hanya berada di PDF attachment.'
          />
        </div>
      </AppModal>

      <AppModal
        open={vm.bulkEmailModalOpen}
        title='Kirim Payslip Massal'
        subtitle='Hanya payslip yang dicentang akan dikirim ke email karyawan.'
        okText={`Kirim ${vm.bulkEligibleSelectedPayrolls.length} Payslip`}
        cancelText='Batal'
        okLoading={vm.bulkEmailSending}
        okDisabled={!vm.canSendBulkPayslipEmail}
        cancelDisabled={vm.bulkEmailSending}
        onClose={vm.closeBulkEmailModal}
        onOk={vm.sendBulkPayslipEmail}
        width={680}
      >
        <div className='space-y-4'>
          <div className='rounded-lg border border-slate-200 bg-slate-50'>
            <div className='border-b border-slate-200 px-4 py-3'>
              <AppTypography.Text
                size={13}
                weight={800}
                className='block text-slate-900'
              >
                Payslip Dicentang ({vm.bulkEligibleSelectedPayrolls.length})
              </AppTypography.Text>
            </div>

            <div className='max-h-56 overflow-auto divide-y divide-slate-200'>
              {vm.bulkSelectedPayrolls.map((item) => (
                <div
                  key={item.id_payroll_karyawan}
                  className='px-4 py-3'
                >
                  <AppTypography.Text
                    size={13}
                    weight={800}
                    className='block truncate text-slate-900'
                  >
                    {item.nama_karyawan}
                  </AppTypography.Text>

                  <AppTypography.Text
                    size={12}
                    className='mt-1 block text-slate-500'
                  >
                    {item.email_period_label} - {item.has_valid_email ? item.email : 'Email tidak valid'}
                  </AppTypography.Text>
                </div>
              ))}
            </div>
          </div>

          <AppSelect
            label='CC'
            value={vm.bulkEmailForm.cc}
            mode='tags'
            options={vm.ccUserOptions}
            onChange={(value) => vm.updateBulkEmailForm('cc', value)}
            placeholder='Ketik email atau pilih user'
            allowClear
            tokenSeparators={[',', ';', '\n']}
            maxTagCount='responsive'
            maxTagTextLength={36}
            loading={vm.ccUserOptionsLoading}
            hint='Opsional. Ketik email manual atau pilih user dari dropdown.'
            disabled={vm.bulkEmailSending}
          />

          <AppInput.TextArea
            label='Template pesan'
            value={vm.bulkEmailForm.message}
            onChange={(event) => vm.updateBulkEmailForm('message', event.target.value)}
            allowClear
            autoSize={{ minRows: 8, maxRows: 12 }}
            disabled={vm.bulkEmailSending}
            hint='[Employee Name] dan [Month Year] akan otomatis diganti untuk masing-masing penerima.'
          />
        </div>
      </AppModal>
    </div>
  );
}
