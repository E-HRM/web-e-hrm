"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";

// referensi stabil biar lolos eslint react-hooks/exhaustive-deps
const EMPTY = Object.freeze([]);

export default function useProyekViewModel() {
  // query & pagination (kalau nanti mau dipakai)
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const listUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    p.set("page", String(page));
    p.set("perPage", String(perPage));
    return `${ApiEndpoints.GetAgenda}?${p.toString()}`;
  }, [q, page, perPage]);

  const { data, isLoading, mutate, error } = useSWR(listUrl, fetcher, { revalidateOnFocus: false });

  const rows = useMemo(() => (Array.isArray(data?.data) ? data.data : EMPTY), [data]);
  const meta = data?.meta ?? { page, perPage, total: rows.length, totalPages: 1 };

  const refresh = () => mutate();

  const create = async (nama_agenda) => {
    await crudService.post(ApiEndpoints.CreateAgenda, { nama_agenda });
    await mutate();
  };

  const update = async (id, nama_agenda) => {
    await crudService.patch(ApiEndpoints.UpdateAgenda(id), { nama_agenda });
    await mutate();
  };

  // soft delete secara default
  const remove = async (id, { hard = false } = {}) => {
    const url = ApiEndpoints.DeleteAgenda(id) + (hard ? "?hard=1" : "");
    await crudService.del(url);
    await mutate();
  };

  return {
    // state
    loading: isLoading,
    error,
    rows,
    meta,

    // query
    q, setQ,
    page, setPage,
    perPage, setPerPage,

    // actions
    refresh,
    create,
    update,
    remove,
  };
}
