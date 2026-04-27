'use client';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function CreatePeriodeModal({ vm }) {
  return (
    <AppModal
      open={vm.isCreateModalOpen}
      onClose={vm.closeCreateModal}
      title='Buat Periode Payroll'
      footer={null}
      width={840}
    >
      <div className='space-y-4'>
        <div className='rounded-2xl border border-blue-100 bg-blue-50 p-4'>
          <AppTypography.Text
            size={13}
            weight={700}
            className='block text-blue-900'
          >
            Lengkapi informasi periode penggajian
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='mt-1 block leading-5 text-blue-700'
          >
            Pilih bulan, tahun, rentang tanggal, status proses, dan template slip gaji yang akan digunakan untuk periode ini.
          </AppTypography.Text>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <AppSelect
            label='Bulan Periode'
            required
            value={vm.formData.bulan}
            onChange={(value) => vm.setFormValue('bulan', value)}
            options={vm.bulanOptions}
            showSearch={false}
            selectClassName='!rounded-lg'
          />

          <AppInput.Number
            label='Tahun'
            required
            min={2000}
            max={9999}
            precision={0}
            value={vm.formData.tahun}
            onChange={(value) => vm.setFormValue('tahun', Number(value || 0))}
            inputClassName='!rounded-lg'
          />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <AppInput
            label='Tanggal Mulai'
            required
            type='date'
            value={vm.formData.tanggal_mulai}
            onChange={(event) => vm.setFormValue('tanggal_mulai', event.target.value)}
            inputClassName='!rounded-lg'
          />

          <AppInput
            label='Tanggal Selesai'
            required
            type='date'
            value={vm.formData.tanggal_selesai}
            onChange={(event) => vm.setFormValue('tanggal_selesai', event.target.value)}
            inputClassName='!rounded-lg'
          />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <AppSelect
            label='Status Periode'
            required
            value={vm.formData.status_periode}
            onChange={(value) => vm.setFormValue('status_periode', value)}
            options={vm.statusOptions.filter((item) => item.value)}
            showSearch={false}
            selectClassName='!rounded-lg'
          />

          <AppSelect
            label='Template Slip Gaji'
            value={vm.formData.id_master_template}
            onChange={(value) => vm.setFormValue('id_master_template', value || '')}
            options={vm.templateOptions}
            loading={vm.templateLoading}
            allowClear
            placeholder='Pilih template slip gaji bila diperlukan'
            selectClassName='!rounded-lg'
          />
        </div>

        <AppInput.TextArea
          label='Catatan'
          value={vm.formData.catatan}
          onChange={(event) => vm.setFormValue('catatan', event.target.value)}
          placeholder='Tambahkan catatan periode penggajian bila diperlukan.'
          autoSize={{ minRows: 4, maxRows: 6 }}
          inputClassName='!rounded-lg'
        />
      </div>

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
