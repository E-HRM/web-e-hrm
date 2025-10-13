// useAbsensiViewModel.jsx
"use client";

import useSWR from "swr";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { fetcher } from "../../../utils/fetcher";
import { ApiEndpoints } from "../../../../constrainst/endpoints";

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
  return "/" + String(url).replace(/^\.?\//, "");
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

function toMinutes(hhmm) {
  if (!hhmm) return null;
  if (typeof hhmm === "string") {
    const m = hhmm.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (m) return Number(m[1]) * 60 + Number(m[2]);
  }
  const d = dayjs(hhmm);
  return d.isValid() ? d.hour() * 60 + d.minute() : null;
}

function minStartMaxEnd(istirahatArr) {
  if (!Array.isArray(istirahatArr) || istirahatArr.length === 0) return { start: null, end: null };
  let min = null, max = null;
  for (const it of istirahatArr) {
    const s = it.start_istirahat ?? it.start ?? it.mulai ?? null;
    const e = it.end_istirahat ?? it.end ?? it.selesai ?? null;
    if (s) {
      const ds = dayjs(s);
      if (ds.isValid() && (!min || ds.isBefore(min))) min = ds;
    }
    if (e) {
      const de = dayjs(e);
      if (de.isValid() && (!max || de.isAfter(max))) max = de;
    }
  }
  return { start: min?.toISOString() ?? null, end: max?.toISOString() ?? null };
}

/** Ratakan objek penerima + absensi nested */
function flattenRecipient(rec) {
  const a = rec?.absensi ?? {};
  const user = a.user ?? rec.user ?? null;

  const tanggal = a.tanggal || a.tgl || a.created_at || rec.created_at || null;

  const jam_masuk = a.jam_masuk ?? a.jamIn ?? a.checkin_time ?? a.masuk_at ?? null;
  const jam_pulang = a.jam_pulang ?? a.jamOut ?? a.checkout_time ?? a.pulang_at ?? null;

  // Ambil array istirahat dari API (absensi.istirahat)
  const istirahat_list = Array.isArray(a.istirahat) ? a.istirahat : [];
  // Fallback field lama (single)
  const istirahat_mulai_raw =
    a.jam_istirahat_mulai ??
    a.mulai_istirahat ??
    a.break_start ??
    a.istirahat_in ??
    null;
  const istirahat_selesai_raw =
    a.jam_istirahat_selesai ??
    a.selesai_istirahat ??
    a.break_end ??
    a.istirahat_out ??
    null;

  // Jika single kosong, rangkum dari list
  const { start: istirahat_mulai_list, end: istirahat_selesai_list } = minStartMaxEnd(istirahat_list);
  const istirahat_mulai = istirahat_mulai_raw || istirahat_mulai_list || null;
  const istirahat_selesai = istirahat_selesai_raw || istirahat_selesai_list || null;

  // Status dari backend (jika ada)
  const status_masuk_server = a.status_masuk ?? a.status_in ?? a.status_masuk_label ?? null;
  const status_pulang = a.status_pulang ?? a.status_out ?? a.status_pulang_label ?? null;

  // Fallback kalkulasi "terlambat/tepat" jika server tidak kirim/keliru.
  // Ambil jam batas dari shift kalau ada; jika tidak, default 09:00
  const batasMasuk =
    a?.shift?.jam_mulai ??
    a?.jam_shift_mulai ??
    a?.jam_masuk_batas ??
    "09:00";

  const menitMasuk = toMinutes(jam_masuk);
  const menitBatas = toMinutes(batasMasuk);
  let status_masuk = status_masuk_server;

  // Jika server tidak kirim atau mengirim "tepat" padahal lewat batas → override jadi "terlambat"
  if (menitMasuk != null && menitBatas != null) {
    const isLate = menitMasuk > menitBatas;
    const lbl = String(status_masuk_server || "").toLowerCase();
    const isSpecial = /izin|sakit/.test(lbl);
    if (!isSpecial) {
      if (!status_masuk_server) status_masuk = isLate ? "terlambat" : "tepat";
      else if (/tepat/.test(lbl) && isLate) status_masuk = "terlambat";
    }
  }

  const lokasiIn  = a.lokasiIn  ?? a.lokasi_in  ?? a.lokasi_absen_masuk  ?? null;
  const lokasiOut = a.lokasiOut ?? a.lokasi_out ?? a.lokasi_absen_pulang ?? null;

  const photo_in  = normalizePhotoUrl(a.foto_masuk  ?? a.photo_in  ?? a.bukti_foto_masuk  ?? a.attachment_in  ?? null);
  const photo_out = normalizePhotoUrl(a.foto_pulang ?? a.photo_out ?? a.bukti_foto_pulang ?? a.attachment_out ?? null);

  const departemenRaw = user?.departement ?? user?.departemen ?? user?.department ?? null;
  const jabatanRaw =
    user?.jabatan ?? user?.posisi ?? user?.position ?? user?.role_jabatan ?? user?.nama_jabatan ?? null;

  const departement =
    typeof departemenRaw === "string"
      ? { nama_departement: departemenRaw }
      : departemenRaw || null;

  const jabatan =
    typeof jabatanRaw === "string"
      ? { nama_jabatan: jabatanRaw }
      : jabatanRaw || null;

  const fotoUser = normalizePhotoUrl(
    user?.foto_profil_user ??
      user?.foto ??
      user?.avatarUrl ??
      user?.avatar ??
      user?.photoUrl ??
      user?.photo ??
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
          id_user: user.id_user ?? user.id ?? user.uuid,
          nama_pengguna: user.nama_pengguna ?? user.name ?? user.email,
          email: user.email,
          role: user.role,
          foto_profil_user: fotoUser,
          departement,
          jabatan,
        }
      : null,

    tanggal,

    jam_masuk,
    jam_pulang,

    // istirahat (sudah dirangkum + raw list)
    istirahat_mulai,
    istirahat_selesai,
    istirahat_list,

    status_masuk,
    status_pulang,

    lokasiIn: pickCoord(lokasiIn),
    lokasiOut: pickCoord(lokasiOut),
    photo_in,
    photo_out,
  };
}

export default function useAbsensiViewModel() {
  const [dateIn, setDateIn] = useState(dayjs());
  const [dateOut, setDateOut] = useState(dayjs());
  const [filterIn, setFilterIn] = useState({ q: "", divisi: undefined, status: undefined });
  const [filterOut, setFilterOut] = useState({ q: "", divisi: undefined, status: undefined });

  const url = useMemo(() => ApiEndpoints.GetAbsensiApprovals({ perPage: 200 }), []);
  const { data: resp, isLoading } = useSWR(url, fetcher, { keepPreviousData: true });

  const base = useMemo(() => {
    const list = Array.isArray(resp?.data) ? resp.data : EMPTY;
    return list.map(flattenRecipient);
  }, [resp?.data]);

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

  const rowsAll = base;

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

  const getStartCoord = (row) => row?.lokasiIn || null;
  const getEndCoord = (row) => row?.lokasiOut || null;

  return {
    kedatangan,
    kepulangan,
    rowsAll,

    loading: isLoading,

    dateIn,
    setDateIn,
    dateOut,
    setDateOut,
    filterIn,
    setFilterIn,
    filterOut,
    setFilterOut,

    divisiOptions,
    statusOptionsIn,
    statusOptionsOut,

    normalizePhotoUrl,
    getStartCoord,
    getEndCoord,
  };
}
