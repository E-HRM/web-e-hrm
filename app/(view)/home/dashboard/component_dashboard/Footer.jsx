'use client';

import React from 'react';
import AppTypography from '@/app/(view)/component_shared/AppTypography';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className='w-full bg-white border-t border-gray-200 '>
      <div className='mx-auto px-4 md:px-6 lg:px-8 h-12 flex items-center justify-center'>
        <AppTypography.Text
          tone='muted'
          size={12}
          weight={500}
          className='antialiased tracking-wide'
        >
          <span className='font-semibold tracking-wider text-gray-800'>OSS</span>
          <span className='mx-2 text-gray-300'>•</span>
          <span>© {year}</span>
        </AppTypography.Text>
      </div>
    </footer>
  );
}
