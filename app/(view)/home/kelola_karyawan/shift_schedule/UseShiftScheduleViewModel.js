"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App as AntdApp } from "antd";
import useSWR from "swr";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

dayjs.locale("id");

/** IMPORTANT: jangan bikin new Map() di render sebagai default value */
const EMPTY_MAP = new Map();

/* ================== KUNCI TANGGAL SERAGAM (UTC) ================== */
/** Dari server (Date/string ISO) → 'YYYY-MM-DD' UTC */
const keyFromServerDate = (v) => new Date(v).toISOString().slice(0, 10);
/** Dari “hari lokal” UI → 'YYYY-MM-DD' UTC konsisten */
const keyFromLocalDay = (dLike) => {
  const d = dayjs(dLike);
  return new Date(Date.UTC(d.year(), d.month(), d.date()))
    .toISOString()
    .slice(0, 10);
};
/** Untuk querystring ke server (date-only) */
const toISO = (d) => dayjs(d).format("YYYY-MM-DD");

/** Start of week (Senin) untuk tampilan */
function startOfWeek(d) {
  const wd = dayjs(d).day(); // 0=Min..6=Sab
  const shift = wd === 0 ? -6 : 1 - wd;
  return dayjs(d).add(shift, "day").startOf("day").toDate();
}

function isPastDate(dateKey) {
  return dayjs(dateKey).isBefore(dayjs().startOf("day"), "day");
}

/* =============== UTIL WAKTU POLA =============== */
const CLOCK_HHMM = /^\d{2}:\d{2}$/;
const CLOCK_HHMMSS = /^\d{2}:\d{2}:\d{2}$/;
function hhmmFromDb(v) {
  if (v == null || v === "") return "";
  if (typeof v === "string") {
    if (CLOCK_HHMM.test(v)) return v;
    if (CLOCK_HHMMSS.test(v)) return v.slice(0, 5);
    const m = v.match(/(\d{2}):(\d{2})(?::\d{2})?/);
    if (m) return m[1] + ":" + m[2];
  }
  const d = dayjs(v);
  return d.isValid() ? d.format("HH:mm") : "";
}

/** Ambil record shift dari response crudService (anti beda-beda bentuk) */
function pickShiftRecord(resp) {
  const d = resp?.data ?? resp;
  return d?.data ?? d;
}

function endOfWeekInclusive(d) {
  const m = dayjs(d);
  const shiftToSunday = (7 - m.day()) % 7;
  return m.add(shiftToSunday, "day").endOf("day").toDate();
}

/* =============== EXECUTOR DENGAN LIMIT & RETRY =============== */
async function runJobsWithRetry(jobFns, options) {
  const concurrency =
    options && options.concurrency != null ? options.concurrency : 6;
  const retries = options && options.retries != null ? options.retries : 2;
  const delayMs = options && options.delayMs != null ? options.delayMs : 350;

  const queue = jobFns.slice();
  let running = 0;
  const results = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  return new Promise(function (resolve) {
    function next() {
      if (queue.length === 0 && running === 0) {
        resolve(results);
        return;
      }
      while (running < concurrency && queue.length > 0) {
        const fn = queue.shift();
        running++;
        (async function () {
          let attempt = 0;
          let lastErr = null;
          while (attempt <= retries) {
            try {
              const r = await fn();
              results.push({ ok: true, value: r });
              break;
            } catch (e) {
              lastErr = e;
              attempt++;
              if (attempt <= retries) await sleep(delayMs * attempt);
            }
          }
          if (attempt > retries) results.push({ ok: false, error: lastErr });
        })().finally(function () {
          running--;
          next();
        });
      }
    }
    next();
  });
}

/* ================== SHIFT (GET TERBARU) HELPERS ================== */
/**
 * GET terbaru (per-user): /api/admin/shift-kerja/user/:id?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
const buildUserShiftQS = (startISO, endISO) => {
  const p = new URLSearchParams();
  p.set("page", "1");
  p.set("pageSize", "200");
  p.set("from", startISO);
  p.set("to", endISO);
  p.set("orderBy", "tanggal_mulai");
  p.set("sort", "asc");
  return p.toString();
};

async function loadShiftMapForRangeByUser(startDate, endDate, userId) {
  if (!userId) return new Map();
  if (dayjs(startDate).isAfter(endDate)) return new Map();

  const qs = buildUserShiftQS(toISO(startDate), toISO(endDate));
  const res = await fetcher(`${ApiEndpoints.GetShiftKerjaByUser(userId)}?${qs}`);

  const map = new Map();
  const list = (res && res.data) || [];

  list.forEach((it) => {
    const dateKey = keyFromServerDate(it.tanggal_mulai);
    const k = `${it.id_user}|${dateKey}`;
    if (!map.has(k)) {
      map.set(k, {
        userId: it.id_user,
        date: dateKey,
        status: it.status,
        polaId: it.id_pola_kerja == null ? null : String(it.id_pola_kerja),
        rawId: it.id_shift_kerja,
      });
    }
  });

  return map;
}

/** Bulk FE loader: hit endpoint per-user dengan concurrency */
async function loadShiftMapForUsersRange(userIds, startDate, endDate) {
  if (!userIds || userIds.length === 0) return new Map();
  if (dayjs(startDate).isAfter(endDate)) return new Map();

  const startISO = toISO(startDate);
  const endISO = toISO(endDate);

  const jobFns = userIds.map((uid) => async () => {
    const qs = buildUserShiftQS(startISO, endISO);
    const res = await fetcher(`${ApiEndpoints.GetShiftKerjaByUser(uid)}?${qs}`);
    return (res && res.data) || [];
  });

  const results = await runJobsWithRetry(jobFns, {
    concurrency: 6,
    retries: 1,
    delayMs: 250,
  });

  const map = new Map();
  results.forEach((r) => {
    if (!r.ok) return;
    (r.value || []).forEach((it) => {
      const dateKey = keyFromServerDate(it.tanggal_mulai);
      const k = `${it.id_user}|${dateKey}`;
      if (!map.has(k)) {
        map.set(k, {
          userId: it.id_user,
          date: dateKey,
          status: it.status,
          polaId: it.id_pola_kerja == null ? null : String(it.id_pola_kerja),
          rawId: it.id_shift_kerja,
        });
      }
    });
  });

  return map;
}

/* ================== STORY PLANNER HELPERS ================== */
async function loadStoryMapForRange(startDate, endDate, userId) {
  if (dayjs(startDate).isAfter(endDate)) return new Map();

  const p = new URLSearchParams();
  p.set("page", "1");
  p.set("pageSize", "5000");
  p.set("countTimeFrom", toISO(startDate));
  p.set("countTimeTo", toISO(endDate));
  if (userId) p.set("id_user", String(userId));

  const res = await fetcher(`${ApiEndpoints.GetStoryPlanner}?${p.toString()}`);

  const map = new Map();
  const list = (res && res.data) || [];

  list.forEach((it) => {
    if (!it.count_time) return;
    const dateKey = keyFromServerDate(it.count_time);
    const key = it.id_user + "|" + dateKey;
    if (!map.has(key)) {
      map.set(key, {
        rawId: it.id_story,
        status: it.status,
        deskripsi_kerja: it.deskripsi_kerja,
      });
    }
  });

  return map;
}

async function repeatStorySameWeekdayUntilEndOfMonth(
  userId,
  baseDateKey,
  basePayload
) {
  const source = dayjs(baseDateKey);
  const monthEnd = source.endOf("month");

  const existingMap = await loadStoryMapForRange(
    source.toDate(),
    monthEnd.toDate(),
    userId
  );

  const jobFns = [];
  let cursor = source.add(1, "week");

  while (cursor.isBefore(monthEnd, "day") || cursor.isSame(monthEnd, "day")) {
    const targetDateKey = keyFromLocalDay(cursor);
    const key = userId + "|" + targetDateKey;

    if (!existingMap.has(key)) {
      const payload = Object.assign({}, basePayload, {
        count_time: targetDateKey,
      });
      jobFns.push(() => crudService.post(ApiEndpoints.CreateStoryPlanner, payload));
    }

    cursor = cursor.add(1, "week");
  }

  if (jobFns.length === 0) return;

  await runJobsWithRetry(jobFns, { concurrency: 4, retries: 2, delayMs: 300 });
}

/* ================== VIEW MODEL ================== */
export default function UseShiftScheduleViewModel() {
  const { notification, modal } = AntdApp.useApp();

  /* ===== state waktu ===== */
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const weekEnd = useMemo(
    () => dayjs(weekStart).add(6, "day").endOf("day").toDate(),
    [weekStart]
  );

  const nextWeekStart = useMemo(
    () => dayjs(weekStart).add(1, "week").startOf("day").toDate(),
    [weekStart]
  );
  const nextWeekEnd = useMemo(
    () => dayjs(nextWeekStart).add(6, "day").endOf("day").toDate(),
    [nextWeekStart]
  );

  const currentMonthIdx = dayjs(weekStart).month();
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
      const y = base - 2 + k;
      return { label: String(y), value: y };
    });
  }, []);

  const setMonthYear = useCallback((year, monthIdx) => {
    const mid = dayjs().year(year).month(monthIdx).date(15).toDate();
    setWeekStart(startOfWeek(mid));
  }, []);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const d = dayjs(weekStart).add(i, "day");
        return {
          key: d.format("YYYYMMDD"),
          dateStr: keyFromLocalDay(d),
          labelDay: d.format("dddd"),
          labelDate: d.format("DD MMM YYYY"),
          short: d.format("ddd"),
        };
      }),
    [weekStart]
  );

  /* ===== filter & users ===== */
  const [deptId, setDeptId] = useState(null);
  const { data: deptRes, isLoading: loadingDept } = useSWR(
    ApiEndpoints.GetDepartement + "?page=1&pageSize=200",
    fetcher
  );

  const deptOptions = useMemo(() => {
    const list = (deptRes && deptRes.data) || [];
    return list.map((d) => ({
      value: d.id_departement,
      label: d.nama_departement,
    }));
  }, [deptRes]);

  const [jabatanId, setJabatanId] = useState(null);
  const { data: jabRes, isLoading: loadingJab } = useSWR(
    ApiEndpoints.GetJabatan + "?page=1&pageSize=500",
    fetcher
  );

  const jabatanOptions = useMemo(() => {
    const list = (jabRes && jabRes.data) || [];
    return list.map((j) => ({
      value: j.id_jabatan,
      label: j.nama_jabatan,
    }));
  }, [jabRes]);

  const usersQS = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", "1");
    p.set("pageSize", "1000");
    if (deptId) p.set("departementId", String(deptId));
    if (jabatanId) {
      p.set("jabatanId", String(jabatanId));
      p.set("id_jabatan", String(jabatanId)); // kompat backend lama
    }
    return p.toString();
  }, [deptId, jabatanId]);

  const {
    data: usersRes,
    isLoading: loadingUsers,
    mutate: mutUsers,
  } = useSWR(ApiEndpoints.GetUsers + "?" + usersQS, fetcher);

  const users = useMemo(() => {
    let arr = (usersRes && usersRes.data) || [];
    if (deptId) arr = arr.filter((u) => u.id_departement === deptId);
    return arr;
  }, [usersRes, deptId]);

  const rows = useMemo(() => {
    const list = users || [];
    return list.map((u) => {
      const name = u.nama_pengguna || u.nama || u.name || u.email || "—";
      const email = u.email || "—";
      const jabatan =
        (u.jabatan && u.jabatan.nama_jabatan) ||
        u.nama_jabatan ||
        (u.jabatan && u.jabatan.nama) ||
        "";
      const departemen =
        (u.departement && u.departement.nama_departement) ||
        u.nama_departement ||
        u.divisi ||
        "";
      const foto =
        u.foto_profil_user ||
        u.foto_url ||
        u.foto ||
        u.avatarUrl ||
        u.photoUrl ||
        null;

      return {
        id: u.id_user || u.id || u.uuid,
        name,
        email,
        jabatan,
        departemen,
        foto_profil_user: foto,
        avatarUrl: foto,
        foto_url: foto,
      };
    });
  }, [users]);

  const userIds = useMemo(() => rows.map((r) => r.id).filter(Boolean), [rows]);

  /* ===== pola kerja ===== */
  const { data: polaRes, isLoading: loadingPola } = useSWR(
    ApiEndpoints.GetPolaKerja + "?page=1&pageSize=500",
    fetcher
  );

  const polaMap = useMemo(() => {
    const map = new Map();
    const list = (polaRes && polaRes.data) || [];
    list.forEach((p) => {
      const mulai = p.jam_mulai || p.jamMulai || "";
      const selesai = p.jam_selesai || p.jamSelesai || "";
      const jam = hhmmFromDb(mulai) + " - " + hhmmFromDb(selesai);
      map.set(String(p.id_pola_kerja), { nama: p.nama_pola_kerja, jam });
    });
    return map;
  }, [polaRes]);

  /* ===== data shift minggu aktif (SWR) ===== */
  const shiftKey = useMemo(() => {
    if (!userIds.length) return null;
    return ["shiftRange", userIds.join(","), toISO(weekStart), toISO(weekEnd)];
  }, [userIds, weekStart, weekEnd]);

  const swrShift = useSWR(
    shiftKey,
    () => loadShiftMapForUsersRange(userIds, weekStart, weekEnd),
    { revalidateOnFocus: false }
  );

  const cellMap = swrShift.data ?? EMPTY_MAP;
  const loadingShift = swrShift.isLoading;
  const mutate = swrShift.mutate;

  // ✅ UI Map: render instan tanpa nunggu revalidate
  const [uiCellMap, setUiCellMap] = useState(EMPTY_MAP);

  // SYNC dari SWR → UI map (TIDAK LOOP: karena EMPTY_MAP stabil)
  useEffect(() => {
    if (cellMap === EMPTY_MAP) {
      setUiCellMap(EMPTY_MAP);
      return;
    }
    setUiCellMap(new Map(cellMap));
  }, [cellMap]);

  const getCell = useCallback(
    (userId, dateKey) => uiCellMap.get(userId + "|" + dateKey),
    [uiCellMap]
  );

  /* ===== data shift MINGGU BERIKUTNYA (indikator repeat) ===== */
  const nextShiftKey = useMemo(() => {
    if (!userIds.length) return null;
    return [
      "shiftRangeNext",
      userIds.join(","),
      toISO(nextWeekStart),
      toISO(nextWeekEnd),
    ];
  }, [userIds, nextWeekStart, nextWeekEnd]);

  const swrNext = useSWR(
    nextShiftKey,
    () => loadShiftMapForUsersRange(userIds, nextWeekStart, nextWeekEnd),
    { revalidateOnFocus: false }
  );

  const nextCellMap = swrNext.data ?? EMPTY_MAP;
  const loadingNextWeek = swrNext.isLoading;
  const mutateNextWeek = swrNext.mutate;

  const nextWeekUserHasAny = useMemo(() => {
    const s = new Set();
    nextCellMap.forEach((v) => {
      if (v && v.userId) s.add(v.userId);
    });
    return s;
  }, [nextCellMap]);

  const isRepeatVisualOn = useCallback(
    (userId) => nextWeekUserHasAny.has(userId),
    [nextWeekUserHasAny]
  );

  /* ===== data Story Planner minggu aktif ===== */
  const storyQs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", "1");
    p.set("pageSize", "5000");
    p.set("countTimeFrom", toISO(weekStart));
    p.set("countTimeTo", toISO(weekEnd));
    return p.toString();
  }, [weekStart, weekEnd]);

  const {
    data: storyRes,
    isLoading: loadingStory,
    mutate: mutateStory,
  } = useSWR(ApiEndpoints.GetStoryPlanner + "?" + storyQs, fetcher, {
    revalidateOnFocus: false,
  });

  const storyMap = useMemo(() => {
    const map = new Map();
    const list = (storyRes && storyRes.data) || [];
    list.forEach((it) => {
      if (!it.count_time) return;
      const dateKey = keyFromServerDate(it.count_time);
      const key = it.id_user + "|" + dateKey;
      if (!map.has(key)) {
        map.set(key, {
          userId: it.id_user,
          date: dateKey,
          rawId: it.id_story,
          status: it.status,
          deskripsi_kerja: it.deskripsi_kerja,
          id_departement: it.id_departement || null,
        });
      }
    });
    return map;
  }, [storyRes]);

  const getStoryCell = useCallback(
    (userId, dateKey) => storyMap.get(userId + "|" + dateKey),
    [storyMap]
  );

  /* ===== payload helpers ===== */
  const assignPayload = (userId, dateKey, value) => {
    const hari = dayjs(dateKey).format("dddd");
    if (value === "LIBUR") {
      return {
        id_user: userId,
        status: "LIBUR",
        hari_kerja: hari,
        tanggal_mulai: dateKey,
        tanggal_selesai: dateKey,
        id_pola_kerja: null,
      };
    }
    return {
      id_user: userId,
      status: "KERJA",
      hari_kerja: hari,
      tanggal_mulai: dateKey,
      tanggal_selesai: dateKey,
      id_pola_kerja: String(value),
    };
  };

  /* ===== assign / delete shift (INSTANT UI) ===== */
  const assignCell = useCallback(
    async (userId, dateKey, value) => {
      if (isPastDate(dateKey)) return;

      const k = userId + "|" + dateKey;
      const existing = uiCellMap.get(k);

      const optimisticCell = {
        userId,
        date: dateKey,
        status: value === "LIBUR" ? "LIBUR" : "KERJA",
        polaId: value === "LIBUR" ? null : String(value),
        rawId: existing?.rawId || null,
      };

      setUiCellMap((prev) => {
        const m = new Map(prev);
        m.set(k, optimisticCell);
        return m;
      });

      const payload = assignPayload(userId, dateKey, value);

      try {
        let resp;
        if (existing && existing.rawId) {
          resp = await crudService.put(
            ApiEndpoints.UpdateShiftKerja(existing.rawId),
            payload
          );
        } else {
          resp = await crudService.post(ApiEndpoints.CreateShiftKerja, payload);
        }

        const saved = pickShiftRecord(resp);
        const rawId =
          saved?.id_shift_kerja || saved?.rawId || existing?.rawId || null;

        setUiCellMap((prev) => {
          const m = new Map(prev);
          const cur = m.get(k) || optimisticCell;
          m.set(k, { ...cur, rawId });
          return m;
        });

        // revalidate background biar konsisten
        setTimeout(() => mutate(), 200);
        mutateNextWeek();
      } catch (e) {
        setUiCellMap((prev) => {
          const m = new Map(prev);
          if (existing) m.set(k, existing);
          else m.delete(k);
          return m;
        });
        notification.error({ message: "Gagal menyimpan shift" });
      }
    },
    [uiCellMap, mutate, mutateNextWeek, notification]
  );

  const deleteCell = useCallback(
    async (userId, dateKey) => {
      if (isPastDate(dateKey)) return;

      const k = userId + "|" + dateKey;
      const existing = uiCellMap.get(k);
      if (!existing || !existing.rawId) return;

      setUiCellMap((prev) => {
        const m = new Map(prev);
        m.delete(k);
        return m;
      });

      try {
        await crudService.delete(ApiEndpoints.DeleteShiftKerja(existing.rawId));
        setTimeout(() => mutate(), 200);
        mutateNextWeek();
      } catch (e) {
        setUiCellMap((prev) => {
          const m = new Map(prev);
          m.set(k, existing);
          return m;
        });
        notification.error({ message: "Gagal menghapus shift" });
      }
    },
    [uiCellMap, mutate, mutateNextWeek, notification]
  );

  /* ===== toggle Story Planner per hari ===== */
  const toggleStoryForDay = useCallback(
    async (userId, dateKey, checked) => {
      if (isPastDate(dateKey)) return;

      const existing = getStoryCell(userId, dateKey);

      if (checked) {
        if (existing) return;

        const user = rows.find((r) => r.id === userId);

        const defaultDesc =
          "Story planner - " +
          (user && user.name ? user.name : "Karyawan") +
          " - " +
          dayjs(dateKey).format("DD MMM YYYY");

        const basePayload = {
          id_user: userId,
          deskripsi_kerja: defaultDesc,
          status: "berjalan",
        };

        try {
          await crudService.post(
            ApiEndpoints.CreateStoryPlanner,
            Object.assign({}, basePayload, { count_time: dateKey })
          );
          await repeatStorySameWeekdayUntilEndOfMonth(
            userId,
            dateKey,
            basePayload
          );
        } catch (e) {
          notification.error({ message: "Gagal membuat Story Planner" });
          return;
        }
      } else {
        if (!existing || !existing.rawId) return;
        try {
          await crudService.delete(
            ApiEndpoints.DeleteStoryPlanner(existing.rawId)
          );
        } catch (e) {
          notification.error({ message: "Gagal menghapus Story Planner" });
          return;
        }
      }

      await mutateStory();
    },
    [getStoryCell, rows, mutateStory, notification]
  );

  /* ===== repeat sampai akhir bulan (SHIFT) ===== */
  const applyRepetition = useCallback(
    async (userId) => {
      const sourceWeek = days.map((d) => getCell(userId, d.dateStr) || null);

      const rangeStart = dayjs(weekStart).add(1, "week").startOf("day").toDate();
      const monthEnd = dayjs(weekStart).endOf("month");
      const rangeEnd = endOfWeekInclusive(monthEnd);

      const targetMap = await loadShiftMapForRangeByUser(
        rangeStart,
        rangeEnd,
        userId
      );

      let cursor = dayjs(rangeStart);
      const jobFns = [];

      while (cursor.isBefore(rangeEnd) || cursor.isSame(rangeEnd, "day")) {
        const weekKeys = Array.from({ length: 7 }).map((_, i) =>
          keyFromLocalDay(cursor.add(i, "day"))
        );

        for (let i = 0; i < 7; i++) {
          const src = sourceWeek[i];
          const dateKey = weekKeys[i];
          if (dayjs(dateKey).isAfter(rangeEnd)) continue;

          const k = userId + "|" + dateKey;
          const existingTarget = targetMap.get(k);

          if (src) {
            const val = src.status === "LIBUR" ? "LIBUR" : src.polaId;
            const payload = assignPayload(userId, dateKey, val);

            if (existingTarget && existingTarget.rawId) {
              jobFns.push(() =>
                crudService.put(
                  ApiEndpoints.UpdateShiftKerja(existingTarget.rawId),
                  payload
                )
              );
            } else {
              jobFns.push(() =>
                crudService.post(ApiEndpoints.CreateShiftKerja, payload)
              );
            }
          } else if (existingTarget && existingTarget.rawId) {
            jobFns.push(() =>
              crudService.delete(
                ApiEndpoints.DeleteShiftKerja(existingTarget.rawId)
              )
            );
          }
        }

        cursor = cursor.add(1, "week");
      }

      const results = await runJobsWithRetry(jobFns, {
        concurrency: 6,
        retries: 2,
        delayMs: 400,
      });
      const failed = results.filter((r) => !r.ok).length;

      if (failed === 0) {
        notification.success({
          message: "Jadwal berulang diterapkan",
          description:
            "Minggu sumber disalin. Hari kosong di sumber menghapus target.",
        });
      } else {
        notification.warning({
          message: "Jadwal berulang sebagian gagal",
          description:
            "Sebagian tanggal gagal diproses (" + failed + "). Coba ulangi.",
        });
      }

      await Promise.all([mutate(), mutateNextWeek()]);
    },
    [days, getCell, weekStart, mutate, mutateNextWeek, notification]
  );

  const clearRepetition = useCallback(
    async (userId) => {
      const rangeStart = dayjs(weekStart).add(1, "week").startOf("day").toDate();
      const monthEnd = dayjs(weekStart).endOf("month");
      const rangeEnd = endOfWeekInclusive(monthEnd);

      const targetMap = await loadShiftMapForRangeByUser(
        rangeStart,
        rangeEnd,
        userId
      );

      const jobFns = [];
      targetMap.forEach((v, key) => {
        if (key.startsWith(userId + "|") && v.rawId) {
          jobFns.push(() =>
            crudService.delete(ApiEndpoints.DeleteShiftKerja(v.rawId))
          );
        }
      });

      const results = await runJobsWithRetry(jobFns, {
        concurrency: 8,
        retries: 2,
        delayMs: 300,
      });
      const failed = results.filter((r) => !r.ok).length;

      if (failed === 0) {
        notification.success({ message: "Jadwal mendatang di bulan ini dihapus." });
      } else {
        notification.warning({
          message: "Penghapusan sebagian gagal",
          description:
            "Sebagian tanggal gagal dihapus (" + failed + "). Coba ulangi.",
        });
      }

      await Promise.all([mutate(), mutateNextWeek()]);
    },
    [weekStart, mutate, mutateNextWeek, notification]
  );

  const toggleRepeatSchedule = useCallback(
    (userId, isRepeating) => {
      const user = rows.find((r) => r.id === userId);
      const userName = (user && user.name) || "pengguna ini";

      modal.confirm({
        title: "Konfirmasi",
        content: isRepeating
          ? "Pola minggu ini untuk " +
            userName +
            " akan disalin tiap minggu hingga akhir bulan."
          : "Semua jadwal mendatang " +
            userName +
            " (mulai minggu depan) pada bulan ini akan dihapus.",
        okText: "Lanjut",
        cancelText: "Batal",
        onOk: async function () {
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
  const prevWeek = useCallback(
    () => setWeekStart(dayjs(weekStart).add(-1, "week").toDate()),
    [weekStart]
  );
  const nextWeek = useCallback(
    () => setWeekStart(dayjs(weekStart).add(1, "week").toDate()),
    [weekStart]
  );

  const refresh = useCallback(async () => {
    await Promise.all([mutate(), mutateNextWeek(), mutUsers(), mutateStory()]);
  }, [mutate, mutateNextWeek, mutUsers, mutateStory]);

  const loading = !!(
    loadingDept ||
    loadingJab ||
    loadingUsers ||
    loadingPola ||
    loadingShift ||
    loadingNextWeek ||
    loadingStory
  );

  return {
    weekStart,
    weekEnd,
    days,
    monthOptions,
    yearOptions,
    currentMonthIdx,
    currentYear,
    setMonthYear,

    rows,
    polaMap,
    getCell,
    getStoryCell,
    assignCell,
    deleteCell,
    toggleStoryForDay,

    deptId,
    setDeptId,
    deptOptions,
    jabatanId,
    setJabatanId,
    jabatanOptions,

    toggleRepeatSchedule,
    prevWeek,
    nextWeek,
    refresh,
    loading,

    isRepeatVisualOn,
  };
}