"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";
import { crudService } from "@/app/utils/services/crudService";

dayjs.extend(utc);

/** Render persis angka DB (tanpa shifting zona). */
export const showFromDB = (v, fmt = "DD MMM YYYY HH:mm") => {
  if (!v) return "-";
  const s = String(v);
  if (/[T ]\d{2}:\d{2}:\d{2}/.test(s) && (s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s))) {
    return dayjs.utc(s).format(fmt);
  }
  return dayjs(s).format(fmt);
};

/** Untuk FullCalendar (string naif tanpa offset). */
const toNaiveForFC = (v) => {
  if (!v) return null;
  const s = String(v);
  if (s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s)) return dayjs.utc(s).format("YYYY-MM-DDTHH:mm:ss");
  return dayjs(s).format("YYYY-MM-DDTHH:mm:ss");
};

/** Format kirim ke API (tanpa offset). */
const asLocalPlain = (d) => (d ? dayjs(d).format("YYYY-MM-DD HH:mm:ss") : null);
const asDateOnly   = (d) => (d ? dayjs(d).format("YYYY-MM-DD") : null);

/** Gabungkan tanggal (date-only) + jam (time-only). */
const combineLocalDateTime = (dateOnly, timeOnly) => {
  if (!dateOnly || !timeOnly) return null;
  const d = dayjs(dateOnly);
  const t = dayjs(timeOnly);
  return d.hour(t.hour()).minute(t.minute()).second(t.second() || 0).millisecond(0);
};

/** Safe number (number/string → number; selain itu → null). */
const toNum = (v) => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

// opsional: default kategori saat create
const DEFAULT_KATEGORI_ID = process.env.NEXT_PUBLIC_KUNJUNGAN_DEFAULT_KATEGORI_ID || null;

export default function useKunjunganKalenderViewModel() {
  // ==== USERS ====
  const { data: usersRes } = useSWR(`${ApiEndpoints.GetUsers}?perPage=1000`, fetcher, { revalidateOnFocus: false });
  const userOptions = useMemo(() => {
    const xs = Array.isArray(usersRes?.data) ? usersRes.data : [];
    return xs.map((u) => ({ value: u.id_user, label: u.nama_pengguna || u.email || u.id_user }));
  }, [usersRes]);

  const userMap = useMemo(() => {
    const m = new Map();
    const xs = Array.isArray(usersRes?.data) ? usersRes.data : [];
    xs.forEach((u) => m.set(u.id_user, u));
    return m;
  }, [usersRes]);

  const getUserById = useCallback((id) => userMap.get(id) || null, [userMap]);

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

  // ==== KATEGORI ====
  const { data: katRes } = useSWR(`${ApiEndpoints.GetKategoriKunjungan}?perPage=1000`, fetcher, { revalidateOnFocus: false });
  const kategoriOptions = useMemo(() => {
    const xs = Array.isArray(katRes?.data) ? katRes.data : [];
    return xs.map((k) => ({ value: k.id_kategori_kunjungan, label: k.kategori_kunjungan }));
  }, [katRes]);
  const kategoriRequired = !DEFAULT_KATEGORI_ID;

  // ==== RANGE KALENDER ====
  const [viewRange, setViewRange] = useState({ start: null, end: null });
  const setRange = useCallback((r) => {
    if (!r) return;
    setViewRange((prev) => {
      const prevStart = prev?.start ? dayjs(prev.start).startOf("day").valueOf() : null;
      const prevEnd   = prev?.end   ? dayjs(prev.end).endOf("day").valueOf()   : null;
      const nextStart = r?.start    ? dayjs(r.start).startOf("day").valueOf()  : null;
      const nextEnd   = r?.end      ? dayjs(r.end).endOf("day").valueOf()      : null;
      if (prevStart === nextStart && prevEnd === nextEnd) return prev;
      return { start: r.start, end: r.end };
    });
  }, []);

  // ==== LIST KUNJUNGAN ====
  const listUrl = useMemo(() => {
    if (!viewRange.start || !viewRange.end) return null;
    // FullCalendar end EXCLUSIVE → -1 hari
    const start = dayjs(viewRange.start).startOf("day");
    const end   = dayjs(viewRange.end).startOf("day").subtract(1, "day").endOf("day");

    const p = new URLSearchParams();
    p.set("startDate", start.format("YYYY-MM-DD HH:mm:ss"));
    p.set("endDate",   end.format("YYYY-MM-DD HH:mm:ss"));
    p.set("pageSize", "1000");
    p.set("orderBy", "tanggal");
    p.set("sort", "desc");
    return `${ApiEndpoints.GetKunjungan}?${p.toString()}`;
  }, [viewRange.start, viewRange.end]);

  const { data: listRes, isLoading, mutate } = useSWR(listUrl, fetcher, { revalidateOnFocus: false });
  const rows = useMemo(() => (Array.isArray(listRes?.data) ? listRes.data : []), [listRes]);

  // ==== EVENTS ====
  const events = useMemo(() => {
    return rows.map((r) => {
      const hasTime = r.jam_mulai || r.jam_selesai;
      let start = null, end = null;
      if (r.jam_mulai) start = toNaiveForFC(r.jam_mulai);
      else if (r.tanggal) start = dayjs(r.tanggal).format("YYYY-MM-DD");
      if (r.jam_selesai) end = toNaiveForFC(r.jam_selesai);

      return {
        id: r.id_kunjungan,
        title: r.deskripsi || r.kategori?.kategori_kunjungan || "Visit",
        start,
        end,
        allDay: !hasTime,
        extendedProps: { status: r.status_kunjungan, raw: r },
      };
    });
  }, [rows]);

  // ==== CREATE ====
  const createPlansForUsers = useCallback(
    async ({ userIds = [], tanggal, jam_mulai, jam_selesai, deskripsi, kategoriId }) => {
      const base = dayjs(tanggal || new Date());
      const start = jam_mulai ? combineLocalDateTime(base, jam_mulai) : null;
      const end   = jam_selesai ? combineLocalDateTime(base, jam_selesai) : null;

      for (const uid of userIds) {
        const payload = {
          id_user: uid,
          ...(kategoriId ? { id_kategori_kunjungan: kategoriId } : (DEFAULT_KATEGORI_ID ? { id_kategori_kunjungan: DEFAULT_KATEGORI_ID } : {})),
          tanggal: asDateOnly(base),
          jam_mulai: start ? asLocalPlain(start) : null,
          jam_selesai: end ? asLocalPlain(end) : null,
          status_kunjungan: "diproses",
          deskripsi: deskripsi?.trim() || null,
        };
        await crudService.post(ApiEndpoints.CreateKunjungan, payload);
      }
      await mutate();
    },
    [mutate]
  );

  // ==== UPDATE ====
  const updatePlan = useCallback(
    async (id, { tanggal, jam_mulai, jam_selesai, deskripsi, id_kategori_kunjungan, status_kunjungan }) => {
      const base = tanggal ? dayjs(tanggal) : null;
      const start = base && jam_mulai ? combineLocalDateTime(base, jam_mulai) : (jam_mulai ? dayjs(jam_mulai) : null);
      const end   = base && jam_selesai ? combineLocalDateTime(base, jam_selesai) : (jam_selesai ? dayjs(jam_selesai) : null);

      const payload = {
        ...(tanggal ? { tanggal: asDateOnly(base) } : {}),
        ...(jam_mulai ? { jam_mulai: asLocalPlain(start) } : { jam_mulai: null }),
        ...(jam_selesai ? { jam_selesai: asLocalPlain(end) } : { jam_selesai: null }),
        ...(typeof deskripsi !== "undefined" ? { deskripsi: deskripsi?.trim() || null } : {}),
        ...(typeof id_kategori_kunjungan !== "undefined" ? { id_kategori_kunjungan } : {}),
        ...(typeof status_kunjungan !== "undefined" ? { status_kunjungan } : {}),
      };

      await crudService.put(ApiEndpoints.UpdateKunjungan(id), payload);
      await mutate();
    },
    [mutate]
  );

  // ==== DELETE ====
    const deletePlan = useCallback(
      async (id) => {
        // pakai endpoint [id] yang sama seperti PUT, method DELETE
        await crudService.delete(ApiEndpoints.UpdateKunjungan(id));
        await mutate();
      },
      [mutate]
    );


  // ==== FOTO & KOORDINAT ====
  const pickPhotoUrl = useCallback(
    (r) => r?.lampiran_kunjungan_url || r?.lampiran_url || r?.foto_url || r?.image_url || r?.photo_url || null,
    []
  );

  const getStartCoord = useCallback((r) => ({
    lat: toNum(r?.start_latitude ?? r?.latitude_start ?? null),
    lon: toNum(r?.start_longitude ?? r?.longitude_start ?? null),
  }), []);
  const getEndCoord = useCallback((r) => ({
    lat: toNum(r?.end_latitude ?? r?.latitude_end ?? null),
    lon: toNum(r?.end_longitude ?? r?.longitude_end ?? null),
  }), []);

  /** Buat URL embed OSM, null jika invalid. */
  const makeOsmEmbed = useCallback((lat, lon) => {
    const la = toNum(lat), lo = toNum(lon);
    if (la == null || lo == null) return null;
    const dx = 0.002, dy = 0.002;
    const bbox = `${(lo - dx).toFixed(6)},${(la - dy).toFixed(6)},${(lo + dx).toFixed(6)},${(la + dy).toFixed(6)}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(la)},${encodeURIComponent(lo)}`;
  }, []);

  /** Format periode untuk pill jam seperti contoh screenshot. */
  const formatPeriod = useCallback((r) => {
    const s = r?.jam_mulai ? showFromDB(r.jam_mulai, "DD MMM YYYY HH:mm") : null;
    const e = r?.jam_selesai ? showFromDB(r.jam_selesai, "DD MMM YYYY HH:mm") : null;
    if (s && e) return `${s} - ${e}`;
    if (s) return s;
    if (r?.tanggal) return showFromDB(r.tanggal, "DD MMM YYYY");
    return "—";
  }, []);

  return {
    // data
    loading: isLoading,
    events,
    rows,

    // options & user helpers
    userOptions,
    getUserById,
    getJabatanName,
    getDepartemenName,
    getPhotoUrl,
    kategoriOptions,
    kategoriRequired,

    // actions
    setRange,
    createPlansForUsers,
    updatePlan,
    deletePlan,

    // util
    showFromDB,
    formatPeriod,
    pickPhotoUrl,
    getStartCoord,
    getEndCoord,
    makeOsmEmbed,
  };
}
