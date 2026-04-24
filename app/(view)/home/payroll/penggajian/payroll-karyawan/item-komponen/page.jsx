// app/(view)/home/payroll/penggajian/payroll-karyawan/item-komponen/page.jsx
import { lazy, Suspense } from 'react';

import LoadingSplash from '@/app/(view)/component_shared/LoadingSplash';

export const metadata = {
  title: 'Rincian Gaji Karyawan',
};

const ItemKomponenPayrollContent = lazy(() => import('./ItemKomponenPayrollContent'));

export default function ItemKomponenPayrollPage() {
  return (
    <Suspense
      fallback={
        <div className='grid place-items-center min-h-[calc(100dvh-64px-56px)]'>
          <LoadingSplash
            label='Menyiapkan rincian gaji karyawan...'
            brand='#003A6F'
            size={124}
            fullscreen={false}
          />
        </div>
      }
    >
      <ItemKomponenPayrollContent />
    </Suspense>
  );
}
