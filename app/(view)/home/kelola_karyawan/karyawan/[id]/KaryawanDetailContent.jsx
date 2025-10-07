// app/(view)/home/kelola_karyawan/karyawan/[id]/KaryawanDetailContent.jsx
"use client";
import KaryawanProfileForm from "../../../../../components/form/KaryawanForm"
import { useParams } from "next/navigation";

export default function KaryawanDetailContent() {
  const { id } = useParams(); // Next 13/14
  return <KaryawanProfileForm mode="view" id={id} forceReadOnly={false} />;
}
