import AppButton from '@/app/(view)/component_shared/AppButton';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';

const PRIMARY_BUTTON_CLASS_NAME = '!h-10 !rounded-lg !border-blue-600 !bg-blue-600 !px-4 !text-white hover:!border-blue-700 hover:!bg-blue-700';

const formatRupiahInput = (value) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const numericValue = String(value).replace(/[^\d]/g, '');

  if (!numericValue) {
    return '';
  }

  return `Rp ${numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
};

const parseRupiahInput = (value) => {
  if (!value) {
    return '';
  }

  return String(value).replace(/[^\d]/g, '');
};

export default function PajakTERCreateModal({ vm }) {
  return (
    <AppModal
      open={vm.isCreateModalOpen}
      onClose={vm.closeCreateModal}
      title='Tambah Tarif Pajak TER'
      footer={null}
      width={720}
    >
      <div className='space-y-4'>
        <AppInput
          label='Kode Kategori Pajak'
          required
          value={vm.formData.kode_kategori_pajak}
          onChange={(event) => vm.setFormValue('kode_kategori_pajak', event.target.value)}
          placeholder='Contoh: TK_0 atau PTKP_A'
          inputClassName='!rounded-lg'
          hint='Kode kategori pajak bebas diisi sesuai model terbaru.'
          disabled={vm.isSubmitting}
        />

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <AppInput.Number
            label='Penghasilan Dari'
            required
            min={0}
            step={1}
            precision={0}
            placeholder='Rp 0'
            value={vm.formData.penghasilan_dari}
            onChange={(value) => vm.setFormValue('penghasilan_dari', value)}
            formatter={formatRupiahInput}
            parser={parseRupiahInput}
            inputClassName='!rounded-lg !w-full'
            hint='Masukkan batas bawah penghasilan bruto.'
            disabled={vm.isSubmitting}
          />

          <AppInput.Number
            label='Penghasilan Sampai'
            min={0}
            step={1}
            precision={0}
            placeholder='Rp 0'
            value={vm.formData.penghasilan_sampai}
            onChange={(value) => vm.setFormValue('penghasilan_sampai', value ?? null)}
            formatter={formatRupiahInput}
            parser={parseRupiahInput}
            inputClassName='!rounded-lg !w-full'
            hint='Kosongkan bila rentang berlaku tanpa batas atas.'
            disabled={vm.isSubmitting}
          />
        </div>

        <div>
          <AppInput.Number
            label='Persentase Tarif (%)'
            required
            min={0}
            max={100}
            step={0.0001}
            precision={4}
            placeholder='0.0'
            value={vm.formData.persen_tarif}
            onChange={(value) => vm.setFormValue('persen_tarif', value)}
            inputClassName='!rounded-lg'
            hint='Contoh: 5.5 untuk tarif 5,5%.'
            disabled={vm.isSubmitting}
          />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <AppInput
            label='Berlaku Mulai'
            required
            type='date'
            value={vm.formData.berlaku_mulai}
            onChange={(event) => vm.setFormValue('berlaku_mulai', event.target.value)}
            inputClassName='!rounded-lg'
            disabled={vm.isSubmitting}
          />

          <AppInput
            label='Berlaku Sampai'
            type='date'
            value={vm.formData.berlaku_sampai || ''}
            onChange={(event) => vm.setFormValue('berlaku_sampai', event.target.value || null)}
            inputClassName='!rounded-lg'
            hint='Kosongkan jika tarif tetap berlaku sampai ada perubahan berikutnya.'
            disabled={vm.isSubmitting}
          />
        </div>
      </div>

      <div className='flex justify-end gap-3 pt-4'>
        <AppButton
          variant='text'
          onClick={vm.closeCreateModal}
          className='!text-gray-700 hover:!text-gray-900'
          disabled={vm.isSubmitting}
        >
          Batal
        </AppButton>

        <AppButton
          onClick={vm.handleCreate}
          loading={vm.isSubmitting}
          className={PRIMARY_BUTTON_CLASS_NAME}
        >
          Simpan
        </AppButton>
      </div>
    </AppModal>
  );
}
