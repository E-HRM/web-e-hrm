import AppButton from '@/app/(view)/component_shared/AppButton';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppSwitch from '@/app/(view)/component_shared/AppSwitch';

import { buildUserSelectOptions, filterUserOption } from '../utils/userSelectOptions';

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

export default function CreateModalSection({ vm }) {
  const userOptions = buildUserSelectOptions(vm.availableUsers, vm);

  return (
    <AppModal
      open={vm.isCreateModalOpen}
      onClose={vm.closeCreateModal}
      title='Tambah Profil Payroll Baru'
      footer={null}
      width={680}
    >
      <div className='space-y-4'>
        <AppSelect
          label='Karyawan'
          required
          value={vm.formData.id_user || undefined}
          onChange={(value) => vm.setFormValue('id_user', value || '')}
          options={userOptions}
          placeholder='Pilih karyawan'
          loading={vm.loadingUsers}
          disabled={vm.isSubmitting || vm.loadingUsers}
          filterOption={filterUserOption}
          optionFilterProp='searchText'
          optionLabelProp='plainLabel'
          selectClassName='!rounded-lg'
          hint={userOptions.length === 0 ? 'Semua karyawan aktif sudah memiliki profil payroll.' : 'Cari berdasarkan nama, NIK, email, atau jabatan.'}
        />

        <AppSelect
          label='Jenis Hubungan Kerja'
          required
          value={vm.formData.jenis_hubungan_kerja}
          onChange={(value) => vm.setFormValue('jenis_hubungan_kerja', value)}
          options={vm.jenisHubunganOptions}
          placeholder='Pilih jenis hubungan kerja'
          disabled={vm.isSubmitting}
          selectClassName='!rounded-lg'
        />

        <AppInput.Number
          label='Gaji Pokok'
          required
          min={0}
          step={0.01}
          precision={2}
          value={vm.formData.gaji_pokok}
          onChange={(value) => vm.setFormValue('gaji_pokok', value)}
          formatter={formatRupiahInput}
          parser={parseRupiahInput}
          inputClassName='!rounded-lg !w-full'
          disabled={vm.isSubmitting}
          placeholder='Rp 0'
          hint='Nilai ini akan menjadi default gaji pokok saat payroll karyawan dibuat.'
        />

        <AppInput.Number
          label='Tunjangan BPJS'
          required
          min={0}
          step={0.01}
          precision={2}
          value={vm.formData.tunjangan_bpjs}
          onChange={(value) => vm.setFormValue('tunjangan_bpjs', value)}
          formatter={formatRupiahInput}
          parser={parseRupiahInput}
          inputClassName='!rounded-lg !w-full'
          disabled={vm.isSubmitting}
          placeholder='Rp 0'
          hint='Nilai ini akan menjadi default potongan BPJS saat payroll karyawan dibuat.'
        />

        <AppInput
          label='Tanggal Mulai Payroll'
          type='date'
          value={vm.formData.tanggal_mulai_payroll}
          onChange={(e) => vm.setFormValue('tanggal_mulai_payroll', e.target.value)}
          inputClassName='!rounded-lg'
          disabled={vm.isSubmitting}
        />

        <AppSwitch
          label='Payroll Aktif'
          checked={Boolean(vm.formData.payroll_aktif)}
          onChange={(checked) => vm.setFormValue('payroll_aktif', checked)}
          showStateLabel={false}
          tone='primary'
          disabled={vm.isSubmitting}
        />

        <AppInput.TextArea
          label='Catatan'
          value={vm.formData.catatan}
          onChange={(e) => vm.setFormValue('catatan', e.target.value)}
          placeholder='Catatan tambahan (opsional)'
          autoSize={{ minRows: 3, maxRows: 5 }}
          inputClassName='!rounded-lg'
          disabled={vm.isSubmitting}
        />
      </div>

      <div className='flex gap-3 pt-4'>
        <AppButton
          onClick={vm.handleCreate}
          loading={vm.isSubmitting}
          className='!flex-1 !rounded-lg !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
        >
          Simpan
        </AppButton>

        <AppButton
          onClick={vm.closeCreateModal}
          variant='secondary'
          disabled={vm.isSubmitting}
          className='!flex-1 !rounded-lg !h-10 !bg-gray-100 hover:!bg-gray-200 !border-gray-100 hover:!border-gray-200 !text-gray-700'
        >
          Batal
        </AppButton>
      </div>
    </AppModal>
  );
}
