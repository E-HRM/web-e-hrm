// app/(view)/home/kelola_karyawan/karyawan/[id]/edit/EditContent.jsx
'use client';

import { useRouter, useParams } from 'next/navigation';
import KaryawanProfileForm from '../../component_karyawan/KaryawanForm';

export default function EditContent() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return (
    <KaryawanProfileForm
      mode='edit'
      id={id}
      onSuccess={() => router.replace(`/home/kelola_karyawan/karyawan/${id}`)}
    />
  );
}
