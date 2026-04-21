'use client';

import { CheckCircleOutlined, PercentageOutlined, SearchOutlined, StopOutlined } from '@ant-design/icons';

import AppButton from '@/app/(view)/component_shared/AppButton';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppSpace from '@/app/(view)/component_shared/AppSpace';
import AppSwitch from '@/app/(view)/component_shared/AppSwitch';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'INACTIVE', label: 'Tidak Aktif' },
];

export function createInitialForm() {
  return {
    nama_produk: '',
    persen_share_default: null,
    aktif: true,
    catatan: '',
  };
}

export function normalizePercentValue(value) {
  if (value === null || value === undefined || value === '') return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatPercent(value) {
  if (value === null || value === undefined || value === '') return '-';

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value);

  return parsed.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

export function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function StatusTag({ aktif }) {
  if (aktif) {
    return (
      <AppTag
        tone='success'
        variant='soft'
        size='sm'
        icon={<CheckCircleOutlined />}
        className='!font-medium'
      >
        Aktif
      </AppTag>
    );
  }

  return (
    <AppTag
      tone='danger'
      variant='soft'
      size='sm'
      icon={<StopOutlined />}
      className='!font-medium'
    >
      Tidak Aktif
    </AppTag>
  );
}

export function ShareTag({ value }) {
  if (value === null || value === undefined || value === '') {
    return (
      <AppTypography.Text
        size={13}
        className='text-gray-400'
      >
        Tidak diatur
      </AppTypography.Text>
    );
  }

  return (
    <AppTag
      tone='purple'
      variant='soft'
      size='sm'
      icon={<PercentageOutlined />}
      className='!font-medium'
    >
      {formatPercent(value)}%
    </AppTag>
  );
}

export function DetailField({ label, children }) {
  return (
    <div>
      <AppTypography.Text
        size={12}
        weight={600}
        className='mb-1 block uppercase tracking-wide text-gray-500'
      >
        {label}
      </AppTypography.Text>

      <div>{children}</div>
    </div>
  );
}

export function ModalActionFooter({
  onCancel,
  onSubmit,
  submitLabel,
  submitButtonClassName = '!h-10 !rounded-lg !border-blue-600 !bg-blue-600 !px-4 !text-white whitespace-nowrap hover:!border-blue-700 hover:!bg-blue-700',
  cancelDisabled = false,
  submitDisabled = false,
  submitLoading = false,
}) {
  return (
    <div className='flex justify-end gap-3 pt-4'>
      <AppButton
        variant='text'
        onClick={onCancel}
        className='!text-gray-700 hover:!text-gray-900'
        disabled={cancelDisabled}
      >
        Batal
      </AppButton>

      <AppButton
        onClick={onSubmit}
        className={submitButtonClassName}
        disabled={submitDisabled}
        loading={submitLoading}
      >
        {submitLabel}
      </AppButton>
    </div>
  );
}

export function ProdukKonsultanForm({ formData, setFormValue, disabled = false }) {
  return (
    <AppSpace
      direction='vertical'
      size='lg'
      block
      stretch
    >
      <AppInput
        label='Nama Produk'
        required
        disabled={disabled}
        value={formData.nama_produk}
        onChange={(event) => setFormValue('nama_produk', event.target.value)}
        placeholder='Contoh: Konsultasi Strategi Bisnis'
        maxLength={255}
        hint='Gunakan nama produk/jasa yang jelas karena akan dipakai sebagai referensi transaksi konsultan.'
        inputClassName='!rounded-lg'
      />

      <AppInput.Number
        label='Persentase Share Default (%)'
        disabled={disabled}
        value={formData.persen_share_default}
        onChange={(value) => setFormValue('persen_share_default', normalizePercentValue(value))}
        placeholder='0'
        min={0}
        max={100}
        step={0.01}
        precision={4}
        className='w-full'
        inputClassName='!w-full !rounded-lg'
        hint='Kosongkan bila share default belum ingin ditentukan. Nilai valid: 0 sampai 100.'
      />

      <AppSwitch
        label='Produk Aktif'
        description='Produk aktif dapat dipilih saat membuat transaksi konsultan.'
        checked={Boolean(formData.aktif)}
        onChange={(checked) => setFormValue('aktif', checked)}
        showStateLabel={false}
        tone='primary'
        disabled={disabled}
      />

      <AppInput.TextArea
        label='Catatan'
        value={formData.catatan}
        onChange={(event) => setFormValue('catatan', event.target.value)}
        placeholder='Deskripsi tambahan tentang produk/jasa konsultan (opsional)'
        autoSize={{ minRows: 3, maxRows: 5 }}
        inputClassName='!rounded-lg'
        disabled={disabled}
      />
    </AppSpace>
  );
}

export function ProdukKonsultanSearchFilter({ searchQuery, onSearchQueryChange, filterStatus, onFilterStatusChange }) {
  return (
    <>
      <AppInput
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        placeholder='Cari nama produk atau catatan...'
        prefixIcon={<SearchOutlined className='text-gray-400' />}
        className='w-full'
        inputClassName='!rounded-lg'
      />

      <AppSelect
        value={filterStatus}
        onChange={(value) => onFilterStatusChange(value)}
        options={STATUS_FILTER_OPTIONS}
        placeholder='Filter status'
        showSearch={false}
        className='w-full'
        selectClassName='!rounded-lg'
      />
    </>
  );
}
