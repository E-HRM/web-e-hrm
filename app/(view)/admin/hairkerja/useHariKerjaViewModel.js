"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import { App as AntdApp } from "antd";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

/* ====== Const & Utils ====== */
export const DAYS_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const hhmm = (v) => (v ? dayjs(v).format("HH:mm") : "");
const dateOnly = (d) => (d ? dayjs(d).format("YYYY-MM-DD") : null); // kirim gaya YYYY-MM-DD (Date di server)

/* ambil pesan error nyaman */
const errMsg = (e) =>
  e?.response?.data?.message || e?.data?.message || e?.message || "Terjadi kesalahan";

/* ====== ViewModel ====== */
export default function useHariKerjaViewModel({ userId }) {
  const { notification } = AntdApp.useApp();

  /* Periode berlaku (wajib start, optional end) */
  const [startDate, setStartDate] = useState(dayjs().startOf("week").add(1, "day")); // default Senin minggu ini
  const [endDate, setEndDate] = useState(null); // boleh null = tanpa batas

  /* Load pola kerja untuk pilihan dropdown */
  const { data: polaRes } = useSWR(
    `${ApiEndpoints.GetPolaKerja}?page=1&pageSize=1000&includeDeleted=0&orderBy=nama_pola_kerja&sort=asc`,
    fetcher
  );
  const polaList = useMemo(() => polaRes?.data ?? [], [polaRes]);
  const polaMap = useMemo(() => {
    const m = new Map();
    for (const p of polaList) m.set(p.id_pola_kerja || p.id, p);
    return m;
  }, [polaList]);

  /* Load shift mingguan yang sudah ada untuk user ini */
  const shiftsKey =
    userId &&
    `${ApiEndpoints.GetShiftKerja}?id_user=${encodeURIComponent(
      userId
    )}&page=1&pageSize=100&orderBy=updated_at&sort=desc`;
  const { data: shiftRes, isLoading: loadingShifts, mutate } = useSWR(shiftsKey, fetcher);

  // pilih yang terbaru per hari_kerja (deleted_at = null)
  const existingByDay = useMemo(() => {
    const map = new Map();
    const rows = shiftRes?.data ?? [];
    for (const row of rows) {
      if (row.deleted_at) continue;
      const h = row.hari_kerja;
      if (!map.has(h)) map.set(h, row); // karena sudah sorted desc by updated_at
    }
    return map;
  }, [shiftRes]);

  /* state pilihan (id_pola_kerja atau null untuk LIBUR) */
  const [picked, setPicked] = useState(() =>
    DAYS_ID.reduce((acc, d) => ((acc[d] = null), acc), {})
  );

  /* sinkron initial picked dari data existing */
  const hydrated = useMemo(() => {
    const snap = { ...picked };
    for (const d of DAYS_ID) {
      const ex = existingByDay.get(d);
      snap[d] = ex?.id_pola_kerja ?? null; // null = libur
    }
    return snap;
  }, [existingByDay]); // <- dipakai hanya untuk initial render form (lihat getter di Content)

  const setPola = useCallback((hari, polaIdOrNull) => {
    setPicked((prev) => ({ ...prev, [hari]: polaIdOrNull || null }));
  }, []);

  const previewJam = useCallback(
    (polaId) => {
      const p = polaId ? polaMap.get(polaId) : null;
      if (!p) return { kerja: "", istirahat: "", maks: null };
      const jamKerja = `${hhmm(p.jam_mulai)} - ${hhmm(p.jam_selesai)}`;
      const ist =
        p.jam_istirahat_mulai && p.jam_istirahat_selesai
          ? `${hhmm(p.jam_istirahat_mulai)} - ${hhmm(p.jam_istirahat_selesai)}`
          : "";
      return { kerja: jamKerja, istirahat: ist, maks: p.maks_jam_istirahat ?? null };
    },
    [polaMap]
  );

  /* Apply (bulk POST/PUT 7 hari) */
  const apply = useCallback(async () => {
    if (!userId) {
      notification.error({ message: "User belum dipilih" });
      throw new Error("no-user");
    }
    if (!startDate) {
      notification.error({ message: "Tanggal mulai wajib diisi" });
      throw new Error("no-start");
    }

    const sd = dateOnly(startDate);
    const ed = endDate ? dateOnly(endDate) : null;

    const tasks = [];
    for (const hari of DAYS_ID) {
      const exist = existingByDay.get(hari);
      const pola = picked[hari];
      const status = pola ? "KERJA" : "LIBUR";
      const payload = {
        id_user: userId,
        hari_kerja: hari,
        status,
        tanggal_mulai: sd,
        tanggal_selesai: ed,
        id_pola_kerja: pola || null,
      };

      if (exist) {
        tasks.push(
          crudService
            .put(ApiEndpoints.UpdateShiftKerja(exist.id_shift_kerja || exist.id), payload)
            .catch((e) => {
              throw new Error(`[${hari}] ${errMsg(e)}`);
            })
        );
      } else {
        tasks.push(
          crudService.post(ApiEndpoints.CreateShiftKerja, payload).catch((e) => {
            throw new Error(`[${hari}] ${errMsg(e)}`);
          })
        );
      }
    }

    try {
      await Promise.all(tasks);
      notification.success({ message: "Jadwal mingguan tersimpan." });
      await mutate();
    } catch (e) {
      notification.error({ message: "Gagal menyimpan", description: e.message });
      throw e;
    }
  }, [userId, startDate, endDate, picked, existingByDay, mutate, notification]);

  return {
    loading: loadingShifts,
    polaList,
    polaMap,
    hydrated, // nilai awal tabel (dibaca sekali saat set form)
    picked,
    setPola,
    previewJam,

    // periode
    startDate,
    setStartDate,
    endDate,
    setEndDate,

    // action
    apply,
  };
}
