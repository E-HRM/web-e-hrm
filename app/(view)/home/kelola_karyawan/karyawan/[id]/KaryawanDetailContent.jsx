// app/(view)/home/kelola_karyawan/karyawan/[id]/KaryawanDetailContent.jsx
'use client';

import { useParams } from 'next/navigation';
import KaryawanProfileForm from '../component_karyawan/KaryawanForm';

export default function KaryawanDetailContent() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return (
    <KaryawanProfileForm
      mode='view'
      id={id}
      forceReadOnly={false}
    />
  );
}
