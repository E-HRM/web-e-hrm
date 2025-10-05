"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";
import { crudService } from "@/app/utils/services/crudService";

dayjs.extend(utc);

/** Tampilkan waktu persis seperti di DB (tanpa geser zona). */
export const showFromDB = (v, fmt = "DD MMM YYYY HH:mm") => {
  if (!v) return "-";
  const s = String(v);
  if (/[T ]\d{2}:\d{2}:\d{2}/.test(s) && (s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s))) {
    return dayjs.utc(s).format(fmt);
  }
  return dayjs(s).format(fmt);
};

const EMPTY = Object.freeze([]);

export default function useKategoriKunjunganViewModel() {
  // filters
  const [q, setQ] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // list URL
  const listUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("search", q.trim());
    if (includeDeleted) p.set("includeDeleted", "1");
    p.set("orderBy", "created_at");
    p.set("sort", "desc");
    p.set("pageSize", "200");
    return `${ApiEndpoints.GetKategoriKunjungan}?${p.toString()}`;
  }, [q, includeDeleted]);

  // fetch list
  const { data: res, isLoading, mutate } = useSWR(listUrl, fetcher, { revalidateOnFocus: false });
  const rows = useMemo(() => (Array.isArray(res?.data) ? res.data : EMPTY), [res]);

  // actions
  const refresh = useCallback(() => mutate(), [mutate]);

  const create = useCallback(async (kategori_kunjungan) => {
    const body = { kategori_kunjungan: kategori_kunjungan?.trim() };
    const res = await crudService.post(ApiEndpoints.CreateKategoriKunjungan, body);
    await mutate();
    return res?.data || {};
  }, [mutate]);

  const update = useCallback(async (id, kategori_kunjungan) => {
    await crudService.put(ApiEndpoints.UpdateKategoriKunjungan(id), {
      kategori_kunjungan: kategori_kunjungan?.trim(),
    });
    await mutate();
  }, [mutate]);

  const remove = useCallback(async (id) => {
    // API melakukan soft delete (set deleted_at)
    await crudService.del(ApiEndpoints.DeleteKategoriKunjungan(id));
    await mutate();
  }, [mutate]);

  return {
    loading: isLoading,
    rows,
    q, setQ,
    includeDeleted, setIncludeDeleted,
    refresh, create, update, remove,
    showFromDB,
  };
}
