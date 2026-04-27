// app/(view)/home/payroll/payroll-karyawan/item-komponen/component_ItemKomponenPayroll/ItemKomponenPayrollFormModal.jsx
'use client';

import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

const formatRupiahInput = (value) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const stringValue = String(value).replace(/[^\d.]/g, '');
  const [integerPart, decimalPart] = stringValue.split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (decimalPart !== undefined) {
    return `Rp ${formattedInteger},${decimalPart}`;
  }

  return `Rp ${formattedInteger}`;
};

const parseRupiahInput = (value) => {
  if (!value) {
    return '';
  }

  return String(value)
    .replace(/Rp\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.]/g, '');
};

function ItemKomponenForm({ vm }) {
  const manualDisabled = vm.isUsingDefinition;

  return (
    <div className='space-y-4'>
      <AppSelect
        label='Gunakan Rincian Standar'
        value={vm.formData.id_definisi_komponen_payroll || undefined}
        onChange={(value) => vm.handleDefinitionChange(value ?? null)}
        options={vm.definitionsOptions}
        placeholder='Pilih rincian standar (opsional)'
        allowClear
        loading={vm.isDefinisiLoading}
        selectClassName='!rounded-lg'
      />

      {vm.isUsingDefinition ? (
        <div className='rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3'>
          <AppTypography.Text
            size={12}
            weight={600}
            className='block text-blue-700'
          >
            Data rincian mengikuti pilihan standar
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='block text-blue-600 mt-1'
          >
            Nama, jenis, dan kategori akan otomatis mengikuti rincian standar yang dipilih.
          </AppTypography.Text>
        </div>
      ) : null}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppInput
          label='Nama Rincian'
          required={!vm.isUsingDefinition}
          value={vm.formData.nama_komponen}
          onChange={(event) => vm.setFormValue('nama_komponen', event.target.value)}
          placeholder='Contoh: Bonus Kehadiran'
          disabled={manualDisabled}
          inputClassName='!rounded-lg'
        />

        <AppInput.Number
          label='Nominal'
          required
          min={0}
          precision={2}
          value={vm.formData.nominal}
          onChange={(value) => vm.setFormValue('nominal', value ?? 0)}
          formatter={formatRupiahInput}
          parser={parseRupiahInput}
          placeholder='Rp 0'
          inputClassName='!rounded-lg !w-full'
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppSelect
          label='Jenis Rincian'
          required={!vm.isUsingDefinition}
          value={vm.formData.tipe_komponen || undefined}
          onChange={(value) => vm.setFormValue('tipe_komponen', value)}
          options={vm.tipeKomponenOptions}
          placeholder='Pilih jenis rincian'
          disabled={manualDisabled}
          loading={vm.isTipeKomponenLoading}
          showSearch
          selectClassName='!rounded-lg'
        />

        <AppSelect
          label='Masuk Sebagai'
          required={!vm.isUsingDefinition}
          value={vm.formData.arah_komponen}
          onChange={(value) => vm.setFormValue('arah_komponen', value)}
          options={vm.arahKomponenOptions}
          placeholder='Pilih pemasukan atau potongan'
          disabled={manualDisabled}
          showSearch={false}
          selectClassName='!rounded-lg'
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppInput.Number
          label='Urutan Tampil'
          min={0}
          precision={0}
          value={vm.formData.urutan_tampil}
          onChange={(value) => vm.setFormValue('urutan_tampil', value ?? 0)}
          placeholder='0'
          inputClassName='!rounded-lg'
        />
      </div>

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

export default function ItemKomponenPayrollFormModal({ vm }) {
  return (
    <AppModal
      open={vm.isFormModalOpen}
      onClose={vm.closeFormModal}
      title={vm.isEditMode ? 'Ubah Rincian Gaji' : 'Tambah Rincian Gaji'}
      subtitle='Perubahan rincian akan langsung memperbarui ringkasan gaji karyawan.'
      okText={vm.isEditMode ? 'Simpan Perubahan' : 'Simpan'}
      onOk={vm.handleSubmit}
      closeOnOk={false}
      okLoading={vm.isSubmitting}
      okDisabled={vm.isReadonly}
      width={760}
    >
      <ItemKomponenForm vm={vm} />
    </AppModal>
  );
}
