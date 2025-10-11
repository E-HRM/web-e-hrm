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

// === helper overlap sehari (tanpa transform zona waktu)
function overlapsDay(row, ymd) {
  const s = row.start_date ? dayjs.utc(row.start_date) : null; // treat as literal
  const e = row.end_date ? dayjs.utc(row.end_date) : null;     // treat as literal

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
    // kirim ke backend pakai format lokal polos (tanpa Z)
    from: DEFAULT_FROM.startOf("day").format("YYYY-MM-DD HH:mm:ss"),
    to: DEFAULT_TO.endOf("day").format("YYYY-MM-DD HH:mm:ss"),
  });
  const [selectedDay, setSelectedDay] = useState(""); // YYYY-MM-DD

  // === AUTO SELECT 'HARI INI' setelah memilih karyawan
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

  // Agenda master (Proyek)
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

  // URL list aktivitas (harus ada user_id)
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

  // Fetch agenda-kerja
  const { data, isLoading, mutate } = useSWR(listUrl, fetcher, {
    revalidateOnFocus: false,
  });
  const rows = useMemo(
    () => (Array.isArray(data?.data) ? data.data : EMPTY_ROWS),
    [data]
  );

  // Strip tanggal (jumlah pekerjaan per hari)
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

  // Tabel: filter client-side (selectedDay + q), sort terbaru
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

  // Actions
  const refresh = () => mutate();

  const remove = async (id, { hard = false } = {}) => {
    const url = ApiEndpoints.DeleteAgendaKerja(id) + (hard ? "?hard=1" : "");
    await crudService.del(url);
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

  const createActivity = async ({ deskripsi_kerja, id_agenda, start_date, end_date }) => {
    if (!filters.user_id) throw new Error("Pilih karyawan dulu");
    await crudService.post(ApiEndpoints.CreateAgendaKerja, {
      id_user: filters.user_id,
      id_agenda,
      deskripsi_kerja,
      status: "diproses",
      // kirim string lokal polos (tanpa Z) jika ada
      start_date,
      end_date,
    });
    await mutate();
  };

  const createAgendaMaster = async (nama_agenda) => {
    await crudService.post(ApiEndpoints.CreateAgenda, { nama_agenda });
    await refetchAgenda();
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
  };
}
