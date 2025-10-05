"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { App as AntdApp } from "antd";
import { fetcher } from "../../../../utils/fetcher";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";  

/**
 * Ambil karyawan asli berdasarkan departemen (tanpa CRUD)
 * Sumber: GET /api/admin/departements/:id/users
 */
export default function useDetailKunjunganViewModel({
  departementId,
  departementName,
}) {
  const router = useRouter();
  const { notification } = AntdApp.useApp();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(24);

  // ✅ base URL ambil dari constraint
  const listBaseUrl = useMemo(() => {
    if (!departementId) return null;
    return ApiEndpoints.GetDepartementByUser(departementId);
  }, [departementId]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (search.trim()) p.set("search", search.trim());
    return p.toString();
  }, [page, pageSize, search]);

  const swrKey = listBaseUrl ? `${listBaseUrl}?${query}` : null;
  const { data, isLoading, mutate, error } = useSWR(swrKey, fetcher);

  useEffect(() => {
    if (error) {
      notification.error({
        message: "Gagal memuat karyawan",
        description: error?.message || "Terjadi kesalahan memuat data karyawan.",
      });
    }
  }, [error, notification]);

  // ✅ mapping hasil API user → data kartu
  const employees = useMemo(() => {
    const arr = data?.data || [];
    return arr.map((u) => ({
      id: u.id_user,
      name: u.nama_pengguna,
      email: u.email,
      phone: u.kontak,
      role: u.role,
      avatarUrl: u.foto_profil_user || "/avatar.png",
      visitsCount: undefined,
      lastVisitAt: undefined,
    }));
  }, [data]);

  const refresh = useCallback(() => mutate(), [mutate]);

  const openDetail = useCallback(
    (employee) => {
      router.push(
        `/home/kunjungan/detail_kunjungan?user=${encodeURIComponent(
          employee?.id || ""
        )}&name=${encodeURIComponent(employee?.name || "")}`
      );
    },
    [router]
  );

  const back = useCallback(() => router.back(), [router]);

  return {
    departementName,
    employees,
    loading: isLoading,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    page,
    setPage,
    refresh,
    openDetail,
    back,
  };
}
