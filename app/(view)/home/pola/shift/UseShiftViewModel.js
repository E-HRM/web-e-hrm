"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App as AntdApp } from "antd";
import useSWR from "swr";
import dayjs from "dayjs";
import { fetcher } from "../../../../utils/fetcher";
import { crudService } from "../../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

/* ===== Utils ===== */
const hhmm = (v) => (v ? dayjs(v).format("HH:mm") : "");
const toIso = (t) => (t ? dayjs(t).format("YYYY-MM-DDTHH:mm:ss") : null);
const minutesDiff = (a, b) => (a && b ? Math.abs(dayjs(b).diff(dayjs(a), "minute")) : null);
function colorFromString(s = "") {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h} 80% 65%)`;
}

/* ===== ViewModel ===== */
export default function UseShiftViewModel() {
  const { notification } = AntdApp.useApp();

  /* table state */
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* LIST */
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
          ? `${hhmm(istMulai)} - ${hhmm(istSelesai)}${maksIst != null ? ` (${maksIst} mnt)` : ""}`
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
  useEffect(() => {
    // swrKey sudah berubah kalau page/pageSize/search berubah, tapi kita tetap safe-call mutate
    mutate();
  }, [mutate, page, pageSize, search]);

  /* ADD */
  const onAddSubmit = useCallback(
    async (values) => {
      const hasIstMulai = !!values.mulaiIstirahat;
      const hasIstSelesai = !!values.selesaiIstirahat;

      // harus berpasangan
      if (hasIstMulai !== hasIstSelesai) {
        notification.error({
          message: "Jam istirahat tidak lengkap",
          description: "Isi keduanya: Mulai Istirahat dan Selesai Istirahat.",
        });
        throw new Error("invalid-break-range");
      }

      // validasi maks ≤ durasi jendela (kalau jendela ada)
      if (hasIstMulai && hasIstSelesai && values.maxIstirahat != null) {
        const dur = minutesDiff(values.mulaiIstirahat, values.selesaiIstirahat);
        if (Number(values.maxIstirahat) > dur) {
          notification.error({
            message: "Maks istirahat terlalu besar",
            description: `Maks ${values.maxIstirahat} menit > durasi jendela (${dur} menit).`,
          });
          throw new Error("invalid-max-break");
        }
      }

      const payload = {
        nama_pola_kerja: values.nama,
        jam_mulai: toIso(values.jamMasuk),
        jam_selesai: toIso(values.jamKeluar),
        ...(hasIstMulai && hasIstSelesai
          ? {
              jam_istirahat_mulai: toIso(values.mulaiIstirahat),
              jam_istirahat_selesai: toIso(values.selesaiIstirahat),
              ...(values.maxIstirahat != null
                ? { maks_jam_istirahat: Number(values.maxIstirahat) }
                : {}),
            }
          : {}),
      };

      await crudService.post(ApiEndpoints.CreatePolaKerja, payload);
      notification.success({ message: "Berhasil", description: "Pola kerja dibuat." });
      await mutate();
    },
    [mutate, notification]
  );

  /* EDIT */
  const [selected, setSelected] = useState(null);
  const openEdit = useMemo(() => !!selected, [selected]);

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

      const hasIstMulai = !!values.mulaiIstirahat;
      const hasIstSelesai = !!values.selesaiIstirahat;

      if (hasIstMulai !== hasIstSelesai) {
        notification.error({
          message: "Jam istirahat tidak lengkap",
          description: "Isi keduanya: Mulai Istirahat dan Selesai Istirahat.",
        });
        throw new Error("invalid-break-range");
      }

      // validasi maks saat edit:
      // - kalau user kirim jendela baru, validasi ke jendela baru
      // - kalau tidak kirim jendela tapi hanya ubah maks, validasi ke jendela existing
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
        ...(values.maxIstirahat != null
          ? { maks_jam_istirahat: Number(values.maxIstirahat) }
          : {}),
      };

      await crudService.put(ApiEndpoints.UpdatePolaKerja(id), payload);
      notification.success({ message: "Berhasil", description: "Pola kerja diperbarui." });
      setSelected(null);
      await mutate();
    },
    [mutate, notification, selected]
  );

  /* DELETE */
  const [deleting, setDeleting] = useState(null);
  const openDelete = useMemo(() => !!deleting, [deleting]);
  const onDeleteOpen = useCallback((row) => setDeleting(row), []);
  const onDeleteClose = useCallback(() => setDeleting(null), []);
  const onDeleteConfirm = useCallback(async () => {
    const id = deleting?.id;
    if (!id) return;
    await crudService.delete(ApiEndpoints.DeletePolaKerja(id));
    notification.success({ message: "Terhapus", description: "Pola kerja dihapus." });
    setDeleting(null);
    await mutate();
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
