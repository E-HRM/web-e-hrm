"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App as AntdApp } from "antd";
import useSWR from "swr";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

export default function useKaryawanViewModel({ departementId, departementName }) {
  const { notification } = AntdApp.useApp();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // list users by departement
  const listBaseUrl = useMemo(() => {
    if (!departementId) return null;
    return ApiEndpoints.GetDepartementByUser(departementId);
  }, [departementId]);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (search.trim()) p.set("search", search.trim());
    return p.toString();
  }, [page, pageSize, search]);

  const swrKey = listBaseUrl ? `${listBaseUrl}?${qs}` : null;
  const { data, isLoading, mutate } = useSWR(swrKey, fetcher);

  // rows + fallback nama_departement (kalau API belum join)
  const rows = (data?.data || []).map((r) => ({
    ...r,
    departement:
      r.departement || (departementName ? { nama_departement: departementName } : undefined),
  }));

  const apiPagination = data?.pagination;
  const pagination = apiPagination || { page, pageSize, total: rows.length };

  const fetchList = useCallback(() => mutate(), [mutate]);

  const onTableChange = useCallback((pg) => {
    setPage(pg.current);
    setPageSize(pg.pageSize);
  }, []);

  useEffect(() => {
    if (!departementId) return;
    fetchList();
  }, [departementId, fetchList]);

  /* =========================
     LOKASI (untuk Select)
     ========================= */
  const { data: locData, isLoading: locationLoading } = useSWR(
    `${ApiEndpoints.GetLocation}?page=1&pageSize=100`,
    fetcher
  );

  const locationOptions = useMemo(() => {
    const arr = locData?.data || [];
    return arr.map((it) => ({
      value: it.id_location,
      label: it.nama_kantor,
    }));
  }, [locData]);

  /* =========================
     CRUD
     ========================= */

  // CREATE → (pakai endpoint register sesuai mapping CreateUser)
  // pastikan di ApiEndpoints: CreateUser = "/api/auth/register"
  const addKaryawan = useCallback(
    async (payload) => {
      try {
        await crudService.post(ApiEndpoints.CreateUser, payload);
        notification.success({ message: "Berhasil", description: "Karyawan dibuat." });
        await fetchList();
      } catch (err) {
        notification.error({
          message: "Gagal menambah",
          description: err?.message || "Tidak dapat menambah karyawan",
        });
        throw err;
      }
    },
    [fetchList, notification]
  );

  // UPDATE → /api/users/[id] (PUT)
  const updateKaryawan = useCallback(
    async (id, payload) => {
      try {
        await crudService.put(ApiEndpoints.UpdateUser(id), payload);
        notification.success({ message: "Berhasil", description: "Karyawan diperbarui." });
        await fetchList();
      } catch (err) {
        notification.error({
          message: "Gagal mengubah",
          description: err?.message || "Tidak dapat mengubah karyawan",
        });
        throw err;
      }
    },
    [fetchList, notification]
  );

  // DELETE (opsional)
  const deleteKaryawan = useCallback(
    async (id) => {
      try {
        await crudService.delete(ApiEndpoints.DeleteUser(id));
        notification.success({ message: "Berhasil", description: "Karyawan dihapus." });
        await fetchList();
      } catch (err) {
        notification.error({
          message: "Gagal menghapus",
          description: err?.message || "Tidak dapat menghapus karyawan",
        });
        throw err;
      }
    },
    [fetchList, notification]
  );

  return {
    rows,
    loading: isLoading,
    pagination: { page, pageSize, total: pagination.total },
    onTableChange,
    search,
    setSearch,
    fetchList,
    addKaryawan,
    updateKaryawan,
    deleteKaryawan,

    // lokasi
    locationOptions,
    locationLoading,
  };
}
