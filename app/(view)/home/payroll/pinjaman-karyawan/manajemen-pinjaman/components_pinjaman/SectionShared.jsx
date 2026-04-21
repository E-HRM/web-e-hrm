'use client';

import AppAvatar from '@/app/(view)/component_shared/AppAvatar';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSelect from '@/app/(view)/component_shared/AppSelect';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { PINJAMAN_FORM_STATUS_OPTIONS, STATUS_PINJAMAN } from '../utils/utils';

export function SummaryCard({ icon, iconWrapClassName, iconClassName, value, label }) {
  return (
    <AppCard
      rounded='xl'
      ring={false}
      shadow='none'
      className='border border-gray-200'
      bodyStyle={{ padding: 24 }}
    >
      <div className='flex items-center justify-between mb-4'>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconWrapClassName}`}>
          <span className={iconClassName}>{icon}</span>
        </div>
      </div>

      <AppTypography.Text
        size={30}
        weight={800}
        className='block text-gray-900 mb-1'
      >
        {value}
      </AppTypography.Text>

      <AppTypography.Text
        size={14}
        className='text-gray-600'
      >
        {label}
      </AppTypography.Text>
    </AppCard>
  );
}

export function StatusTag({ status }) {
  if (status === STATUS_PINJAMAN.DRAFT) {
    return (
      <AppTag
        tone='info'
        variant='soft'
        size='sm'
        className='!font-medium'
      >
        DRAFT
      </AppTag>
    );
  }

  if (status === STATUS_PINJAMAN.AKTIF) {
    return (
      <AppTag
        tone='warning'
        variant='soft'
        size='sm'
        className='!font-medium'
      >
        AKTIF
      </AppTag>
    );
  }

  if (status === STATUS_PINJAMAN.LUNAS) {
    return (
      <AppTag
        tone='success'
        variant='soft'
        size='sm'
        className='!font-medium'
      >
        LUNAS
      </AppTag>
    );
  }

  if (status === STATUS_PINJAMAN.DIBATALKAN) {
    return (
      <AppTag
        tone='danger'
        variant='soft'
        size='sm'
        className='!font-medium'
      >
        DIBATALKAN
      </AppTag>
    );
  }

  return (
    <AppTag
      tone='neutral'
      variant='soft'
      size='sm'
      className='!font-medium'
    >
      {status || '-'}
    </AppTag>
  );
}

export function DetailField({ label, value, valueClassName = 'text-gray-900', valueSize = 14, weight = 600 }) {
  return (
    <div>
      <AppTypography.Text
        size={12}
        className='block text-gray-500 mb-1'
      >
        {label}
      </AppTypography.Text>

      <AppTypography.Text
        size={valueSize}
        weight={weight}
        className={`block ${valueClassName}`}
      >
        {value}
      </AppTypography.Text>
    </div>
  );
}

function filterUserOption(input, option) {
  return String(option?.searchText || '')
    .toLowerCase()
    .includes(String(input || '').toLowerCase());
}

export function UserMeta({ user, vm, compact = false }) {
  const name = vm.getUserDisplayName(user);
  const identity = vm.getUserIdentity(user);
  const roleOrJob = vm.getUserRoleOrJob(user);
  const department = vm.getUserDepartment(user);
  const subtitle = [roleOrJob, department].filter(Boolean).join(' • ');

  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'p-4 rounded-xl bg-gray-50 border border-gray-200'}`}>
      <AppAvatar
        src={vm.getUserPhoto(user) || undefined}
        name={name}
        size={compact ? 'md' : 'lg'}
      />

      <div className='min-w-0'>
        <AppTypography.Text
          size={15}
          weight={700}
          className='block text-gray-900 truncate'
        >
          {name}
        </AppTypography.Text>

        <AppTypography.Text
          size={13}
          className='block text-gray-500 truncate'
        >
          {identity}
        </AppTypography.Text>

        {!compact ? (
          <AppTypography.Text
            size={13}
            className='block text-gray-500 truncate mt-1'
          >
            {subtitle || 'Data jabatan/departemen belum tersedia'}
          </AppTypography.Text>
        ) : null}
      </div>
    </div>
  );
}

function buildUserSelectOptions(users, vm) {
  return users.map((user) => {
    const plainLabel = [vm.getUserDisplayName(user), vm.getUserIdentity(user)].filter(Boolean).join(' • ');

    return {
      value: user.id_user,
      label: (
        <UserMeta
          user={user}
          vm={vm}
          compact
        />
      ),
      plainLabel,
      title: plainLabel,
      searchText: [vm.getUserDisplayName(user), vm.getUserIdentity(user), user?.email, vm.getUserRoleOrJob(user), vm.getUserDepartment(user), user?.id_user].filter(Boolean).join(' '),
    };
  });
}

function buildStatusOptions(vm) {
  return PINJAMAN_FORM_STATUS_OPTIONS.map((option) => ({
    ...option,
    disabled: typeof vm.isStatusOptionDisabled === 'function' ? vm.isStatusOptionDisabled(option.value) : false,
  }));
}

export function PinjamanForm({ vm, formData, setFormValue, duplicateNameForUser, disableUserField = false }) {
  const userOptions = buildUserSelectOptions(vm.availableUsers, vm);
  const statusOptions = buildStatusOptions(vm);

  return (
    <div className='space-y-4'>
      {!disableUserField ? (
        <AppSelect
          label='Karyawan'
          required
          value={formData.id_user || undefined}
          onChange={(value) => setFormValue('id_user', value || '')}
          options={userOptions}
          placeholder='Pilih karyawan'
          loading={vm.loading}
          disabled={vm.loading || vm.isSubmitting}
          filterOption={filterUserOption}
          optionFilterProp='searchText'
          optionLabelProp='plainLabel'
          selectClassName='!rounded-lg'
          hint='Cari berdasarkan nama, NIK, email, atau jabatan.'
        />
      ) : (
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
      )}

      <AppInput
        label='Nama Pinjaman'
        required
        value={formData.nama_pinjaman}
        onChange={(event) => setFormValue('nama_pinjaman', event.target.value)}
        placeholder='Pinjaman Renovasi Rumah'
        disabled={vm.isSubmitting}
        hint={duplicateNameForUser ? 'Nama pinjaman untuk karyawan ini sudah ada.' : undefined}
        inputClassName='!rounded-lg'
      />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppInput.Number
          label='Nominal Pinjaman'
          required
          min={0}
          value={formData.nominal_pinjaman}
          onChange={(value) => setFormValue('nominal_pinjaman', value ?? 0)}
          placeholder='5000000'
          disabled={vm.isSubmitting}
          inputClassName='!rounded-lg'
        />

        <AppInput.Number
          label='Cicilan per Bulan'
          required
          min={0}
          value={formData.nominal_cicilan}
          onChange={(value) => setFormValue('nominal_cicilan', value ?? 0)}
          placeholder='250000'
          disabled={vm.isSubmitting}
          inputClassName='!rounded-lg'
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <AppInput
          label='Tanggal Mulai'
          required
          type='date'
          value={formData.tanggal_mulai}
          onChange={(event) => setFormValue('tanggal_mulai', event.target.value)}
          disabled={vm.isSubmitting}
          inputClassName='!rounded-lg'
        />

        <AppSelect
          label='Status Pengajuan'
          required
          value={formData.status_pinjaman || undefined}
          onChange={(value) => setFormValue('status_pinjaman', value || STATUS_PINJAMAN.DRAFT)}
          options={statusOptions}
          placeholder='Pilih status pengajuan'
          disabled={vm.isSubmitting}
          selectClassName='!rounded-lg'
          hint={vm.statusFieldHint}
          showSearch={false}
        />
      </div>

      <AppInput.TextArea
        label='Catatan (Opsional)'
        value={formData.catatan}
        onChange={(event) => setFormValue('catatan', event.target.value)}
        autoSize={{ minRows: 3, maxRows: 5 }}
        placeholder='Catatan tambahan...'
        disabled={vm.isSubmitting}
        inputClassName='!rounded-lg'
      />
    </div>
  );
}
