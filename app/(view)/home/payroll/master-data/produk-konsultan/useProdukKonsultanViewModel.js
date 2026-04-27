'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { useAuth } from '@/app/utils/auth/authService';
import { crudServiceAuth } from '@/app/utils/services/crudServiceAuth';
import { ApiEndpoints } from '@/constrainst/endpoints';

import { createInitialForm, normalizePercentValue } from './component_produk_konsultan/ProdukKonsultanShared';

const FETCH_PAGE_SIZE = 100;
const SWR_KEY = 'payroll:produk-konsultan:list';
const ALLOWED_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

function normalizeRole(value) {
  return String(value || '')
    .trim()
    .toUpperCase();
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeSearchText(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeNullableText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeCount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeProdukKonsultanItem(item) {
  if (!item) return null;

  const id = normalizeText(item.id_jenis_produk_konsultan);
  const nama_produk = normalizeText(item.nama_produk);

  if (!id || !nama_produk) return null;

  return {
    id_jenis_produk_konsultan: id,
    nama_produk,
    persen_share_default: normalizePercentValue(item.persen_share_default),
    aktif: Boolean(item.aktif),
    catatan: normalizeNullableText(item.catatan),
    created_at: item.created_at || null,
    updated_at: item.updated_at || null,
    deleted_at: item.deleted_at || null,
    _count: {
      transaksi_konsultan: normalizeCount(item?._count?.transaksi_konsultan),
    },
  };
}

function createProdukKonsultanFormData(item) {
  const normalized = normalizeProdukKonsultanItem(item);

  if (!normalized) {
    return createInitialForm();
  }

  return {
    nama_produk: normalized.nama_produk || '',
    persen_share_default: normalizePercentValue(normalized.persen_share_default),
    aktif: Boolean(normalized.aktif),
    catatan: normalized.catatan || '',
  };
}

function buildProdukKonsultanPayload(formData) {
  return {
    nama_produk: normalizeText(formData?.nama_produk),
    persen_share_default: normalizePercentValue(formData?.persen_share_default),
    aktif: Boolean(formData?.aktif),
    catatan: normalizeNullableText(formData?.catatan),
  };
}

async function fetchAllPages(fetcher) {
  const merged = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await fetcher(page);
    const items = Array.isArray(response?.data) ? response.data : [];

    merged.push(...items);

    const nextTotalPages = Number(response?.pagination?.totalPages);
    totalPages = Number.isFinite(nextTotalPages) && nextTotalPages > 0 ? nextTotalPages : 1;
    page += 1;
  }

  return merged;
}

async function fetchAllProdukKonsultan() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetProdukKonsultan({
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: 'created_at',
        sort: 'desc',
      }),
    ),
  );
}

async function fetchProdukKonsultanById(id) {
  const response = await crudServiceAuth.get(ApiEndpoints.GetProdukKonsultanById(id));
  return normalizeProdukKonsultanItem(response?.data || null);
}

export default function useProdukKonsultanViewModel() {
  const auth = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProduk, setSelectedProduk] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(createInitialForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingEdit, setIsPreparingEdit] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const canAccess = useMemo(() => {
    if (!auth.isLoggedIn) return false;
    return ALLOWED_ROLES.has(normalizeRole(auth.role));
  }, [auth.isLoggedIn, auth.role]);

  const shouldFetch = !auth.isLoading && canAccess;

  const { data, error, isLoading, isValidating, mutate } = useSWR(shouldFetch ? SWR_KEY : null, fetchAllProdukKonsultan, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!error) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'produk-konsultan-fetch-error',
      content: error?.message || 'Gagal memuat data produk konsultan.',
    });
  }, [error]);

  const produkData = useMemo(() => {
    const rawData = Array.isArray(data) ? data : [];
    return rawData.map(normalizeProdukKonsultanItem).filter(Boolean);
  }, [data]);

  const resolvedSelectedProduk = useMemo(() => {
    if (!selectedProduk) return null;

    const normalized = normalizeProdukKonsultanItem(selectedProduk);
    if (normalized) return normalized;

    const selectedId = normalizeText(selectedProduk?.id_jenis_produk_konsultan);
    return produkData.find((item) => item.id_jenis_produk_konsultan === selectedId) || null;
  }, [produkData, selectedProduk]);

  const setFormValue = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(createInitialForm());
  }, []);

  const reloadData = useCallback(async () => {
    if (!shouldFetch) return;
    await mutate();
  }, [mutate, shouldFetch]);

  const closeCreateModal = useCallback(() => {
    if (isSubmitting) return;

    setIsCreateModalOpen(false);
    resetForm();
  }, [isSubmitting, resetForm]);

  const closeEditModal = useCallback(() => {
    if (isSubmitting || isPreparingEdit) return;

    setIsEditModalOpen(false);
    setSelectedProduk(null);
    resetForm();
  }, [isPreparingEdit, isSubmitting, resetForm]);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedProduk(null);
    setIsDetailLoading(false);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    if (isSubmitting) return;

    setIsDeleteDialogOpen(false);
    setSelectedProduk(null);
  }, [isSubmitting]);

  const openCreateModal = useCallback(() => {
    setSelectedProduk(null);
    resetForm();
    setIsCreateModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback(
    async (produk) => {
      if (!produk?.id_jenis_produk_konsultan || isPreparingEdit || isSubmitting) return;

      const normalizedProduk = normalizeProdukKonsultanItem(produk);

      setSelectedProduk(normalizedProduk);
      setFormData(createProdukKonsultanFormData(normalizedProduk));
      setIsEditModalOpen(true);
      setIsPreparingEdit(true);

      try {
        const freshProduk = await fetchProdukKonsultanById(produk.id_jenis_produk_konsultan);

        if (!freshProduk) {
          setIsEditModalOpen(false);
          setSelectedProduk(null);
          resetForm();
          AppMessage.warning('Data produk konsultan tidak ditemukan.');
          return;
        }

        setSelectedProduk(freshProduk);
        setFormData(createProdukKonsultanFormData(freshProduk));
      } catch (err) {
        setIsEditModalOpen(false);
        setSelectedProduk(null);
        resetForm();
        AppMessage.error(err?.message || 'Gagal memuat data produk konsultan.');
      } finally {
        setIsPreparingEdit(false);
      }
    },
    [isPreparingEdit, isSubmitting, resetForm],
  );

  const openDetailModal = useCallback(async (produk) => {
    if (!produk?.id_jenis_produk_konsultan) return;

    const normalizedProduk = normalizeProdukKonsultanItem(produk);

    setSelectedProduk(normalizedProduk);
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);

    try {
      const freshProduk = await fetchProdukKonsultanById(produk.id_jenis_produk_konsultan);

      if (freshProduk) {
        setSelectedProduk(freshProduk);
      }
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memuat detail produk konsultan.');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const openDeleteDialog = useCallback((produk) => {
    if (!produk?.id_jenis_produk_konsultan || isSubmitting) return;

    setSelectedProduk(normalizeProdukKonsultanItem(produk));
    setIsDeleteDialogOpen(true);
  }, [isSubmitting]);

  const filteredData = useMemo(() => {
    const normalizedSearch = normalizeSearchText(searchQuery);

    return produkData.filter((produk) => {
      if (filterStatus === 'ACTIVE' && !produk.aktif) return false;
      if (filterStatus === 'INACTIVE' && produk.aktif) return false;
      if (!normalizedSearch) return true;

      return [produk.nama_produk, produk.catatan].filter(Boolean).some((value) => normalizeSearchText(value).includes(normalizedSearch));
    });
  }, [filterStatus, produkData, searchQuery]);

  const statistics = useMemo(() => {
    const total = produkData.length;
    const aktif = produkData.filter((item) => item.aktif).length;
    const tidakAktif = produkData.filter((item) => !item.aktif).length;
    const itemsDenganShare = produkData.filter((item) => item.persen_share_default !== null && item.persen_share_default !== undefined);

    const rataRataShare = itemsDenganShare.length
      ? itemsDenganShare.reduce((sum, item) => sum + Number(item.persen_share_default || 0), 0) / itemsDenganShare.length
      : 0;

    return {
      total,
      aktif,
      tidakAktif,
      rataRataShare,
    };
  }, [produkData]);

  const handleCreate = useCallback(async () => {
    if (isSubmitting) return;

    const payload = buildProdukKonsultanPayload(formData);

    if (!payload.nama_produk) {
      AppMessage.error('Nama produk wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.post(ApiEndpoints.CreateProdukKonsultan(), payload);

      await mutate();

      setIsCreateModalOpen(false);
      resetForm();

      AppMessage.success(response?.message || 'Produk konsultan berhasil ditambahkan.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menambahkan produk konsultan.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, mutate, resetForm]);

  const handleEdit = useCallback(async () => {
    if (isSubmitting || isPreparingEdit || !resolvedSelectedProduk?.id_jenis_produk_konsultan) return;

    const payload = buildProdukKonsultanPayload(formData);

    if (!payload.nama_produk) {
      AppMessage.error('Nama produk wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.put(ApiEndpoints.UpdateProdukKonsultan(resolvedSelectedProduk.id_jenis_produk_konsultan), payload);

      await mutate();

      setIsEditModalOpen(false);
      setSelectedProduk(null);
      resetForm();

      AppMessage.success(response?.message || 'Produk konsultan berhasil diperbarui.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memperbarui produk konsultan.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isPreparingEdit, isSubmitting, mutate, resetForm, resolvedSelectedProduk]);

  const handleDelete = useCallback(async () => {
    if (isSubmitting || !resolvedSelectedProduk?.id_jenis_produk_konsultan) return;

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.delete(ApiEndpoints.DeleteProdukKonsultan(resolvedSelectedProduk.id_jenis_produk_konsultan));

      await mutate();

      setIsDeleteDialogOpen(false);
      setSelectedProduk(null);

      AppMessage.success(response?.message || 'Produk konsultan berhasil dihapus.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menghapus produk konsultan.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, mutate, resolvedSelectedProduk]);

  return {
    auth,
    canAccess,

    produkData,
    filteredData,
    selectedProduk: resolvedSelectedProduk,
    formData,
    filterStatus,
    searchQuery,
    statistics,

    error,
    loading: isLoading,
    refreshing: isValidating,
    isSubmitting,
    isPreparingEdit,
    isDetailLoading,

    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isDetailModalOpen,

    setFormValue,
    resetForm,
    setFilterStatus,
    setSearchQuery,
    reloadData,

    openCreateModal,
    closeCreateModal,
    handleCreate,

    openEditModal,
    closeEditModal,
    handleEdit,

    openDetailModal,
    closeDetailModal,

    openDeleteDialog,
    closeDeleteDialog,
    handleDelete,
  };
}
