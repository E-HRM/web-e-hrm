'use client';

import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function EditPeriodeModalSection({ vm }) {
  return (
    <AppModal
      open={vm.isEditModalOpen}
      onClose={vm.closeEditModal}
      title={vm.selectedPeriode ? `Edit Periode ${vm.formatPeriodeLabel(vm.selectedPeriode)}` : 'Edit Periode Konsultan'}
      subtitle='Perbarui informasi periode untuk menyesuaikan proses pemeriksaan, persetujuan, atau penguncian data.'
      width={720}
      onOk={vm.handleUpdate}
      okText='Simpan Perubahan'
      cancelText='Batal'
      okLoading={vm.isSubmitting}
    >
      <div className='space-y-4'>
        <div className='rounded-2xl border border-blue-100 bg-blue-50 p-4'>
          <AppTypography.Text
            size={13}
            weight={700}
            className='block text-blue-900'
          >
            Tanggal periode akan disesuaikan otomatis
          </AppTypography.Text>

          <AppTypography.Text
            size={12}
            className='block text-blue-700 mt-1 leading-5'
          >
            Pilih bulan dan tahun, lalu sistem akan membantu mengisi rentang tanggal periode. Tanggal, status, dan catatan tetap dapat disesuaikan bila diperlukan.
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
          placeholder='Tambahkan catatan perubahan atau keterangan periode.'
          autoSize={{ minRows: 4, maxRows: 6 }}
          inputClassName='!rounded-lg'
        />
      </div>
    </AppModal>
  );
}
