"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import { App as AntdApp } from "antd";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

export const DAYS_ID = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"];
const hhmm = (v) => (v ? dayjs(v).format("HH:mm") : "");
const errMsg = (e) => e?.response?.data?.message || e?.data?.message || e?.message || "Terjadi kesalahan";

export default function useHariKerjaAllViewModel() {
  const { notification } = AntdApp.useApp();

  /* Departemen */
  const { data: deptRes } = useSWR(`${ApiEndpoints.GetDepartement}?page=1&pageSize=1000`, fetcher);
  const deptOptions = useMemo(() => {
    const arr = deptRes?.data ?? [];
    return arr.map((d) => ({
      value: d.id_departement || d.id,
      label: d.nama_departement || d.name,
    }));
  }, [deptRes]);
  const [deptId, setDeptId] = useState(null);

  /* Pola Kerja */
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

  /* Users */
  const usersKey = deptId
    ? `${ApiEndpoints.GetDepartementByUser(deptId)}?page=1&pageSize=1000`
    : `${ApiEndpoints.GetUsers}?page=1&pageSize=1000&includeDeleted=0`;
  const { data: usersRes, isLoading: loadingUsers, mutate: reloadUsers } = useSWR(usersKey, fetcher);
  const users = useMemo(() => {
    const raw = usersRes?.data ?? [];
    return raw.map((u) => ({
      id_user: u.id_user || u.id,
      nama_pengguna: u.nama_pengguna || u.name || u.username,
      email: u.email || "",
    }));
  }, [usersRes]);

  /* Shifts template dari DB */
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [existingByUserDay, setExistingByUserDay] = useState(new Map());

  /* picked = state editor; baseline = snapshot terakhir dari DB (untuk deteksi dirty) */
  const [picked, setPicked] = useState({});
  const [baseline, setBaseline] = useState({});

  const [saving, setSaving] = useState({});

  const usersKeyStable = useMemo(
    () => (users || []).map((u) => u.id_user).join("|"),
    [users]
  );

  useEffect(() => {
    if (!users || users.length === 0) return;

    (async () => {
      setLoadingShifts(true);
      try {
        const entries = await Promise.all(
          users.map(async (u) => {
            const url = `${ApiEndpoints.GetShiftKerja}?id_user=${encodeURIComponent(
              u.id_user
            )}&page=1&pageSize=100&orderBy=updated_at&sort=desc`;
            const res = await fetcher(url);
            const rows = res?.data ?? [];
            const mapForUser = new Map();
            for (const row of rows) {
              if (row.deleted_at) continue;
              if (!mapForUser.has(row.hari_kerja)) mapForUser.set(row.hari_kerja, row);
            }
            return [u.id_user, mapForUser];
          })
        );

        const byUserDay = new Map(entries);
        setExistingByUserDay(byUserDay);

        const next = {};
        for (const [uid, dayMap] of byUserDay.entries()) {
          next[uid] = {};
          for (const d of DAYS_ID) next[uid][d] = dayMap.get(d)?.id_pola_kerja ?? null;
        }
        setPicked(next);
        setBaseline(next); // snapshot awal = DB
      } catch (e) {
        notification.error({ message: "Gagal memuat shift", description: errMsg(e) });
      } finally {
        setLoadingShifts(false);
      }
    })();
  }, [usersKeyStable, users, notification]);

  /* Mutasi UI */
  const setPola = useCallback((userId, day, polaIdOrNull) => {
    setPicked((prev) => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), [day]: polaIdOrNull || null },
    }));
  }, []);

  /* Dirty helpers */
  const isCellDirty = useCallback((userId, day) => {
    const a = picked[userId]?.[day] ?? null;
    const b = baseline[userId]?.[day] ?? null;
    return a !== b;
  }, [picked, baseline]);

  const isUserDirty = useCallback((userId) => {
    for (const d of DAYS_ID) {
      if (isCellDirty(userId, d)) return true;
    }
    return false;
  }, [isCellDirty]);

  const dirtyCount = useMemo(
    () => users.filter((u) => isUserDirty(u.id_user)).length,
    [users, isUserDirty]
  );

  /* Prompt saat keluar/refresh jika masih ada dirty */
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    if (dirtyCount > 0) window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirtyCount]);

  /* Preview jam untuk label kecil di sel */
  const previewJamLabel = useCallback((polaId) => {
    if (!polaId) return "";
    const p = polaMap.get(polaId);
    if (!p) return "";
    const jam = [hhmm(p.jam_mulai), hhmm(p.jam_selesai)].filter(Boolean).join("–");
    return jam || "";
  }, [polaMap]);

  const buildPreviewLines = useCallback((userId) => {
    const p = picked[userId] || {};
    const rows = [];
    for (const d of DAYS_ID) {
      const pid = p[d] || null;
      if (!pid) {
        rows.push({ key: `${userId}-${d}`, dayAbbr: d.slice(0, 3) + ".", text: "" });
        continue;
      }
      const pola = polaMap.get(pid);
      const jam = [hhmm(pola?.jam_mulai), hhmm(pola?.jam_selesai)].filter(Boolean).join("–");
      const text = [(pola?.nama_pola_kerja || pola?.name) ?? "", jam].filter(Boolean).join(" ");
      rows.push({ key: `${userId}-${d}`, dayAbbr: d.slice(0, 3) + ".", text });
    }
    return rows;
  }, [picked, polaMap]);

  /* Simpan 7 hari (tanpa tanggal → repeat weekly) */
  const saveUser = useCallback(async (userId) => {
    const pickedDays = picked[userId] || {};
    const dayMap = existingByUserDay.get(userId) || new Map();

    const tasks = [];
    for (const hari of DAYS_ID) {
      const ex = dayMap.get(hari);
      const pola = pickedDays[hari] || null;
      const status = pola ? "KERJA" : "LIBUR";
      const payload = {
        id_user: userId,
        hari_kerja: hari,
        status,
        tanggal_mulai: null,
        tanggal_selesai: null,
        id_pola_kerja: pola,
      };

      if (ex) {
        tasks.push(
          crudService
            .put(ApiEndpoints.UpdateShiftKerja(ex.id_shift_kerja || ex.id), payload)
            .catch((e) => { throw new Error(`[${hari}] ${errMsg(e)}`); })
        );
      } else {
        tasks.push(
          crudService
            .post(ApiEndpoints.CreateShiftKerja, payload)
            .catch((e) => { throw new Error(`[${hari}] ${errMsg(e)}`); })
        );
      }
    }

    try {
      setSaving((s) => ({ ...s, [userId]: true }));
      await Promise.all(tasks);

      // Refresh shifts user ini & set baseline baru (clear dirty)
      const url = `${ApiEndpoints.GetShiftKerja}?id_user=${encodeURIComponent(
        userId
      )}&page=1&pageSize=100&orderBy=updated_at&sort=desc`;
      const res = await fetcher(url);
      const rows = res?.data ?? [];
      const mapForUser = new Map();
      for (const row of rows) {
        if (row.deleted_at) continue;
        if (!mapForUser.has(row.hari_kerja)) mapForUser.set(row.hari_kerja, row);
      }
      setExistingByUserDay((prev) => {
        const next = new Map(prev);
        next.set(userId, mapForUser);
        return next;
      });

      const snap = {};
      for (const d of DAYS_ID) snap[d] = mapForUser.get(d)?.id_pola_kerja ?? null;

      setBaseline((b) => ({ ...b, [userId]: snap }));
      notification.success({ message: "Template mingguan disimpan." });
    } catch (e) {
      notification.error({ message: "Gagal menyimpan", description: e.message });
    } finally {
      setSaving((s) => ({ ...s, [userId]: false }));
    }
  }, [picked, existingByUserDay, notification]);

  /* Reset 7 hari untuk user (hapus dari DB) */
  const resetUser = useCallback(async (userId, { hard = false } = {}) => {
    const dayMap = existingByUserDay.get(userId) || new Map();
    const ids = [...dayMap.values()].map((r) => r.id_shift_kerja || r.id);
    try {
      setSaving((s) => ({ ...s, [userId]: true }));
      await Promise.all(
        ids.map((id) =>
          crudService.delete(`${ApiEndpoints.DeleteShiftKerja(id)}${hard ? "?hard=1" : ""}`)
        )
      );
      // kosongkan state + baseline (jadi tidak dirty)
      const empty = DAYS_ID.reduce((acc, d) => ((acc[d] = null), acc), {});
      setExistingByUserDay((prev) => {
        const next = new Map(prev);
        next.set(userId, new Map());
        return next;
      });
      setPicked((p) => ({ ...p, [userId]: empty }));
      setBaseline((b) => ({ ...b, [userId]: empty }));
      notification.success({ message: hard ? "Jadwal dihapus permanen." : "Jadwal direset." });
    } catch (e) {
      notification.error({ message: "Gagal reset", description: errMsg(e) });
    } finally {
      setSaving((s) => ({ ...s, [userId]: false }));
    }
  }, [existingByUserDay, notification]);

  /* Batalkan perubahan lokal (tanpa menyentuh DB) */
  const discardUser = useCallback((userId) => {
    setPicked((p) => ({ ...p, [userId]: { ...(baseline[userId] || {}) } }));
  }, [baseline]);

  const discardAll = useCallback(() => {
    setPicked((_) => JSON.parse(JSON.stringify(baseline)));
  }, [baseline]);

  /* Simpan semua user yang dirty */
  const saveAll = useCallback(async () => {
    const targets = users.map((u) => u.id_user).filter((id) => isUserDirty(id));
    for (const id of targets) {
      await saveUser(id);
    }
  }, [users, isUserDirty, saveUser]);

  const reloadAll = useCallback(() => { reloadUsers(); }, [reloadUsers]);

  return {
    users,
    polaList,
    polaMap,

    picked,
    setPola,
    previewJamLabel,
    buildPreviewLines,

    deptId,
    setDeptId,
    deptOptions,

    loadingAll: loadingUsers || loadingShifts,
    saving,

    // dirty helpers
    isCellDirty,
    isUserDirty,
    dirtyCount,

    // actions
    saveUser,
    resetUser,
    discardUser,
    discardAll,
    saveAll,
    reloadAll,
  };
}
