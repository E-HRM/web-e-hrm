"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App as AntdApp } from "antd";
import useSWR from "swr";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

export default function useKaryawanViewModel({ departementId }) {
  const { notification } = AntdApp.useApp();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Tentukan base URL list sesuai constraint:
  // - Jika ada departementId → /api/departements/:id/users
  // - (opsional) jika ingin fetch seluruh users tanpa departement, pakai ApiEndpoints.GetUsers
  const listBaseUrl = useMemo(() => {
    if (!departementId) return null;
    return ApiEndpoints.GetDepartementByUser(departementId);
  }, [departementId]);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    // Hanya kirimkan query umum (page, pageSize, search).
    // departementId tidak perlu dikirim karena sudah ada di path.
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (search.trim()) p.set("search", search.trim());
    return p.toString();
  }, [page, pageSize, search]);

  const swrKey = useMemo(() => {
    if (!listBaseUrl) return null;
    return `${listBaseUrl}?${qs}`;
  }, [listBaseUrl, qs]);

  const { data, isLoading, mutate } = useSWR(swrKey, fetcher);

  const rows = data?.data || [];
  const pagination = data?.pagination || { page, pageSize, total: rows.length };

  const fetchList = useCallback(() => mutate(), [mutate]);

  const onTableChange = useCallback((pg) => {
    setPage(pg.current);
    setPageSize(pg.pageSize);
  }, []);

  useEffect(() => {
    if (!departementId) return;
    fetchList();
  }, [departementId, fetchList]);

  // CRUD (patuh constraint ApiEndpoints.*)
  const addKaryawan = useCallback(
    async (payload) => {
      try {
        await crudService.post(ApiEndpoints.CreateUser, payload);
        notification.success({
          message: "Berhasil",
          description: "Karyawan dibuat.",
        });
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

  const updateKaryawan = useCallback(
    async (id, payload) => {
      try {
        await crudService.put(ApiEndpoints.UpdateUser(id), payload);
        notification.success({
          message: "Berhasil",
          description: "Karyawan diperbarui.",
        });
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

  const deleteKaryawan = useCallback(
    async (id) => {
      try {
        await crudService.delete(ApiEndpoints.DeleteUser(id));
        notification.success({
          message: "Berhasil",
          description: "Karyawan dihapus.",
        });
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
  };
}
