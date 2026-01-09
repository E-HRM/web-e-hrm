'use client';

import React from 'react';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function MiniStat({ label = '-', value = '—' }) {
  return (
    <div className='rounded-2xl ring-1 ring-gray-100 bg-white px-4 py-4'>
      <AppTypography.Text
        tone='muted'
        size={12}
        weight={500}
        className='tracking-wide text-gray-500'
      >
        {label}
      </AppTypography.Text>

      <div className='mt-1'>
        <AppTypography.Text
          tone='primary'
          size={28}
          weight={700}
          lineHeight={1.1}
          className='text-gray-900'
        >
          {value}
        </AppTypography.Text>
      </div>
    </div>
  );
}
