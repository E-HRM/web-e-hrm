import AppButton from '@/app/(view)/component_shared/AppButton';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppModal from '@/app/(view)/component_shared/AppModal';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppSwitch from '@/app/(view)/component_shared/AppSwitch';

const formatRupiahInput = (value) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const stringValue = String(value).replace(/[^\d.]/g, '');
  const [integerPart, decimalPart] = stringValue.split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (!formattedInteger) {
    return '';
  }

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

export default function EditModalSection({ vm }) {
  return (
    <AppModal
      open={vm.isEditModalOpen}
      onClose={vm.closeEditModal}
      title='Edit Transaksi Konsultan'
      footer={null}
      width={760}
    >
      <div className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <AppSelect
            label='Konsultan'
            required
            value={vm.formData.id_user_konsultan || undefined}
            onChange={(value) => vm.setFormValue('id_user_konsultan', value || '')}
            options={vm.konsultanOptions}
            placeholder='Pilih konsultan'
            disabled
            selectClassName='!rounded-lg'
          />

          <AppInput
            label='Tanggal Transaksi'
            required
            type='date'
            value={vm.formData.tanggal_transaksi}
            onChange={(e) => vm.setFormValue('tanggal_transaksi', e.target.value)}
            inputClassName='!rounded-lg'
            disabled={vm.isSubmitting}
          />
        </div>

        <AppSelect
          label='Layanan / Produk Konsultan'
          value={vm.formData.id_jenis_produk_konsultan || undefined}
          onChange={(value) => {
            if (typeof vm.setProdukValue === 'function') {
              vm.setProdukValue(value || '');
              return;
            }

            vm.setFormValue('id_jenis_produk_konsultan', value || '');
          }}
          options={vm.produkOptions}
          placeholder='Pilih layanan atau produk'
          allowClear
          disabled={vm.isSubmitting}
          selectClassName='!rounded-lg'
        />

        <AppInput
          label='Nama Klien'
          value={vm.formData.nama_klien}
          onChange={(e) => vm.setFormValue('nama_klien', e.target.value)}
          placeholder='PT. ABC Indonesia'
          inputClassName='!rounded-lg'
          disabled={vm.isSubmitting}
        />

        <AppInput.TextArea
          label='Keterangan'
          required
          value={vm.formData.deskripsi}
          onChange={(e) => vm.setFormValue('deskripsi', e.target.value)}
          placeholder='Tulis keterangan transaksi'
          autoSize={{ minRows: 2, maxRows: 4 }}
          inputClassName='!rounded-lg'
          disabled={vm.isSubmitting}
        />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <AppInput.Number
            label='Pemasukan'
            min={0}
            precision={2}
            value={vm.formData.nominal_debit}
            onChange={(value) => vm.setFormValue('nominal_debit', value ?? 0)}
            formatter={formatRupiahInput}
            parser={parseRupiahInput}
            placeholder='Rp 0'
            inputClassName='!rounded-lg'
            disabled={vm.isSubmitting}
          />

          <AppInput.Number
            label='Pengeluaran'
            min={0}
            precision={2}
            value={vm.formData.nominal_kredit}
            onChange={(value) => vm.setFormValue('nominal_kredit', value ?? 0)}
            formatter={formatRupiahInput}
            parser={parseRupiahInput}
            placeholder='Rp 0'
            inputClassName='!rounded-lg'
            disabled={vm.isSubmitting}
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <AppInput
            label='Persentase Share Standar (%)'
            type='number'
            value={vm.formData.persen_share_default}
            onChange={(e) => vm.setFormValue('persen_share_default', e.target.value)}
            placeholder='60'
            inputClassName='!rounded-lg'
            disabled={vm.isSubmitting}
          />

          <AppInput
            label='Persentase Share Khusus (%)'
            type='number'
            value={vm.formData.persen_share_override}
            onChange={(e) => vm.setFormValue('persen_share_override', e.target.value)}
            placeholder='Kosongkan jika memakai persentase standar'
            inputClassName='!rounded-lg'
            disabled={vm.isSubmitting}
          />
        </div>

        <div className='border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors'>
          <AppSwitch
            label='Atur Nominal Manual'
            checked={Boolean(vm.formData.override_manual)}
            onChange={(checked) => {
              vm.setFormValue('override_manual', checked);

              if (!checked) {
                vm.setFormValue('nominal_share', '');
                vm.setFormValue('nominal_oss', '');
              }
            }}
            description='Aktifkan jika bagian konsultan atau bagian OSS perlu diisi langsung.'
            showStateLabel={false}
            tone='primary'
            disabled={vm.isSubmitting}
          />
        </div>

        {vm.formData.override_manual ? (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <AppInput.Number
              label='Bagian Konsultan'
              min={0}
              precision={2}
              value={vm.formData.nominal_share}
              onChange={(value) => vm.setFormValue('nominal_share', value ?? '')}
              formatter={formatRupiahInput}
              parser={parseRupiahInput}
              placeholder='Kosongkan jika ingin dihitung otomatis'
              inputClassName='!rounded-lg'
              disabled={vm.isSubmitting}
            />

            <AppInput.Number
              label='Bagian OSS'
              min={0}
              precision={2}
              value={vm.formData.nominal_oss}
              onChange={(value) => vm.setFormValue('nominal_oss', value ?? '')}
              formatter={formatRupiahInput}
              parser={parseRupiahInput}
              placeholder='Kosongkan jika ingin dihitung otomatis'
              inputClassName='!rounded-lg'
              disabled={vm.isSubmitting}
            />
          </div>
        ) : null}
      </div>

      <div className='flex items-center justify-end gap-3 pt-4'>
        <AppButton
          onClick={vm.closeEditModal}
          variant='secondary'
          className='!rounded-lg !px-4 !h-10 !border-gray-300 !text-gray-700 hover:!bg-gray-50'
          disabled={vm.isSubmitting}
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
