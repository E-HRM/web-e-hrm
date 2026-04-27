// app/(view)/home/payroll/payroll-karyawan/component_PayrollKaryawan/EditPayrollKaryawanModal.jsx
'use client';

import { useEffect } from 'react';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSelect from '@/app/(view)/component_shared/AppSelect';

import ApprovalStepsSection from './ApprovalStepsSection';
import { EDITABLE_STATUS_PAYROLL_OPTIONS } from '../utils/payrollKaryawanUtils';

const DEFAULT_COMPANY_NAME = 'CV One Step Solution Bali International';

function EditPayrollForm({ vm }) {
  return (
    <div className='space-y-4'>
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

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppInput
          label='Nama Karyawan'
          required
          value={vm.formData.nama_karyawan_snapshot}
          placeholder='Nama karyawan'
          disabled
          inputClassName='!rounded-lg'
        />

        <AppInput
          label='Jenis Hubungan Kerja'
          value={vm.formatJenisHubungan(vm.formData.jenis_hubungan_snapshot)}
          placeholder='Jenis hubungan kerja'
          disabled
          inputClassName='!rounded-lg'
        />

        <AppSelect
          label='Tarif Pajak TER'
          value={vm.formData.id_tarif_pajak_ter || undefined}
          onChange={(value) => vm.handleTarifPajakChange(value)}
          options={vm.tarifPajakOptions}
          placeholder='Pilih tarif TER'
          loading={vm.isTarifPajakLoading}
          disabled={vm.isTarifPajakLoading}
          selectClassName='!rounded-lg'
          hint={vm.tarifPajakSelectionHint}
        />

        <AppInput
          label='Gaji Pokok'
          value={vm.formatCurrency(vm.formData.gaji_pokok_snapshot)}
          placeholder='Gaji pokok snapshot'
          disabled
          inputClassName='!rounded-lg'
        />

        <AppInput
          label='Tunjangan BPJS (Potongan)'
          value={vm.formatCurrency(vm.formData.tunjangan_bpjs_snapshot)}
          placeholder='Tunjangan BPJS snapshot'
          disabled
          inputClassName='!rounded-lg'
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppInput
          label='Departemen'
          value={vm.formData.nama_departement_snapshot}
          placeholder='Departemen'
          disabled
          inputClassName='!rounded-lg'
        />

        <AppInput
          label='Jabatan'
          value={vm.formData.nama_jabatan_snapshot}
          placeholder='Jabatan'
          disabled
          inputClassName='!rounded-lg'
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppInput
          label='Bank'
          value={vm.formData.nama_bank_snapshot}
          placeholder='Diambil dari data karyawan'
          disabled
          inputClassName='!rounded-lg'
        />

        <AppInput
          label='Nomor Rekening'
          value={vm.formData.nomor_rekening_snapshot}
          placeholder='Diambil dari data karyawan'
          disabled
          inputClassName='!rounded-lg'
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppInput
          label='Nomor Slip'
          value={vm.formData.issue_number}
          onChange={(event) => vm.setFormValue('issue_number', event.target.value)}
          placeholder='Nomor slip gaji'
          inputClassName='!rounded-lg'
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
        placeholder='Nama perusahaan pada slip gaji'
        inputClassName='!rounded-lg'
      />

      <ApprovalStepsSection vm={vm} />

      <AppSelect
        label='Status Penggajian'
        value={vm.formData.status_payroll}
        onChange={(value) => vm.setFormValue('status_payroll', value)}
        options={EDITABLE_STATUS_PAYROLL_OPTIONS}
        showSearch={false}
        selectClassName='!rounded-lg'
      />

      <AppInput.TextArea
        label='Catatan'
        value={vm.formData.catatan}
        onChange={(event) => vm.setFormValue('catatan', event.target.value)}
        autoSize={{ minRows: 3, maxRows: 5 }}
        placeholder='Catatan tambahan'
        inputClassName='!rounded-lg'
      />
    </div>
  );
}

export default function EditPayrollKaryawanModal({ vm }) {
  useEffect(() => {
    if (!vm.isEditModalOpen) return;
    if (vm.formData.company_name_snapshot) return;

    vm.setFormValue('company_name_snapshot', DEFAULT_COMPANY_NAME);
  }, [vm.isEditModalOpen, vm.formData.company_name_snapshot, vm.setFormValue]);

  return (
    <AppModal
      open={vm.isEditModalOpen}
      onClose={vm.closeEditModal}
      title='Ubah Penggajian Karyawan'
      footer={null}
      width={720}
    >
      <EditPayrollForm vm={vm} />

      <div className='flex justify-end gap-3 pt-4'>
        <AppButton
          variant='text'
          onClick={vm.closeEditModal}
          className='!text-gray-700 hover:!text-gray-900'
        >
          Batal
        </AppButton>

        <AppButton
          onClick={vm.handleEdit}
          className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
        >
          Simpan Perubahan
        </AppButton>
      </div>
    </AppModal>
  );
}
