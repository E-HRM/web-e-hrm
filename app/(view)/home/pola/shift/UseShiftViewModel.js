"use client";

import { useCallback, useMemo, useState } from "react";
import { App as AntdApp } from "antd";
import useSWR from "swr";
import dayjs from "dayjs";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

/* ===================== Utils ===================== */

// Format tampil di tabel
const hhmm = (v) => (v ? dayjs(v).format("HH:mm") : "");

// Kirim ISO UTC standar (aman untuk parser server)
const toIso = (t) => (t ? dayjs(t).toISOString() : null);

// Selisih menit absolut
const minutesDiff = (a, b) =>
  a && b ? Math.abs(dayjs(b).diff(dayjs(a), "minute")) : null;

// Warna fallback
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
      // Nama & jam kerja wajib
      if (!values?.nama?.trim()) {
        notification.error({ message: "Nama wajib", description: "Isi Nama Pola Kerja." });
        throw new Error("empty-name");
      }
      if (!values?.jamMasuk || !values?.jamKeluar) {
        notification.error({
          message: "Jam kerja wajib",
          description: "Isi Jam Masuk & Jam Keluar.",
        });
        throw new Error("empty-worktime");
      }
      // Urutan jam kerja
      if (dayjs(values.jamKeluar).isBefore(dayjs(values.jamMasuk))) {
        notification.error({
          message: "Urutan jam kerja salah",
          description: "Jam keluar tidak boleh lebih awal dari jam masuk.",
        });
        throw new Error("worktime-order");
      }

      const hasIstMulai = !!values.mulaiIstirahat;
      const hasIstSelesai = !!values.selesaiIstirahat;

      // window istirahat harus berpasangan bila diisi
      if (hasIstMulai !== hasIstSelesai) {
        notification.error({
          message: "Jam istirahat tidak lengkap",
          description: "Isi keduanya: Mulai Istirahat dan Selesai Istirahat.",
        });
        throw new Error("invalid-break-range");
      }

      // window harus di dalam jam kerja & urutan benar
      if (hasIstMulai && hasIstSelesai) {
        const jm = dayjs(values.jamMasuk);
        const jk = dayjs(values.jamKeluar);
        const bi = dayjs(values.mulaiIstirahat);
        const bs = dayjs(values.selesaiIstirahat);
        if (bi.isBefore(jm) || bs.isAfter(jk)) {
          notification.error({
            message: "Istirahat di luar jam kerja",
            description: "Rentang istirahat harus berada di dalam jam kerja.",
          });
          throw new Error("break-outside");
        }
        if (bs.isBefore(bi)) {
          notification.error({
            message: "Urutan istirahat salah",
            description: "Selesai istirahat tidak boleh lebih awal dari mulai istirahat.",
          });
          throw new Error("break-order");
        }
      }

      // validasi: MAX ≤ durasi window (jika window ada)
      if (hasIstMulai && hasIstSelesai && values.maxIstirahat != null) {
        const dur = minutesDiff(values.mulaiIstirahat, values.selesaiIstirahat);
        if (dur != null && Number(values.maxIstirahat) > dur) {
          notification.error({
            message: "Maks istirahat terlalu besar",
            description: `Maks ${values.maxIstirahat} menit > durasi jendela (${dur} menit).`,
          });
          throw new Error("invalid-max-break");
        }
      }

      const payload = {
        nama_pola_kerja: values.nama.trim(),
        jam_mulai: toIso(values.jamMasuk),
        jam_selesai: toIso(values.jamKeluar),
        ...(hasIstMulai &&
          hasIstSelesai && {
            jam_istirahat_mulai: toIso(values.mulaiIstirahat),
            jam_istirahat_selesai: toIso(values.selesaiIstirahat),
            ...(values.maxIstirahat != null && {
              maks_jam_istirahat: Number(values.maxIstirahat),
            }),
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
      jamMasuk: raw.jam_mulai ? dayjs(raw.jam_mulai) : null,
      jamKeluar: raw.jam_selesai ? dayjs(raw.jam_selesai) : null,
      mulaiIstirahat: raw.jam_istirahat_mulai ? dayjs(raw.jam_istirahat_mulai) : null,
      selesaiIstirahat: raw.jam_istirahat_selesai ? dayjs(raw.jam_istirahat_selesai) : null,
      maxIstirahat: selected.maksIst ?? undefined,
    };
  }, [selected]);

  const onEditOpen = useCallback((row) => setSelected(row), []);
  const onEditClose = useCallback(() => setSelected(null), []);

  const onEditSubmit = useCallback(
    async (values) => {
      const id = selected?.id;
      if (!id) return;

      // Jika user mengubah jam kerja, validasi urutan
      if (values.jamMasuk && values.jamKeluar) {
        if (dayjs(values.jamKeluar).isBefore(dayjs(values.jamMasuk))) {
          notification.error({
            message: "Urutan jam kerja salah",
            description: "Jam keluar tidak boleh lebih awal dari jam masuk.",
          });
          throw new Error("worktime-order");
        }
      }

      const hasIstMulai = !!values.mulaiIstirahat;
      const hasIstSelesai = !!values.selesaiIstirahat;

      if (hasIstMulai !== hasIstSelesai) {
        notification.error({
          message: "Jam istirahat tidak lengkap",
          description: "Isi keduanya: Mulai Istirahat dan Selesai Istirahat.",
        });
        throw new Error("invalid-break-range");
      }

      // validasi MAX saat edit (boleh update MAX saja kalau window SUDAH ada)
      if (values.maxIstirahat != null) {
        let dur = null;
        if (hasIstMulai && hasIstSelesai) {
          dur = minutesDiff(values.mulaiIstirahat, values.selesaiIstirahat);
        } else {
          const raw = selected?._raw || {};
          if (raw.jam_istirahat_mulai && raw.jam_istirahat_selesai) {
            dur = minutesDiff(raw.jam_istirahat_mulai, raw.jam_istirahat_selesai);
          }
        }
        if (dur == null) {
          notification.error({
            message: "Tidak ada jendela istirahat",
            description:
              "Isi Mulai & Selesai Istirahat terlebih dahulu sebelum mengatur maksimal menit.",
          });
          throw new Error("no-break-window");
        }
        if (Number(values.maxIstirahat) > dur) {
          notification.error({
            message: "Maks istirahat terlalu besar",
            description: `Maks ${values.maxIstirahat} menit > durasi jendela (${dur} menit).`,
          });
          throw new Error("invalid-max-break");
        }
      }

      // Jika user isi window baru, cek harus di dalam jam kerja efektif
      // Tentukan jam kerja efektif (baru kalau dikirim, kalau tidak pakai yang lama)
      const raw = selected?._raw || {};
      const effMasuk = values.jamMasuk ? dayjs(values.jamMasuk) : dayjs(raw.jam_mulai);
      const effKeluar = values.jamKeluar ? dayjs(values.jamKeluar) : dayjs(raw.jam_selesai);

      if (hasIstMulai && hasIstSelesai) {
        const bi = dayjs(values.mulaiIstirahat);
        const bs = dayjs(values.selesaiIstirahat);
        if (bi.isBefore(effMasuk) || bs.isAfter(effKeluar)) {
          notification.error({
            message: "Istirahat di luar jam kerja",
            description: "Rentang istirahat harus berada di dalam jam kerja.",
          });
          throw new Error("break-outside");
        }
        if (bs.isBefore(bi)) {
          notification.error({
            message: "Urutan istirahat salah",
            description: "Selesai istirahat tidak boleh lebih awal dari mulai istirahat.",
          });
          throw new Error("break-order");
        }
      }

      const payload = {
        ...(values.nama != null && { nama_pola_kerja: values.nama }),
        ...(values.jamMasuk && { jam_mulai: toIso(values.jamMasuk) }),
        ...(values.jamKeluar && { jam_selesai: toIso(values.jamKeluar) }),
        ...(hasIstMulai &&
          hasIstSelesai && {
            jam_istirahat_mulai: toIso(values.mulaiIstirahat),
            jam_istirahat_selesai: toIso(values.selesaiIstirahat),
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
      await crudService.delete(ApiEndpoints.DeletePolaKerja(id)); // soft delete (default API)
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
    (row) => notification.info({ message: "Riwayat/Reset", description: row?.name || "" }),
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
