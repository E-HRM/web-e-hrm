"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App as AntdApp } from "antd";
import useSWR, { useSWRConfig } from "swr";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

dayjs.locale("id");

const EMPTY_MAP = new Map();

const keyFromServerDate = (v) => new Date(v).toISOString().slice(0, 10);
const keyFromLocalDay = (dLike) => {
  const d = dayjs(dLike);
  return new Date(Date.UTC(d.year(), d.month(), d.date())).toISOString().slice(0, 10);
};
const toISO = (d) => dayjs(d).format("YYYY-MM-DD");

function startOfWeek(d) {
  const wd = dayjs(d).day();
  const shift = wd === 0 ? -6 : 1 - wd;
  return dayjs(d).add(shift, "day").startOf("day").toDate();
}

function isPastDate(dateKey) {
  return dayjs(dateKey).isBefore(dayjs().startOf("day"), "day");
}

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

function pickShiftRecord(resp) {
  const d = resp?.data ?? resp;
  return d?.data ?? d;
}

function endOfWeekInclusive(d) {
  const m = dayjs(d);
  const shiftToSunday = (7 - m.day()) % 7;
  return m.add(shiftToSunday, "day").endOf("day").toDate();
}

async function runJobsWithRetry(jobFns, options) {
  const concurrency = options?.concurrency ?? 6;
  const retries = options?.retries ?? 2;
  const delayMs = options?.delayMs ?? 350;

  const queue = jobFns.slice();
  let running = 0;
  const results = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  return new Promise((resolve) => {
    function next() {
      if (queue.length === 0 && running === 0) return resolve(results);
      while (running < concurrency && queue.length > 0) {
        const fn = queue.shift();
        running++;
        (async () => {
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
        })().finally(() => {
          running--;
          next();
        });
      }
    }
    next();
  });
}

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

  const results = await runJobsWithRetry(jobFns, { concurrency: 6, retries: 1, delayMs: 250 });

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
      map.set(key, { rawId: it.id_story, status: it.status, deskripsi_kerja: it.deskripsi_kerja });
    }
  });

  return map;
}

async function repeatStorySameWeekdayUntilEndOfMonth(userId, baseDateKey, basePayload) {
  const source = dayjs(baseDateKey);
  const monthEnd = source.endOf("month");

  const existingMap = await loadStoryMapForRange(source.toDate(), monthEnd.toDate(), userId);

  const jobFns = [];
  let cursor = source.add(1, "week");

  while (cursor.isBefore(monthEnd, "day") || cursor.isSame(monthEnd, "day")) {
    const targetDateKey = keyFromLocalDay(cursor);
    const key = userId + "|" + targetDateKey;

    if (!existingMap.has(key)) {
      const payload = Object.assign({}, basePayload, { count_time: targetDateKey });
      jobFns.push(() => crudService.post(ApiEndpoints.CreateStoryPlanner, payload));
    }
    cursor = cursor.add(1, "week");
  }

  if (jobFns.length === 0) return;
  await runJobsWithRetry(jobFns, { concurrency: 4, retries: 2, delayMs: 300 });
}

export default function UseShiftScheduleViewModel() {
  const { notification, modal } = AntdApp.useApp();
  const { mutate: globalMutate } = useSWRConfig();

  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const weekEnd = useMemo(() => dayjs(weekStart).add(6, "day").endOf("day").toDate(), [weekStart]);

  const nextWeekStart = useMemo(() => dayjs(weekStart).add(1, "week").startOf("day").toDate(), [weekStart]);
  const nextWeekEnd = useMemo(() => dayjs(nextWeekStart).add(6, "day").endOf("day").toDate(), [nextWeekStart]);

  const currentMonthIdx = dayjs(weekStart).month();
  const currentYear = dayjs(weekStart).year();

  const monthOptions = useMemo(
    () => Array.from({ length: 12 }).map((_, i) => ({ label: dayjs().month(i).format("MMMM"), value: i })),
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

  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = dayjs(weekStart).add(i, "day");
      return {
        key: d.format("YYYYMMDD"),
        dateStr: keyFromLocalDay(d),
        labelDay: d.format("dddd"),
        labelDate: d.format("DD MMM YYYY"),
        short: d.format("ddd"),
      };
    });
  }, [weekStart]);

  const [deptId, setDeptId] = useState(null);
  const { data: deptRes, isLoading: loadingDept } = useSWR(ApiEndpoints.GetDepartement + "?page=1&pageSize=200", fetcher);

  const deptOptions = useMemo(() => {
    const list = (deptRes && deptRes.data) || [];
    return list.map((d) => ({ value: d.id_departement, label: d.nama_departement }));
  }, [deptRes]);

  const [jabatanId, setJabatanId] = useState(null);
  const { data: jabRes, isLoading: loadingJab } = useSWR(ApiEndpoints.GetJabatan + "?page=1&pageSize=500", fetcher);

  const jabatanOptions = useMemo(() => {
    const list = (jabRes && jabRes.data) || [];
    return list.map((j) => ({ value: j.id_jabatan, label: j.nama_jabatan }));
  }, [jabRes]);

  const usersQS = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", "1");
    p.set("pageSize", "1000");
    if (deptId) p.set("departementId", String(deptId));
    if (jabatanId) {
      p.set("jabatanId", String(jabatanId));
      p.set("id_jabatan", String(jabatanId));
    }
    return p.toString();
  }, [deptId, jabatanId]);

  const { data: usersRes, isLoading: loadingUsers, mutate: mutUsers } = useSWR(ApiEndpoints.GetUsers + "?" + usersQS, fetcher);

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
      const jabatan = (u.jabatan && u.jabatan.nama_jabatan) || u.nama_jabatan || (u.jabatan && u.jabatan.nama) || "";
      const departemen = (u.departement && u.departement.nama_departement) || u.nama_departement || u.divisi || "";
      const foto = u.foto_profil_user || u.foto_url || u.foto || u.avatarUrl || u.photoUrl || null;

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
  const userIdsKey = useMemo(() => userIds.join(","), [userIds]);

  const { data: polaRes, isLoading: loadingPola } = useSWR(ApiEndpoints.GetPolaKerja + "?page=1&pageSize=500", fetcher);

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

  const shiftKey = useMemo(() => {
    if (!userIds.length) return null;
    return ["shiftRange", userIdsKey, toISO(weekStart), toISO(weekEnd)];
  }, [userIds.length, userIdsKey, weekStart, weekEnd]);

  const swrShift = useSWR(shiftKey, () => loadShiftMapForUsersRange(userIds, weekStart, weekEnd), {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const cellMap = swrShift.data ?? EMPTY_MAP;
  const loadingShift = swrShift.isLoading;
  const mutate = swrShift.mutate;

  const [uiCellMap, setUiCellMap] = useState(EMPTY_MAP);
  const uiCellMapRef = useRef(EMPTY_MAP);

  useEffect(() => {
    if (cellMap === EMPTY_MAP) return;
    const next = new Map(cellMap);
    uiCellMapRef.current = next;
    setUiCellMap(next);
  }, [cellMap]);

  const commitUiCellMap = useCallback(
    (producer) => {
      const basePrev = uiCellMapRef.current === EMPTY_MAP ? new Map() : new Map(uiCellMapRef.current);
      const next = producer(basePrev) || basePrev;
      uiCellMapRef.current = next;
      setUiCellMap(next);
      if (shiftKey) globalMutate(shiftKey, next, false);
      return next;
    },
    [globalMutate, shiftKey]
  );

  const getCell = useCallback((userId, dateKey) => {
    return uiCellMapRef.current.get(userId + "|" + dateKey);
  }, []);

  const nextShiftKey = useMemo(() => {
    if (!userIds.length) return null;
    return ["shiftRangeNext", userIdsKey, toISO(nextWeekStart), toISO(nextWeekEnd)];
  }, [userIds.length, userIdsKey, nextWeekStart, nextWeekEnd]);

  const swrNext = useSWR(nextShiftKey, () => loadShiftMapForUsersRange(userIds, nextWeekStart, nextWeekEnd), {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const nextCellMap = swrNext.data ?? EMPTY_MAP;
  const loadingNextWeek = swrNext.isLoading;
  const mutateNextWeek = swrNext.mutate;

  const [uiNextCellMap, setUiNextCellMap] = useState(EMPTY_MAP);

  useEffect(() => {
    if (nextCellMap === EMPTY_MAP) return;
    setUiNextCellMap(new Map(nextCellMap));
  }, [nextCellMap]);

  const nextWeekKeys = useMemo(() => {
    const base = dayjs(nextWeekStart);
    return Array.from({ length: 7 }).map((_, i) => keyFromLocalDay(base.add(i, "day")));
  }, [nextWeekStart]);

  const nextWeekUserHasAny = useMemo(() => {
    const s = new Set();
    uiNextCellMap.forEach((v) => {
      if (v?.userId) s.add(v.userId);
    });
    return s;
  }, [uiNextCellMap]);

  const isRepeatVisualOn = useCallback((userId) => nextWeekUserHasAny.has(userId), [nextWeekUserHasAny]);

  const storyQs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", "1");
    p.set("pageSize", "5000");
    p.set("countTimeFrom", toISO(weekStart));
    p.set("countTimeTo", toISO(weekEnd));
    return p.toString();
  }, [weekStart, weekEnd]);

  const { data: storyRes, isLoading: loadingStory, mutate: mutateStory } = useSWR(ApiEndpoints.GetStoryPlanner + "?" + storyQs, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
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

  const storyMapRef = useRef(new Map());
  useEffect(() => {
    storyMapRef.current = storyMap;
  }, [storyMap]);

  const getStoryCell = useCallback((userId, dateKey) => {
    return storyMapRef.current.get(userId + "|" + dateKey);
  }, []);

  const assignPayload = useCallback((userId, dateKey, value) => {
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
  }, []);

  const assignCell = useCallback(
    async (userId, dateKey, value) => {
      if (isPastDate(dateKey)) return;

      const k = userId + "|" + dateKey;
      const existing = uiCellMapRef.current.get(k);

      const optimisticCell = {
        userId,
        date: dateKey,
        status: value === "LIBUR" ? "LIBUR" : "KERJA",
        polaId: value === "LIBUR" ? null : String(value),
        rawId: existing?.rawId || null,
      };

      commitUiCellMap((m) => {
        m.set(k, optimisticCell);
        return m;
      });

      const payload = assignPayload(userId, dateKey, value);

      try {
        let resp;
        if (existing && existing.rawId) resp = await crudService.put(ApiEndpoints.UpdateShiftKerja(existing.rawId), payload);
        else resp = await crudService.post(ApiEndpoints.CreateShiftKerja, payload);

        const saved = pickShiftRecord(resp);
        const rawId = saved?.id_shift_kerja || saved?.rawId || existing?.rawId || null;

        commitUiCellMap((m) => {
          const cur = m.get(k) || optimisticCell;
          m.set(k, { ...cur, rawId });
          return m;
        });

        setTimeout(() => mutate(), 600);
        mutateNextWeek();
      } catch (e) {
        commitUiCellMap((m) => {
          if (existing) m.set(k, existing);
          else m.delete(k);
          return m;
        });
        notification.error({ message: "Gagal menyimpan shift" });
      }
    },
    [assignPayload, commitUiCellMap, mutate, mutateNextWeek, notification]
  );

  const deleteCell = useCallback(
    async (userId, dateKey) => {
      if (isPastDate(dateKey)) return;

      const k = userId + "|" + dateKey;
      const existing = uiCellMapRef.current.get(k);
      if (!existing || !existing.rawId) return;

      commitUiCellMap((m) => {
        m.delete(k);
        return m;
      });

      try {
        await crudService.delete(ApiEndpoints.DeleteShiftKerja(existing.rawId));
        setTimeout(() => mutate(), 600);
        mutateNextWeek();
      } catch (e) {
        commitUiCellMap((m) => {
          m.set(k, existing);
          return m;
        });
        notification.error({ message: "Gagal menghapus shift" });
      }
    },
    [commitUiCellMap, mutate, mutateNextWeek, notification]
  );

  const toggleStoryForDay = useCallback(
    async (userId, dateKey, checked) => {
      if (isPastDate(dateKey)) return;

      const existing = getStoryCell(userId, dateKey);

      if (checked) {
        if (existing) return;

        const user = rows.find((r) => r.id === userId);
        const defaultDesc = "Story planner - " + (user && user.name ? user.name : "Karyawan") + " - " + dayjs(dateKey).format("DD MMM YYYY");

        const basePayload = { id_user: userId, deskripsi_kerja: defaultDesc, status: "berjalan" };

        try {
          await crudService.post(ApiEndpoints.CreateStoryPlanner, Object.assign({}, basePayload, { count_time: dateKey }));
          await repeatStorySameWeekdayUntilEndOfMonth(userId, dateKey, basePayload);
        } catch (e) {
          notification.error({ message: "Gagal membuat Story Planner" });
          return;
        }
      } else {
        if (!existing || !existing.rawId) return;
        try {
          await crudService.delete(ApiEndpoints.DeleteStoryPlanner(existing.rawId));
        } catch (e) {
          notification.error({ message: "Gagal menghapus Story Planner" });
          return;
        }
      }

      await mutateStory();
    },
    [getStoryCell, rows, mutateStory, notification]
  );

  const shiftRangeKeyFor = useCallback(
    (ws, we) => {
      if (!userIdsKey) return null;
      return ["shiftRange", userIdsKey, toISO(ws), toISO(we)];
    },
    [userIdsKey]
  );

  const applyPatternToWeekCache = useCallback(
    (weekStartDate, userId, sourceWeek) => {
      const ws = dayjs(weekStartDate).startOf("day").toDate();
      const we = dayjs(ws).add(6, "day").endOf("day").toDate();
      const key = shiftRangeKeyFor(ws, we);
      if (!key) return;

      globalMutate(
        key,
        (cur) => {
          const m = cur instanceof Map ? new Map(cur) : new Map();
          const base = dayjs(ws);

          for (let i = 0; i < 7; i++) {
            const dateKey = keyFromLocalDay(base.add(i, "day"));
            const k = userId + "|" + dateKey;
            const src = sourceWeek[i] || null;

            if (src) {
              const prev = m.get(k);
              m.set(k, {
                userId,
                date: dateKey,
                status: src.status === "LIBUR" ? "LIBUR" : "KERJA",
                polaId: src.status === "LIBUR" ? null : src.polaId ? String(src.polaId) : null,
                rawId: prev?.rawId || null,
              });
            } else {
              m.delete(k);
            }
          }

          return m;
        },
        false
      );
    },
    [globalMutate, shiftRangeKeyFor]
  );

  const clearWeekCacheForUser = useCallback(
    (weekStartDate, userId) => {
      const ws = dayjs(weekStartDate).startOf("day").toDate();
      const we = dayjs(ws).add(6, "day").endOf("day").toDate();
      const key = shiftRangeKeyFor(ws, we);
      if (!key) return;

      globalMutate(
        key,
        (cur) => {
          const m = cur instanceof Map ? new Map(cur) : new Map();
          const base = dayjs(ws);
          for (let i = 0; i < 7; i++) {
            const dateKey = keyFromLocalDay(base.add(i, "day"));
            m.delete(userId + "|" + dateKey);
          }
          return m;
        },
        false
      );
    },
    [globalMutate, shiftRangeKeyFor]
  );

  const optimisticSetNextWeekFromSource = useCallback(
    (userId) => {
      const sourceWeek = days.map((d) => getCell(userId, d.dateStr) || null);

      setUiNextCellMap((prev) => {
        const m = new Map(prev);

        for (let i = 0; i < 7; i++) {
          const dateKey = nextWeekKeys[i];
          const k = userId + "|" + dateKey;
          const src = sourceWeek[i];

          if (src) {
            m.set(k, {
              userId,
              date: dateKey,
              status: src.status === "LIBUR" ? "LIBUR" : "KERJA",
              polaId: src.status === "LIBUR" ? null : src.polaId ? String(src.polaId) : null,
              rawId: m.get(k)?.rawId || null,
            });
          } else {
            m.delete(k);
          }
        }

        if (nextShiftKey) globalMutate(nextShiftKey, m, false);
        return m;
      });

      applyPatternToWeekCache(nextWeekStart, userId, sourceWeek);
    },
    [days, getCell, nextWeekKeys, globalMutate, nextShiftKey, applyPatternToWeekCache, nextWeekStart]
  );

  const optimisticClearNextWeek = useCallback(
    (userId) => {
      setUiNextCellMap((prev) => {
        const m = new Map(prev);
        for (let i = 0; i < 7; i++) {
          const dateKey = nextWeekKeys[i];
          m.delete(userId + "|" + dateKey);
        }
        if (nextShiftKey) globalMutate(nextShiftKey, m, false);
        return m;
      });

      clearWeekCacheForUser(nextWeekStart, userId);
    },
    [nextWeekKeys, globalMutate, nextShiftKey, clearWeekCacheForUser, nextWeekStart]
  );

  const optimisticApplyRangeCachesFromSource = useCallback(
    (userId) => {
      const sourceWeek = days.map((d) => getCell(userId, d.dateStr) || null);

      const rangeStart = dayjs(weekStart).add(1, "week").startOf("day").toDate();
      const monthEnd = dayjs(weekStart).endOf("month");
      const rangeEnd = endOfWeekInclusive(monthEnd);

      let cursor = startOfWeek(rangeStart);

      while (!dayjs(cursor).isAfter(rangeEnd, "day")) {
        applyPatternToWeekCache(cursor, userId, sourceWeek);
        cursor = dayjs(cursor).add(1, "week").toDate();
      }
    },
    [applyPatternToWeekCache, days, getCell, weekStart]
  );

  const optimisticClearRangeCachesForUser = useCallback(
    (userId) => {
      const rangeStart = dayjs(weekStart).add(1, "week").startOf("day").toDate();
      const monthEnd = dayjs(weekStart).endOf("month");
      const rangeEnd = endOfWeekInclusive(monthEnd);

      let cursor = startOfWeek(rangeStart);

      while (!dayjs(cursor).isAfter(rangeEnd, "day")) {
        clearWeekCacheForUser(cursor, userId);
        cursor = dayjs(cursor).add(1, "week").toDate();
      }
    },
    [clearWeekCacheForUser, weekStart]
  );

  const applyRepetition = useCallback(
    async (userId) => {
      optimisticSetNextWeekFromSource(userId);
      optimisticApplyRangeCachesFromSource(userId);

      const sourceWeek = days.map((d) => getCell(userId, d.dateStr) || null);

      const rangeStart = dayjs(weekStart).add(1, "week").startOf("day").toDate();
      const monthEnd = dayjs(weekStart).endOf("month");
      const rangeEnd = endOfWeekInclusive(monthEnd);

      const targetMap = await loadShiftMapForRangeByUser(rangeStart, rangeEnd, userId);

      let cursor = dayjs(rangeStart);
      const jobFns = [];

      while (cursor.isBefore(rangeEnd) || cursor.isSame(rangeEnd, "day")) {
        const weekKeys = Array.from({ length: 7 }).map((_, i) => keyFromLocalDay(cursor.add(i, "day")));

        for (let i = 0; i < 7; i++) {
          const src = sourceWeek[i];
          const dateKey = weekKeys[i];
          if (dayjs(dateKey).isAfter(rangeEnd)) continue;

          const k = userId + "|" + dateKey;
          const existingTarget = targetMap.get(k);

          if (src) {
            const val = src.status === "LIBUR" ? "LIBUR" : src.polaId;
            const payload = assignPayload(userId, dateKey, val);

            if (existingTarget && existingTarget.rawId) jobFns.push(() => crudService.put(ApiEndpoints.UpdateShiftKerja(existingTarget.rawId), payload));
            else jobFns.push(() => crudService.post(ApiEndpoints.CreateShiftKerja, payload));
          } else if (existingTarget && existingTarget.rawId) {
            jobFns.push(() => crudService.delete(ApiEndpoints.DeleteShiftKerja(existingTarget.rawId)));
          }
        }

        cursor = cursor.add(1, "week");
      }

      const results = await runJobsWithRetry(jobFns, { concurrency: 6, retries: 2, delayMs: 400 });
      const failed = results.filter((r) => !r.ok).length;

      if (failed === 0) {
        notification.success({
          message: "Jadwal berulang diterapkan",
          description: "Minggu sumber disalin. Hari kosong di sumber menghapus target.",
        });
      } else {
        notification.warning({
          message: "Jadwal berulang sebagian gagal",
          description: "Sebagian tanggal gagal diproses (" + failed + "). Coba ulangi.",
        });
      }

      await Promise.all([mutate(), mutateNextWeek()]);
    },
    [
      optimisticSetNextWeekFromSource,
      optimisticApplyRangeCachesFromSource,
      days,
      getCell,
      weekStart,
      assignPayload,
      notification,
      mutate,
      mutateNextWeek,
    ]
  );

  const clearRepetition = useCallback(
    async (userId) => {
      optimisticClearNextWeek(userId);
      optimisticClearRangeCachesForUser(userId);

      const rangeStart = dayjs(weekStart).add(1, "week").startOf("day").toDate();
      const monthEnd = dayjs(weekStart).endOf("month");
      const rangeEnd = endOfWeekInclusive(monthEnd);

      const targetMap = await loadShiftMapForRangeByUser(rangeStart, rangeEnd, userId);

      const jobFns = [];
      targetMap.forEach((v, key) => {
        if (key.startsWith(userId + "|") && v.rawId) jobFns.push(() => crudService.delete(ApiEndpoints.DeleteShiftKerja(v.rawId)));
      });

      const results = await runJobsWithRetry(jobFns, { concurrency: 8, retries: 2, delayMs: 300 });
      const failed = results.filter((r) => !r.ok).length;

      if (failed === 0) notification.success({ message: "Jadwal mendatang di bulan ini dihapus." });
      else {
        notification.warning({
          message: "Penghapusan sebagian gagal",
          description: "Sebagian tanggal gagal dihapus (" + failed + "). Coba ulangi.",
        });
      }

      await Promise.all([mutate(), mutateNextWeek()]);
    },
    [optimisticClearNextWeek, optimisticClearRangeCachesForUser, weekStart, notification, mutate, mutateNextWeek]
  );

  const toggleRepeatSchedule = useCallback(
    (userId, isRepeating) => {
      const user = rows.find((r) => r.id === userId);
      const userName = (user && user.name) || "pengguna ini";

      modal.confirm({
        title: "Konfirmasi",
        content: isRepeating
          ? "Pola minggu ini untuk " + userName + " akan disalin tiap minggu hingga akhir bulan."
          : "Semua jadwal mendatang " + userName + " (mulai minggu depan) pada bulan ini akan dihapus.",
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

  const prevWeek = useCallback(() => setWeekStart(dayjs(weekStart).add(-1, "week").toDate()), [weekStart]);
  const nextWeek = useCallback(() => setWeekStart(dayjs(weekStart).add(1, "week").toDate()), [weekStart]);

  const refresh = useCallback(async () => {
    await Promise.all([mutate(), mutateNextWeek(), mutUsers(), mutateStory()]);
  }, [mutate, mutateNextWeek, mutUsers, mutateStory]);

  const loading = !!(loadingDept || loadingJab || loadingUsers || loadingPola || loadingShift || loadingNextWeek || loadingStory);

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
