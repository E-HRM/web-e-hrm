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

/* ================== KUNCI TANGGAL SERAGAM (UTC) ================== */
/** Dari server (Date/string ISO) → 'YYYY-MM-DD' UTC */
const keyFromServerDate = (v) => new Date(v).toISOString().slice(0, 10);
/** Dari “hari lokal” UI → 'YYYY-MM-DD' UTC konsisten */
const keyFromLocalDay = (dLike) => {
  const d = dayjs(dLike);
  return new Date(
    Date.UTC(d.year(), d.month(), d.date())
  )
    .toISOString()
    .slice(0, 10);
};
/** Untuk querystring ke server */
const toISO = (d) => dayjs(d).format("YYYY-MM-DD");
/** Start of week (Senin) untuk tampilan */
function startOfWeek(d) {
  const wd = dayjs(d).day(); // 0=Min..6=Sab
  const shift = wd === 0 ? -6 : 1 - wd;
  return dayjs(d).add(shift, "day").startOf("day").toDate();
}

/* ================== HELPERS ================== */
const buildListQS = (startISO, endISO) => {
  const p = new URLSearchParams();
  p.set("page", "1");
  p.set("pageSize", "5000");
  p.set("tanggalMulaiFrom", startISO);
  p.set("tanggalMulaiTo", endISO);
  p.set("orderBy", "created_at");
  p.set("sort", "desc");
  return p.toString();
};

async function loadShiftMapForRange(startDate, endDate) {
  if (dayjs(startDate).isAfter(endDate)) return new Map();
  const qs = buildListQS(toISO(startDate), toISO(endDate));
  const res = await fetcher(`${ApiEndpoints.GetShiftKerja}?${qs}`);
  const map = new Map();
  // keep-first (data desc → pertama = paling baru)
  const list = (res && res.data) || [];
  list.forEach((it) => {
    const dateKey = keyFromServerDate(it.tanggal_mulai);
    const k = `${it.id_user}|${dateKey}`;
    if (!map.has(k)) {
      map.set(k, {
        rawId: it.id_shift_kerja,
        status: it.status,
        polaId:
          it.id_pola_kerja == null ? null : String(it.id_pola_kerja),
      });
    }
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

  const res = await fetcher(
    `${ApiEndpoints.GetStoryPlanner}?${p.toString()}`
  );

  const map = new Map();
  const list = (res && res.data) || [];

  list.forEach(function (it) {
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
  const source = dayjs(baseDateKey);         // contoh: Sabtu, 22
  const monthEnd = source.endOf("month");    // akhir bulan
  const existingMap = await loadStoryMapForRange(
    source.toDate(),
    monthEnd.toDate(),
    userId
  );

  const jobFns = [];
  let cursor = source.add(1, "week");        // mulai Sabtu minggu depan

  while (
    cursor.isBefore(monthEnd, "day") ||
    cursor.isSame(monthEnd, "day")
  ) {
    const targetDateKey = keyFromLocalDay(cursor); // 'YYYY-MM-DD'
    const key = userId + "|" + targetDateKey;

    // kalau belum ada story di tanggal itu → buat
    if (!existingMap.has(key)) {
      const payload = Object.assign({}, basePayload, {
        count_time: targetDateKey,
      });

      jobFns.push(function () {
        return crudService.post(
          ApiEndpoints.CreateStoryPlanner,
          payload
        );
      });
    }

    cursor = cursor.add(1, "week"); // lompat ke minggu depannya lagi
  }

  if (jobFns.length === 0) return;

  await runJobsWithRetry(jobFns, {
    concurrency: 4,
    retries: 2,
    delayMs: 300,
  });
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

function endOfWeekInclusive(d) {
  const m = dayjs(d);
  const shiftToSunday = (7 - m.day()) % 7;
  return m.add(shiftToSunday, "day").endOf("day").toDate();
}

/* =============== EXECUTOR DENGAN LIMIT & RETRY =============== */
async function runJobsWithRetry(
  jobFns,
  options
) {
  const concurrency =
    options && options.concurrency != null ? options.concurrency : 6;
  const retries =
    options && options.retries != null ? options.retries : 2;
  const delayMs =
    options && options.delayMs != null ? options.delayMs : 350;

  const queue = jobFns.slice();
  let running = 0;
  const results = [];
  const sleep = (ms) =>
    new Promise(function (r) {
      setTimeout(r, ms);
    });

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
              if (attempt <= retries) {
                await sleep(delayMs * attempt);
              }
            }
          }
          if (attempt > retries) {
            results.push({ ok: false, error: lastErr });
          }
        })().finally(function () {
          running--;
          next();
        });
      }
    }
    next();
  });
}

export default function UseShiftScheduleViewModel() {
  const { notification, modal } = AntdApp.useApp();

  /* ===== state waktu ===== */
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const weekEnd = useMemo(
    () =>
      dayjs(weekStart).add(6, "day").endOf("day").toDate(),
    [weekStart]
  );

  const nextWeekStart = useMemo(
    () =>
      dayjs(weekStart).add(1, "week").startOf("day").toDate(),
    [weekStart]
  );
  const nextWeekEnd = useMemo(
    () =>
      dayjs(nextWeekStart).add(6, "day").endOf("day").toDate(),
    [nextWeekStart]
  );

  const currentMonthIdx = dayjs(weekStart).month();
  const currentYear = dayjs(weekStart).year();

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }).map(function (_, i) {
        return {
          label: dayjs().month(i).format("MMMM"),
          value: i,
        };
      }),
    []
  );

  const yearOptions = useMemo(() => {
    const base = dayjs().year();
    return Array.from({ length: 7 }).map(function (_, k) {
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
      Array.from({ length: 7 }).map(function (_, i) {
        const d = dayjs(weekStart).add(i, "day");
        return {
          key: d.format("YYYYMMDD"),
          dateStr: keyFromLocalDay(d), // KEY client-server
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
    return list.map(function (d) {
      return { value: d.id_departement, label: d.nama_departement };
    });
  }, [deptRes]);

  const [jabatanId, setJabatanId] = useState(null);
  const { data: jabRes, isLoading: loadingJab } = useSWR(
    ApiEndpoints.GetJabatan + "?page=1&pageSize=500",
    fetcher
  );
  const jabatanOptions = useMemo(() => {
    const list = (jabRes && jabRes.data) || [];
    return list.map(function (j) {
      return { value: j.id_jabatan, label: j.nama_jabatan };
    });
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
  } = useSWR(
    ApiEndpoints.GetUsers + "?" + usersQS,
    fetcher
  );

  const users = useMemo(() => {
    let arr = (usersRes && usersRes.data) || [];
    if (deptId) {
      arr = arr.filter(function (u) {
        return u.id_departement === deptId;
      });
    }
    return arr;
  }, [usersRes, deptId]);

  const rows = useMemo(() => {
    const list = users || [];
    return list.map(function (u) {
      const name =
        u.nama_pengguna || u.nama || u.name || u.email || "—";
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
        name: name,
        email: email,
        jabatan: jabatan,
        departemen: departemen,
        foto_profil_user: foto,
        avatarUrl: foto,
        foto_url: foto,
      };
    });
  }, [users]);

  /* ===== pola kerja ===== */
  const { data: polaRes, isLoading: loadingPola } = useSWR(
    ApiEndpoints.GetPolaKerja + "?page=1&pageSize=500",
    fetcher
  );
  const polaMap = useMemo(() => {
    const map = new Map();
    const list = (polaRes && polaRes.data) || [];
    list.forEach(function (p) {
      const mulai = p.jam_mulai || p.jamMulai || "";
      const selesai = p.jam_selesai || p.jamSelesai || "";
      const jam = hhmmFromDb(mulai) + " - " + hhmmFromDb(selesai);
      map.set(String(p.id_pola_kerja), {
        nama: p.nama_pola_kerja,
        jam: jam,
      });
    });
    return map;
  }, [polaRes]);

  /* ===== data shift minggu aktif ===== */
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", "1");
    p.set("pageSize", "5000");
    p.set("tanggalMulaiFrom", toISO(weekStart));
    p.set("tanggalMulaiTo", toISO(weekEnd));
    p.set("orderBy", "created_at");
    p.set("sort", "desc");
    return p.toString();
  }, [weekStart, weekEnd]);

  const {
    data: shiftRes,
    isLoading: loadingShift,
    mutate,
  } = useSWR(
    ApiEndpoints.GetShiftKerja + "?" + qs,
    fetcher
  );

  /* ===== data shift MINGGU BERIKUTNYA (untuk indikator checkbox) ===== */
  const nextQs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", "1");
    p.set("pageSize", "5000");
    p.set("tanggalMulaiFrom", toISO(nextWeekStart));
    p.set("tanggalMulaiTo", toISO(nextWeekEnd));
    p.set("orderBy", "created_at");
    p.set("sort", "desc");
    return p.toString();
  }, [nextWeekStart, nextWeekEnd]);

  const {
    data: nextShiftRes,
    isLoading: loadingNextWeek,
    mutate: mutateNextWeek,
  } = useSWR(
    ApiEndpoints.GetShiftKerja + "?" + nextQs,
    fetcher
  );

  const nextWeekUserHasAny = useMemo(() => {
    const s = new Set();
    const list = (nextShiftRes && nextShiftRes.data) || [];
    list.forEach(function (it) {
      s.add(it.id_user);
    });
    return s;
  }, [nextShiftRes]);

  const isRepeatVisualOn = useCallback(
    (userId) => nextWeekUserHasAny.has(userId),
    [nextWeekUserHasAny]
  );

  const cellMap = useMemo(() => {
    const map = new Map();
    const list = (shiftRes && shiftRes.data) || [];
    list.forEach(function (it) {
      const dateKey = keyFromServerDate(it.tanggal_mulai);
      const key = it.id_user + "|" + dateKey;
      if (!map.has(key)) {
        map.set(key, {
          userId: it.id_user,
          date: dateKey,
          status: it.status,
          polaId:
            it.id_pola_kerja == null ? null : String(it.id_pola_kerja),
          rawId: it.id_shift_kerja,
        });
      }
    });
    return map;
  }, [shiftRes]);

  const getCell = useCallback(
    (userId, dateKey) => cellMap.get(userId + "|" + dateKey),
    [cellMap]
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
  } = useSWR(
    ApiEndpoints.GetStoryPlanner + "?" + storyQs,
    fetcher
  );

  const storyMap = useMemo(() => {
    const map = new Map();
    const list = (storyRes && storyRes.data) || [];
    list.forEach(function (it) {
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

  /* ===== assign / delete shift ===== */
  const assignCell = useCallback(
    async (userId, dateKey, value) => {
      if (isPastDate(dateKey)) return;
      const existing = getCell(userId, dateKey);
      const payload = assignPayload(userId, dateKey, value);
      if (existing && existing.rawId) {
        await crudService.put(
          ApiEndpoints.UpdateShiftKerja(existing.rawId),
          payload
        );
      } else {
        await crudService.post(
          ApiEndpoints.CreateShiftKerja,
          payload
        );
      }
      await Promise.all([mutate(), mutateNextWeek()]);
    },
    [getCell, mutate, mutateNextWeek]
  );

  const deleteCell = useCallback(
    async (userId, dateKey) => {
      if (isPastDate(dateKey)) return;
      const existing = getCell(userId, dateKey);
      if (!existing || !existing.rawId) return;
      await crudService.delete(
        ApiEndpoints.DeleteShiftKerja(existing.rawId)
      );
      await Promise.all([mutate(), mutateNextWeek()]);
    },
    [getCell, mutate, mutateNextWeek]
  );

  /* ===== toggle Story Planner per hari ===== */
  const toggleStoryForDay = useCallback(
  async (userId, dateKey, checked) => {
    if (isPastDate(dateKey)) return;

    const existing = getStoryCell(userId, dateKey);

    if (checked) {
      // kalau sudah ada, nggak usah bikin lagi
      if (existing) return;

      const user = rows.find(function (r) {
        return r.id === userId;
      });

      const defaultDesc =
        "Story planner - " +
        (user && user.name ? user.name : "Karyawan") +
        " - " +
        dayjs(dateKey).format("DD MMM YYYY");

      // basePayload yang dipakai untuk hari ini + copy ke depan
      const basePayload = {
        id_user: userId,
        deskripsi_kerja: defaultDesc,
        status: "berjalan",
      };

      try {
        // 1) buat untuk hari yang dicentang
        await crudService.post(
          ApiEndpoints.CreateStoryPlanner,
          Object.assign({}, basePayload, {
            count_time: dateKey,
          })
        );

        // 2) otomatis ulangi ke weekday yang sama sampai akhir bulan
        await repeatStorySameWeekdayUntilEndOfMonth(
          userId,
          dateKey,
          basePayload
        );
      } catch (e) {
        notification.error({
          message: "Gagal membuat Story Planner",
        });
        return;
      }
    } else {
      // uncheck → hapus story pada hari ini saja
      if (!existing || !existing.rawId) return;
      try {
        await crudService.delete(
          ApiEndpoints.DeleteStoryPlanner(existing.rawId)
        );
      } catch (e) {
        notification.error({
          message: "Gagal menghapus Story Planner",
        });
        return;
      }
    }

    // refresh minggu aktif
    await mutateStory();
  },
  [getStoryCell, rows, mutateStory, notification]
);


  /* ===== repeat sampai akhir bulan (SHIFT, bukan Story Planner) ===== */
  const applyRepetition = useCallback(
    async (userId) => {
      const sourceWeek = days.map(function (d) {
        return getCell(userId, d.dateStr) || null;
      });

      const rangeStart = dayjs(weekStart)
        .add(1, "week")
        .startOf("day")
        .toDate();
      const monthEnd = dayjs(weekStart).endOf("month");
      const rangeEnd = endOfWeekInclusive(monthEnd);

      const globalTargetMap = await loadShiftMapForRange(
        rangeStart,
        rangeEnd
      );

      let cursor = dayjs(rangeStart);
      const jobFns = [];

      while (
        cursor.isBefore(rangeEnd) ||
        cursor.isSame(rangeEnd, "day")
      ) {
        const weekKeys = Array.from({ length: 7 }).map(function (_, i) {
          return keyFromLocalDay(cursor.add(i, "day"));
        });

        for (let i = 0; i < 7; i++) {
          const src = sourceWeek[i];
          const dateKey = weekKeys[i];
          if (dayjs(dateKey).isAfter(rangeEnd)) continue;

          const k = userId + "|" + dateKey;
          const existingTarget = globalTargetMap.get(k);

          if (src) {
            const val =
              src.status === "LIBUR"
                ? "LIBUR"
                : src.polaId;
            const payload = assignPayload(userId, dateKey, val);
            if (existingTarget && existingTarget.rawId) {
              jobFns.push(function () {
                return crudService.put(
                  ApiEndpoints.UpdateShiftKerja(existingTarget.rawId),
                  payload
                );
              });
            } else {
              jobFns.push(function () {
                return crudService.post(
                  ApiEndpoints.CreateShiftKerja,
                  payload
                );
              });
            }
          } else if (existingTarget && existingTarget.rawId) {
            jobFns.push(function () {
              return crudService.delete(
                ApiEndpoints.DeleteShiftKerja(
                  existingTarget.rawId
                )
              );
            });
          }
        }

        cursor = cursor.add(1, "week");
      }

      const results = await runJobsWithRetry(jobFns, {
        concurrency: 6,
        retries: 2,
        delayMs: 400,
      });
      const failed = results.filter(function (r) {
        return !r.ok;
      }).length;

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
            "Sebagian tanggal gagal diproses (" +
            failed +
            "). Coba ulangi.",
        });
      }

      await Promise.all([mutate(), mutateNextWeek()]);
    },
    [days, getCell, weekStart, mutate, mutateNextWeek, notification]
  );

  const clearRepetition = useCallback(
    async (userId) => {
      const rangeStart = dayjs(weekStart)
        .add(1, "week")
        .startOf("day")
        .toDate();
      const monthEnd = dayjs(weekStart).endOf("month");
      const rangeEnd = endOfWeekInclusive(monthEnd);

      const targetMap = await loadShiftMapForRange(
        rangeStart,
        rangeEnd
      );
      const jobFns = [];
      targetMap.forEach(function (v, key) {
        if (key.startsWith(userId + "|") && v.rawId) {
          jobFns.push(function () {
            return crudService.delete(
              ApiEndpoints.DeleteShiftKerja(v.rawId)
            );
          });
        }
      });

      const results = await runJobsWithRetry(jobFns, {
        concurrency: 8,
        retries: 2,
        delayMs: 300,
      });
      const failed = results.filter(function (r) {
        return !r.ok;
      }).length;

      if (failed === 0) {
        notification.success({
          message: "Jadwal mendatang di bulan ini dihapus.",
        });
      } else {
        notification.warning({
          message: "Penghapusan sebagian gagal",
          description:
            "Sebagian tanggal gagal dihapus (" +
            failed +
            "). Coba ulangi.",
        });
      }

      await Promise.all([mutate(), mutateNextWeek()]);
    },
    [weekStart, mutate, mutateNextWeek, notification]
  );

  const toggleRepeatSchedule = useCallback(
    (userId, isRepeating) => {
      const user = rows.find(function (r) {
        return r.id === userId;
      });
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
            if (isRepeating) {
              await applyRepetition(userId);
            } else {
              await clearRepetition(userId);
            }
          } catch (e) {
            notification.error({
              message: "Gagal memproses jadwal.",
            });
          }
        },
      });
    },
    [rows, modal, applyRepetition, clearRepetition, notification]
  );

  /* ===== navigasi & refresh ===== */
  const prevWeek = useCallback(
    () =>
      setWeekStart(
        dayjs(weekStart).add(-1, "week").toDate()
      ),
    [weekStart]
  );
  const nextWeek = useCallback(
    () =>
      setWeekStart(
        dayjs(weekStart).add(1, "week").toDate()
      ),
    [weekStart]
  );

  const refresh = useCallback(async () => {
    await Promise.all([
      mutate(),
      mutateNextWeek(),
      mutUsers(),
      mutateStory(),
    ]);
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

    // indikator visual checkbox (persist by data)
    isRepeatVisualOn,
  };
}