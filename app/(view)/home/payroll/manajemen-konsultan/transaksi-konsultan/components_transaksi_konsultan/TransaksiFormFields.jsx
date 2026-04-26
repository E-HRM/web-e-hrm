import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppSwitch from '@/app/(view)/component_shared/AppSwitch';

export default function TransaksiFormFields({ formData, setFormValue, setProdukValue, periodeOptions, konsultanOptions, produkOptions, mode = 'create', disabled = false }) {
  const isEditMode = mode === 'edit';

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppSelect
          label='Konsultan'
          required
          value={formData.id_user_konsultan || undefined}
          onChange={(value) => setFormValue('id_user_konsultan', value || '')}
          options={konsultanOptions}
          placeholder='Pilih konsultan'
          disabled={disabled || isEditMode}
          selectClassName='!rounded-lg'
        />

        <AppInput
          label='Tanggal Transaksi'
          required
          type='date'
          value={formData.tanggal_transaksi}
          onChange={(e) => setFormValue('tanggal_transaksi', e.target.value)}
          inputClassName='!rounded-lg'
          disabled={disabled}
        />
      </div>

      {!isEditMode ? (
        <AppSelect
          label='Periode'
          required
          value={formData.id_periode_konsultan || undefined}
          onChange={(value) => setFormValue('id_periode_konsultan', value || '')}
          options={periodeOptions}
          placeholder='Pilih periode'
          disabled={disabled}
          selectClassName='!rounded-lg'
          showSearch={false}
        />
      ) : null}

      <AppSelect
        label='Layanan / Produk Konsultan'
        value={formData.id_jenis_produk_konsultan || undefined}
        onChange={(value) => {
          if (typeof setProdukValue === 'function') {
            setProdukValue(value || '');
            return;
          }

          setFormValue('id_jenis_produk_konsultan', value || '');
        }}
        options={produkOptions}
        placeholder='Pilih layanan atau produk'
        allowClear
        disabled={disabled}
        selectClassName='!rounded-lg'
      />

      <AppInput
        label='Nama Klien'
        value={formData.nama_klien}
        onChange={(e) => setFormValue('nama_klien', e.target.value)}
        placeholder='PT. ABC Indonesia'
        inputClassName='!rounded-lg'
        disabled={disabled}
      />

      <AppInput.TextArea
        label='Keterangan'
        required
        value={formData.deskripsi}
        onChange={(e) => setFormValue('deskripsi', e.target.value)}
        placeholder='Tulis keterangan transaksi'
        autoSize={{ minRows: 2, maxRows: 4 }}
        inputClassName='!rounded-lg'
        disabled={disabled}
      />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppInput
          label='Pemasukan'
          type='number'
          value={formData.nominal_debit}
          onChange={(e) => setFormValue('nominal_debit', e.target.value)}
          placeholder='0'
          inputClassName='!rounded-lg'
          disabled={disabled}
        />

        <AppInput
          label='Pengeluaran'
          type='number'
          value={formData.nominal_kredit}
          onChange={(e) => setFormValue('nominal_kredit', e.target.value)}
          placeholder='0'
          inputClassName='!rounded-lg'
          disabled={disabled}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppInput
          label='Persentase Share Standar (%)'
          type='number'
          value={formData.persen_share_default}
          onChange={(e) => setFormValue('persen_share_default', e.target.value)}
          placeholder='60'
          inputClassName='!rounded-lg'
          disabled={disabled}
        />

        <AppInput
          label='Persentase Share Khusus (%)'
          type='number'
          value={formData.persen_share_override}
          onChange={(e) => setFormValue('persen_share_override', e.target.value)}
          placeholder='Kosongkan jika memakai persentase standar'
          inputClassName='!rounded-lg'
          disabled={disabled}
        />
      </div>

      <div className='border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors'>
        <AppSwitch
          label='Atur Nominal Manual'
          checked={Boolean(formData.override_manual)}
          onChange={(checked) => {
            setFormValue('override_manual', checked);

            if (!checked) {
              setFormValue('nominal_share', '');
              setFormValue('nominal_oss', '');
            }
          }}
          description='Aktifkan jika bagian konsultan atau bagian OSS perlu diisi langsung.'
          showStateLabel={false}
          tone='primary'
          disabled={disabled}
        />
      </div>

      {formData.override_manual ? (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <AppInput
            label='Bagian Konsultan'
            type='number'
            value={formData.nominal_share}
            onChange={(e) => setFormValue('nominal_share', e.target.value)}
            placeholder='Kosongkan jika ingin dihitung otomatis'
            inputClassName='!rounded-lg'
            disabled={disabled}
          />

          <AppInput
            label='Bagian OSS'
            type='number'
            value={formData.nominal_oss}
            onChange={(e) => setFormValue('nominal_oss', e.target.value)}
            placeholder='Kosongkan jika ingin dihitung otomatis'
            inputClassName='!rounded-lg'
            disabled={disabled}
          />
        </div>
      ) : null}
    </div>
  );
}
