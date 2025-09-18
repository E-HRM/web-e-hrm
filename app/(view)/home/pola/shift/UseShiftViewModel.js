"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App as AntdApp } from "antd";
import useSWR from "swr";
import dayjs from "dayjs";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

// util: format HH:mm dari ISO
const hhmm = (v) => (v ? dayjs(v).format("HH:mm") : "");

// util: konversi time (dayjs dari TimePicker) ke ISO; tanggal bebas, yang penting valid
const toIso = (t) => (t ? dayjs(t).format("YYYY-MM-DDTHH:mm:ss") : null);

// fallback warna jika API belum ada field color
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

  // map ke row UI (jam kerja & istirahat untuk sekarang hanya dari jam_mulai/jam_selesai)
  const rows = useMemo(() => {
    const arr = data?.data || [];
    return arr.map((it) => {
      const name = it.nama_pola_kerja || it.name;
      const jamMulai = it.jam_mulai || it.jamMulai;
      const jamSelesai = it.jam_selesai || it.jamSelesai;
      return {
        _raw: it,
        id: it.id_pola_kerja || it.id,
        name,
        jamKerja: `${hhmm(jamMulai)} - ${hhmm(jamSelesai)}`,
        istirahat: it.istirahat || "", // jika backend tambah field, otomatis tampil
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
  const onAddOpen = useCallback(() => {
    // handled di ShiftContent (modal state disana), VM fokus ke CRUD
  }, []);
  const onAddClose = useCallback(() => {}, []);

  const onAddSubmit = useCallback(
    async (values) => {
      const payload = {
        nama_pola_kerja: values.nama,
        jam_mulai: toIso(values.jamMasuk),
        jam_selesai: toIso(values.jamKeluar),
        // jangan kirim field ekstra yang belum ada di schema
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
    // pecah "HH:mm - HH:mm"
    const [m = "", s = ""] = (selected.jamKerja || "").split("-").map((x) => x.trim());
    return {
      nama: selected.name,
      toleransi: selected.toleransi ? parseInt(String(selected.toleransi).replace(/\D/g, ""), 10) : undefined,
      catatan: selected.note || "",
      warna: selected.color,
      jamMasuk: m ? dayjs(m, "HH:mm") : null,
      jamKeluar: s ? dayjs(s, "HH:mm") : null,
      // istirahat opsional; abaikan untuk API sekarang
      maxIstirahat: 60,
    };
  }, [selected]);

  const onEditOpen = useCallback((row) => setSelected(row), []);
  const onEditClose = useCallback(() => setSelected(null), []);

  const onEditSubmit = useCallback(
    async (values) => {
      const id = selected?.id;
      if (!id) return;
      const payload = {
        nama_pola_kerja: values.nama,
        jam_mulai: toIso(values.jamMasuk),
        jam_selesai: toIso(values.jamKeluar),
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
  const onReset = useCallback((row) => {
    notification.info({ message: "Riwayat/Reset", description: row?.name || "" });
  }, [notification]);

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
