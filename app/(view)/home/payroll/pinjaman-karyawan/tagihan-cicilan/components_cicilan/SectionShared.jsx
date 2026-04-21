'use client';

import AppAvatar from '@/app/(view)/component_shared/AppAvatar';
import AppCard from '@/app/(view)/component_shared/AppCard';
import AppTag from '@/app/(view)/component_shared/AppTag';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

import { getStatusCicilanMeta } from '../utils/utils';

export function SummaryCard({ icon, iconWrapClassName, iconClassName, value, label, helper }) {
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
        className='block text-gray-600'
      >
        {label}
      </AppTypography.Text>

      {helper ? (
        <AppTypography.Text
          size={12}
          className='block text-gray-500 mt-1'
        >
          {helper}
        </AppTypography.Text>
      ) : null}
    </AppCard>
  );
}

export function StatusTag({ status }) {
  const meta = getStatusCicilanMeta(status);

  return (
    <AppTag
      tone={meta.tone}
      variant='soft'
      size='sm'
      className='!font-semibold'
    >
      {meta.label}
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

export function UserMeta({ user, vm, compact = false }) {
  const name = vm.getUserDisplayName(user);
  const identity = vm.getUserIdentity(user);
  const roleOrJob = vm.getUserRoleOrJob(user);
  const department = vm.getUserDepartment(user);
  const subtitle = [roleOrJob, department].filter(Boolean).join(' • ');

  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'rounded-xl border border-gray-200 bg-gray-50 p-4'}`}>
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
