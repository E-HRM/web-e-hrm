"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";

const EMPTY = Object.freeze([]);

export default function useProyekViewModel() {
  // query & filter
  const [q, setQ] = useState("");
  const [filterUserId, setFilterUserId] = useState("");

  // Users (untuk opsi filter karyawan & render anggota)
  const { data: usersRes } = useSWR(ApiEndpoints.GetUsers, fetcher, { revalidateOnFocus: false });
  const users = useMemo(() => (Array.isArray(usersRes?.data) ? usersRes.data : EMPTY), [usersRes]);
  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.id_user, label: u.nama_pengguna || u.email || u.id_user })),
    [users]
  );
  const userName = (id) =>
    users.find((u) => u.id_user === id)?.nama_pengguna || users.find((u) => u.id_user === id)?.email || id;

  // Daftar proyek
  const listUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    p.set("perPage", "200");
    return `${ApiEndpoints.GetAgenda}?${p.toString()}`;
  }, [q]);
  const { data: agendaRes, isLoading: loadingAgenda, mutate } = useSWR(listUrl, fetcher, { revalidateOnFocus: false });
  const rows = useMemo(() => (Array.isArray(agendaRes?.data) ? agendaRes.data : EMPTY), [agendaRes]);

  // Ambil semua aktivitas (untuk “anggota proyek” otomatis)
  const { data: aktRes } = useSWR(`${ApiEndpoints.GetAgendaKerja}?perPage=1000`, fetcher, { revalidateOnFocus: false });
  const aktivitas = useMemo(() => (Array.isArray(aktRes?.data) ? aktRes.data : EMPTY), [aktRes]);

  // id_agenda -> Set<id_user>
  const membersMap = useMemo(() => {
    const map = new Map();
    for (const r of aktivitas) {
      if (!r.id_agenda || !r.user?.id_user) continue;
      if (!map.has(r.id_agenda)) map.set(r.id_agenda, new Set());
      map.get(r.id_agenda).add(r.user.id_user);
    }
    return map;
  }, [aktivitas]);

  const membersNames = (agendaId) => {
    const set = membersMap.get(agendaId);
    if (!set || set.size === 0) return [];
    return Array.from(set).map((uid) => userName(uid));
  };

  // Filter proyek berdasarkan karyawan + q (client-side juga)
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

  // Actions
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
    await crudService.del(url);
    await mutate();
  };

  return {
    loading: loadingAgenda,
    rows,
    filteredRows,

    q, setQ,
    filterUserId, setFilterUserId,

    userOptions,
    membersNames,

    refresh, create, update, remove,
  };
}
