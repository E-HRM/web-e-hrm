"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";

const DEFAULT_FROM = dayjs().startOf("week").add(1, "day");
const DEFAULT_TO = dayjs(DEFAULT_FROM).add(6, "day");

const EMPTY = Object.freeze([]);

export default function useAgendaViewModel() {
  const [filters, setFilters] = useState({
    user_id: "",
    id_agenda: "",
    status: "",
    q: "",
    // pakai string polos supaya server tidak geser TZ
    from: DEFAULT_FROM.startOf("day").format("YYYY-MM-DD HH:mm:ss"),
    to: DEFAULT_TO.endOf("day").format("YYYY-MM-DD HH:mm:ss"),
  });

  /* ===== Ambil SEMUA user (paginate) ===== */
  const fetchAllUsers = useCallback(async () => {
    const perPage = 100; // aman & ringan; loop sampai habis
    let page = 1;
    const all = [];

    while (true) {
      const url = `${ApiEndpoints.GetUsers}?page=${page}&perPage=${perPage}&orderBy=nama_pengguna&sort=asc`;
      const json = await fetcher(url);

      const items = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.items)
        ? json.items
        : [];

      all.push(...items);

      // coba baca totalPages dari beberapa kemungkinan shape
      const totalPages =
        json?.pagination?.totalPages ?? json?.meta?.totalPages ?? null;

      if (totalPages) {
        if (page >= totalPages) break;
        page += 1;
      } else {
        // fallback: berhenti kalau sudah kurang dari perPage
        if (items.length < perPage) break;
        page += 1;
      }
    }

    return all;
  }, []);

  const { data: usersAll } = useSWR("agenda:users:allpages", fetchAllUsers, {
    revalidateOnFocus: false,
  });

  const userOptions = useMemo(
    () =>
      (Array.isArray(usersAll) ? usersAll : EMPTY).map((u) => ({
        value: u.id_user,
        label: u.nama_pengguna || u.email || u.id_user,
      })),
    [usersAll]
  );

  /* ===== Master Agenda (proyek) ===== */
  const { data: agendaRes } = useSWR(
    `${ApiEndpoints.GetAgenda}?perPage=200`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const agendaOptions = useMemo(
    () =>
      (Array.isArray(agendaRes?.data) ? agendaRes.data : EMPTY).map((a) => ({
        value: a.id_agenda,
        label: a.nama_agenda,
      })),
    [agendaRes]
  );

  /* ===== List agenda kerja ===== */
  const listUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.user_id) p.set("user_id", filters.user_id);
    if (filters.id_agenda) p.set("id_agenda", filters.id_agenda);
    if (filters.status) p.set("status", filters.status);
    if (filters.from) p.set("from", filters.from);
    if (filters.to) p.set("to", filters.to);
    if (filters.q) p.set("q", filters.q);
    p.set("perPage", "500");
    return `${ApiEndpoints.GetAgendaKerja}?${p.toString()}`;
  }, [
    filters.user_id,
    filters.id_agenda,
    filters.status,
    filters.from,
    filters.to,
    filters.q,
  ]);

  const { data, isLoading, mutate } = useSWR(listUrl, fetcher, {
    revalidateOnFocus: false,
  });
  const rows = useMemo(
    () => (Array.isArray(data?.data) ? data.data : EMPTY),
    [data]
  );

  const masterRows = useMemo(() => {
    const byUser = new Map();
    for (const r of rows) {
      const uid = r.user?.id_user || "UNKNOWN";
      const entry =
        byUser.get(uid) || {
          id_user: uid,
          nama: r.user?.nama_pengguna || r.user?.email || uid,
          email: r.user?.email || "",
          rows: [],
        };
      entry.rows.push(r);
      byUser.set(uid, entry);
    }
    for (const v of byUser.values()) {
      v.count = v.rows.length;
      v.duration = v.rows.reduce(
        (acc, it) => acc + (it.duration_seconds || 0),
        0
      );
    }
    return Array.from(byUser.values()).sort((a, b) =>
      a.nama.localeCompare(b.nama)
    );
  }, [rows]);

  const refresh = () => mutate();

  const remove = async (id, { hard = false } = {}) => {
    const url = ApiEndpoints.DeleteAgendaKerja(id) + (hard ? "?hard=1" : "");
    const delFn = crudService.del || crudService.delete;
    await delFn(url);
    await mutate();
  };

  const update = async (id, payload) => {
    await crudService.put(ApiEndpoints.UpdateAgendaKerja(id), payload);
    await mutate();
  };

  return {
    loading: isLoading,
    rows,
    masterRows,
    userOptions,
    agendaOptions,
    filters,
    setFilters,
    refresh,
    remove,
    update,
  };
}
