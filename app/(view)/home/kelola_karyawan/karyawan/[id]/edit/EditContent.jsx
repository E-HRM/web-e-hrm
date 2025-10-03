// app/(view)/home/kelola_karyawan/karyawan/[id]/edit/EditContent.jsx
"use client";
import { useRouter, useParams } from "next/navigation";
import KaryawanProfileForm from "../../../../../../components/form/KaryawanForm"

export default function EditContent() {
  const router = useRouter();
  const { id } = useParams();
  return (
    <KaryawanProfileForm
      mode="edit"
      id={id}
      onSuccess={() => router.replace(`/home/kelola_karyawan/karyawan/${id}`)}
    />
  );
}
