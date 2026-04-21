import AppInput from '@/app/(view)/component_shared/AppInput';

export default function TarifForm({ formData, setFormValue, disabled = false }) {
  return (
    <div className='space-y-4'>
      <AppInput
        label='Kode Kategori Pajak'
        required
        value={formData.kode_kategori_pajak}
        onChange={(event) => setFormValue('kode_kategori_pajak', event.target.value)}
        placeholder='Contoh: TK_0 atau PTKP_A'
        inputClassName='!rounded-lg'
        hint='Kode kategori pajak bebas diisi sesuai model terbaru.'
        disabled={disabled}
      />

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <AppInput.Number
          label='Penghasilan Dari'
          required
          min={0}
          step={1}
          precision={0}
          placeholder='0'
          value={formData.penghasilan_dari}
          onChange={(value) => setFormValue('penghasilan_dari', value)}
          inputClassName='!rounded-lg'
          hint='Masukkan batas bawah penghasilan bruto.'
          disabled={disabled}
        />

        <AppInput.Number
          label='Penghasilan Sampai'
          min={0}
          step={1}
          precision={0}
          placeholder='0'
          value={formData.penghasilan_sampai}
          onChange={(value) => setFormValue('penghasilan_sampai', value ?? null)}
          inputClassName='!rounded-lg'
          hint='Kosongkan bila rentang berlaku tanpa batas atas.'
          disabled={disabled}
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
          value={formData.persen_tarif}
          onChange={(value) => setFormValue('persen_tarif', value)}
          inputClassName='!rounded-lg'
          hint='Contoh: 5.5 untuk tarif 5,5%.'
          disabled={disabled}
        />
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <AppInput
          label='Berlaku Mulai'
          required
          type='date'
          value={formData.berlaku_mulai}
          onChange={(event) => setFormValue('berlaku_mulai', event.target.value)}
          inputClassName='!rounded-lg'
          disabled={disabled}
        />

        <AppInput
          label='Berlaku Sampai'
          type='date'
          value={formData.berlaku_sampai || ''}
          onChange={(event) => setFormValue('berlaku_sampai', event.target.value || null)}
          inputClassName='!rounded-lg'
          hint='Kosongkan jika tarif tetap berlaku sampai ada perubahan berikutnya.'
          disabled={disabled}
        />
      </div>
    </div>
  );
}
