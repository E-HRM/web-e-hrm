// app/(view)/home/payroll/payroll-karyawan/page.jsx
'use client';

import { Suspense, lazy } from 'react';

import LoadingSplash from '@/app/(view)/component_shared/LoadingSplash';

const PayrollKaryawanContent = lazy(() => import('./PayrollKaryawanContent'));

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className='grid place-items-center min-h-[calc(100dvh-64px-56px)]'>
          <LoadingSplash
            label='Menyiapkan data penggajian karyawan...'
            brand='#003A6F'
            size={124}
            fullscreen={false}
          />
        </div>
      }
    >
      <PayrollKaryawanContent />
    </Suspense>
  );
}
