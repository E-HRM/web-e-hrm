"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";

dayjs.extend(utc);

/** tampilkan angka jam persis seperti DB */
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
    from: null,
    to: null,
  });

  const { data: usersRes } = useSWR(`${ApiEndpoints.GetUsers}?perPage=1000`, fetcher, { revalidateOnFocus: false });
  const userOptions = useMemo(() => {
    const xs = Array.isArray(usersRes?.data) ? usersRes.data : [];
    return xs.map((u) => ({ value: u.id_user, label: u.nama_pengguna || u.email || u.id_user }));
  }, [usersRes]);

  const listUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.q?.trim()) p.set("q", filters.q.trim());
    if (filters.userId) p.set("id_user", filters.userId);
    if (filters.status) p.set("status_kunjungan", filters.status);
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
  const rows = useMemo(() => (Array.isArray(listRes?.data) ? listRes.data : []), [listRes]);

  const osmUrl = (lat, lon) =>
    lat != null && lon != null
      ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`
      : null;

  // foto/koordinat kemungkinan nama field
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
    showFromDB,
    osmUrl,
    pickPhotoUrl,
    getStartCoord,
    getEndCoord,
  };
}
