"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App as AntdApp } from "antd";
import useSWR from "swr";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";

const API_USERS = "/api/users";

export default function useKaryawanViewModel({ departementId }) {
  const { notification } = AntdApp.useApp();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("departementId", departementId || "");
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (search.trim()) p.set("search", search.trim());
    return p.toString();
  }, [departementId, page, pageSize, search]);

  const { data, isLoading, mutate } = useSWR(
    departementId ? `${API_USERS}?${qs}` : null,
    fetcher
  );

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

  // CRUD
  const addKaryawan = useCallback(async (payload) => {
    try {
      await crudService.post(API_USERS, payload);
      notification.success({ message: "Berhasil", description: "Karyawan dibuat." });
      await fetchList();
    } catch (err) {
      notification.error({ message: "Gagal menambah", description: err?.message || "Tidak dapat menambah karyawan" });
      throw err;
    }
  }, [fetchList, notification]);

  const updateKaryawan = useCallback(async (id, payload) => {
    try {
      await crudService.put(`${API_USERS}/${id}`, payload);
      notification.success({ message: "Berhasil", description: "Karyawan diperbarui." });
      await fetchList();
    } catch (err) {
      notification.error({ message: "Gagal mengubah", description: err?.message || "Tidak dapat mengubah karyawan" });
      throw err;
    }
  }, [fetchList, notification]);

  const deleteKaryawan = useCallback(async (id) => {
    try {
      await crudService.delete(`${API_USERS}/${id}`);
      notification.success({ message: "Berhasil", description: "Karyawan dihapus." });
      await fetchList();
    } catch (err) {
      notification.error({ message: "Gagal menghapus", description: err?.message || "Tidak dapat menghapus karyawan" });
      throw err;
    }
  }, [fetchList, notification]);

  return {
    rows,
    loading: isLoading,
    pagination: { page, pageSize, total: pagination.total },
    onTableChange,
    search, setSearch,
    fetchList,
    addKaryawan, updateKaryawan, deleteKaryawan,
  };
}
