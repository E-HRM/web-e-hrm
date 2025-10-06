"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";

dayjs.extend(utc);

/* ========= Helpers TZ-agnostic ========= */

/** Normalisasi string tanggal dari server ke "YYYY-MM-DD HH:mm:ss" (tanpa TZ). */
const toLocalWallTime = (v) => {
  if (!v) return null;
  const s = String(v).trim();

  const m1 = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  if (m1) return `${m1[1]} ${m1[2]}`;

  const m2 = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})$/);
  if (m2) return `${m2[1]} ${m2[2]}:00`;

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) return s;

  const d = dayjs(s);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm:ss") : s;
};

/** Serialisasi Date/dayjs ke string lokal polos. */
const serializeLocalWallTime = (d) =>
  d ? dayjs(d).format("YYYY-MM-DD HH:mm:ss") : null;

/** Format tampilan dari string DB/ISO tanpa geser zona. */
export const showFromDB = (v, fmt = "DD MMM YYYY HH:mm") => {
  if (!v) return "-";
  const s = String(v).trim();
  // treat sebagai literal tanpa TZ
  const local = toLocalWallTime(s);
  return dayjs(local).format(fmt);
};

/* ============== Map Server -> FullCalendar ============== */

const mapServerToFC = (row) => {
  const status =
    row.status || row.status_agenda || row.status_kerja || "diproses";

  const title =
    row.deskripsi_kerja || row.nama_agenda || row.title || "Agenda";

  const startRaw =
    row.start_date || row.tanggal_mulai || row.start || row.mulai;
  const endRaw =
    row.end_date || row.tanggal_selesai || row.end || row.selesai || startRaw;

  const start = toLocalWallTime(startRaw);
  const end = toLocalWallTime(endRaw);

  let backgroundColor = "#3b82f6"; // diproses
  if (status === "selesai") backgroundColor = "#22c55e";
  else if (status === "ditunda") backgroundColor = "#f59e0b";

  return {
    id: row.id_agenda_kerja || row.id || row._id,
    title,
    start, // string lokal agar FC tak geser TZ
    end,
    backgroundColor,
    borderColor: backgroundColor,
    extendedProps: {
      status,
      deskripsi: row.deskripsi_kerja || row.deskripsi || "",
      agenda: row.agenda || null,
      id_agenda: row.id_agenda || row.agenda?.id_agenda || null,
      id_user: row.id_user || row.user?.id_user || null,
      user: row.user || null,
      raw: row,
    },
  };
};

export default function useAgendaCalendarViewModel() {
  /* ===== Range kalender (FC memberi end eksklusif) ===== */
  const [range, setRangeState] = useState(() => ({
    start: dayjs().startOf("month").startOf("week").toDate(),
    end: dayjs().endOf("month").endOf("week").toDate(),
  }));
  const setRange = useCallback((start, end) => setRangeState({ start, end }), []);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("start", dayjs(range.start).format("YYYY-MM-DD"));
    p.set("end", dayjs(range.end).format("YYYY-MM-DD"));
    return p.toString();
  }, [range]);

  /* ===== Master Users ===== */
  const { data: usersRes } = useSWR(
    `${ApiEndpoints.GetUsers}?perPage=1000`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const usersList = useMemo(
    () => (Array.isArray(usersRes?.data) ? usersRes.data : []),
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

  const userMap = useMemo(() => {
    const m = new Map();
    for (const u of usersList) m.set(u.id_user, u);
    return m;
  }, [usersList]);

  const getUserById = useCallback((id) => userMap.get(id) || null, [userMap]);

  const getPhotoUrl = useCallback((u) => {
    if (!u) return null;
    return (
      u.foto_profil_user ||
      u.avatarUrl ||
      u.foto ||
      u.foto_url ||
      u.photoUrl ||
      u.photo ||
      u.avatar ||
      u.gambar ||
      null
    );
  }, []);

  const getJabatanName = useCallback((u) => {
    if (!u) return null;
    const j = u.jabatan || u.nama_jabatan || u.role || null;
    if (!j) return null;
    if (typeof j === "string") return j;
    if (typeof j === "object") return j.nama_jabatan || j.name || j.title || null;
    return null;
  }, []);

  const getDepartemenName = useCallback((u) => {
    if (!u) return null;
    const d = u.departemen || u.departement || u.department || u.divisi || null;
    if (!d) return null;
    if (typeof d === "string") return d;
    if (typeof d === "object") return d.nama_departemen || d.nama || d.name || d.title || null;
    return null;
  }, []);

  /* ===== Master Proyek/Agenda ===== */
  const { data: agendaRes, mutate: refetchAgenda } = useSWR(
    `${ApiEndpoints.GetAgenda}?perPage=1000`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const agendaOptions = useMemo(
    () =>
      (agendaRes?.data || []).map((a) => ({
        value: a.id_agenda,
        label: a.nama_agenda,
      })),
    [agendaRes]
  );

  const createAgendaMaster = useCallback(
    async (nama_agenda) => {
      const res = await crudService.post(ApiEndpoints.CreateAgenda, {
        nama_agenda,
      });
      await refetchAgenda();
      return res?.data?.id_agenda || res?.data?.id || null;
    },
    [refetchAgenda]
  );

  /* ===== List agenda kerja ===== */
  const { data, mutate } = useSWR(
    `${ApiEndpoints.GetAgendaKerja}?${qs}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const events = useMemo(
    () => (Array.isArray(data?.data) ? data.data.map(mapServerToFC) : []),
    [data]
  );

  /* ===== CRUD ===== */

  // CREATE untuk banyak user (1 event per user)
  const createEvents = useCallback(
    async ({ title, start, end, status = "diproses", userIds = [], id_agenda }) => {
      for (const uid of userIds) {
        const payload = {
          id_user: uid,
          id_agenda: id_agenda || null,
          deskripsi_kerja: title,
          status,
          start_date: serializeLocalWallTime(start),
          end_date: serializeLocalWallTime(end || start),
        };
        await crudService.post(ApiEndpoints.CreateAgendaKerja, payload);
      }
      await mutate();
    },
    [mutate]
  );

  const updateEvent = useCallback(
    async (id, { title, start, end, status, id_agenda }) => {
      const payload = {
        deskripsi_kerja: title,
        start_date: serializeLocalWallTime(start),
        end_date: serializeLocalWallTime(end || start),
        status: status || "diproses",
        ...(id_agenda ? { id_agenda } : {}),
      };
      await crudService.put(ApiEndpoints.UpdateAgendaKerja(id), payload);
      await mutate();
    },
    [mutate]
  );

  const deleteEvent = useCallback(
    async (id) => {
      await crudService.del(ApiEndpoints.DeleteAgendaKerja(id));
      await mutate();
    },
    [mutate]
  );

  return {
    // data
    events,
    agendaOptions,
    userOptions,

    // user helpers
    getUserById,
    getPhotoUrl,
    getJabatanName,
    getDepartemenName,

    // actions
    setRange,
    createEvents,
    updateEvent,
    deleteEvent,
    createAgendaMaster,

    // util
    showFromDB,
  };
}
