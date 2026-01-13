'use client';

import React from 'react';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function StatCard({ title, value, trend, tone = 'neutral' }) {
  const toneClass = tone === 'primary' ? 'bg-[#E7B97A]/15 text-[#C99A5B] ring-[#E7B97A]/30' : 'bg-white text-gray-800 ring-gray-100';

  return (
    <div className={`rounded-2xl ring-1 ${toneClass} px-4 py-4`}>
      <AppTypography.Text
        size={14}
        weight={600}
        className='opacity-70'
      >
        {title}
      </AppTypography.Text>

      <div className='mt-2 flex items-baseline gap-2'>
        <AppTypography.Text
          size={30}
          weight={800}
          className='leading-none'
        >
          {value}
        </AppTypography.Text>

        {trend ? (
          <AppTypography.Text
            size={12}
            weight={500}
            className='opacity-70'
          >
            {trend}
          </AppTypography.Text>
        ) : null}
      </div>
    </div>
  );
}
