// app/(view)/home/payroll/payout-konsultan/page.jsx
'use client';

import { Suspense, lazy } from 'react';

import LoadingSplash from '@/app/(view)/component_shared/LoadingSplash';

const PayoutKonsultanContent = lazy(() => import('./PayoutKonsultanContent'));

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className='grid place-items-center min-h-[calc(100dvh-64px-56px)]'>
          <LoadingSplash
            label='Menyiapkan payout konsultan...'
            brand='#003A6F'
            size={124}
            fullscreen={false}
          />
        </div>
      }
    >
      <PayoutKonsultanContent />
    </Suspense>
  );
}
