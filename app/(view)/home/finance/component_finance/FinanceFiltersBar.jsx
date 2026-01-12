'use client';

import React, { useMemo } from 'react';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSegmented from '@/app/(view)/component_shared/AppSegmented';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppDatePicker from '@/app/(view)/component_shared/AppDatePicker';

export default function FinanceFiltersBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  dateMode,
  onDateModeChange,
  dateRange,
  onDateRangeChange,
}) {
  const statusOptions = useMemo(
    () => [
      { label: 'Semua', value: 'ALL' },
      { label: 'Pending', value: 'PENDING' },
      { label: 'Approved', value: 'APPROVED' },
      { label: 'Rejected', value: 'REJECTED' },
    ],
    []
  );

  const dateOptions = useMemo(
    () => [
      { label: 'All', value: 'ALL' },
      { label: 'Select Date', value: 'DATE' },
    ],
    []
  );

  const mergedRange = useMemo(() => {
    const v0 = dateRange?.[0] || null;
    const v1 = dateRange?.[1] || null;
    // antd RangePicker value harus dayjs atau null
    return [
      v0 && dayjs.isDayjs(v0) ? v0 : v0 ? dayjs(v0) : null,
      v1 && dayjs.isDayjs(v1) ? v1 : v1 ? dayjs(v1) : null,
    ];
  }, [dateRange]);

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
          <AppTypography.Text size={13} tone='muted' className='text-slate-600'>
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
          <AppTypography.Text size={13} tone='muted' className='text-slate-600'>
            Tanggal:
          </AppTypography.Text>

          <AppSegmented
            size='sm'
            variant='outline'
            tone='primary'
            options={dateOptions}
            value={dateMode}
            onChange={onDateModeChange}
          />

          {String(dateMode || 'ALL').toUpperCase() === 'DATE' ? (
            <div className='min-w-[280px]'>
              <AppDatePicker.RangePicker
                value={mergedRange}
                onChange={(vals) => onDateRangeChange?.(vals || [null, null])}
                placeholder={['Pilih tanggal', 'Sampai']}
                allowEmpty={[false, true]}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
