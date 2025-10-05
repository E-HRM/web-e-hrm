"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";
import { crudService } from "@/app/utils/services/crudService";

dayjs.extend(utc);

/** Tampilkan jam persis seperti DB (tanpa geser zona). */
export const showFromDB = (v, fmt = "DD MMM YYYY HH:mm") => {
  if (!v) return "-";
  const s = String(v);
  if (/[T ]\d{2}:\d{2}:\d{2}/.test(s) && (s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s))) {
    return dayjs.utc(s).format(fmt);
  }
  return dayjs(s).format(fmt);
};

/** String naif (tanpa Z/offset) untuk FullCalendar */
const toNaiveForFC = (v) => {
  if (!v) return null;
  const s = String(v);
  if (s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s)) return dayjs.utc(s).format("YYYY-MM-DDTHH:mm:ss");
  return dayjs(s).format("YYYY-MM-DDTHH:mm:ss");
};

/** Helper format kirim ke API (tanpa Z/offset) */
const asLocalPlain = (d) => (d ? dayjs(d).format("YYYY-MM-DD HH:mm:ss") : null);
const asDateOnly   = (d) => (d ? dayjs(d).format("YYYY-MM-DD") : null);

// Jika backend mewajibkan kategori saat POST, set di env:
// NEXT_PUBLIC_KUNJUNGAN_DEFAULT_KATEGORI_ID
const DEFAULT_KATEGORI_ID = process.env.NEXT_PUBLIC_KUNJUNGAN_DEFAULT_KATEGORI_ID || null;

export default function useKunjunganKalenderViewModel() {
  // ---- users
  const { data: usersRes } = useSWR(`${ApiEndpoints.GetUsers}?perPage=1000`, fetcher, { revalidateOnFocus: false });
  const userOptions = useMemo(() => {
    const xs = Array.isArray(usersRes?.data) ? usersRes.data : [];
    return xs.map((u) => ({ value: u.id_user, label: u.nama_pengguna || u.email || u.id_user }));
  }, [usersRes]);

  // ---- kategori kunjungan (opsional / jika ada)
  const { data: katRes } = useSWR(`${ApiEndpoints.GetKategoriKunjungan}?perPage=1000`, fetcher, { revalidateOnFocus: false });
  const kategoriOptions = useMemo(() => {
    const xs = Array.isArray(katRes?.data) ? katRes.data : [];
    return xs.map((k) => ({ value: k.id_kategori_kunjungan, label: k.kategori_kunjungan }));
  }, [katRes]);
  const kategoriRequired = !DEFAULT_KATEGORI_ID; // jika tidak set default, minta user pilih

  // ---- range kalender (FullCalendar kasih end EXCLUSIVE → kita adjust)
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

  // ---- list kunjungan by range
  const listUrl = useMemo(() => {
    if (!viewRange.start || !viewRange.end) return null;

    // FullCalendar: end = EXCLUSIVE → kurangi 1 hari
    const start = dayjs(viewRange.start).startOf("day");
    const end   = dayjs(viewRange.end).startOf("day").subtract(1, "day").endOf("day");

    const p = new URLSearchParams();
    p.set("startDate",  start.format("YYYY-MM-DD HH:mm:ss"));
    p.set("endDate",    end.format("YYYY-MM-DD HH:mm:ss"));
    p.set("pageSize", "1000");
    p.set("orderBy", "tanggal");
    p.set("sort", "desc");
    return `${ApiEndpoints.GetKunjungan}?${p.toString()}`;
  }, [viewRange.start, viewRange.end]);

  const { data: listRes, isLoading, mutate } = useSWR(listUrl, fetcher, { revalidateOnFocus: false });
  const rows = useMemo(() => (Array.isArray(listRes?.data) ? listRes.data : []), [listRes]);

  // ---- mapping ke event FullCalendar
  const events = useMemo(() => {
    return rows.map((r) => {
      const hasTime = r.jam_mulai || r.jam_selesai;
      let start = null, end = null;

      if (r.jam_mulai) start = toNaiveForFC(r.jam_mulai);
      else if (r.tanggal) start = dayjs(r.tanggal).format("YYYY-MM-DD");

      if (r.jam_selesai) end = toNaiveForFC(r.jam_selesai);

      return {
        id: r.id_kunjungan,
        title: r.deskripsi || r.kategori?.kategori_kunjungan || "Kunjungan",
        start,
        end,
        allDay: !hasTime,
        extendedProps: { status: r.status_kunjungan, raw: r },
      };
    });
  }, [rows]);

  // ---- create rencana kunjungan (multi user)
  const createPlansForUsers = useCallback(async ({ userIds = [], tanggal, jam_mulai, jam_selesai, deskripsi, kategoriId }) => {
    const base = dayjs(tanggal || new Date());
    const start = jam_mulai
      ? base.hour(dayjs(jam_mulai).hour()).minute(dayjs(jam_mulai).minute()).second(0)
      : null;
    const end = jam_selesai
      ? base.hour(dayjs(jam_selesai).hour()).minute(dayjs(jam_selesai).minute()).second(0)
      : null;

    for (const uid of userIds) {
      const payload = {
        id_user: uid,
        ...(kategoriId ? { id_kategori_kunjungan: kategoriId } : (DEFAULT_KATEGORI_ID ? { id_kategori_kunjungan: DEFAULT_KATEGORI_ID } : {})),
        tanggal:     asDateOnly(base),
        jam_mulai:   start ? asLocalPlain(start) : null,
        jam_selesai: end   ? asLocalPlain(end)   : null,
        status_kunjungan: "diproses",
        deskripsi: deskripsi?.trim() || null,
      };
      await crudService.post(ApiEndpoints.CreateKunjungan, payload);
    }
    await mutate();
  }, [mutate]);

  return {
    // loading & data
    loading: isLoading,
    events,

    // controls
    setRange,

    // options
    userOptions,
    kategoriOptions,
    kategoriRequired,

    // actions
    createPlansForUsers,

    // util
    showFromDB,
  };
}
