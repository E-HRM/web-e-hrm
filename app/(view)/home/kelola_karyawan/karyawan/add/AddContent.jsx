"use client";
import { useRouter } from "next/navigation";
import KaryawanProfileForm from "../../../../../components/form/KaryawanForm"
export default function AddContent() {
  const router = useRouter();
  return (
    <KaryawanProfileForm
      mode="add"
      onSuccess={(u) =>
        router.replace(
          u?.id_user
            ? `/home/kelola_karyawan/karyawan/${u.id_user}`
            : `/home/kelola_karyawan/karyawan`
        )
      }
    />
  );
}
