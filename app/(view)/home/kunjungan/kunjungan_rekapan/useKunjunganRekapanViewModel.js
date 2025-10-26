// app/home/.../useKunjunganRekapanViewModel.js (atau path kamu)
"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";

dayjs.extend(utc);

/** tampilkan waktu persis seperti di DB (tanpa pergeseran zona) */
export const showFromDB = (v, fmt = "DD MMM YYYY HH:mm") => {
  if (!v) return "-";
  const s = String(v);
  if (/[T ]\d{2}:\d{2}:\d{2}/.test(s) && (s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s))) {
    return dayjs.utc(s).format(fmt);
  }
  return dayjs(s).format(fmt);
};

const asDateOnly = (d) => (d ? dayjs(d).format("YYYY-MM-DD") : null);

export default function useKunjunganRekapanViewModel() {
  const [filters, setFilters] = useState({
    q: "",
    userId: "",
    status: "",
    kategoriId: "",
    from: null,
    to: null,
  });

  // Users
  const { data: usersRes } = useSWR(
    `${ApiEndpoints.GetUsers}?perPage=1000`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const userOptions = useMemo(() => {
    const xs = Array.isArray(usersRes?.data) ? usersRes.data : [];
    return xs.map((u) => ({
      value: u.id_user,
      label: u.nama_pengguna || u.email || u.id_user,
    }));
  }, [usersRes]);

  // Map id_user -> user
  const usersById = useMemo(() => {
    const xs = Array.isArray(usersRes?.data) ? usersRes.data : [];
    const map = new Map();
    for (const u of xs) {
      const key = String(u.id_user ?? u.id ?? u.uuid ?? "");
      if (key) map.set(key, u);
    }
    return map;
  }, [usersRes]);

  // Kategori
  const { data: katRes } = useSWR(
    `${ApiEndpoints.GetKategoriKunjungan}?pageSize=1000&orderBy=kategori_kunjungan&sort=asc`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const kategoriOptions = useMemo(() => {
    const xs = Array.isArray(katRes?.data) ? katRes.data : [];
    return xs.map((k) => ({ value: k.id_kategori_kunjungan, label: k.kategori_kunjungan }));
  }, [katRes]);

  // List kunjungan
  const listUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.q?.trim()) p.set("q", filters.q.trim());
    if (filters.userId) p.set("id_user", filters.userId);
    if (filters.status) p.set("status_kunjungan", filters.status);
    if (filters.kategoriId) p.set("id_kategori_kunjungan", filters.kategoriId);
    const f = asDateOnly(filters.from);
    const t = asDateOnly(filters.to);
    if (f) p.set("tanggal_mulai", f);
    if (t) p.set("tanggal_selesai", t);
    p.set("pageSize", "500");
    p.set("orderBy", "tanggal");
    p.set("sort", "desc");
    return `${ApiEndpoints.GetKunjungan}?${p.toString()}`;
  }, [filters]);

  const { data: listRes, isLoading } = useSWR(listUrl, fetcher, { revalidateOnFocus: false });

  // ⬇️ MERGE: user dari API kunjungan + user dari /users (kalau ada)
  const rows = useMemo(() => {
    const xs = Array.isArray(listRes?.data) ? listRes.data : [];
    return xs.map((r) => {
      const key = String(r.id_user ?? r.user?.id_user ?? r.user?.id ?? "");
      const userFromMap = key ? usersById.get(key) : null;
      const mergedUser = userFromMap ? { ...r.user, ...userFromMap } : (r.user || null);
      return { ...r, user: mergedUser };
    });
  }, [listRes, usersById]);

  const osmUrl = (lat, lon) =>
    lat != null && lon != null
      ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`
      : null;

  const pickPhotoUrl = (r) =>
    r.lampiran_kunjungan_url || r.lampiran_url || r.foto_url || r.image_url || r.photo_url || null;

  const getStartCoord = (r) => ({
    lat: r.start_latitude ?? r.latitude_start ?? null,
    lon: r.start_longitude ?? r.longitude_start ?? null,
  });
  const getEndCoord = (r) => ({
    lat: r.end_latitude ?? r.latitude_end ?? null,
    lon: r.end_longitude ?? r.longitude_end ?? null,
  });

  return {
    loading: isLoading,
    rows,
    filters,
    setFilters,
    userOptions,
    kategoriOptions,
    showFromDB,
    osmUrl,
    pickPhotoUrl,
    getStartCoord,
    getEndCoord,
  };
}
