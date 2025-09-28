"use client";

import { useCallback, useMemo, useState } from "react";
import { App as AntdApp } from "antd";
import useSWR from "swr";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

dayjs.locale("id");
const toISO = (d) => dayjs(d).format("YYYY-MM-DD");

function startOfWeek(d) {
  const wd = dayjs(d).day(); // 0=Min..6=Sab
  const shift = wd === 0 ? -6 : 1 - wd;
  return dayjs(d).add(shift, "day").startOf("day").toDate();
}

/* ===== helpers ===== */
const buildListQS = (startISO, endISO) => {
  const p = new URLSearchParams();
  p.set("page", "1");
  p.set("pageSize", "5000");
  p.set("tanggalMulaiFrom", startISO);
  p.set("tanggalMulaiTo", endISO);
  return p.toString();
};

async function loadShiftMapForRange(startDate, endDate) {
  if (dayjs(startDate).isAfter(endDate)) return new Map();
  const qs = buildListQS(toISO(startDate), toISO(endDate));
  const res = await fetcher(`${ApiEndpoints.GetShiftKerja}?${qs}`);
  const map = new Map();
  for (const it of res?.data || []) {
    const dateStr = dayjs(it.tanggal_mulai).format("YYYY-MM-DD");
    map.set(`${it.id_user}|${dateStr}`, {
      rawId: it.id_shift_kerja,
      status: it.status,
      polaId: it.id_pola_kerja ?? null,
    });
  }
  return map;
}

export default function UseShiftScheduleViewModel() {
  const { notification, modal } = AntdApp.useApp();

  /* ===== state waktu ===== */
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const weekEnd = useMemo(
    () => dayjs(weekStart).add(6, "day").endOf("day").toDate(),
    [weekStart]
  );

  // kontrol filter bulan/tahun
  const currentMonthIdx = dayjs(weekStart).month(); // 0..11
  const currentYear = dayjs(weekStart).year();

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        label: dayjs().month(i).format("MMMM"),
        value: i,
      })),
    []
  );
  const yearOptions = useMemo(() => {
    const base = dayjs().year();
    return Array.from({ length: 7 }).map((_, k) => {
      const y = base - 2 + k; // range: -2 .. +4
      return { label: String(y), value: y };
    });
  }, []);

  const setMonthYear = useCallback((year, monthIdx) => {
    // ambil tanggal 15 di bulan tsb agar aman, lalu snap ke Senin
    const mid = dayjs().year(year).month(monthIdx).date(15).toDate();
    setWeekStart(startOfWeek(mid));
  }, []);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const d = dayjs(weekStart).add(i, "day");
        return {
          key: d.format("YYYYMMDD"),
          dateStr: d.format("YYYY-MM-DD"),
          labelDay: d.format("dddd"),
          labelDate: d.format("DD MMM YYYY"),
          short: d.format("ddd"),
        };
      }),
    [weekStart]
  );

  /* ===== filter & users ===== */
  const [deptId, setDeptId] = useState(null);
  const { data: deptRes } = useSWR(`${ApiEndpoints.GetDepartement}?page=1&pageSize=200`, fetcher);
  const deptOptions = useMemo(
    () => (deptRes?.data || []).map((d) => ({ value: d.id_departement, label: d.nama_departement })),
    [deptRes]
  );

  const { data: usersRes, mutate: mutUsers } = useSWR(
    `${ApiEndpoints.GetUsers}?page=1&pageSize=1000`,
    fetcher
  );
  const users = useMemo(() => {
    let arr = usersRes?.data || [];
    if (deptId) arr = arr.filter((u) => u.id_departement === deptId);
    return arr;
  }, [usersRes, deptId]);

  const rows = useMemo(
    () => users.map((u) => ({ id: u.id_user, name: u.nama_pengguna || u.email, email: u.email })),
    [users]
  );

  /* ===== pola kerja ===== */
  const { data: polaRes } = useSWR(`${ApiEndpoints.GetPolaKerja}?page=1&pageSize=500`, fetcher);
  const polaMap = useMemo(() => {
    const map = new Map();
    for (const p of polaRes?.data || []) {
      const jam = `${dayjs(p.jam_mulai).format("HH:mm")} - ${dayjs(p.jam_selesai).format("HH:mm")}`;
      map.set(p.id_pola_kerja, { nama: p.nama_pola_kerja, jam });
    }
    return map;
  }, [polaRes]);

  /* ===== data shift minggu aktif ===== */
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", "1");
    p.set("pageSize", "5000");
    p.set("tanggalMulaiFrom", toISO(weekStart));
    p.set("tanggalMulaiTo", toISO(weekEnd));
    return p.toString();
  }, [weekStart, weekEnd]);

  const { data: shiftRes, mutate } = useSWR(`${ApiEndpoints.GetShiftKerja}?${qs}`, fetcher);

  const cellMap = useMemo(() => {
    const map = new Map();
    for (const it of shiftRes?.data || []) {
      const key = `${it.id_user}|${dayjs(it.tanggal_mulai).format("YYYY-MM-DD")}`;
      map.set(key, {
        userId: it.id_user,
        date: dayjs(it.tanggal_mulai).format("YYYY-MM-DD"),
        status: it.status,
        polaId: it.id_pola_kerja ?? null,
        rawId: it.id_shift_kerja,
      });
    }
    return map;
  }, [shiftRes]);

  const getCell = useCallback((userId, dateStr) => cellMap.get(`${userId}|${dateStr}`), [cellMap]);

  /* ===== payload helpers (SELALU kirim 'hari_kerja') ===== */
  const assignPayload = (userId, dateStr, value) => {
    const hari = dayjs(dateStr).format("dddd"); // penting!
    return value === "LIBUR"
      ? {
          id_user: userId,
          status: "LIBUR",
          hari_kerja: hari,
          tanggal_mulai: dateStr,
          tanggal_selesai: dateStr,
          id_pola_kerja: null,
        }
      : {
          id_user: userId,
          status: "KERJA",
          hari_kerja: hari,
          tanggal_mulai: dateStr,
          tanggal_selesai: dateStr,
          id_pola_kerja: value,
        };
  };

  /* ===== assign / delete ===== */
  const assignCell = useCallback(
    async (userId, dateStr, value) => {
      const existing = getCell(userId, dateStr);
      const payload = assignPayload(userId, dateStr, value);
      if (existing?.rawId) {
        await crudService.put(ApiEndpoints.UpdateShiftKerja(existing.rawId), payload);
      } else {
        await crudService.post(ApiEndpoints.CreateShiftKerja, payload);
      }
      await mutate();
    },
    [getCell, mutate]
  );

  const deleteCell = useCallback(
    async (userId, dateStr) => {
      const existing = getCell(userId, dateStr);
      if (!existing?.rawId) return;
      await crudService.delete(ApiEndpoints.DeleteShiftKerja(existing.rawId));
      await mutate();
    },
    [getCell, mutate]
  );

  /* ===== apply repeat: HANYA sampai akhir bulan ===== */
  const applyRepetition = useCallback(
    async (userId) => {
      const sourceWeek = days.map((d) => getCell(userId, d.dateStr) || null);
      const rangeStart = dayjs(weekStart).add(1, "week").startOf("day").toDate();
      const rangeEnd = dayjs(weekStart).endOf("month").toDate(); // <= diubah: end of month

      let curStart = dayjs(rangeStart);
      while (curStart.isBefore(rangeEnd) || curStart.isSame(rangeEnd, "day")) {
        const weekEndLocal = curStart.add(6, "day");
        const weekDates = Array.from({ length: 7 }).map((_, i) =>
          curStart.add(i, "day").format("YYYY-MM-DD")
        );
        const targetMap = await loadShiftMapForRange(curStart.toDate(), weekEndLocal.endOf("day").toDate());

        for (let i = 0; i < 7; i++) {
          const src = sourceWeek[i];
          const dateStr = weekDates[i];
          if (dayjs(dateStr).isAfter(rangeEnd)) continue; // jangan lewat bulan ini
          const key = `${userId}|${dateStr}`;
          const existingTarget = targetMap.get(key);

          if (src) {
            const val = src.status === "LIBUR" ? "LIBUR" : src.polaId;
            const payload = assignPayload(userId, dateStr, val);
            if (existingTarget?.rawId) {
              await crudService.put(ApiEndpoints.UpdateShiftKerja(existingTarget.rawId), payload);
            } else {
              await crudService.post(ApiEndpoints.CreateShiftKerja, payload);
            }
          } else if (existingTarget?.rawId) {
            await crudService.delete(ApiEndpoints.DeleteShiftKerja(existingTarget.rawId));
          }
        }
        curStart = curStart.add(1, "week");
      }

      notification.success({
        message: "Jadwal berulang diterapkan",
        description: "Pola minggu ini disalin hingga akhir bulan.",
      });
      await mutate();
    },
    [days, getCell, weekStart, mutate, notification]
  );

  const clearRepetition = useCallback(
    async (userId) => {
      const rangeStart = dayjs(weekStart).add(1, "week").startOf("day").toDate();
      const rangeEnd = dayjs(weekStart).endOf("month").toDate(); // <= diubah: end of month

      const targetMap = await loadShiftMapForRange(rangeStart, rangeEnd);
      const toDelete = [];
      targetMap.forEach((v, key) => {
        if (key.startsWith(`${userId}|`)) toDelete.push(v.rawId);
      });
      await Promise.all(toDelete.map((id) => crudService.delete(ApiEndpoints.DeleteShiftKerja(id))));
      notification.success({ message: "Jadwal berulang dihapus untuk sisa bulan ini." });
      await mutate();
    },
    [weekStart, mutate, notification]
  );

  const toggleRepeatSchedule = useCallback(
    (userId, isRepeating) => {
      const userName = rows.find((r) => r.id === userId)?.name || "pengguna ini";
      modal.confirm({
        title: "Konfirmasi",
        content: isRepeating
          ? `Pola minggu ini untuk ${userName} akan disalin tiap minggu hingga akhir bulan.`
          : `Semua jadwal mendatang ${userName} (mulai minggu depan) pada bulan ini akan dihapus.`,
        okText: "Lanjut",
        cancelText: "Batal",
        onOk: async () => {
          try {
            if (isRepeating) await applyRepetition(userId);
            else await clearRepetition(userId);
          } catch (e) {
            notification.error({ message: "Gagal memproses jadwal." });
          }
        },
      });
    },
    [rows, modal, applyRepetition, clearRepetition, notification]
  );

  /* ===== navigasi & refresh ===== */
  const prevWeek = useCallback(() => setWeekStart(dayjs(weekStart).add(-1, "week").toDate()), [weekStart]);
  const nextWeek = useCallback(() => setWeekStart(dayjs(weekStart).add(1, "week").toDate()), [weekStart]);

  const refresh = useCallback(async () => {
    await Promise.all([mutUsers(), mutate()]);
  }, [mutUsers, mutate]);

  return {
    // waktu & hari
    weekStart, weekEnd, days,
    monthOptions, yearOptions, currentMonthIdx, currentYear, setMonthYear,

    // grid
    rows, polaMap, getCell, assignCell, deleteCell,

    // filter
    deptId, setDeptId, deptOptions,

    // repeat
    toggleRepeatSchedule,

    // nav
    prevWeek, nextWeek, refresh,
  };
}
