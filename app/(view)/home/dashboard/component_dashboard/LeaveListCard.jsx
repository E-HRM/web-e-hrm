'use client';

import React from 'react';
import AppAvatar from '@/app/(view)/component_shared/AppAvatar';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function LeaveListCard({ items = [], title = 'Karyawan Cuti', countLabel = '5/12', emptyLabel = 'Belum ada data' }) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className='rounded-2xl bg-white ring-1 ring-gray-100 p-4'>
      <div className='flex items-center justify-between'>
        <AppTypography.Text
          size={14}
          weight={600}
          className='text-gray-900'
        >
          {title}
        </AppTypography.Text>

        <span className='text-xs rounded-full bg-emerald-50 text-emerald-700 px-2 py-1'>{countLabel}</span>
      </div>

      {safeItems.length === 0 ? (
        <div className='mt-4'>
          <AppTypography.Text
            size={12}
            tone='muted'
            className='text-gray-500'
          >
            {emptyLabel}
          </AppTypography.Text>
        </div>
      ) : (
        <ul className='mt-4 space-y-3'>
          {safeItems.map((it, i) => {
            const key = it?.id ?? it?.userId ?? it?.name ?? i;
            const name = it?.name ?? '-';
            const avatar = it?.avatar ?? undefined;
            const days = it?.days ?? '—';

            return (
              <li
                key={key}
                className='flex items-center justify-between'
              >
                <div className='flex items-center gap-3'>
                  <AppAvatar
                    size={32}
                    src={avatar}
                    alt={name}
                    name={name}
                    bordered={false}
                    className='ring-1 ring-gray-200'
                  />

                  <AppTypography.Text
                    size={14}
                    className='text-gray-800'
                  >
                    {name}
                  </AppTypography.Text>
                </div>

                <span className='text-xs rounded-full bg-rose-50 text-rose-600 px-2 py-1'>{days}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
