// app/(view)/home/payroll/manajemen-karyawan/profile-payroll/component_profile_payroll/ProfilFormFields.jsx

import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppSwitch from '@/app/(view)/component_shared/AppSwitch';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import EmptyValue from './EmptyValue';
import UserMeta from './UserMeta';
import { buildUserSelectOptions, filterUserOption } from '../utils/userSelectOptions';

export default function ProfilFormFields({ vm, formData, setFormValue, jenisHubunganOptions, tarifPajakOptions, mode, disabled = false, loadingUsers = false, loadingTarifPajak = false }) {
  const isCreateMode = mode === 'create';
  const userOptions = buildUserSelectOptions(vm.availableUsers, vm);

  return (
    <div className='space-y-4'>
      {isCreateMode ? (
        <AppSelect
          label='Karyawan'
          required
          value={formData.id_user || undefined}
          onChange={(value) => setFormValue('id_user', value || '')}
          options={userOptions}
          placeholder='Pilih karyawan'
          loading={loadingUsers}
          disabled={disabled || loadingUsers}
          filterOption={filterUserOption}
          optionFilterProp='searchText'
          optionLabelProp='plainLabel'
          selectClassName='!rounded-lg'
          hint={userOptions.length === 0 ? 'Semua karyawan aktif sudah memiliki profil payroll.' : 'Cari berdasarkan nama, NIK, email, atau jabatan.'}
        />
      ) : (
        <div>
          <AppTypography.Text
            size={12}
            weight={600}
            className='block text-gray-700 mb-1.5'
          >
            Karyawan
          </AppTypography.Text>

          {vm.selectedFormUser ? (
            <UserMeta
              user={vm.selectedFormUser}
              vm={vm}
            />
          ) : (
            <div className='rounded-xl border border-dashed border-gray-200 p-4 bg-gray-50'>
              <EmptyValue>Data karyawan tidak ditemukan.</EmptyValue>
            </div>
          )}
        </div>
      )}

      <AppSelect
        label='Jenis Hubungan Kerja'
        required
        value={formData.jenis_hubungan_kerja}
        onChange={(value) => setFormValue('jenis_hubungan_kerja', value)}
        options={jenisHubunganOptions}
        placeholder='Pilih jenis hubungan kerja'
        disabled={disabled}
        selectClassName='!rounded-lg'
      />

      <AppSelect
        label='Tarif Pajak TER'
        required
        value={formData.id_tarif_pajak_ter || undefined}
        onChange={(value) => setFormValue('id_tarif_pajak_ter', value || '')}
        options={tarifPajakOptions}
        placeholder='Pilih tarif pajak TER'
        disabled={disabled || loadingTarifPajak}
        loading={loadingTarifPajak}
        selectClassName='!rounded-lg'
        hint={tarifPajakOptions.length === 0 ? 'Belum ada tarif pajak TER aktif. Lengkapi master tarif terlebih dahulu.' : 'Pilih tarif pajak TER sesuai kategori dan rentang penghasilan yang berlaku.'}
      />

      <AppInput
        label='Gaji Pokok'
        required
        type='number'
        min='0'
        step='0.01'
        value={formData.gaji_pokok}
        onChange={(e) => setFormValue('gaji_pokok', e.target.value)}
        inputClassName='!rounded-lg'
        disabled={disabled}
        placeholder='Masukkan gaji pokok'
        hint='Nilai ini akan menjadi default gaji pokok saat payroll karyawan dibuat.'
      />

      <AppInput
        label='Tanggal Mulai Payroll'
        type='date'
        value={formData.tanggal_mulai_payroll}
        onChange={(e) => setFormValue('tanggal_mulai_payroll', e.target.value)}
        inputClassName='!rounded-lg'
        disabled={disabled}
      />

      <AppSwitch
        label='Payroll Aktif'
        checked={Boolean(formData.payroll_aktif)}
        onChange={(checked) => setFormValue('payroll_aktif', checked)}
        showStateLabel={false}
        tone='primary'
        disabled={disabled}
      />

      <AppInput.TextArea
        label='Catatan'
        value={formData.catatan}
        onChange={(e) => setFormValue('catatan', e.target.value)}
        placeholder='Catatan tambahan (opsional)'
        autoSize={{ minRows: 3, maxRows: 5 }}
        inputClassName='!rounded-lg'
        disabled={disabled}
      />
    </div>
  );
}
