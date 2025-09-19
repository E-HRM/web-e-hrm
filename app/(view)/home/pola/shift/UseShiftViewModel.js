"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App as AntdApp } from "antd";
import useSWR from "swr";
import dayjs from "dayjs";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

// util: HH:mm dari tipe apa pun yang bisa diparse dayjs
const hhmm = (v) => (v ? dayjs(v).format("HH:mm") : "");

// util: TimePicker (dayjs) -> ISO; tanggal bebas yang penting jam:menitnya benar
const toIso = (t) => (t ? dayjs(t).format("YYYY-MM-DDTHH:mm:ss") : null);

// fallback warna bila backend belum sediakan
function colorFromString(s = "") {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h} 80% 65%)`;
}

export default function UseShiftViewModel() {
  const { notification } = AntdApp.useApp();

  // table state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ======== LIST (SWR) ========
  const listUrl = ApiEndpoints.GetPolaKerja;
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (search.trim()) p.set("search", search.trim());
    return p.toString();
  }, [page, pageSize, search]);

  const swrKey = `${listUrl}?${qs}`;
  const { data, isLoading, mutate } = useSWR(swrKey, fetcher);

  // map ke row UI — sekarang termasuk jam istirahat dari API
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
          ? `${hhmm(istMulai)} - ${hhmm(istSelesai)}${maksIst != null ? ` (${maksIst} mnt)` : ""}`
          : "";

      return {
        _raw: it,
        id: it.id_pola_kerja || it.id,
        name,
        jamKerja: `${hhmm(jamMulai)} - ${hhmm(jamSelesai)}`,
        istirahat: istirahatStr,               // <<< tampil di tabel
        istMulai,                              // simpan mentahan untuk edit
        istSelesai,
        maksIst,
        toleransi: it.toleransi || "",
        note: it.note || "",
        color: it.color || colorFromString(name),
      };
    });
  }, [data]);

  const pagination = data?.pagination || { total: rows.length, page, pageSize };

  const fetchList = useCallback(() => mutate(), [mutate]);

  const onTableChange = useCallback((pg) => {
    setPage(pg.current);
    setPageSize(pg.pageSize);
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList, page, pageSize, search]);

  // ======== ADD ========
  const onAddSubmit = useCallback(
    async (values) => {
      const hasIstMulai = !!values.mulaiIstirahat;
      const hasIstSelesai = !!values.selesaiIstirahat;

      // validasi ringan di sisi client: harus berpasangan
      if (hasIstMulai !== hasIstSelesai) {
        notification.error({
          message: "Jam istirahat tidak lengkap",
          description: "Isi keduanya: Mulai Istirahat dan Selesai Istirahat.",
        });
        throw new Error("invalid-break-range");
      }

      const payload = {
        nama_pola_kerja: values.nama,
        jam_mulai: toIso(values.jamMasuk),
        jam_selesai: toIso(values.jamKeluar),
        // opsional: hanya kirim kalau keduanya ada
        ...(hasIstMulai && hasIstSelesai
          ? {
              jam_istirahat_mulai: toIso(values.mulaiIstirahat),
              jam_istirahat_selesai: toIso(values.selesaiIstirahat),
            }
          : {}),
        // boleh kirim maks walau jam istirahat kosong (API handle)
        ...(values.maxIstirahat != null ? { maks_jam_istirahat: Number(values.maxIstirahat) } : {}),
      };

      try {
        await crudService.post(ApiEndpoints.CreatePolaKerja, payload);
        notification.success({ message: "Berhasil", description: "Pola kerja dibuat." });
        await mutate();
      } catch (err) {
        notification.error({ message: "Gagal menambah", description: err?.message || "Error" });
        throw err;
      }
    },
    [mutate, notification]
  );

  // ======== EDIT ========
  const [selected, setSelected] = useState(null);
  const openEdit = useMemo(() => !!selected, [selected]);

  const getEditInitial = useCallback(() => {
    if (!selected) return {};
    const raw = selected._raw || {};

    // ambil dari raw agar presisi
    const jamMasuk = raw.jam_mulai ? dayjs(raw.jam_mulai) : null;
    const jamKeluar = raw.jam_selesai ? dayjs(raw.jam_selesai) : null;

    const mulaiIst = raw.jam_istirahat_mulai ? dayjs(raw.jam_istirahat_mulai) : null;
    const selesaiIst = raw.jam_istirahat_selesai ? dayjs(raw.jam_istirahat_selesai) : null;

    return {
      nama: selected.name,
      toleransi: selected.toleransi
        ? parseInt(String(selected.toleransi).replace(/\D/g, ""), 10)
        : undefined,
      catatan: selected.note || "",
      warna: selected.color,
      jamMasuk,
      jamKeluar,
      mulaiIstirahat: mulaiIst,
      selesaiIstirahat: selesaiIst,
      maxIstirahat: selected.maksIst ?? undefined,
    };
  }, [selected]);

  const onEditOpen = useCallback((row) => setSelected(row), []);
  const onEditClose = useCallback(() => setSelected(null), []);

  const onEditSubmit = useCallback(
    async (values) => {
      const id = selected?.id;
      if (!id) return;

      const hasIstMulai = !!values.mulaiIstirahat;
      const hasIstSelesai = !!values.selesaiIstirahat;

      if (hasIstMulai !== hasIstSelesai) {
        // PUT di server akan menolak kalau cuma satu yang dikirim; kita validasi dulu
        notification.error({
          message: "Jam istirahat tidak lengkap",
          description: "Isi keduanya: Mulai Istirahat dan Selesai Istirahat.",
        });
        throw new Error("invalid-break-range");
      }

      // HATI2: endpoint PUT menolak null/'' (pakai "undefined" untuk 'tidak diubah')
      const payload = {
        ...(values.nama != null ? { nama_pola_kerja: values.nama } : {}),
        ...(values.jamMasuk ? { jam_mulai: toIso(values.jamMasuk) } : {}),
        ...(values.jamKeluar ? { jam_selesai: toIso(values.jamKeluar) } : {}),
        ...(hasIstMulai && hasIstSelesai
          ? {
              jam_istirahat_mulai: toIso(values.mulaiIstirahat),
              jam_istirahat_selesai: toIso(values.selesaiIstirahat),
            }
          : {}),
        ...(values.maxIstirahat != null ? { maks_jam_istirahat: Number(values.maxIstirahat) } : {}),
      };

      try {
        await crudService.put(ApiEndpoints.UpdatePolaKerja(id), payload);
        notification.success({ message: "Berhasil", description: "Pola kerja diperbarui." });
        setSelected(null);
        await mutate();
      } catch (err) {
        notification.error({ message: "Gagal mengubah", description: err?.message || "Error" });
        throw err;
      }
    },
    [mutate, notification, selected]
  );

  // ======== DELETE ========
  const [deleting, setDeleting] = useState(null);
  const openDelete = useMemo(() => !!deleting, [deleting]);
  const onDeleteOpen = useCallback((row) => setDeleting(row), []);
  const onDeleteClose = useCallback(() => setDeleting(null), []);
  const onDeleteConfirm = useCallback(async () => {
    const id = deleting?.id;
    if (!id) return;
    try {
      await crudService.delete(ApiEndpoints.DeletePolaKerja(id));
      notification.success({ message: "Terhapus", description: "Pola kerja dihapus." });
      setDeleting(null);
      await mutate();
    } catch (err) {
      notification.error({ message: "Gagal menghapus", description: err?.message || "Error" });
      throw err;
    }
  }, [deleting, mutate, notification]);

  // dummy reset
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
