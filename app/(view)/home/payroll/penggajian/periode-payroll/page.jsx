'use client';

import { Suspense, lazy } from 'react';

import LoadingSplash from '@/app/(view)/component_shared/LoadingSplash';

const PeriodePayrollContent = lazy(() => import('./PeriodePayrollContent'));

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className='grid min-h-[calc(100dvh-64px-56px)] place-items-center'>
          <LoadingSplash
            label='Menyiapkan periode payroll...'
            brand='#003A6F'
            size={124}
            fullscreen={false}
          />
        </div>
      }
    >
      <PeriodePayrollContent />
    </Suspense>
  );
}
