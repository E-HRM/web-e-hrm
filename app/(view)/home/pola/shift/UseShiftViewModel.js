"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { App as AntdApp } from "antd";
import useSWR from "swr";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

dayjs.extend(customParseFormat);

/* ===================== Utils ===================== */

// Regex ambil "HH:mm" dari string "HH:mm" / "HH:mm:ss" di mana pun berada
const EXTRACT_HHMM = /(\d{1,2}):(\d{2})(?::\d{2})?/;

// Tampilkan jam-menit "HH:mm" dari berbagai bentuk input
const hhmm = (v) => {
  if (v == null || v === "") return "";
  if (typeof v === "string") {
    const m = v.match(EXTRACT_HHMM);
    if (m) {
      const hh = m[1].padStart(2, "0");
      const mm = m[2];
      return `${hh}:${mm}`;
    }
  }
  const d = dayjs(v);
  return d.isValid() ? d.format("HH:mm") : "";
};

/**
 * Kirim ke server sebagai "YYYY-MM-DD HH:mm:ss" agar lolos validasi "date/datetime".
 * - Ambil jam lokal dari input (dayjs/string/Date)
 * - Pad ke HH:mm:ss
 * - Tempelkan tanggal (pakai hari ini) → "YYYY-MM-DD HH:mm:ss"
 * NB: Tampilan di UI tetap pakai HH:mm (fungsi hhmm), jadi tidak mengubah UX.
 */
const toServerDateTime = (t) => {
  if (!t) return null;

  let hhmmss = null;

  if (dayjs.isDayjs(t)) {
    hhmmss = t.second(0).millisecond(0).format("HH:mm:ss");
  } else if (typeof t === "string") {
    if (/^\d{2}:\d{2}:\d{2}$/.test(t)) {
      hhmmss = t;
    } else if (/^\d{2}:\d{2}$/.test(t)) {
      hhmmss = `${t}:00`;
    } else {
      const d = dayjs(t);
      if (d.isValid()) hhmmss = d.format("HH:mm:ss");
    }
  } else {
    const d = dayjs(t);
    if (d.isValid()) hhmmss = d.second(0).millisecond(0).format("HH:mm:ss");
  }

  if (!hhmmss) return null;
  const baseDate = dayjs().format("YYYY-MM-DD");
  return `${baseDate} ${hhmmss}`;
};

// Selisih menit absolut
const minutesDiff = (a, b) =>
  a && b ? Math.abs(dayjs(b).diff(dayjs(a), "minute")) : null;

// Warna fallback deterministik dari string
function colorFromString(s = "") {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h} 80% 65%)`;
}

// Ambil pesan error dari berbagai bentuk respons
const getErrMsg = (err) =>
  err?.response?.data?.message ||
  err?.data?.message ||
  err?.message ||
  "Terjadi kesalahan";

/**
 * Parse server value (apapun: "HH:mm", "HH:mm:ss", ISO) → dayjs "HH:mm" TANPA TZ offset.
 * Caranya ekstrak HH:mm dari string, lalu build dayjs("HH:mm","HH:mm").
 */
const parseTimeToDayjs = (v) => {
  if (!v) return null;
  if (dayjs.isDayjs(v)) return v;

  if (typeof v === "string") {
    const m = v.match(EXTRACT_HHMM);
    if (m) {
      const hh = m[1].padStart(2, "0");
      const mm = m[2];
      return dayjs(`${hh}:${mm}`, "HH:mm");
    }
    const d = dayjs(v);
    return d.isValid() ? d : null;
  }

  const d = dayjs(v);
  return d.isValid() ? d : null;
};

/* ===================== ViewModel ===================== */

export default function UseShiftViewModel() {
  const { notification } = AntdApp.useApp();

  // table state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* -------- LIST (SWR) -------- */
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (search.trim()) p.set("search", search.trim());
    return p.toString();
  }, [page, pageSize, search]);

  const swrKey = `${ApiEndpoints.GetPolaKerja}?${qs}`;
  const { data, isLoading, mutate } = useSWR(swrKey, fetcher);

  useEffect(() => {
    // console.log("SAMPLE:", data?.data?.[0]);
  }, [data]);

  const rows = useMemo(() => {
    const arr = data?.data || [];
    return arr.map((it) => {
      const name = it.nama_pola_kerja || it.name;

      const jamMulai = it.jam_mulai || it.jamMulai;
      const jamSelesai = it.jam_selesai || it.jamSelesai;
      const istMulai = it.jam_istirahat_mulai || it.jamIstirahatMulai;
      const istSelesai = it.jam_istirahat_selesai || it.jamIstirahatSelesai;
      const maksIst = it.maks_jam_istirahat ?? it.maksJamIstirahat;

      const istirahatStr =
        istMulai && istSelesai
          ? `${hhmm(istMulai)} - ${hhmm(istSelesai)}${
              maksIst != null ? ` (${maksIst} mnt)` : ""
            }`
          : "";

      return {
        _raw: it,
        id: it.id_pola_kerja || it.id,
        name,
        jamKerja: `${hhmm(jamMulai)} - ${hhmm(jamSelesai)}`,
        istirahat: istirahatStr,
        istMulai,
        istSelesai,
        maksIst,
        toleransi: it.toleransi || "",
        note: it.note || "",
        color: it.color || colorFromString(name),
      };
    });
  }, [data]);

  const pagination = data?.pagination || { total: rows.length, page, pageSize };

  const onTableChange = useCallback((pg) => {
    setPage(pg.current);
    setPageSize(pg.pageSize);
  }, []);

  /* -------- ADD -------- */
  const onAddSubmit = useCallback(
    async (values) => {
      if (!values?.nama?.trim()) {
        notification.error({ message: "Nama wajib", description: "Isi Nama Pola Kerja." });
        throw new Error("empty-name");
      }
      if (!values?.jamMasuk || !values?.jamKeluar) {
        notification.error({ message: "Jam kerja wajib", description: "Isi Jam Masuk & Jam Keluar." });
        throw new Error("empty-worktime");
      }
      if (dayjs(values.jamKeluar).isBefore(dayjs(values.jamMasuk))) {
        notification.error({ message: "Urutan jam kerja salah", description: "Jam keluar tidak boleh lebih awal dari jam masuk." });
        throw new Error("worktime-order");
      }

      const hasIstMulai = !!values.mulaiIstirahat;
      const hasIstSelesai = !!values.selesaiIstirahat;

      if (hasIstMulai !== hasIstSelesai) {
        notification.error({ message: "Jam istirahat tidak lengkap", description: "Isi keduanya: Mulai & Selesai Istirahat." });
        throw new Error("invalid-break-range");
      }

      if (hasIstMulai && hasIstSelesai && values.maxIstirahat != null) {
        const dur = minutesDiff(values.mulaiIstirahat, values.selesaiIstirahat);
        if (dur != null && Number(values.maxIstirahat) > dur) {
          notification.error({ message: "Maks istirahat terlalu besar", description: `Maks ${values.maxIstirahat} menit > durasi jendela (${dur} menit).` });
          throw new Error("invalid-max-break");
        }
      }

      const payload = {
        nama_pola_kerja: values.nama.trim(),
        jam_mulai: toServerDateTime(values.jamMasuk),   // <<— now datetime
        jam_selesai: toServerDateTime(values.jamKeluar),// <<— now datetime
        ...(hasIstMulai &&
          hasIstSelesai && {
            jam_istirahat_mulai: toServerDateTime(values.mulaiIstirahat),
            jam_istirahat_selesai: toServerDateTime(values.selesaiIstirahat),
            ...(values.maxIstirahat != null && { maks_jam_istirahat: Number(values.maxIstirahat) }),
          }),
      };

      try {
        await crudService.post(ApiEndpoints.CreatePolaKerja, payload);
        notification.success({ message: "Berhasil", description: "Pola kerja dibuat." });
        await mutate();
      } catch (err) {
        console.error("CREATE POLA KERJA ERROR:", err?.response?.data || err);
        notification.error({ message: "Gagal menambah", description: getErrMsg(err) });
        throw err;
      }
    },
    [mutate, notification]
  );

  /* -------- EDIT -------- */
  const [selected, setSelected] = useState(null);
  const openEdit = !!selected;

  const getEditInitial = useCallback(() => {
    if (!selected) return {};
    const raw = selected._raw || {};
    return {
      nama: selected.name,
      toleransi: selected.toleransi
        ? parseInt(String(selected.toleransi).replace(/\D/g, ""), 10)
        : undefined,
      catatan: selected.note || "",
      warna: selected.color,

      // Prefill aman TZ (hanya HH:mm)
      jamMasuk: parseTimeToDayjs(raw.jam_mulai),
      jamKeluar: parseTimeToDayjs(raw.jam_selesai),
      mulaiIstirahat: parseTimeToDayjs(raw.jam_istirahat_mulai),
      selesaiIstirahat: parseTimeToDayjs(raw.jam_istirahat_selesai),

      maxIstirahat: selected.maksIst ?? undefined,
    };
  }, [selected]);

  const onEditOpen = useCallback((row) => setSelected(row), []);
  const onEditClose = useCallback(() => setSelected(null), []);

  const onEditSubmit = useCallback(
    async (values) => {
      const id = selected?.id;
      if (!id) return;

      if (values.jamMasuk && values.jamKeluar) {
        if (dayjs(values.jamKeluar).isBefore(dayjs(values.jamMasuk))) {
          notification.error({ message: "Urutan jam kerja salah", description: "Jam keluar tidak boleh lebih awal dari jam masuk." });
          throw new Error("worktime-order");
        }
      }

      const hasIstMulai = !!values.mulaiIstirahat;
      const hasIstSelesai = !!values.selesaiIstirahat;

      if (hasIstMulai !== hasIstSelesai) {
        notification.error({ message: "Jam istirahat tidak lengkap", description: "Isi keduanya: Mulai & Selesai Istirahat." });
        throw new Error("invalid-break-range");
      }

      if (values.maxIstirahat != null) {
        let dur = null;
        if (hasIstMulai && hasIstSelesai) {
          dur = minutesDiff(values.mulaiIstirahat, values.selesaiIstirahat);
        } else {
          const raw2 = selected?._raw || {};
          if (raw2.jam_istirahat_mulai && raw2.jam_istirahat_selesai) {
            dur = minutesDiff(
              parseTimeToDayjs(raw2.jam_istirahat_mulai),
              parseTimeToDayjs(raw2.jam_istirahat_selesai)
            );
          }
        }
        if (dur == null) {
          notification.error({
            message: "Tidak ada jendela istirahat",
            description: "Isi Mulai & Selesai Istirahat terlebih dahulu sebelum mengatur maksimal menit.",
          });
          throw new Error("no-break-window");
        }
        if (Number(values.maxIstirahat) > dur) {
          notification.error({ message: "Maks istirahat terlalu besar", description: `Maks ${values.maxIstirahat} menit > durasi jendela (${dur} menit).` });
          throw new Error("invalid-max-break");
        }
      }

      const raw = selected?._raw || {};
      const effMasuk = values.jamMasuk ? dayjs(values.jamMasuk) : parseTimeToDayjs(raw.jam_mulai);
      const effKeluar = values.jamKeluar ? dayjs(values.jamKeluar) : parseTimeToDayjs(raw.jam_selesai);

      if (hasIstMulai && hasIstSelesai) {
        const bi = dayjs(values.mulaiIstirahat);
        const bs = dayjs(values.selesaiIstirahat);
        if (bi.isBefore(effMasuk) || bs.isAfter(effKeluar)) {
          notification.error({ message: "Istirahat di luar jam kerja", description: "Rentang istirahat harus berada di dalam jam kerja." });
          throw new Error("break-outside");
        }
        if (bs.isBefore(bi)) {
          notification.error({ message: "Urutan istirahat salah", description: "Selesai istirahat tidak boleh lebih awal dari mulai istirahat." });
          throw new Error("break-order");
        }
      }

      const payload = {
        ...(values.nama != null && { nama_pola_kerja: values.nama }),
        ...(values.jamMasuk && { jam_mulai: toServerDateTime(values.jamMasuk) }),   // <<—
        ...(values.jamKeluar && { jam_selesai: toServerDateTime(values.jamKeluar) }),// <<—
        ...(hasIstMulai &&
          hasIstSelesai && {
            jam_istirahat_mulai: toServerDateTime(values.mulaiIstirahat),          // <<—
            jam_istirahat_selesai: toServerDateTime(values.selesaiIstirahat),      // <<—
          }),
        ...(values.maxIstirahat != null && {
          maks_jam_istirahat: Number(values.maxIstirahat),
        }),
      };

      try {
        await crudService.put(ApiEndpoints.UpdatePolaKerja(id), payload);
        notification.success({ message: "Berhasil", description: "Pola kerja diperbarui." });
        setSelected(null);
        await mutate();
      } catch (err) {
        console.error("UPDATE POLA KERJA ERROR:", err?.response?.data || err);
        notification.error({ message: "Gagal mengubah", description: getErrMsg(err) });
        throw err;
      }
    },
    [mutate, notification, selected]
  );

  /* -------- DELETE -------- */
  const [deleting, setDeleting] = useState(null);
  const openDelete = !!deleting;
  const onDeleteOpen = useCallback((row) => setDeleting(row), []);
  const onDeleteClose = useCallback(() => setDeleting(null), []);
  const onDeleteConfirm = useCallback(async () => {
    const id = deleting?.id;
    if (!id) return;
    try {
      await crudService.delete(ApiEndpoints.DeletePolaKerja(id)); // soft delete
      notification.success({ message: "Terhapus", description: "Pola kerja dihapus." });
      setDeleting(null);
      await mutate();
    } catch (err) {
      console.error("DELETE POLA KERJA ERROR:", err?.response?.data || err);
      notification.error({ message: "Gagal menghapus", description: getErrMsg(err) });
      throw err;
    }
  }, [deleting, mutate, notification]);

  const onReset = useCallback(
    (row) =>
      notification.info({
        message: "Riwayat/Reset",
        description: row?.name || "",
      }),
    [notification]
  );

  return {
    // list
    rows,
    loading: isLoading,
    pagination: { page, pageSize, total: pagination.total },
    onTableChange,
    search,
    setSearch,

    // add
    onAddSubmit,

    // edit
    openEdit,
    onEditOpen,
    onEditClose,
    onEditSubmit,
    getEditInitial,
    selected,

    // delete
    openDelete,
    onDeleteOpen,
    onDeleteClose,
    onDeleteConfirm,

    // other
    onReset,
  };
}
