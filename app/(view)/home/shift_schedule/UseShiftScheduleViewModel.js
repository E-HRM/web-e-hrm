"use client";

import { useCallback, useMemo, useState } from "react";
import { App as AntdApp } from "antd";
import useSWR from "swr";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { fetcher } from "../../../utils/fetcher";
import { crudService } from "../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../constrainst/endpoints";

dayjs.locale("id");
const toISO = (d) => dayjs(d).format("YYYY-MM-DD");

function startOfWeek(d) {
  // Senin sebagai awal minggu
  const wd = dayjs(d).day(); // 0=Min .. 6=Sab
  const shift = wd === 0 ? -6 : 1 - wd; // geser ke Senin
  return dayjs(d).add(shift, "day").startOf("day").toDate();
}

export default function UseShiftScheduleViewModel() {
  const { notification } = AntdApp.useApp();

  /* ======= state mingguan ======= */
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const weekEnd = useMemo(
    () => dayjs(weekStart).add(6, "day").endOf("day").toDate(),
    [weekStart]
  );

  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = dayjs(weekStart).add(i, "day");
      return {
        key: d.format("YYYYMMDD"),
        dateStr: d.format("YYYY-MM-DD"),
        labelDay: d.format("dddd"),
        labelDate: d.format("DD MMM YYYY"),
        short: d.format("ddd"),
      };
    });
  }, [weekStart]);

  /* ======= filter Divisi (opsional) ======= */
  const [deptId, setDeptId] = useState(null);
  const { data: deptRes } = useSWR(
    `${ApiEndpoints.GetDepartement}?page=1&pageSize=200`,
    fetcher
  );
  const deptOptions = useMemo(
    () =>
      (deptRes?.data || []).map((d) => ({
        value: d.id_departement,
        label: d.nama_departement,
      })),
    [deptRes]
  );

  /* ======= users ======= */
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
    () =>
      users.map((u) => ({
        id: u.id_user,
        name: u.nama_pengguna || u.email,
        email: u.email,
      })),
    [users]
  );

  /* ======= Pola Kerja ======= */
  const { data: polaRes } = useSWR(
    `${ApiEndpoints.GetPolaKerja}?page=1&pageSize=500`,
    fetcher
  );
  const polaMap = useMemo(() => {
    const map = new Map();
    for (const p of polaRes?.data || []) {
      const jam =
        dayjs(p.jam_mulai).format("HH:mm") +
        " - " +
        dayjs(p.jam_selesai).format("HH:mm");
      map.set(p.id_pola_kerja, { nama: p.nama_pola_kerja, jam });
    }
    return map;
  }, [polaRes]);

  /* ======= data shift minggu ini (SEMUA user) ======= */
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", "1");
    p.set("pageSize", "5000");
    p.set("tanggalMulaiFrom", toISO(weekStart));
    p.set("tanggalMulaiTo", toISO(weekEnd));
    return p.toString();
  }, [weekStart, weekEnd]);

  const { data: shiftRes, mutate } = useSWR(
    `${ApiEndpoints.GetShiftKerja}?${qs}`,
    fetcher
  );

  // Map: key = userId + "|" + dateStr
  const cellMap = useMemo(() => {
    const map = new Map();
    for (const it of (shiftRes?.data || [])) {
      const key =
        it.id_user + "|" + dayjs(it.tanggal_mulai).format("YYYY-MM-DD");
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

  // >>> Memoize getCell agar aman untuk dependency hooks lain
  const getCell = useCallback(
    (userId, dateStr) => cellMap.get(userId + "|" + dateStr),
    [cellMap]
  );

  /* ======= assign/delete cell ======= */

  const assignCell = useCallback(
    async (userId, dateStr, value) => {
      const existing = getCell(userId, dateStr);
      const payload =
        value === "LIBUR"
          ? {
              id_user: userId,
              status: "LIBUR",
              hari_kerja: dayjs(dateStr).format("dddd"),
              tanggal_mulai: dateStr,
              tanggal_selesai: dateStr,
              id_pola_kerja: null,
            }
          : {
              id_user: userId,
              status: "KERJA",
              hari_kerja: dayjs(dateStr).format("dddd"),
              tanggal_mulai: dateStr,
              tanggal_selesai: dateStr,
              id_pola_kerja: value,
            };

      if (existing?.rawId) {
        await crudService.put(
          ApiEndpoints.UpdateShiftKerja(existing.rawId),
          payload
        );
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

  /* ======= repeat mingguan (duplikasi ke depan) ======= */

  const [repeatFlags, setRepeatFlags] = useState({});
  const [repeatUntil, setRepeatUntil] = useState({});

  const setRepeatFlag = useCallback((userId, v) => {
    setRepeatFlags((s) => ({ ...s, [userId]: v }));
  }, []);
  const setRepeatUntilFor = useCallback((userId, d) => {
    setRepeatUntil((s) => ({ ...s, [userId]: d }));
  }, []);

  const applyRepeat = useCallback(
    async (userId) => {
      if (!repeatFlags[userId]) return;
      const until =
        repeatUntil[userId] || dayjs(weekStart).add(8, "week").toDate();

      // ambil 7 pola minggu ini untuk userId
      const curWeek = days.map((d) => getCell(userId, d.dateStr));
      // iterasi minggu demi minggu
      let curStart = dayjs(weekStart).add(1, "week");
      while (curStart.isBefore(dayjs(until).endOf("day"))) {
        for (let i = 0; i < 7; i++) {
          const src = curWeek[i];
          const dateStr = curStart.add(i, "day").format("YYYY-MM-DD");
          if (!src) continue; // skip yg kosong
          const val = src.status === "LIBUR" ? "LIBUR" : src.polaId;
          // create/update
          await assignCell(userId, dateStr, val);
        }
        curStart = curStart.add(1, "week");
      }
      notification.success({
        message: "Diulang",
        description:
          "Jadwal minggu ini diterapkan ke minggu-minggu berikutnya.",
      });
      await mutate();
    },
    [assignCell, days, getCell, mutate, notification, repeatFlags, repeatUntil, weekStart]
  );

  /* ======= navigasi minggu ======= */
  const prevWeek = useCallback(
    () => setWeekStart(dayjs(weekStart).add(-1, "week").toDate()),
    [weekStart]
  );
  const nextWeek = useCallback(
    () => setWeekStart(dayjs(weekStart).add(1, "week").toDate()),
    [weekStart]
  );
  const setMonthYear = useCallback((year, monthIdx) => {
    const mid = dayjs().year(year).month(monthIdx).date(15).toDate();
    setWeekStart(startOfWeek(mid));
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([mutate(), mutUsers()]);
  }, [mutate, mutUsers]);

  return {
    // waktu & hari
    weekStart,
    weekEnd,
    days,

    // grid
    rows,
    polaMap,
    getCell,
    assignCell,
    deleteCell,

    // dept & users
    deptId,
    setDeptId,
    deptOptions,

    // repeat
    repeatFlags,
    setRepeatFlag,
    repeatUntil,
    setRepeatUntil: setRepeatUntilFor,
    applyRepeat,

    // navigasi
    prevWeek,
    nextWeek,
    setMonthYear,
    refresh,
  };
}
