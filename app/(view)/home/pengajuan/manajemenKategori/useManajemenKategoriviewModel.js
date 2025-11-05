"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { message, Modal } from "antd";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";
import { crudService } from "@/app/utils/services/crudService";

/** Util bikin key SWR */
function listKey(kind, { page, pageSize, search }) {
  const base =
    kind === "cuti"
      ? ApiEndpoints.GetKategoriCuti
      : kind === "sakit"
      ? ApiEndpoints.GetKategoriSakit
      : ApiEndpoints.GetKategoriIzinJam; // izinjam
  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    search: search || "",
  });
  return `${base}?${qs.toString()}`;
}

export default function useManajemenKategoriviewModel() {
  const [activeTab, setActiveTab] = useState("cuti"); // 'cuti' | 'sakit' | 'izinjam'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [modalKind, setModalKind] = useState("cuti");   // 'cuti' | 'sakit' | 'izinjam'
  const [editingItem, setEditingItem] = useState(null); // { id, nama }

  // SWR – CUTI
  const swrCuti = useSWR(listKey("cuti", { page, pageSize, search }), fetcher, {
    revalidateOnFocus: false,
  });
  // SWR – SAKIT
  const swrSakit = useSWR(listKey("sakit", { page, pageSize, search }), fetcher, {
    revalidateOnFocus: false,
  });
  // SWR – IZIN JAM
  const swrIzinJam = useSWR(
    listKey("izinjam", { page, pageSize, search }),
    fetcher,
    { revalidateOnFocus: false }
  );

  const itemsCuti = useMemo(() => {
    const arr = Array.isArray(swrCuti.data?.data) ? swrCuti.data.data : [];
    return arr.map((x) => ({
      id: x.id_kategori_cuti,
      nama: x.nama_kategori,
      raw: x,
    }));
  }, [swrCuti.data]);

  const itemsSakit = useMemo(() => {
    const arr = Array.isArray(swrSakit.data?.data) ? swrSakit.data.data : [];
    return arr.map((x) => ({
      id: x.id_kategori_sakit,
      nama: x.nama_kategori,
      raw: x,
    }));
  }, [swrSakit.data]);

  const itemsIzinJam = useMemo(() => {
    const arr = Array.isArray(swrIzinJam.data?.data) ? swrIzinJam.data.data : [];
    return arr.map((x) => ({
      id: x.id_kategori_izin_jam,
      nama: x.nama_kategori,
      raw: x,
    }));
  }, [swrIzinJam.data]);

  const loading = swrCuti.isLoading || swrSakit.isLoading || swrIzinJam.isLoading;

  const mutateAll = useCallback(async () => {
    await Promise.all([swrCuti.mutate(), swrSakit.mutate(), swrIzinJam.mutate()]);
  }, [swrCuti, swrSakit, swrIzinJam]);

  // ACTIONS
  const openCreate = useCallback((kind) => {
    setModalMode("create");
    setModalKind(kind);
    setEditingItem(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((kind, item) => {
    setModalMode("edit");
    setModalKind(kind);
    setEditingItem(item);
    setModalOpen(true);
  }, []);

  const submitForm = useCallback(
    async (values) => {
      const payload = { nama_kategori: String(values.nama_kategori || "").trim() };
      if (!payload.nama_kategori) {
        message.error("Nama kategori wajib diisi.");
        return;
      }

      try {
        if (modalMode === "create") {
          const ep =
            modalKind === "cuti"
              ? ApiEndpoints.CreateKategoriCuti
              : modalKind === "sakit"
              ? ApiEndpoints.CreateKategoriSakit
              : ApiEndpoints.CreateKategoriIzinJam; // izinjam
          await crudService.postAuth(ep, payload);
          message.success("Kategori berhasil dibuat.");
        } else {
          const id = editingItem.id;
          const ep =
            modalKind === "cuti"
              ? ApiEndpoints.UpdateKategoriCuti(id)
              : modalKind === "sakit"
              ? ApiEndpoints.UpdateKategoriSakit(id)
              : ApiEndpoints.UpdateKategoriIzinJam(id);
          await crudService.put(ep, payload);
          message.success("Kategori diperbarui.");
        }

        setModalOpen(false);
        await mutateAll();
      } catch (err) {
        message.error(err?.message || "Gagal menyimpan kategori.");
      }
    },
    [modalMode, modalKind, editingItem, mutateAll]
  );

  const confirmDelete = useCallback(
    (kind, item) => {
      Modal.confirm({
        title: "Hapus kategori?",
        content: (
          <>
            Kategori <b>{item?.nama}</b> akan dihapus (soft delete).
          </>
        ),
        okText: "Hapus",
        okButtonProps: { danger: true },
        cancelText: "Batal",
        onOk: async () => {
          try {
            const ep =
              kind === "cuti"
                ? ApiEndpoints.DeleteKategoriCuti(item.id)
                : kind === "sakit"
                ? ApiEndpoints.DeleteKategoriSakit(item.id)
                : ApiEndpoints.DeleteKategoriIzinJam(item.id);
            await crudService.delete(ep);
            message.success("Kategori dihapus.");
            await mutateAll();
          } catch (err) {
            message.error(err?.message || "Gagal menghapus kategori.");
          }
        },
      });
    },
    [mutateAll]
  );

  // Pagination handler terpadu (dipakai Table)
  const onPageChange = useCallback((_kind, p, ps) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  return {
    // state
    activeTab,
    setActiveTab,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    loading,

    // data
    itemsCuti,
    itemsSakit,
    itemsIzinJam,
    pagCuti: swrCuti.data?.pagination,
    pagSakit: swrSakit.data?.pagination,
    pagIzinJam: swrIzinJam.data?.pagination,

    // modal
    modalOpen,
    setModalOpen,
    modalMode,
    modalKind,
    editingItem,
    openCreate,
    openEdit,
    submitForm,
    confirmDelete,

    // table handlers
    onPageChange,
  };
}
