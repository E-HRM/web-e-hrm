'use client';

import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { AppConfirm } from '@/app/(view)/component_shared/AppModal';
import { ApiEndpoints } from '@/constrainst/endpoints';
import { fetcher } from '@/app/utils/fetcher';
import { crudService } from '@/app/utils/services/crudService';

function listKey(kind, { page, pageSize, search }) {
  const base = kind === 'cuti' ? ApiEndpoints.GetKategoriCuti : kind === 'sakit' ? ApiEndpoints.GetKategoriSakit : ApiEndpoints.GetKategoriIzinJam;

  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    search: search || '',
  });
  return `${base}?${qs.toString()}`;
}

export default function useManajemenKategoriviewModel() {
  const [activeTab, setActiveTab] = useState('cuti');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [modalKind, setModalKind] = useState('cuti');
  const [editingItem, setEditingItem] = useState(null);

  const swrCuti = useSWR(listKey('cuti', { page, pageSize, search }), fetcher, {
    revalidateOnFocus: false,
  });
  const swrSakit = useSWR(listKey('sakit', { page, pageSize, search }), fetcher, {
    revalidateOnFocus: false,
  });
  const swrIzinJam = useSWR(listKey('izinjam', { page, pageSize, search }), fetcher, {
    revalidateOnFocus: false,
  });

  const itemsCuti = useMemo(() => {
    const arr = Array.isArray(swrCuti.data?.data) ? swrCuti.data.data : [];
    return arr.map((x) => ({
      id: x.id_kategori_cuti,
      nama: x.nama_kategori,
      reduce: Boolean(x.pengurangan_kouta),
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

  const openCreate = useCallback((kind) => {
    setModalMode('create');
    setModalKind(kind);
    setEditingItem(kind === 'cuti' ? { id: null, nama: '', reduce: true } : null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((kind, item) => {
    setModalMode('edit');
    setModalKind(kind);
    setEditingItem(item);
    setModalOpen(true);
  }, []);

  const submitForm = useCallback(
    async (values) => {
      const payload = {
        nama_kategori: String(values.nama_kategori || '').trim(),
      };

      if (!payload.nama_kategori) {
        AppMessage.error('Nama kategori wajib diisi.');
        return;
      }

      if (modalKind === 'cuti') {
        payload.pengurangan_kouta = typeof values.pengurangan_kouta === 'boolean' ? values.pengurangan_kouta : true;
      }

      try {
        if (modalMode === 'create') {
          const ep = modalKind === 'cuti' ? ApiEndpoints.CreateKategoriCuti : modalKind === 'sakit' ? ApiEndpoints.CreateKategoriSakit : ApiEndpoints.CreateKategoriIzinJam;
          await crudService.postAuth(ep, payload);
          AppMessage.success('Kategori berhasil dibuat.');
        } else {
          const id = editingItem?.id;
          const ep = modalKind === 'cuti' ? ApiEndpoints.UpdateKategoriCuti(id) : modalKind === 'sakit' ? ApiEndpoints.UpdateKategoriSakit(id) : ApiEndpoints.UpdateKategoriIzinJam(id);
          await crudService.put(ep, payload);
          AppMessage.success('Kategori diperbarui.');
        }

        setModalOpen(false);
        await mutateAll();
      } catch (err) {
        AppMessage.error(err?.message || 'Gagal menyimpan kategori.');
      }
    },
    [modalMode, modalKind, editingItem, mutateAll]
  );

  const confirmDelete = useCallback(
    (kind, item) => {
      AppConfirm({
        title: 'Hapus kategori?',
        content: (
          <>
            Kategori <b>{item?.nama}</b> akan dihapus (soft delete).
          </>
        ),
        danger: true,
        okText: 'Hapus',
        cancelText: 'Batal',
        maskClosable: true,
        onOk: async () => {
          try {
            const ep = kind === 'cuti' ? ApiEndpoints.DeleteKategoriCuti(item.id) : kind === 'sakit' ? ApiEndpoints.DeleteKategoriSakit(item.id) : ApiEndpoints.DeleteKategoriIzinJam(item.id);
            await crudService.delete(ep);
            AppMessage.success('Kategori dihapus.');
            await mutateAll();
          } catch (err) {
            AppMessage.error(err?.message || 'Gagal menghapus kategori.');
            throw err;
          }
        },
      });
    },
    [mutateAll]
  );

  const onPageChange = useCallback((_kind, p, ps) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  return {
    activeTab,
    setActiveTab,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    loading,

    itemsCuti,
    itemsSakit,
    itemsIzinJam,
    pagCuti: swrCuti.data?.pagination,
    pagSakit: swrSakit.data?.pagination,
    pagIzinJam: swrIzinJam.data?.pagination,

    modalOpen,
    setModalOpen,
    modalMode,
    modalKind,
    editingItem,
    openCreate,
    openEdit,
    submitForm,
    confirmDelete,

    onPageChange,
  };
}
