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
  const local = toLocalWallTime(s);
  return dayjs(local).format(fmt);
};

/* ===== Urgensi normalizer (DB -> label + level) ===== */
const normalizeUrgency = (v) => {
  const s = (v || "").toString().trim().toUpperCase();
  switch (s) {
    case "PENTING MENDESAK":
      return { label: "PENTING MENDESAK", level: 1 };
    case "TIDAK PENTING TAPI MENDESAK":
    case "TIDAK PENTING, TAPI MENDESAK":
      return { label: "TIDAK PENTING TAPI MENDESAK", level: 2 };
    case "PENTING TAK MENDESAK":
    case "PENTING TIDAK MENDESAK":
      return { label: "PENTING TAK MENDESAK", level: 3 };
    case "TIDAK PENTING TIDAK MENDESAK":
      return { label: "TIDAK PENTING TIDAK MENDESAK", level: 4 };
    default:
      return s ? { label: s, level: 4 } : null;
  }
};

/* Ambil nilai “kebutuhan_agenda” dari berbagai kemungkinan lokasi */
const extractUrgencyRaw = (row) =>
  row?.kebutuhan_agenda ??
  row?.kebutuhan ??
  row?.urgensi ??
  row?.prioritas ??
  row?.agenda?.kebutuhan_agenda ??
  row?.agenda_kerja?.kebutuhan_agenda ??
  null;

/* ============== Map Server -> FullCalendar ============== */

const mapServerToFC = (row) => {
  const status =
    row.status || row.status_agenda || row.status_kerja || "diproses";

  const title = row.deskripsi_kerja || row.nama_agenda || row.title || "Agenda";

  const startRaw = row.start_date || row.tanggal_mulai || row.start || row.mulai;
  const endRaw =
    row.end_date || row.tanggal_selesai || row.end || row.selesai || startRaw;

  const start = toLocalWallTime(startRaw);
  const end = toLocalWallTime(endRaw);

  const urgency = normalizeUrgency(extractUrgencyRaw(row));

  let backgroundColor = "#3b82f6"; // status default diproses
  if (status === "selesai") backgroundColor = "#22c55e";
  else if (status === "ditunda") backgroundColor = "#f59e0b";

  return {
    id: row.id_agenda_kerja || row.id || row._id,
    title,
    start,
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
      urgency,
      raw: row,
    },
  };
};

/* ====== Signature helper: identitas “serupa” (judul + proyek + jam) ====== */
const signatureFromRow = (row) => {
  const title = (row?.deskripsi_kerja || "").trim();
  const id_agenda = String(row?.id_agenda || row?.agenda?.id_agenda || "");
  const start = toLocalWallTime(row?.start_date || row?.mulai);
  const end = toLocalWallTime(row?.end_date || row?.selesai || row?.start_date || row?.mulai);
  return `${id_agenda}|${title}|${start}|${end}`;
};

const signatureFromEventLike = (evLike) => {
  const title = (evLike.title || evLike.deskripsi_kerja || "").trim();
  const id_agenda = String(
    evLike.id_agenda ??
      evLike.extendedProps?.id_agenda ??
      evLike.raw?.id_agenda ??
      evLike.raw?.agenda?.id_agenda ??
      ""
  );
  const start = toLocalWallTime(evLike.start || evLike.raw?.start_date);
  const end = toLocalWallTime(evLike.end || evLike.raw?.end_date || evLike.start || evLike.raw?.start_date);
  return `${id_agenda}|${title}|${start}|${end}`;
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
    p.set("from", dayjs(range.start).format("YYYY-MM-DD"));
    p.set("to", dayjs(range.end).format("YYYY-MM-DD"));
    p.set("perPage", "100");
    return p.toString();
  }, [range]);

  /* ===== Master Users: fetch semua halaman ===== */
  const fetchAllUsers = useCallback(async () => {
    const perPage = 100;
    let page = 1;
    let all = [];

    while (true) {
      const url = `${ApiEndpoints.GetUsers}?page=${page}&perPage=${perPage}&orderBy=nama_pengguna&sort=asc`;
      const json = await fetcher(url);

      const items = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.items)
        ? json.items
        : [];

      all.push(...items);

      const totalPages =
        json?.pagination?.totalPages ?? json?.meta?.totalPages ?? null;

      if (totalPages) {
        if (page >= totalPages) break;
        page += 1;
      } else {
        if (items.length < perPage) break;
        page += 1;
      }
    }

    return all;
  }, []);

  const { data: usersAll } = useSWR("users:allpages", fetchAllUsers, {
    revalidateOnFocus: false,
  });

  const usersList = useMemo(
    () => (Array.isArray(usersAll) ? usersAll : []),
    [usersAll]
  );

  const userMap = useMemo(() => {
    const m = new Map();
    for (const u of usersList) {
      const key = String(u?.id_user ?? u?.id ?? u?.uuid ?? "");
      if (key) m.set(key, u);
    }
    return m;
  }, [usersList]);

  const userOptions = useMemo(
    () =>
      usersList.map((u) => ({
        value: String(u.id_user),
        label: u.nama_pengguna || u.email || String(u.id_user),
      })),
    [usersList]
  );

  const getUserById = useCallback(
    (id) => userMap.get(String(id)) || null,
    [userMap]
  );

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
    async (id, { hard = false } = {}) => {
      const url = ApiEndpoints.DeleteAgendaKerja(id) + (hard ? "?hard=1" : "");
      const delFn = crudService.del || crudService.delete;
      await delFn(url);
      await mutate();
    },
    [mutate]
  );

  /* ===== Bulk tools: cari & hapus “serupa” (judul+proyek+jam sama) ===== */

  const findSimilarEventsByEvent = useCallback(async (fcEvent) => {
    if (!fcEvent) return { targets: [] };

    const raw = fcEvent.extendedProps?.raw || {};
    const id_agenda =
      fcEvent.extendedProps?.id_agenda ||
      raw?.id_agenda ||
      raw?.agenda?.id_agenda ||
      null;

    const start = toLocalWallTime(raw.start_date || fcEvent.start);
    const end = toLocalWallTime(raw.end_date || fcEvent.end || fcEvent.start);

    // rentang pencarian (per hari)
    const p = new URLSearchParams();
    p.set("from", dayjs(start).format("YYYY-MM-DD"));
    p.set("to", dayjs(end).format("YYYY-MM-DD"));
    if (id_agenda) p.set("id_agenda", String(id_agenda));
    p.set("perPage", "1000");

    const url = `${ApiEndpoints.GetAgendaKerja}?${p.toString()}`;
    const json = await fetcher(url);
    const items = Array.isArray(json?.data) ? json.data : [];

    const wantSig = signatureFromEventLike({
      title: fcEvent.title,
      id_agenda,
      start,
      end,
      raw,
      extendedProps: fcEvent.extendedProps,
    });

    const targets = items.filter((row) => signatureFromRow(row) === wantSig);
    return { targets };
  }, []);

  const bulkDeleteByIds = useCallback(
    async (ids = [], { hard = false } = {}) => {
      if (!Array.isArray(ids) || ids.length === 0) return 0;
      const delFn = crudService.del || crudService.delete;
      await Promise.all(
        ids.map((id) =>
          delFn(ApiEndpoints.DeleteAgendaKerja(id) + (hard ? "?hard=1" : ""))
        )
      );
      await mutate();
      return ids.length;
    },
    [mutate]
  );

  const bulkDeleteSimilarByEvent = useCallback(
    async (fcEvent, { hard = false } = {}) => {
      const { targets } = await findSimilarEventsByEvent(fcEvent);
      const ids = targets.map((t) => t.id_agenda_kerja || t.id);
      const n = await bulkDeleteByIds(ids, { hard });
      return { count: n };
    },
    [findSimilarEventsByEvent, bulkDeleteByIds]
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

    // bulk helpers
    findSimilarEventsByEvent,
    bulkDeleteByIds,
    bulkDeleteSimilarByEvent,

    // util
    showFromDB,
  };
}
