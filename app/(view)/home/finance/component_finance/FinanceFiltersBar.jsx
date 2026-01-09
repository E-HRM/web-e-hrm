'use client';

import React, { useMemo } from 'react';
import { SearchOutlined } from '@ant-design/icons';

import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSegmented from '@/app/(view)/component_shared/AppSegmented';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function FinanceFiltersBar({ search, onSearchChange, status, onStatusChange, datePreset, onDatePresetChange }) {
  const statusOptions = useMemo(
    () => [
      { label: 'Semua', value: 'ALL' },
      { label: 'Pending', value: 'PENDING' },
      { label: 'In Review', value: 'IN_REVIEW' },
      { label: 'Approved', value: 'APPROVED' },
      { label: 'Rejected', value: 'REJECTED' },
    ],
    []
  );

  const dateOptions = useMemo(
    () => [
      { label: 'All', value: 'ALL' },
      { label: 'Today', value: 'TODAY' },
      { label: 'Tomorrow', value: 'TOMORROW' },
    ],
    []
  );

  return (
    <div className='w-full flex flex-col gap-3'>
      <AppInput
        value={search}
        onChange={(e) => onSearchChange?.(e?.target?.value ?? '')}
        placeholder='Cari karyawan atau nomor pengajuan...'
        prefixIcon={<SearchOutlined className='text-slate-400' />}
        allowClear
      />

      <div className='w-full flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <AppTypography.Text
            size={13}
            tone='muted'
            className='text-slate-600'
          >
            Status:
          </AppTypography.Text>

          <AppSegmented
            size='sm'
            variant='soft'
            tone='neutral'
            options={statusOptions}
            value={status}
            onChange={onStatusChange}
          />
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <AppTypography.Text
            size={13}
            tone='muted'
            className='text-slate-600'
          >
            Tanggal:
          </AppTypography.Text>

          <AppSegmented
            size='sm'
            variant='outline'
            tone='primary'
            options={dateOptions}
            value={datePreset}
            onChange={onDatePresetChange}
          />
        </div>
      </div>
    </div>
  );
}
