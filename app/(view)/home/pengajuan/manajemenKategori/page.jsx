'use client';

import { Suspense, lazy } from 'react';
import LoadingSplash from '../../../component_shared/LoadingSplash';

const BRAND = '#003A6F';
const ManajemenKategori = lazy(() => import('./ManajemenKategoriContent'));

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className='grid place-items-center min-h-[calc(100dvh-64px-56px)]'>
          <LoadingSplash
            label='Menyiapkan Halaman…'
            brand={BRAND}
            size={124}
            fullscreen={false}
          />
        </div>
      }
    >
      <ManajemenKategori />
    </Suspense>
  );
}
