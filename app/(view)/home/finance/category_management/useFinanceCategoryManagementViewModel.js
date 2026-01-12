// app/(view)/home/finance/category_management/useFinanceCategoryManagementViewModel.js
'use client';

import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';

import { ApiEndpoints } from '@/constrainst/endpoints';
import { fetcher } from '@/app/utils/fetcher';
import { crudService } from '@/app/utils/services/crudService';

function mapItem(it) {
  if (!it) return null;
  return {
    id: it.id_kategori_keperluan,
    nama: it.nama_keperluan,
    created_at: it.created_at,
    updated_at: it.updated_at,
    deleted_at: it.deleted_at,
  };
}

function pickPagination(res) {
  const pag = res?.pagination || res?.paginationData || res?.meta?.pagination || null;
  if (!pag) return { page: 1, pageSize: 10, total: 0, totalPages: 0 };
  return {
    page: pag.page ?? 1,
    pageSize: pag.pageSize ?? 10,
    total: pag.total ?? 0,
    totalPages: pag.totalPages ?? 0,
  };
}

export default function useFinanceCategoryManagementViewModel() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const url = useMemo(
    () =>
      ApiEndpoints.GetKategoriKeperluan({
        page,
        pageSize,
        search,
      }),
    [page, pageSize, search]
  );

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, { revalidateOnFocus: false });

  const items = useMemo(() => (data?.data || []).map(mapItem).filter(Boolean), [data]);
  const pagination = useMemo(() => pickPagination(data), [data]);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null);

  const openCreate = useCallback(() => {
    setModalMode('create');
    setEditingItem(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((item) => {
    setModalMode('edit');
    setEditingItem(item);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const submitForm = useCallback(
    async (values) => {
      const nama_keperluan = String(values?.nama_keperluan || values?.nama || '').trim();
      if (!nama_keperluan) throw new Error('Nama keperluan wajib diisi.');

      if (modalMode === 'create') {
        await crudService.post(ApiEndpoints.CreateKategoriKeperluan, { nama_keperluan }, { useToken: true });
      } else {
        const id = editingItem?.id;
        if (!id) throw new Error('ID kategori tidak ditemukan.');
        await crudService.put(ApiEndpoints.UpdateKategoriKeperluan(id), { nama_keperluan }, { useToken: true });
      }

      closeModal();
      await mutate();
    },
    [modalMode, editingItem?.id, closeModal, mutate]
  );

  const deleteItem = useCallback(
    async (item) => {
      const id = item?.id;
      if (!id) throw new Error('ID kategori tidak ditemukan.');
      await crudService.delete(ApiEndpoints.DeleteKategoriKeperluan(id), undefined, { useToken: true });
      await mutate();
    },
    [mutate]
  );

  const onPageChange = useCallback((p, ps) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  return {
    // data
    items,
    pagination,
    isLoading,
    error,

    // search + pagination
    search,
    setSearch,
    onPageChange,

    // modal
    modalOpen,
    modalMode,
    editingItem,
    openCreate,
    openEdit,
    closeModal,
    submitForm,

    // actions
    deleteItem,
  };
}
