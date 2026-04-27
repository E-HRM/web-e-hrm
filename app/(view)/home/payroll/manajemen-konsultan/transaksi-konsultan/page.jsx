// app/(view)/home/payroll/transaksi-konsultan/page.jsx
'use client';

import { Suspense, lazy } from 'react';
import LoadingSplash from '@/app/(view)/component_shared/LoadingSplash';

const TransaksiKonsultanContent = lazy(() => import('./TransaksiKonsultanContent'));

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className='grid place-items-center min-h-[calc(100dvh-64px-56px)]'>
          <LoadingSplash
            label='Menyiapkan transaksi konsultan...'
            brand='#003A6F'
            size={124}
            fullscreen={false}
          />
        </div>
      }
    >
      <TransaksiKonsultanContent />
    </Suspense>
  );
}
