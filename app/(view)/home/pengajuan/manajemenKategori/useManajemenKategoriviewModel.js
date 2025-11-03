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
    kind === "cuti" ? ApiEndpoints.GetKategoriCuti : ApiEndpoints.GetKategoriSakit;
  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    search: search || "",
  });
  return `${base}?${qs.toString()}`;
}

export default function useManajemenKategoriviewModel() {
  const [activeTab, setActiveTab] = useState("cuti");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  // ===== Dummy data lokal untuk "Tukar Hari" =====
  const [tukarSource, setTukarSource] = useState([
    { id_kategori_tukar: 1001, nama_kategori: "Jam extra di hari sama" },
    { id_kategori_tukar: 1002, nama_kategori: "Mengganti dengan jam saat libur" },
  ]);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [modalKind, setModalKind] = useState("cuti");   // 'cuti' | 'sakit' | 'tukar'
  const [editingItem, setEditingItem] = useState(null); // { id, nama }

  // SWR – CUTI
  const swrCuti = useSWR(
    listKey("cuti", { page, pageSize, search }),
    fetcher,
    { revalidateOnFocus: false }
  );
  // SWR – SAKIT
  const swrSakit = useSWR(
    listKey("sakit", { page, pageSize, search }),
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

  // Map dummy Tukar Hari -> items
  const itemsTukar = useMemo(() => {
    return tukarSource.map((x) => ({
      id: x.id_kategori_tukar,
      nama: x.nama_kategori,
      raw: x,
    }));
  }, [tukarSource]);

  const loading = swrCuti.isLoading || swrSakit.isLoading;

  const mutateAll = useCallback(async () => {
    await Promise.all([swrCuti.mutate(), swrSakit.mutate()]);
  }, [swrCuti, swrSakit]);

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
          if (modalKind === "tukar") {
            // Create dummy lokal
            setTukarSource((prev) => [
              ...prev,
              { id_kategori_tukar: Date.now(), nama_kategori: payload.nama_kategori },
            ]);
            message.success("Kategori tukar hari dibuat.");
          } else {
            const ep =
              modalKind === "cuti"
                ? ApiEndpoints.CreateKategoriCuti
                : ApiEndpoints.CreateKategoriSakit;
            await crudService.postAuth(ep, payload);
            message.success("Kategori berhasil dibuat.");
          }
        } else {
          if (modalKind === "tukar") {
            // Edit dummy lokal
            setTukarSource((prev) =>
              prev.map((x) =>
                x.id_kategori_tukar === editingItem.id
                  ? { ...x, nama_kategori: payload.nama_kategori }
                  : x
              )
            );
            message.success("Kategori diperbarui.");
          } else {
            const id = editingItem.id;
            const ep =
              modalKind === "cuti"
                ? ApiEndpoints.UpdateKategoriCuti(id)
                : ApiEndpoints.UpdateKategoriSakit(id);
            await crudService.put(ep, payload);
            message.success("Kategori diperbarui.");
          }
        }

        setModalOpen(false);
        if (modalKind !== "tukar") {
          await mutateAll();
        }
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
            Kategori <b>{item?.nama}</b> akan dihapus {kind === "tukar" ? "(dummy lokal)" : "(soft delete)"}.
          </>
        ),
        okText: "Hapus",
        okButtonProps: { danger: true },
        cancelText: "Batal",
        onOk: async () => {
          try {
            if (kind === "tukar") {
              setTukarSource((prev) =>
                prev.filter((x) => x.id_kategori_tukar !== item.id)
              );
              message.success("Kategori dihapus.");
            } else {
              const ep =
                kind === "cuti"
                  ? ApiEndpoints.DeleteKategoriCuti(item.id)
                  : ApiEndpoints.DeleteKategoriSakit(item.id);
              await crudService.delete(ep);
              message.success("Kategori dihapus.");
              await mutateAll();
            }
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

  // Pagination object untuk tukar (local)
  const pagTukar = useMemo(
    () => ({ page, pageSize, total: tukarSource.length }),
    [page, pageSize, tukarSource]
  );

  return {
    // state
    activeTab, setActiveTab,
    page, setPage,
    pageSize, setPageSize,
    search, setSearch,
    loading,

    // data
    itemsCuti,
    itemsSakit,
    itemsTukar,
    pagCuti: swrCuti.data?.pagination,
    pagSakit: swrSakit.data?.pagination,
    pagTukar,

    // modal
    modalOpen, setModalOpen,
    modalMode, modalKind, editingItem,
    openCreate, openEdit, submitForm, confirmDelete,

    // table handlers
    onPageChange,
  };
}
