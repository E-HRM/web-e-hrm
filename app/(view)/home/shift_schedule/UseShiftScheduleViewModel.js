"use client";

import { useCallback, useMemo, useState } from "react";
import { App as AntdApp } from "antd";
import useSWR from "swr";
import dayjs from "dayjs";
import { fetcher } from "../../../utils/fetcher";
import { crudService } from "../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../constrainst/endpoints";

const toIsoDate = (d) => (d ? dayjs(d).format("YYYY-MM-DD") : null);
const fmt = (d) => (d ? dayjs(d).format("DD MMM YYYY") : "—");

export default function UseShiftScheduleViewModel() {
  const { notification } = AntdApp.useApp();

  /* ===================== Filters & Paging ===================== */
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState(null); // "KERJA" | "LIBUR" | null
  const [polaId, setPolaId] = useState(null); // id | 'null' | null
  const [mulaiRange, setMulaiRange] = useState([null, null]);
  const [selesaiRange, setSelesaiRange] = useState([null, null]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (userId) p.set("id_user", userId);
    if (status) p.set("status", status);
    if (polaId) p.set("id_pola_kerja", polaId); // bisa 'null'
    if (mulaiRange[0]) p.set("tanggalMulaiFrom", toIsoDate(mulaiRange[0]));
    if (mulaiRange[1]) p.set("tanggalMulaiTo", toIsoDate(mulaiRange[1]));
    if (selesaiRange[0]) p.set("tanggalSelesaiFrom", toIsoDate(selesaiRange[0]));
    if (selesaiRange[1]) p.set("tanggalSelesaiTo", toIsoDate(selesaiRange[1]));
    return p.toString();
  }, [page, pageSize, userId, status, polaId, mulaiRange, selesaiRange]);

  const listKey = `${ApiEndpoints.GetShiftKerja}?${qs}`;
  const { data, isLoading, mutate } = useSWR(listKey, fetcher);

  const rows = useMemo(() => {
    const arr = data?.data || [];
    return arr.map((it) => ({
      _raw: it,
      id: it.id_shift_kerja,
      userName: it.user?.nama_pengguna || "—",
      userEmail: it.user?.email || "",
      periode:
        (it.tanggal_mulai ? fmt(it.tanggal_mulai) : "—") +
        " - " +
        (it.tanggal_selesai ? fmt(it.tanggal_selesai) : "—"),
      mulai: it.tanggal_mulai,
      selesai: it.tanggal_selesai,
      hariKerja: it.hari_kerja || "—",
      status: it.status,
      polaName: it.polaKerja?.nama_pola_kerja || (it.id_pola_kerja ? it.id_pola_kerja : "Tanpa Pola"),
      polaId: it.id_pola_kerja ?? null,
    }));
  }, [data]);

  const pagination = data?.pagination || { total: 0, page, pageSize };
  const onTableChange = useCallback((pg) => {
    setPage(pg.current);
    setPageSize(pg.pageSize);
  }, []);

  /* ===================== Select Options (Users & Pola) ===================== */
  const { data: usersRes } = useSWR(`${ApiEndpoints.GetUsers}?page=1&pageSize=100`, fetcher);
  const userOptions = useMemo(
    () =>
      (usersRes?.data || []).map((u) => ({
        value: u.id_user,
        label: u.nama_pengguna || u.email,
        email: u.email,
      })),
    [usersRes]
  );

  // ambil pola kerja (bisa dipakai filter & form)
  const { data: polaRes } = useSWR(`${ApiEndpoints.GetPolaKerja}?page=1&pageSize=200`, fetcher);
  const polaOptions = useMemo(() => {
    const arr = polaRes?.data || [];
    return [
      { value: "null", label: "Tanpa Pola" },
      ...arr.map((p) => ({ value: p.id_pola_kerja, label: p.nama_pola_kerja })),
    ];
  }, [polaRes]);

  /* ===================== CRUD ===================== */
  const addSchedule = useCallback(
    async (values) => {
      const payload = {
        id_user: values.id_user,
        hari_kerja: values.hari_kerja?.trim(),
        status: values.status,
        tanggal_mulai: toIsoDate(values.tanggal_mulai),
        tanggal_selesai: toIsoDate(values.tanggal_selesai),
        id_pola_kerja:
          values.id_pola_kerja === "null" ? null : values.id_pola_kerja ?? null,
      };
      await crudService.post(ApiEndpoints.CreateShiftKerja, payload);
      notification.success({ message: "Berhasil", description: "Shift kerja dibuat." });
      await mutate();
    },
    [mutate, notification]
  );

  const [selected, setSelected] = useState(null);
  const openEdit = !!selected;
  const onEditOpen = useCallback((row) => setSelected(row), []);
  const onEditClose = useCallback(() => setSelected(null), []);
  const getEditInitial = useCallback(() => {
    if (!selected) return {};
    return {
      id_user: userOptions.find((o) => o.value === selected._raw?.id_user)?.value || selected._raw?.id_user,
      hari_kerja: selected.hariKerja,
      status: selected.status,
      id_pola_kerja:
        selected.polaId === null ? "null" : selected.polaId || undefined,
      tanggal_mulai: selected.mulai ? dayjs(selected.mulai) : null,
      tanggal_selesai: selected.selesai ? dayjs(selected.selesai) : null,
    };
  }, [selected, userOptions]);

  const editSchedule = useCallback(
    async (values) => {
      const id = selected?.id;
      if (!id) return;
      const payload = {
        id_user: values.id_user,
        hari_kerja: values.hari_kerja?.trim(),
        status: values.status,
        tanggal_mulai: toIsoDate(values.tanggal_mulai),
        tanggal_selesai: toIsoDate(values.tanggal_selesai),
        id_pola_kerja:
          values.id_pola_kerja === "null" ? null : values.id_pola_kerja ?? undefined,
      };
      await crudService.put(ApiEndpoints.UpdateShiftKerja(id), payload);
      notification.success({ message: "Berhasil", description: "Shift kerja diperbarui." });
      setSelected(null);
      await mutate();
    },
    [mutate, notification, selected]
  );

  const [deleting, setDeleting] = useState(null);
  const openDelete = !!deleting;
  const onDeleteOpen = useCallback((row) => setDeleting(row), []);
  const onDeleteClose = useCallback(() => setDeleting(null), []);
  const onDeleteConfirm = useCallback(async () => {
    const id = deleting?.id;
    if (!id) return;
    await crudService.delete(ApiEndpoints.DeleteShiftKerja(id));
    notification.success({ message: "Terhapus", description: "Shift kerja dihapus." });
    setDeleting(null);
    await mutate();
  }, [deleting, mutate, notification]);

  const resetFilters = useCallback(() => {
    setUserId(null);
    setStatus(null);
    setPolaId(null);
    setMulaiRange([null, null]);
    setSelesaiRange([null, null]);
    setPage(1);
  }, []);

  const onReset = useCallback((row) => {
    notification.info({ message: "Riwayat/Reset", description: row?.userName || "" });
  }, [notification]);

  return {
    // list
    rows,
    loading: isLoading,
    pagination: { page, pageSize, total: pagination.total },
    onTableChange,

    // filters
    userId,
    setUserId,
    status,
    setStatus,
    polaId,
    setPolaId,
    mulaiRange,
    setMulaiRange,
    selesaiRange,
    setSelesaiRange,
    resetFilters,

    // selects
    userOptions,
    polaOptions,

    // CRUD
    addSchedule,
    openEdit,
    onEditOpen,
    onEditClose,
    getEditInitial,
    editSchedule,
    openDelete,
    onDeleteOpen,
    onDeleteClose,
    onDeleteConfirm,
    selected,

    onReset,
  };
}
