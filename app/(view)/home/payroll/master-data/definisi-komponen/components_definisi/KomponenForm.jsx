import { PlusOutlined } from '@ant-design/icons';

import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { ARAH_KOMPONEN_OPTIONS } from '../utils/definisiKomponenPayroll.constants';
import SwitchCard from './SwitchCard';

function buildTipeKomponenOptions(items = []) {
  return items.map((item) => ({
    value: item.id_tipe_komponen_payroll,
    label: item.nama_tipe_komponen,
  }));
}

export default function KomponenForm({
  formData,
  setFormValue,
  disabled = false,
  tipeKomponenOptions = [],
  tipeKomponenLoading = false,
  onOpenQuickAdd = null,
}) {
  return (
    <div className='space-y-4'>
      <AppInput
        label='Nama Komponen'
        required
        disabled={disabled}
        value={formData.nama_komponen}
        onChange={(event) => setFormValue('nama_komponen', event.target.value)}
        placeholder='Contoh: Tunjangan Kesehatan'
        maxLength={255}
        inputClassName='!rounded-lg'
      />

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start'>
        <AppSelect
          label='Tipe Komponen'
          required
          value={formData.id_tipe_komponen_payroll}
          onChange={(value) => setFormValue('id_tipe_komponen_payroll', value)}
          options={buildTipeKomponenOptions(tipeKomponenOptions)}
          placeholder='Pilih tipe komponen'
          disabled={disabled}
          loading={tipeKomponenLoading}
          allowClear={false}
          showSearch
          hint='Tipe komponen diambil dari master data payroll.'
          dropdownRender={(menu) => (
            <div>
              {menu}

              {onOpenQuickAdd ? (
                <div className='border-t border-gray-100 p-2'>
                  <button
                    type='button'
                    onClick={onOpenQuickAdd}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    disabled={disabled}
                    className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-gray-400'
                  >
                    <PlusOutlined />
                    Tambah Tipe Baru
                  </button>
                </div>
              ) : null}
            </div>
          )}
          selectClassName='!rounded-lg'
        />

        <AppSelect
          label='Arah Komponen'
          value={formData.arah_komponen}
          onChange={(value) => setFormValue('arah_komponen', value)}
          options={ARAH_KOMPONEN_OPTIONS}
          showSearch={false}
          disabled={disabled}
          selectClassName='!rounded-lg'
        />
      </div>

      {tipeKomponenOptions.length === 0 && !tipeKomponenLoading ? (
        <div className='rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3'>
          <AppTypography.Text
            size={12}
            className='text-amber-800'
          >
            Belum ada master tipe komponen aktif. Tambahkan tipe baru agar definisi komponen bisa disimpan.
          </AppTypography.Text>
        </div>
      ) : null}

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
        <SwitchCard
          label='Kena Pajak'
          checked={formData.kena_pajak_default}
          onChange={(checked) => setFormValue('kena_pajak_default', checked)}
          disabled={disabled}
        />

        <SwitchCard
          label='Berulang'
          checked={formData.berulang_default}
          onChange={(checked) => setFormValue('berulang_default', checked)}
          disabled={disabled}
        />

        <SwitchCard
          label='Aktif'
          checked={formData.aktif}
          onChange={(checked) => setFormValue('aktif', checked)}
          disabled={disabled}
        />
      </div>

      <AppInput.TextArea
        label='Catatan'
        value={formData.catatan}
        disabled={disabled}
        onChange={(event) => setFormValue('catatan', event.target.value)}
        placeholder='Catatan tambahan...'
        maxLength={1000}
        autoSize={{ minRows: 3, maxRows: 5 }}
        inputClassName='!rounded-lg'
      />
    </div>
  );
}
