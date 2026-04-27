import AppInput from '@/app/(view)/component_shared/AppInput';

export default function TipeKomponenPayrollForm({ formData, setFormValue, disabled = false }) {
  return (
    <div className='space-y-4'>
      <AppInput
        label='Nama Tipe Komponen'
        required
        disabled={disabled}
        value={formData.nama_tipe_komponen}
        onChange={(event) => setFormValue('nama_tipe_komponen', event.target.value)}
        placeholder='Contoh: Tunjangan Tetap'
        maxLength={100}
        hint='Gunakan nama yang jelas dan stabil karena akan dipakai sebagai referensi definisi komponen payroll.'
        inputClassName='!rounded-lg'
      />
    </div>
  );
}
