"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { fetcher } from "../../../../../utils/fetcher";
import { ApiEndpoints } from "../../../../../../constrainst/endpoints";

/**
 * ViewModel halaman detail karyawan.
 * - Fetch detail user by id
 * - Bentuk data siap-tampil
 * - Tentukan permission (canEdit) -> bisa kamu override dari Context/prop sesuai role
 */
export default function useKaryawanDetailViewModel({ forceReadOnly = false } = {}) {
  const params = useParams(); // { id }
  const id = params?.id;

  const key = id ? ApiEndpoints.GetUserById(id) : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  });

  const user = data?.data || null;

  const profil = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id_user,
      foto: user.foto_profil_user || null,
      nama: user.nama_pengguna || "—",
      email: user.email || "—",
      divisi: user.departement?.nama_departement || user.divisi || "—",
      jabatan: user.jabatan?.nama_jabatan || "—",
      tempat_lahir: user.tempat_lahir || "—",
      tanggal_lahir: user.tanggal_lahir ? dayjs(user.tanggal_lahir) : null,
      jenis_kelamin: user.jenis_kelamin || "—",
      golongan_darah: user.golongan_darah || "—",
      status_perkawinan: user.status_perkawinan || "—",
      agama: user.agama || "—",
      zona_waktu: user.zona_waktu || "—",
      telepon: user.kontak || "—",
      alamatKtp: {
        alamat: user.alamat_ktp || "—",
        prov: user.alamat_ktp_provinsi || "—",
        kota: user.alamat_ktp_kota || "—",
      },
      alamatDom: {
        alamat: user.alamat_domisili || "—",
        prov: user.alamat_domisili_provinsi || "—",
        kota: user.alamat_domisili_kota || "—",
      },
      pendidikan: {
        jenjang: user.jenjang_pendidikan || "—",
        jurusan: user.jurusan || "—",
        institusi: user.nama_institusi_pendidikan || "—",
        tahun: user.tahun_lulus || "—",
      },
      kepegawaian: {
        nik: user.nomor_induk_karyawan || "—",
        status_kerja: user.status_kerja || "—",
        tgl_mulai: user.tanggal_mulai_bekerja ? dayjs(user.tanggal_mulai_bekerja) : null,
        lokasi: user.kantor?.nama_kantor || "—",
        bank: user.jenis_bank || "—",
        norek: user.nomor_rekening || "—",
      },
    };
  }, [user]);

  // Permission:
  // - Skenario sederhana: endpoint ini memang HR-only => jika sukses => HR => canEdit true.
  // - Jika kamu punya role dari Context, pass forceReadOnly=true untuk memaksa read-only.
  const canEdit = !forceReadOnly && !!user;
  const readonly = !canEdit;

  return {
    id,
    user,
    profil,
    loading: isLoading,
    error,
    refresh: mutate,
    canEdit,
    readonly,
  };
}
