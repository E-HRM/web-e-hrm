'use client';

import React, { useMemo } from 'react';

import AppInput from '@/app/(view)/component_shared/AppInput';
import AppSegmented from '@/app/(view)/component_shared/AppSegmented';
import AppTypography from '@/app/(view)/component_shared/AppTypography';
import AppDatePicker from '@/app/(view)/component_shared/AppDatePicker';

import { SearchOutlined, CalendarOutlined } from '@ant-design/icons';

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

  const dateModeOptions = useMemo(
    () => [
      { label: 'All', value: 'ALL' },
      { label: 'Select Date', value: 'CUSTOM' },
    ],
    []
  );

  return (
    <div className='flex flex-col gap-4'>
      <AppInput
        allowClear
        placeholder='Cari karyawan atau nomor pengajuan…'
        prefixIcon={<SearchOutlined className='text-gray-400' />}
        value={search}
        onChange={(e) => onSearchChange?.(e.target.value)}
      />

      <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-2'>
          <AppTypography.Text className='text-gray-600'>Status:</AppTypography.Text>
          <AppSegmented
            options={statusOptions}
            value={status || 'ALL'}
            onChange={(v) => onStatusChange?.(String(v))}
          />
        </div>

        <div className='flex flex-col gap-2'>
          <AppTypography.Text className='text-gray-600'>Tanggal:</AppTypography.Text>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
            <AppSegmented
              options={dateModeOptions}
              value={dateMode || 'ALL'}
              onChange={(v) => {
                const mode = String(v);
                onDateModeChange?.(mode);
                if (mode !== 'CUSTOM') onDateRangeChange?.(null);
              }}
            />

            {String(dateMode) === 'CUSTOM' ? (
              <div className='min-w-[260px]'>
                <AppDatePicker.RangePicker
                  allowClear
                  placeholder={['Dari', 'Sampai']}
                  value={Array.isArray(dateRange) ? dateRange : null}
                  onChange={(values) => {
                    onDateRangeChange?.(values || null);
                  }}
                  prefix={<CalendarOutlined className='text-gray-400' />}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
