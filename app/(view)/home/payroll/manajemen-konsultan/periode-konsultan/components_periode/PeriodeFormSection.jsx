'use client';

import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function PeriodeFormSection({ vm, mode = 'create' }) {
  const isEdit = mode === 'edit';

  return (
    <div className='space-y-4'>
      <div className='rounded-2xl border border-blue-100 bg-blue-50 p-4'>
        <AppTypography.Text
          size={13}
          weight={700}
          className='block text-blue-900'
        >
          Periode akan dibentuk otomatis dari bulan dan tahun
        </AppTypography.Text>

        <AppTypography.Text
          size={12}
          className='block text-blue-700 mt-1 leading-5'
        >
          ID periode dihasilkan sistem. Tim operasional cukup menentukan bulan, rentang tanggal aktif, status, dan catatan bila diperlukan.
        </AppTypography.Text>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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

      <AppSelect
        label='Status Periode'
        required
        value={vm.formData.status_periode}
        onChange={(value) => vm.setFormValue('status_periode', value)}
        options={vm.statusOptions.filter((item) => item.value)}
        showSearch={false}
        selectClassName='!rounded-lg'
      />

      <AppInput.TextArea
        label='Catatan'
        value={vm.formData.catatan}
        onChange={(event) => vm.setFormValue('catatan', event.target.value)}
        placeholder={isEdit ? 'Tambahkan catatan perubahan atau keterangan periode.' : 'Tambahkan catatan operasional bila diperlukan.'}
        autoSize={{ minRows: 4, maxRows: 6 }}
        inputClassName='!rounded-lg'
      />
    </div>
  );
}
