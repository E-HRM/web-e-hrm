// AktivitasViewModel.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";

dayjs.extend(utc);

const DEFAULT_FROM = dayjs().startOf("week").add(1, "day");
const DEFAULT_TO = dayjs(DEFAULT_FROM).add(6, "day");

const EMPTY_ROWS = Object.freeze([]);
const EMPTY_AGENDA = Object.freeze([]);
const EMPTY_USERS = Object.freeze([]);

// overlap sehari (UTC literal)
function overlapsDay(row, ymd) {
  const s = row.start_date ? dayjs.utc(row.start_date) : null;
  const e = row.end_date ? dayjs.utc(row.end_date) : null;

  const sod = dayjs.utc(`${ymd} 00:00:00`, "YYYY-MM-DD HH:mm:ss");
  const eod = dayjs.utc(`${ymd} 23:59:59`, "YYYY-MM-DD HH:mm:ss");

  const sMs = s ? s.valueOf() : Number.NEGATIVE_INFINITY;
  const eMs = e ? e.valueOf() : Number.POSITIVE_INFINITY;

  return sMs <= eod.valueOf() && eMs >= sod.valueOf();
}

export default function useAktivitasTimesheetViewModel() {
  const [filters, setFilters] = useState({
    user_id: "",
    id_agenda: "",
    status: "",
    q: "",
    from: DEFAULT_FROM.startOf("day").format("YYYY-MM-DD HH:mm:ss"),
    to: DEFAULT_TO.endOf("day").format("YYYY-MM-DD HH:mm:ss"),
  });
  const [selectedDay, setSelectedDay] = useState(""); // YYYY-MM-DD

  // Auto pilih hari ini saat pilih karyawan
  useEffect(() => {
    if (!filters.user_id) return;
    const today = dayjs().format("YYYY-MM-DD");
    setSelectedDay(today);
  }, [filters.user_id]);

  // Users
  const { data: usersRes, isLoading: loadingUsers } = useSWR(
    ApiEndpoints.GetUsers,
    fetcher,
    { revalidateOnFocus: false }
  );
  const usersList = useMemo(
    () => (Array.isArray(usersRes?.data) ? usersRes.data : EMPTY_USERS),
    [usersRes]
  );
  const userOptions = useMemo(
    () =>
      usersList.map((u) => ({
        value: u.id_user,
        label: u.nama_pengguna || u.email || u.id_user,
      })),
    [usersList]
  );

  // Agenda master
  const {
    data: agendaRes,
    isLoading: loadingAgenda,
    mutate: refetchAgenda,
  } = useSWR(`${ApiEndpoints.GetAgenda}?perPage=200`, fetcher, {
    revalidateOnFocus: false,
  });
  const agendaMaster = useMemo(
    () => (Array.isArray(agendaRes?.data) ? agendaRes.data : EMPTY_AGENDA),
    [agendaRes]
  );
  const agendaOptions = useMemo(
    () => agendaMaster.map((a) => ({ value: a.id_agenda, label: a.nama_agenda })),
    [agendaMaster]
  );

  // URL list aktivitas
  const listUrl = useMemo(() => {
    if (!filters.user_id) return null;
    const p = new URLSearchParams();
    p.set("user_id", filters.user_id);
    if (filters.id_agenda) p.set("id_agenda", filters.id_agenda);
    if (filters.status) p.set("status", filters.status);
    if (filters.from) p.set("from", filters.from);
    if (filters.to) p.set("to", filters.to);
    p.set("perPage", "200");
    return `${ApiEndpoints.GetAgendaKerja}?${p.toString()}`;
  }, [filters.user_id, filters.id_agenda, filters.status, filters.from, filters.to]);

  // Fetch
  const { data, isLoading, mutate } = useSWR(listUrl, fetcher, {
    revalidateOnFocus: false,
  });
  const rows = useMemo(
    () => (Array.isArray(data?.data) ? data.data : EMPTY_ROWS),
    [data]
  );

  // Strip tanggal
  const dayBuckets = useMemo(() => {
    const start = dayjs(filters.from || DEFAULT_FROM);
    const end = dayjs(filters.to || DEFAULT_TO);
    const list = [];
    for (let d = start.clone(); d.isBefore(end) || d.isSame(end, "day"); d = d.add(1, "day")) {
      const dateStr = d.format("YYYY-MM-DD");
      const count = rows.filter((r) => overlapsDay(r, dateStr)).length;
      list.push({ date: dateStr, count });
    }
    return list;
  }, [filters.from, filters.to, rows]);

  // Filter tabel
  const filteredRows = useMemo(() => {
    let xs = rows;
    if (selectedDay) xs = xs.filter((r) => overlapsDay(r, selectedDay));
    const q = (filters.q || "").trim().toLowerCase();
    if (q) {
      xs = xs.filter((r) => {
        const s1 = (r.deskripsi_kerja || "").toLowerCase();
        const s2 = (r.agenda?.nama_agenda || "").toLowerCase();
        return s1.includes(q) || s2.includes(q);
      });
    }
    return xs
      .slice()
      .sort((a, b) => {
        const ad = dayjs.utc(a.start_date || a.created_at).valueOf();
        const bd = dayjs.utc(b.start_date || b.created_at).valueOf();
        return bd - ad;
      });
  }, [rows, selectedDay, filters.q]);

  // Helper tanggal aktif
  const getActiveYMD = () => {
    if (selectedDay) return selectedDay;
    if (filters.from) return dayjs(filters.from, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD");
    return dayjs().format("YYYY-MM-DD");
  };

  // Actions
  const refresh = () => mutate();

  const remove = async (id, { hard = false } = {}) => {
    const url = ApiEndpoints.DeleteAgendaKerja(id) + (hard ? "?hard=1" : "");
    await crudService.delete(url);
    await mutate();
  };

  const quickFinish = async (row) => {
    const put = crudService.put || crudService.patch;
    await put(ApiEndpoints.UpdateAgendaKerja(row.id_agenda_kerja), { status: "selesai" });
    await mutate();
  };

  const resetToDiproses = async (row) => {
    const put = crudService.put || crudService.patch;
    await put(ApiEndpoints.UpdateAgendaKerja(row.id_agenda_kerja), { status: "diproses" });
    await mutate();
  };

  // === Inti: create tanpa input jam — sentinel 00:00:00 di tanggal aktif
  const createActivity = async ({ deskripsi_kerja, id_agenda }) => {
    if (!filters.user_id) throw new Error("Pilih karyawan dulu");
    const ymd = getActiveYMD();
    await crudService.post(ApiEndpoints.CreateAgendaKerja, {
      id_user: filters.user_id,
      id_agenda,
      deskripsi_kerja,
      status: "diproses",
      start_date: `${ymd} 00:00:00`,
      end_date: `${ymd} 00:00:00`,
    });
    await mutate();
  };

  const createAgendaMaster = async (nama_agenda) => {
    await crudService.post(ApiEndpoints.CreateAgenda, { nama_agenda });
    await refetchAgenda();
  };

  const updateActivity = async (id_agenda_kerja, payload) => {
    const put = crudService.put || crudService.patch;
    await put(ApiEndpoints.UpdateAgendaKerja(id_agenda_kerja), payload);
    await mutate();
  };

  return {
    // loading
    loading: isLoading,
    loadingUsers,
    loadingAgenda,

    // data
    rows,
    filteredRows,
    dayBuckets,
    agendaOptions,
    userOptions,

    // state
    filters,
    setFilters,
    selectedDay,
    setSelectedDay,

    // ops
    refresh,
    remove,
    quickFinish,
    resetToDiproses,
    createActivity,
    createAgendaMaster,
    updateActivity,
  };
}
