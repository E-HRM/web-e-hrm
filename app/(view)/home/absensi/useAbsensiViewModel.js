"use client";

import useSWR from "swr";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { fetcher } from "../../../utils/fetcher";
import { ApiEndpoints } from "../../../../constrainst/endpoints";

// array stabil supaya dependency aman
const EMPTY = Object.freeze([]);

/* -------------------- Helpers -------------------- */
function getDateKey(v) {
  if (!v) return "";
  if (typeof v === "string") {
    const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const d = dayjs(v);
    return d.isValid() ? d.format("YYYY-MM-DD") : "";
  }
  const d = dayjs(v);
  return d.isValid() ? d.format("YYYY-MM-DD") : "";
}

function normalizePhotoUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window !== "undefined" && url.startsWith("/")) {
    return `${window.location.origin}${url}`;
  }
  return url;
}

function pickCoord(obj) {
  if (!obj) return null;
  const lat = Number(
    obj.latitude ?? obj.lat ?? obj.geo_lat ?? obj.lat_start ?? obj.lat_end
  );
  const lon = Number(
    obj.longitude ?? obj.lon ?? obj.geo_lon ?? obj.lon_start ?? obj.lon_end
  );
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return { lat, lon, name: obj.nama_kantor || obj.name || null };
  }
  return null;
}

function makeOsmEmbed(lat, lon) {
  const dx = 0.0025,
    dy = 0.0025;
  const bbox = `${(lon - dx).toFixed(6)}%2C${(lat - dy).toFixed(
    6
  )}%2C${(lon + dx).toFixed(6)}%2C${(lat + dy).toFixed(6)}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(
    6
  )}%2C${lon.toFixed(6)}`;
}

/** Ratakan objek penerima + absensi nested */
function flattenRecipient(rec) {
  const a = rec?.absensi ?? {};
  const user = a.user ?? rec.user ?? null;

  // tanggal
  const tanggal = a.tanggal || a.tgl || a.created_at || rec.created_at || null;

  // jam utama
  const jam_masuk =
    a.jam_masuk ?? a.jamIn ?? a.checkin_time ?? a.masuk_at ?? null;
  const jam_pulang =
    a.jam_pulang ?? a.jamOut ?? a.checkout_time ?? a.pulang_at ?? null;

  // istirahat (pakai banyak alias biar tahan banting)
  const istirahat_mulai =
    a.jam_istirahat_mulai ??
    a.mulai_istirahat ??
    a.break_start ??
    a.istirahat_in ??
    null;
  const istirahat_selesai =
    a.jam_istirahat_selesai ??
    a.selesai_istirahat ??
    a.break_end ??
    a.istirahat_out ??
    null;

  // status
  const status_masuk =
    a.status_masuk ?? a.status_in ?? a.status_masuk_label ?? null;
  const status_pulang =
    a.status_pulang ?? a.status_out ?? a.status_pulang_label ?? null;

  // lokasi & foto (dari include API)
  const lokasiIn = a.lokasiIn ?? a.lokasi_in ?? a.lokasi_absen_masuk ?? null;
  const lokasiOut =
    a.lokasiOut ?? a.lokasi_out ?? a.lokasi_absen_pulang ?? null;

  const photo_in = normalizePhotoUrl(
    a.foto_masuk ?? a.photo_in ?? a.bukti_foto_masuk ?? a.attachment_in ?? null
  );
  const photo_out = normalizePhotoUrl(
    a.foto_pulang ??
      a.photo_out ??
      a.bukti_foto_pulang ??
      a.attachment_out ??
      null
  );

  return {
    id_absensi:
      a.id_absensi ??
      rec.id_absensi ??
      rec.id_absensi_report_recipient ??
      rec.id ??
      null,

    user: user
      ? {
          id_user: user.id_user,
          nama_pengguna: user.nama_pengguna,
          email: user.email,
          role: user.role,
          foto_profil_user: user.foto_profil_user ?? user.foto ?? null,
          departement: user.departement ?? null,
        }
      : null,

    tanggal,

    // jam
    jam_masuk,
    jam_pulang,

    // istirahat
    istirahat_mulai,
    istirahat_selesai,

    // status
    status_masuk,
    status_pulang,

    // lokasi/foto
    lokasiIn: pickCoord(lokasiIn),
    lokasiOut: pickCoord(lokasiOut),
    photo_in,
    photo_out,
  };
}

export default function useAbsensiViewModel() {
  // filter untuk rekap header (biarkan ada, dipakai kartu statistik)
  const [dateIn, setDateIn] = useState(dayjs());
  const [dateOut, setDateOut] = useState(dayjs());
  const [filterIn, setFilterIn] = useState({
    q: "",
    divisi: undefined,
    status: undefined,
  });
  const [filterOut, setFilterOut] = useState({
    q: "",
    divisi: undefined,
    status: undefined,
  });

  // sumber data sama
  const url = useMemo(
    () => ApiEndpoints.GetAbsensiApprovals({ perPage: 200 }),
    []
  );
  const { data: resp, isLoading } = useSWR(url, fetcher, {
    keepPreviousData: true,
  });

  // flatten
  const base = useMemo(() => {
    const list = Array.isArray(resp?.data) ? resp.data : EMPTY;
    return list.map(flattenRecipient);
  }, [resp?.data]);

  // opsi divisi
  const divisiOptions = useMemo(() => {
    const arr = Array.from(
      new Set(
        base
          .map((r) => r.user?.departement?.nama_departement)
          .filter(Boolean)
      )
    );
    return arr.map((d) => ({ value: d, label: d }));
  }, [base]);

  // rekap lama untuk header (kedatangan)
  const kedatangan = useMemo(
    () =>
      base
        .filter((r) => !!r.jam_masuk)
        .filter((r) => getDateKey(r.tanggal) === getDateKey(dateIn))
        .filter((r) =>
          filterIn.divisi
            ? r.user?.departement?.nama_departement === filterIn.divisi
            : true
        )
        .map((r) => ({ ...r, jam: r.jam_masuk, status_label: r.status_masuk })),
    [base, dateIn, filterIn.divisi]
  );

  // rekap lama untuk header (kepulangan)
  const kepulangan = useMemo(
    () =>
      base
        .filter((r) => !!r.jam_pulang)
        .filter((r) => getDateKey(r.tanggal) === getDateKey(dateOut))
        .filter((r) =>
          filterOut.divisi
            ? r.user?.departement?.nama_departement === filterOut.divisi
            : true
        )
        .map((r) => ({ ...r, jam: r.jam_pulang, status_label: r.status_pulang })),
    [base, dateOut, filterOut.divisi]
  );

  // === data lengkap untuk TABEL (semua kolom) ===
  const rowsAll = base;

  // dropdown status (biarkan)
  const statusOptionsIn = [
    { value: "tepat", label: "Tepat Waktu" },
    { value: "terlambat", label: "Terlambat" },
    { value: "izin", label: "Izin" },
    { value: "sakit", label: "Sakit" },
  ];
  const statusOptionsOut = [
    { value: "tepat", label: "Tepat Waktu" },
    { value: "lembur", label: "Lembur" },
  ];

  // util lokasi untuk modal
  const getStartCoord = (row) => row?.lokasiIn || null;
  const getEndCoord = (row) => row?.lokasiOut || null;

  return {
    // data untuk rekap
    kedatangan,
    kepulangan,

    // data untuk tabel
    rowsAll,

    // loading
    loading: isLoading,

    // filters & setters
    dateIn,
    setDateIn,
    dateOut,
    setDateOut,
    filterIn,
    setFilterIn,
    filterOut,
    setFilterOut,

    // dropdown options
    divisiOptions,
    statusOptionsIn,
    statusOptionsOut,

    // util foto & map
    normalizePhotoUrl,
    makeOsmEmbed,
    getStartCoord,
    getEndCoord,
  };
}
