'use client';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

function PersetujuanFormFields({ vm }) {
  return (
    <div className='space-y-4'>
      <div className='rounded-2xl border border-blue-100 bg-blue-50 p-4'>
        <AppTypography.Text
          size={13}
          weight={700}
          className='block text-blue-900'
        >
          Approval mengikuti schema `PersetujuanPeriodePayroll`
        </AppTypography.Text>

        <AppTypography.Text
          size={12}
          className='mt-1 block leading-5 text-blue-700'
        >
          Satu approval wajib terkait ke periode payroll dan level tertentu. Penyetuju bisa ditentukan lewat user, role, atau keduanya selama konsisten.
        </AppTypography.Text>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <AppSelect
          label='Periode Payroll'
          required
          value={vm.formData.id_periode_payroll}
          onChange={(value) => vm.setFormValue('id_periode_payroll', value)}
          options={vm.periodeOptions}
          placeholder='Pilih periode payroll'
          showSearch
          optionFilterProp='label'
          selectClassName='!rounded-lg'
        />

        <AppInput.Number
          label='Level Approval'
          required
          min={1}
          precision={0}
          value={vm.formData.level}
          onChange={(value) => vm.setFormValue('level', Number(value || 1))}
          inputClassName='!rounded-lg'
        />
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <AppSelect
          label='User Penyetuju'
          value={vm.formData.id_user_penyetuju || undefined}
          onChange={(value) => vm.setFormValue('id_user_penyetuju', value ?? '')}
          options={vm.usersOptions}
          placeholder='Pilih user penyetuju'
          allowClear
          showSearch
          optionFilterProp='label'
          selectClassName='!rounded-lg'
        />

        <AppSelect
          label='Role Penyetuju'
          value={vm.formData.role_penyetuju || undefined}
          onChange={(value) => vm.setFormValue('role_penyetuju', value ?? '')}
          options={vm.roleOptions.filter((item) => item.value)}
          placeholder='Pilih role penyetuju'
          allowClear
          showSearch={false}
          selectClassName='!rounded-lg'
        />
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <AppSelect
          label='Keputusan'
          required
          value={vm.formData.keputusan}
          onChange={(value) => vm.setFormValue('keputusan', value)}
          options={vm.keputusanOptions.filter((item) => item.value)}
          showSearch={false}
          selectClassName='!rounded-lg'
        />

        <AppInput
          label='Diputuskan Pada'
          type='datetime-local'
          value={vm.formData.diputuskan_pada}
          onChange={(event) => vm.setFormValue('diputuskan_pada', event.target.value)}
          inputClassName='!rounded-lg'
        />
      </div>

      <AppInput.TextArea
        label='Catatan'
        value={vm.formData.catatan}
        onChange={(event) => vm.setFormValue('catatan', event.target.value)}
        placeholder='Tambahkan catatan approval bila diperlukan.'
        autoSize={{ minRows: 4, maxRows: 6 }}
        inputClassName='!rounded-lg'
      />
    </div>
  );
}

export default function CreatePersetujuanModal({ vm }) {
  return (
    <AppModal
      open={vm.isCreateModalOpen}
      onClose={vm.closeCreateModal}
      title='Buat Persetujuan Payroll'
      footer={null}
      width={840}
    >
      <PersetujuanFormFields vm={vm} />

      <div className='flex justify-end gap-3 pt-6'>
        <AppButton
          variant='text'
          onClick={vm.closeCreateModal}
          className='!text-gray-700 hover:!text-gray-900'
        >
          Batal
        </AppButton>

        <AppButton
          onClick={vm.handleCreate}
          loading={vm.isSubmitting}
          className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
        >
          Simpan
        </AppButton>
      </div>
    </AppModal>
  );
}
