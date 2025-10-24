"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";

const EMPTY = Object.freeze([]);

/**
 * ViewModel untuk halaman Proyek.
 * - Hanya menampilkan user yang belum soft-delete (deleted_at == null)
 * - Anggota proyek dihitung dari aktivitas (agenda kerja) dan difilter user aktif saja
 * - Ada helper untuk modal +N lainnya (ambil semua nama anggota aktif)
 */
export default function useProyekViewModel() {
  // query & filter
  const [q, setQ] = useState("");
  const [filterUserId, setFilterUserId] = useState("");

  /* ================= Users (aktif saja) ================= */
  const { data: usersRes } = useSWR(
    `${ApiEndpoints.GetUsers}?page=1&pageSize=1000&includeDeleted=0&orderBy=nama_pengguna&sort=asc`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const usersRaw = useMemo(
    () => (Array.isArray(usersRes?.data) ? usersRes.data : EMPTY),
    [usersRes]
  );
  const users = useMemo(
    () => usersRaw.filter((u) => !u?.deleted_at),
    [usersRaw]
  );

  const userMap = useMemo(() => {
    const m = new Map();
    for (const u of users) m.set(u.id_user, u);
    return m;
  }, [users]);

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id_user,
        label: u.nama_pengguna || u.email || u.id_user,
      })),
    [users]
  );

  const userName = (id) => {
    const u = userMap.get(id);
    return u?.nama_pengguna || u?.email || id;
  };

  const activeUserIdSet = useMemo(
    () => new Set(users.map((u) => u.id_user)),
    [users]
  );

  /* ================= Daftar Proyek ================= */
  const listUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    p.set("perPage", "200");
    return `${ApiEndpoints.GetAgenda}?${p.toString()}`;
  }, [q]);

  const {
    data: agendaRes,
    isLoading: loadingAgenda,
    mutate,
  } = useSWR(listUrl, fetcher, { revalidateOnFocus: false });

  const rows = useMemo(
    () => (Array.isArray(agendaRes?.data) ? agendaRes.data : EMPTY),
    [agendaRes]
  );

  /* ================= Aktivitas (untuk anggota proyek) ================= */
  const { data: aktRes } = useSWR(
    `${ApiEndpoints.GetAgendaKerja}?perPage=1000`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const aktivitas = useMemo(
    () => (Array.isArray(aktRes?.data) ? aktRes.data : EMPTY),
    [aktRes]
  );

  // id_agenda -> Set<id_user aktif>
  const membersMap = useMemo(() => {
    const map = new Map();
    for (const r of aktivitas) {
      const agendaId = r?.id_agenda;
      const uid = r?.user?.id_user;
      if (!agendaId || !uid) continue;
      if (!activeUserIdSet.has(uid)) continue; // skip user soft-delete
      if (!map.has(agendaId)) map.set(agendaId, new Set());
      map.get(agendaId).add(uid);
    }
    return map;
  }, [aktivitas, activeUserIdSet]);

  /** Kembalikan NAMA anggota aktif untuk sebuah proyek. */
  const membersNames = (agendaId) => {
    const set = membersMap.get(agendaId);
    if (!set || set.size === 0) return [];
    return Array.from(set).map((uid) => userName(uid));
  };

  /* ================= Filter bar (by user + q) ================= */
  const filteredRows = useMemo(() => {
    let xs = rows;

    if (filterUserId) {
      xs = xs.filter((ag) => {
        const set = membersMap.get(ag.id_agenda);
        return set ? set.has(filterUserId) : false;
      });
    }

    const qq = (q || "").trim().toLowerCase();
    if (qq) xs = xs.filter((ag) => (ag.nama_agenda || "").toLowerCase().includes(qq));

    return xs;
  }, [rows, filterUserId, q, membersMap]);

  /* ================= Actions (CRUD Proyek) ================= */
  const refresh = () => mutate();

  const create = async (nama_agenda) => {
    const res = await crudService.post(ApiEndpoints.CreateAgenda, { nama_agenda });
    await mutate();
    return res?.data || {};
  };

  const update = async (id, nama_agenda) => {
    const put = crudService.put || crudService.patch;
    await put(ApiEndpoints.UpdateAgenda(id), { nama_agenda });
    await mutate();
  };

  const remove = async (id, { hard = false } = {}) => {
    const url = ApiEndpoints.DeleteAgenda(id) + (hard ? "?hard=1" : "");
    const del = crudService.del || crudService.delete;
    await del(url);
    await mutate();
  };

  return {
    // data
    loading: loadingAgenda,
    rows,
    filteredRows,

    // search/filter state
    q,
    setQ,
    filterUserId,
    setFilterUserId,

    // users & anggota
    userOptions,
    membersNames,

    // actions
    refresh,
    create,
    update,
    remove,
  };
}
