'use client';

import { Suspense, lazy } from 'react';
import LoadingSplash from '@/app/(view)/component_shared/LoadingSplash';

const DetailFreelance = lazy(() => import('./DetailFreelance'));

export default function Page({ params }) {
  return (
    <Suspense
      fallback={
        <div className='grid min-h-[calc(100dvh-64px-56px)] place-items-center'>
          <LoadingSplash
            label='Menyiapkan Detail Freelance...'
            brand='#003A6F'
            size={124}
            fullscreen={false}
          />
        </div>
      }
    >
      <DetailFreelance freelanceId={params?.id} />
    </Suspense>
  );
}
