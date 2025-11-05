"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ApiEndpoints } from "@/constrainst/endpoints";

/** THEME (tetap diekspor untuk dipakai komponen) */
export const GOLD = "#003A6F";
export const LIGHT_BLUE = "#E8F6FF";
export const HEADER_BLUE_BG = "#F0F6FF";

/** Default bulan: dipakai kalau API tidak mengirim urutan bulan */
const DEFAULT_MONTHS = [
  { key: "JANUARI", short: "Jan", label: "Januari" },
  { key: "FEBRUARI", short: "Feb", label: "Februari" },
  { key: "MARET", short: "Mar", label: "Maret" },
  { key: "APRIL", short: "Apr", label: "April" },
  { key: "MEI", short: "Mei", label: "Mei" },
  { key: "JUNI", short: "Jun", label: "Juni" },
  { key: "JULI", short: "Jul", label: "Juli" },
  { key: "AGUSTUS", short: "Agu", label: "Agustus" },
  { key: "SEPTEMBER", short: "Sep", label: "September" },
  { key: "OKTOBER", short: "Okt", label: "Oktober" },
  { key: "NOVEMBER", short: "Nov", label: "November" },
  { key: "DESEMBER", short: "Des", label: "Desember" },
];

export default function useKonfigurasiCutiViewModel() {
  const [rows, setRows] = useState([]);
  const [months, setMonths] = useState(DEFAULT_MONTHS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filter dari header
  const [q, setQ] = useState("");

  // Track sel yang diubah: key = `${id_user}:${BULAN}` -> nilai baru
  const dirtyRef = useRef(new Map());
  const [dirtyCount, setDirtyCount] = useState(0);

  // ===== LOAD MATRIX dari API =====
  const load = useCallback(
    async (signal) => {
      setLoading(true);
      try {
        const url = ApiEndpoints.GetCutiKonfigurasiMatrix({
          q,
          page: 1,
          pageSize: 500,
        });

        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        // Bentuk months dari API kalau ada
        const apiMonths = Array.isArray(json?.months) ? json.months : null;
        const normalizedMonths = apiMonths
          ? apiMonths.map((k) => {
              const m = DEFAULT_MONTHS.find((x) => x.key === k);
              return m || { key: k, short: k.slice(0, 3), label: k };
            })
          : DEFAULT_MONTHS;

        setMonths(normalizedMonths);

        // Data row langsung siap dipakai table
        const data = Array.isArray(json?.data) ? json.data : [];
        setRows(
          data.map((r) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            jabatan: r.jabatan,
            departemen: r.departemen,
            foto_profil_user: r.foto_profil_user || null,
            quotas: { ...(r.quotas || {}) }, 
          }))
        );

        // reset dirty setelah reload
        dirtyRef.current.clear();
        setDirtyCount(0);
      } catch (e) {
        if (e?.name !== "AbortError") {
          console.error("load matrix error:", e);
        }
      } finally {
        setLoading(false);
      }
    },
    [q]
  );

  // debounce sederhana untuk q
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      load(ctrl.signal);
    }, 300);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [load]);

  // ===== Derivatif =====
  const monthKeys = useMemo(() => months.map((m) => m.key), [months]);
  const hasDirty = dirtyCount > 0;

  // Total per karyawan
  const getTotal = useCallback(
    (r) => monthKeys.reduce((sum, k) => sum + (Number(r.quotas?.[k]) || 0), 0),
    [monthKeys]
  );

  // Cek sel dirty (buat highlight di UI)
  const isDirty = useCallback((userId, monthKey) => {
    return dirtyRef.current.has(`${userId}:${monthKey}`);
  }, []);

  // ===== Mutasi sel =====
  const setQuota = useCallback((userId, monthKey, value) => {
    const v = Math.max(0, Number(value) || 0);
    setRows((prev) =>
      prev.map((r) =>
        r.id === userId ? { ...r, quotas: { ...r.quotas, [monthKey]: v } } : r
      )
    );
    const key = `${userId}:${monthKey}`;
    const before = dirtyRef.current.size;
    dirtyRef.current.set(key, v);
    const after = dirtyRef.current.size;
    if (after !== before) setDirtyCount(after);
  }, []);

  // ===== Save semua perubahan (only dirty) =====
  const saveAll = useCallback(async () => {
    if (saving) return { ok: false, message: "Sistem sedang menyimpan." };
    const dirty = dirtyRef.current;
    if (dirty.size === 0) return { ok: true, message: "Tidak ada perubahan." };

    const items = [];
    for (const [k, v] of dirty.entries()) {
      const [id_user, bulan] = k.split(":");
      items.push({ id_user, bulan, kouta_cuti: Number(v) || 0 });
    }

    setSaving(true);
    try {
      const res = await fetch(ApiEndpoints.SaveCutiKonfigurasiMatrix, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const msg =
          (await res.json().catch(() => null))?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      // sukses -> bersihkan dirty dan refresh ringan
      dirty.clear();
      setDirtyCount(0);
      await load();
      return { ok: true, message: "Perubahan tersimpan." };
    } catch (e) {
      console.error("saveAll error:", e);
      return { ok: false, message: e.message || "Gagal menyimpan." };
    } finally {
      setSaving(false);
    }
  }, [saving, load]);

  // Peringatan saat mau tutup/refresh tab kalau ada perubahan
  useEffect(() => {
    const handler = (e) => {
      if (!hasDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasDirty]);

  return {
    // state utama
    loading,
    saving,
    rows,          // sudah difilter sederhana oleh q di server; FE tetap kirim q untuk UX cepat
    rawRows: rows,

    // bulan
    months,
    monthKeys,

    // filter
    q,
    setQ,

    // helpers
    getTotal,
    setQuota,
    saveAll,
    isDirty,
    hasDirty,
    dirtyCount,

    // expose reload kalau perlu
    reload: load,
  };
}
