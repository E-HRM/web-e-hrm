'use client';

import { Suspense, lazy } from 'react';

import LoadingSplash from '@/app/(view)/component_shared/LoadingSplash';

const ManajemenKaryawanPayrollContent = lazy(() => import('./ManajemenKaryawanPayrollContent'));

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className='grid place-items-center min-h-[calc(100dvh-64px-56px)]'>
          <LoadingSplash
            label='Menyiapkan manajemen karyawan payroll...'
            brand='#003A6F'
            size={124}
            fullscreen={false}
          />
        </div>
      }
    >
      <ManajemenKaryawanPayrollContent />
    </Suspense>
  );
}
