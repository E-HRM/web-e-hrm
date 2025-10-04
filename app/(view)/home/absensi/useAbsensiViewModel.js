"use client";

import useSWR from "swr";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { fetcher } from "../../../utils/fetcher";
import { ApiEndpoints } from "../../../../constrainst/endpoints";

// default array yang stabil agar tak bikin dependency berubah
const EMPTY = Object.freeze([]);

/* -------------------- Helpers "pure" -------------------- */
// Ambil kunci tanggal "YYYY-MM-DD" dari berbagai tipe input,
// TANPA konversi zona waktu; kalau string "2025-10-03 17:00:43" -> "2025-10-03"
function getDateKey(v) {
  if (!v) return "";
  if (typeof v === "string") {
    const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    // fallback: biar nggak meledak kalau formatnya beda
    const d = dayjs(v);
    return d.isValid() ? d.format("YYYY-MM-DD") : "";
  }
  // dayjs/Date/number → baca lokal runtime saja (tanpa TZ transform)
  const d = dayjs(v);
  return d.isValid() ? d.format("YYYY-MM-DD") : "";
}

/** Meratakan satu baris recipient + absensi nested (tetap) */
function flattenRecipient(rec) {
  const a = rec?.absensi ?? {};
  const user = a.user ?? rec.user ?? null;
  const depart = user?.departement ?? null;

  const tanggal =
    a.tanggal || a.tgl || a.created_at || rec.created_at || null;

  const jam_masuk = a.jam_masuk ?? a.jamIn ?? a.checkin_time ?? null;
  const jam_pulang = a.jam_pulang ?? a.jamOut ?? a.checkout_time ?? null;

  const status_masuk =
    a.status_masuk ?? a.status_in ?? a.status_masuk_label ?? null;
  const status_pulang =
    a.status_pulang ?? a.status_out ?? a.status_pulang_label ?? null;

  return {
    id_absensi:
      a.id_absensi ??
      rec.id_absensi ??
      rec.id_absensi_report_recipient ??
      rec.id ??
      null,
    user: user
      ? {
          ...user,
          departement: depart || null,
        }
      : null,
    tanggal,
    jam_masuk,
    jam_pulang,
    status_masuk,
    status_pulang,
  };
}

function shapeForIn(row) {
  return {
    ...row,
    jam: row.jam_masuk ?? null,
    status_label: row.status_masuk ?? null,
  };
}

function shapeForOut(row) {
  return {
    ...row,
    jam: row.jam_pulang ?? null,
    status_label: row.status_pulang ?? null,
  };
}

function applyFilters(list, dateVal, filters) {
  const q = (filters?.q || "").toLowerCase().trim();
  const needDiv = filters?.divisi;
  const needStatus = (filters?.status || "").toLowerCase().trim();

  return list
    .filter((r) => {
      if (!dateVal) return true;
      if (!r.tanggal) return false;
      const rowKey = getDateKey(r.tanggal);
      const targetKey = getDateKey(dateVal);
      return rowKey && targetKey ? rowKey === targetKey : false;
    })
    .filter((r) =>
      needDiv ? r.user?.departement?.nama_departement === needDiv : true
    )
    .filter((r) =>
      needStatus
        ? String(r.status_label || "").toLowerCase().includes(needStatus)
        : true
    )
    .filter((r) => {
      if (!q) return true;
      const hay = [
        r.user?.nama_pengguna,
        r.user?.departement?.nama_departement,
      ]
        .map((s) => String(s || "").toLowerCase())
        .join(" ");
      return hay.includes(q);
    });
}

export default function useAbsensiViewModel() {
  // filter per kartu
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

  // satu sumber data: approvals/history
  const url = useMemo(() => {
    return ApiEndpoints.GetAbsensiApprovals({ perPage: 200 });
  }, []);

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

  // pisah masuk/pulang & bentuk field jam/status_label
  const kedatanganAll = useMemo(
    () => base.filter((r) => r.jam_masuk).map(shapeForIn),
    [base]
  );
  const kepulanganAll = useMemo(
    () => base.filter((r) => r.jam_pulang).map(shapeForOut),
    [base]
  );

  // terapkan filter UI (tanggal, q, divisi, status)
  const kedatangan = useMemo(
    () => applyFilters(kedatanganAll, dateIn, filterIn),
    [kedatanganAll, dateIn, filterIn]
  );
  const kepulangan = useMemo(
    () => applyFilters(kepulanganAll, dateOut, filterOut),
    [kepulanganAll, dateOut, filterOut]
  );

  // label status untuk dropdown
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

  return {
    // data table
    kedatangan,
    kepulangan,

    // 1 sumber loading
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
  };
}
