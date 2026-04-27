'use client';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { PINJAMAN_FORM_STATUS_OPTIONS, STATUS_PINJAMAN } from '../utils/utils';
import { UserMeta } from './SectionShared';

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

function buildStatusOptions(vm) {
  return PINJAMAN_FORM_STATUS_OPTIONS.map((option) => ({
    ...option,
    disabled: typeof vm.isStatusOptionDisabled === 'function' ? vm.isStatusOptionDisabled(option.value) : false,
  }));
}

export default function EditPinjamanModalSection({ vm }) {
  const statusOptions = buildStatusOptions(vm);

  return (
    <AppModal
      open={vm.isEditModalOpen}
      onClose={vm.closeEditModal}
      title='Edit Pinjaman'
      footer={null}
      width={680}
    >
      <div className='space-y-4'>
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
              <AppTypography.Text
                size={13}
                className='text-gray-500'
              >
                Data karyawan tidak ditemukan.
              </AppTypography.Text>
            </div>
          )}
        </div>

        <AppInput
          label='Nama Pinjaman'
          required
          value={vm.formData.nama_pinjaman}
          onChange={(event) => vm.setFormValue('nama_pinjaman', event.target.value)}
          placeholder='Pinjaman Renovasi Rumah'
          disabled={vm.isSubmitting}
          hint={vm.duplicateNameForUser ? 'Nama pinjaman untuk karyawan ini sudah ada.' : undefined}
          inputClassName='!rounded-lg'
        />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <AppInput.Number
            label='Nominal Pinjaman'
            required
            min={0}
            value={vm.formData.nominal_pinjaman}
            onChange={(value) => vm.setFormValue('nominal_pinjaman', value ?? 0)}
            formatter={formatRupiahInput}
            parser={parseRupiahInput}
            placeholder='Rp 0'
            disabled={vm.isSubmitting}
            inputClassName='!rounded-lg !w-full'
          />

          <AppInput.Number
            label='Lama Cicilan'
            required
            min={1}
            precision={0}
            step={1}
            value={vm.formData.tenor_bulan}
            onChange={(value) => vm.setFormValue('tenor_bulan', value ?? 0)}
            placeholder='Contoh: 20'
            disabled={vm.isSubmitting}
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
            disabled={vm.isSubmitting}
            inputClassName='!rounded-lg'
          />

          <AppSelect
            label='Status Pinjaman'
            required
            value={vm.formData.status_pinjaman || undefined}
            onChange={(value) => vm.setFormValue('status_pinjaman', value || STATUS_PINJAMAN.DRAFT)}
            options={statusOptions}
            placeholder='Pilih status pinjaman'
            disabled={vm.isSubmitting}
            selectClassName='!rounded-lg'
            hint={vm.statusFieldHint}
            showSearch={false}
          />
        </div>

        <AppInput.TextArea
          label='Catatan (Opsional)'
          value={vm.formData.catatan}
          onChange={(event) => vm.setFormValue('catatan', event.target.value)}
          autoSize={{ minRows: 3, maxRows: 5 }}
          placeholder='Catatan tambahan...'
          disabled={vm.isSubmitting}
          inputClassName='!rounded-lg'
        />
      </div>

      <div className='flex items-center justify-end gap-3 pt-4'>
        <AppButton
          variant='outline'
          onClick={vm.closeEditModal}
          disabled={vm.isSubmitting}
          className='!rounded-lg !px-4 !h-10 !border-gray-300 !text-gray-700 hover:!bg-gray-50 hover:!border-gray-300 hover:!text-gray-700'
        >
          Batal
        </AppButton>

        <AppButton
          onClick={vm.handleEdit}
          loading={vm.isSubmitting}
          className='!rounded-lg !px-4 !h-10 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 !text-white'
        >
          Simpan Perubahan
        </AppButton>
      </div>
    </AppModal>
  );
}
