// app/(view)/home/payroll/payroll-karyawan/component_PayrollKaryawan/CreatePayrollKaryawanModal.jsx
'use client';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import ApprovalStepsSection from './ApprovalStepsSection';
import { STATUS_PAYROLL_OPTIONS } from '../utils/payrollKaryawanUtils';

function CreatePayrollForm({ vm }) {
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppSelect
          label='Periode Penggajian'
          required
          value={vm.formData.id_periode_payroll}
          onChange={(value) => vm.setFormValue('id_periode_payroll', value)}
          options={vm.periodeOptions}
          placeholder='Pilih Periode'
          showSearch={false}
          selectClassName='!rounded-lg'
        />

        <AppSelect
          label='Nama Karyawan'
          required
          value={vm.formData.id_user || undefined}
          onChange={(value) => vm.handleEmployeeChange(value)}
          options={vm.employeeOptions}
          placeholder='Pilih karyawan'
          allowClear
          filterOption={vm.filterEmployeeOption}
          optionFilterProp='searchText'
          optionLabelProp='plainLabel'
          selectClassName='!rounded-lg'
          hint={vm.employeeSelectionHint}
        />
      </div>

      {vm.formData.id_user ? (
        <div className='rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3'>
          <AppTypography.Text
            size={12}
            weight={700}
            className='block text-blue-800'
          >
            Data penggajian karyawan diambil dari profil penggajian aktif
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='block text-blue-700 mt-1'
          >
            Jenis hubungan kerja: {vm.formatJenisHubungan(vm.formData.jenis_hubungan_snapshot)}. Tarif TER: {vm.selectedEmployeeTarifLabel}.
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='block text-blue-700 mt-1'
          >
            Gaji pokok awal: {vm.formatCurrency(vm.formData.total_pendapatan_tetap)}.
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='block text-blue-700 mt-1'
          >
            Data bank otomatis diambil dari data karyawan. Nilai akhir gaji dapat berubah sesuai rincian gaji, pembayaran konsultan, dan cicilan yang masuk ke penggajian ini.
          </AppTypography.Text>
        </div>
      ) : null}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppInput
          label='Departemen'
          value={vm.formData.nama_departement_snapshot}
          placeholder='Akan terisi otomatis'
          disabled
          inputClassName='!rounded-lg'
        />

        <AppInput
          label='Jabatan'
          value={vm.formData.nama_jabatan_snapshot}
          placeholder='Akan terisi otomatis'
          disabled
          inputClassName='!rounded-lg'
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppInput
          label='Jenis Hubungan Kerja'
          value={vm.formatJenisHubungan(vm.formData.jenis_hubungan_snapshot)}
          placeholder='Akan terisi otomatis'
          disabled
          inputClassName='!rounded-lg'
        />

        <AppInput
          label='Tarif Pajak TER'
          value={vm.selectedEmployeeTarifLabel === '-' ? '' : vm.selectedEmployeeTarifLabel}
          placeholder='Akan terisi otomatis'
          disabled
          inputClassName='!rounded-lg'
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppInput
          label='Bank'
          value={vm.formData.nama_bank_snapshot}
          placeholder='Diambil otomatis dari data karyawan'
          disabled
          inputClassName='!rounded-lg'
        />

        <AppInput
          label='Nomor Rekening'
          value={vm.formData.nomor_rekening_snapshot}
          placeholder='Diambil otomatis dari data karyawan'
          disabled
          inputClassName='!rounded-lg'
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppInput
          label='Nomor Slip'
          value={vm.formData.issue_number}
          onChange={(event) => vm.setFormValue('issue_number', event.target.value)}
          placeholder='Contoh: PAY-APR-2026-001'
          inputClassName='!rounded-lg'
          hint='Nomor ini akan tampil pada slip gaji.'
        />

        <AppInput
          label='Tanggal Slip'
          type='datetime-local'
          value={vm.formData.issued_at}
          onChange={(event) => vm.setFormValue('issued_at', event.target.value)}
          inputClassName='!rounded-lg'
        />
      </div>

      <AppInput
        label='Nama Perusahaan'
        value={vm.formData.company_name_snapshot}
        onChange={(event) => vm.setFormValue('company_name_snapshot', event.target.value)}
        placeholder='Contoh: One Step Solution (OSS) Bali'
        inputClassName='!rounded-lg'
        hint='Nama ini akan tampil pada slip gaji.'
      />

      <ApprovalStepsSection vm={vm} />

      <AppSelect
        label='Status Penggajian'
        value={vm.formData.status_payroll}
        onChange={(value) => vm.setFormValue('status_payroll', value)}
        options={STATUS_PAYROLL_OPTIONS}
        showSearch={false}
        selectClassName='!rounded-lg'
      />

      <AppInput.TextArea
        label='Catatan'
        value={vm.formData.catatan}
        onChange={(event) => vm.setFormValue('catatan', event.target.value)}
        autoSize={{ minRows: 3, maxRows: 5 }}
        placeholder='Catatan tambahan (opsional)'
        inputClassName='!rounded-lg'
      />
    </div>
  );
}

export default function CreatePayrollKaryawanModal({ vm }) {
  return (
    <AppModal
      open={vm.isCreateModalOpen}
      onClose={vm.closeCreateModal}
      title='Tambah Penggajian Karyawan'
      footer={null}
      width={760}
    >
      <CreatePayrollForm vm={vm} />

      <div className='flex justify-end gap-3 pt-4'>
        <AppButton
          variant='text'
          onClick={vm.closeCreateModal}
          className='!text-gray-700 hover:!text-gray-900'
        >
          Batal
        </AppButton>

        <AppButton
          onClick={vm.handleCreate}
          className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
        >
          Simpan
        </AppButton>
      </div>
    </AppModal>
  );
}
