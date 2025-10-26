// useKategoriKunjunganViewModel.js
"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";
import { crudService } from "@/app/utils/services/crudService";

// Pakai UTC agar tampilan waktu persis seperti yang tersimpan di DB
dayjs.extend(utc);

/**
 * Format nilai tanggal persis seperti di DB (jika string ISO dengan Z/offset),
 * selain itu gunakan parsing lokal standar.
 */
export const showFromDB = (v, fmt = "DD MMM YYYY HH:mm") => {
  if (!v) return "-";
  const s = String(v);
  // Jika ada HH:mm:ss dan ada suffix Z atau offset "+07:00" → treat as UTC literal
  if (/[T ]\d{2}:\d{2}:\d{2}/.test(s) && (s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s))) {
    return dayjs.utc(s).format(fmt);
  }
  return dayjs(s).format(fmt);
};

const EMPTY = Object.freeze([]);

// Helper DELETE kompatibel berbagai bentuk crudService
const callDelete = async (url) => {
  if (crudService && typeof crudService.del === "function") {
    return crudService.del(url);
  }
  if (crudService && typeof crudService.delete === "function") {
    return crudService.delete(url);
  }
  if (crudService && typeof crudService.remove === "function") {
    return crudService.remove(url);
  }
  return fetch(url, { method: "DELETE" });
};

// Helper PATCH (fallback ke PUT/POST jika PATCH tidak tersedia)
const callPatch = async (url, body = {}) => {
  if (crudService && typeof crudService.patch === "function") {
    return crudService.patch(url, body);
  }
  if (crudService && typeof crudService.put === "function") {
    return crudService.put(url, body);
  }
  if (crudService && typeof crudService.post === "function") {
    return crudService.post(url, body);
  }
  return fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};

export default function useKategoriKunjunganViewModel() {
  // === Filters & query state
  const [q, setQ] = useState("");
  // ON = tampilkan yang terhapus SAJA (hanya-deleted)
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // === Build list URL berdasarkan filter
  const listUrl = useMemo(() => {
    const p = new URLSearchParams();
    const qtrim = q.trim();
    if (qtrim) p.set("search", qtrim);

    // Saat toggle ON, kita minta includeDeleted=1 agar server kirim semua,
    // lalu client filter hanya yang terhapus (deleted_at != null)
    if (includeDeleted) p.set("includeDeleted", "1");

    p.set("orderBy", "created_at");
    p.set("sort", "desc");
    p.set("pageSize", "200");
    return `${ApiEndpoints.GetKategoriKunjungan}?${p.toString()}`;
  }, [q, includeDeleted]);

  // === Fetch list
  const { data: res, isLoading, mutate } = useSWR(listUrl, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  // Base rows dari server
  const baseRows = useMemo(() => (Array.isArray(res?.data) ? res.data : EMPTY), [res]);

  // Client-side filter:
  // - kalau includeDeleted = true -> tampilkan HANYA yang deleted (deleted_at != null)
  // - kalau false -> server memang sudah kirim only active (deleted_at null) karena kita tidak set includeDeleted
  const rows = useMemo(() => {
    if (!includeDeleted) return baseRows;
    return baseRows.filter((r) => !!r.deleted_at);
  }, [baseRows, includeDeleted]);

  // === Actions
  const refresh = useCallback(() => mutate(), [mutate]);

  const create = useCallback(
    async (kategori_kunjungan) => {
      const body = { kategori_kunjungan: kategori_kunjungan?.trim() || "" };
      const r = await crudService.post(ApiEndpoints.CreateKategoriKunjungan, body);
      await mutate();
      return r?.data ?? {};
    },
    [mutate]
  );

  const update = useCallback(
    async (id, kategori_kunjungan) => {
      await crudService.put(ApiEndpoints.UpdateKategoriKunjungan(id), {
        kategori_kunjungan: kategori_kunjungan?.trim() || "",
      });
      await mutate();
    },
    [mutate]
  );

  // Soft delete (default perilaku API; TIDAK mengubah API)
  const remove = useCallback(
    async (id) => {
      await callDelete(ApiEndpoints.DeleteKategoriKunjungan(id));
      await mutate();
    },
    [mutate]
  );

  // Hard delete dengan query ?hard=true (opsional; TIDAK mengubah API)
  const removeHard = useCallback(
    async (id) => {
      const url = `${ApiEndpoints.DeleteKategoriKunjungan(id)}?hard=true`;
      await callDelete(url);
      await mutate();
    },
    [mutate]
  );

  // Restore (butuh endpoint PATCH /kategori-kunjungan/[id]/restore)
  const restore = useCallback(
    async (id) => {
      const restoreUrl = ApiEndpoints.RestoreKategoriKunjungan
        ? ApiEndpoints.RestoreKategoriKunjungan(id)
        : `${ApiEndpoints.UpdateKategoriKunjungan(id)}/restore`;
      await callPatch(restoreUrl, {}); // body kosong
      await mutate();
    },
    [mutate]
  );

  return {
    loading: isLoading,
    rows,
    q,
    setQ,
    includeDeleted,
    setIncludeDeleted,
    refresh,
    create,
    update,
    remove,      // soft delete
    removeHard,  // hard delete
    restore,     // restore (kembalikan)
    showFromDB,
  };
}
