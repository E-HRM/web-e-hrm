// app/(view)/home/payroll/definisi-komponen-payroll/page.jsx
'use client';

import { Suspense, lazy } from 'react';

import LoadingSplash from '@/app/(view)/component_shared/LoadingSplash';

const DefinisiKomponenPayrollContent = lazy(() => import('./DefinisiKomponenPayrollContent'));

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className='grid place-items-center min-h-[calc(100dvh-64px-56px)]'>
          <LoadingSplash
            label='Menyiapkan definisi komponen payroll...'
            brand='#003A6F'
            size={124}
            fullscreen={false}
          />
        </div>
      }
    >
      <DefinisiKomponenPayrollContent />
    </Suspense>
  );
}
