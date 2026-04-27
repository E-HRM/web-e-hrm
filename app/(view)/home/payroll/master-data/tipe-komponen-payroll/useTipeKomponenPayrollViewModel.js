'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { crudServiceAuth } from '@/app/utils/services/crudServiceAuth';
import { ApiEndpoints } from '@/constrainst/endpoints';

import {
  buildSearchText,
  createInitialTipeKomponenPayrollForm,
  createTipeKomponenPayrollFormData,
  formatDateTime,
  normalizeText,
  normalizeTextLower,
  normalizeTipeKomponenPayrollItem,
} from './utils/tipeKomponenPayroll.utils';

const FETCH_PAGE_SIZE = 100;
const SWR_KEY = 'payroll:tipe-komponen-payroll:list';

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

async function fetchAllTipeKomponenPayroll() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetTipeKomponenPayroll({
        page,
        pageSize: FETCH_PAGE_SIZE,
        includeDeleted: true,
        orderBy: 'nama_tipe_komponen',
        sort: 'asc',
      }),
    ),
  );
}

async function fetchTipeKomponenPayrollById(id) {
  const response = await crudServiceAuth.get(ApiEndpoints.GetTipeKomponenPayrollById(id));
  return normalizeTipeKomponenPayrollItem(response?.data || null);
}

function buildPayload(formData) {
  return {
    nama_tipe_komponen: normalizeText(formData?.nama_tipe_komponen),
  };
}

export default function useTipeKomponenPayrollViewModel() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTipeKomponen, setSelectedTipeKomponen] = useState(null);
  const [formData, setFormData] = useState(createInitialTipeKomponenPayrollForm());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingEdit, setIsPreparingEdit] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const { data, error, isLoading, isValidating, mutate } = useSWR(SWR_KEY, fetchAllTipeKomponenPayroll, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!error) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'tipe-komponen-payroll-fetch-error',
      content: error?.message || 'Gagal memuat tipe komponen payroll.',
    });
  }, [error]);

  const tipeKomponenData = useMemo(() => {
    const rawData = Array.isArray(data) ? data : [];
    return rawData.map(normalizeTipeKomponenPayrollItem).filter(Boolean);
  }, [data]);

  const resolvedSelectedTipeKomponen = useMemo(() => {
    if (!selectedTipeKomponen) return null;

    return normalizeTipeKomponenPayrollItem(selectedTipeKomponen) || tipeKomponenData.find((item) => item.id_tipe_komponen_payroll === selectedTipeKomponen.id_tipe_komponen_payroll) || null;
  }, [selectedTipeKomponen, tipeKomponenData]);

  const filteredData = useMemo(() => {
    const normalizedSearch = normalizeTextLower(searchQuery);

    return tipeKomponenData.filter((item) => {
      if (statusFilter === 'ACTIVE' && item.deleted_at) return false;
      if (statusFilter === 'DELETED' && !item.deleted_at) return false;

      if (normalizedSearch && !buildSearchText(item).includes(normalizedSearch)) {
        return false;
      }

      return true;
    });
  }, [searchQuery, statusFilter, tipeKomponenData]);

  const statistics = useMemo(() => {
    const total = tipeKomponenData.length;
    const aktif = tipeKomponenData.filter((item) => !item.deleted_at).length;
    const terhapus = tipeKomponenData.filter((item) => Boolean(item.deleted_at)).length;
    const totalReferensi = tipeKomponenData.reduce((sum, item) => sum + item.definisi_komponen_count, 0);

    return {
      total,
      aktif,
      terhapus,
      totalReferensi,
    };
  }, [tipeKomponenData]);

  const setFormValue = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(createInitialTipeKomponenPayrollForm());
  }, []);

  const reloadData = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const closeCreateModal = useCallback(() => {
    if (isSubmitting) return;

    setIsCreateModalOpen(false);
    resetForm();
  }, [isSubmitting, resetForm]);

  const closeEditModal = useCallback(() => {
    if (isSubmitting || isPreparingEdit) return;

    setIsEditModalOpen(false);
    setSelectedTipeKomponen(null);
    resetForm();
  }, [isPreparingEdit, isSubmitting, resetForm]);

  const closeDeleteDialog = useCallback(() => {
    if (isSubmitting) return;

    setIsDeleteDialogOpen(false);
    setSelectedTipeKomponen(null);
  }, [isSubmitting]);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedTipeKomponen(null);
    setIsDetailLoading(false);
  }, []);

  const openCreateModal = useCallback(() => {
    setSelectedTipeKomponen(null);
    resetForm();
    setIsCreateModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback(
    async (item) => {
      if (!item?.id_tipe_komponen_payroll || isPreparingEdit || isSubmitting) return;

      const normalizedItem = normalizeTipeKomponenPayrollItem(item);

      setSelectedTipeKomponen(normalizedItem);
      setFormData(createTipeKomponenPayrollFormData(normalizedItem));
      setIsEditModalOpen(true);
      setIsPreparingEdit(true);

      try {
        const freshItem = await fetchTipeKomponenPayrollById(item.id_tipe_komponen_payroll);

        if (!freshItem) {
          AppMessage.warning('Data tipe komponen payroll tidak ditemukan.');
          setIsEditModalOpen(false);
          setSelectedTipeKomponen(null);
          resetForm();
          return;
        }

        setSelectedTipeKomponen(freshItem);
        setFormData(createTipeKomponenPayrollFormData(freshItem));
      } catch (err) {
        setIsEditModalOpen(false);
        setSelectedTipeKomponen(null);
        resetForm();
        AppMessage.error(err?.message || 'Gagal memuat data tipe komponen payroll.');
      } finally {
        setIsPreparingEdit(false);
      }
    },
    [isPreparingEdit, isSubmitting, resetForm],
  );

  const openDetailModal = useCallback(async (item) => {
    if (!item?.id_tipe_komponen_payroll) return;

    const normalizedItem = normalizeTipeKomponenPayrollItem(item);

    setSelectedTipeKomponen(normalizedItem);
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);

    try {
      const freshItem = await fetchTipeKomponenPayrollById(item.id_tipe_komponen_payroll);

      if (freshItem) {
        setSelectedTipeKomponen(freshItem);
      }
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memuat detail tipe komponen payroll.');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const openDeleteDialog = useCallback(
    (item) => {
      if (!item?.id_tipe_komponen_payroll || isSubmitting) return;

      setSelectedTipeKomponen(normalizeTipeKomponenPayrollItem(item));
      setIsDeleteDialogOpen(true);
    },
    [isSubmitting],
  );

  const validateForm = useCallback(() => {
    const namaTipeKomponen = normalizeText(formData.nama_tipe_komponen);

    if (!namaTipeKomponen) {
      AppMessage.warning('Nama tipe komponen wajib diisi.');
      return false;
    }

    if (namaTipeKomponen.length > 100) {
      AppMessage.warning('Nama tipe komponen maksimal 100 karakter.');
      return false;
    }

    return true;
  }, [formData.nama_tipe_komponen]);

  const handleCreate = useCallback(async () => {
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.post(ApiEndpoints.CreateTipeKomponenPayroll(), buildPayload(formData));

      await mutate();
      setIsCreateModalOpen(false);
      resetForm();
      AppMessage.success(response?.message || 'Tipe komponen payroll berhasil ditambahkan.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menambahkan tipe komponen payroll.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, mutate, resetForm, validateForm]);

  const handleEdit = useCallback(async () => {
    if (isSubmitting) return;

    if (!resolvedSelectedTipeKomponen?.id_tipe_komponen_payroll) {
      AppMessage.warning('Data tipe komponen payroll tidak ditemukan.');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.put(ApiEndpoints.UpdateTipeKomponenPayroll(resolvedSelectedTipeKomponen.id_tipe_komponen_payroll), buildPayload(formData));

      await mutate();
      setIsEditModalOpen(false);
      setSelectedTipeKomponen(null);
      resetForm();
      AppMessage.success(response?.message || 'Tipe komponen payroll berhasil diperbarui.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memperbarui tipe komponen payroll.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, mutate, resetForm, resolvedSelectedTipeKomponen, validateForm]);

  const handleDelete = useCallback(async () => {
    if (isSubmitting) return;

    if (!resolvedSelectedTipeKomponen?.id_tipe_komponen_payroll) {
      AppMessage.warning('Data tipe komponen payroll tidak ditemukan.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.delete(ApiEndpoints.DeleteTipeKomponenPayroll(resolvedSelectedTipeKomponen.id_tipe_komponen_payroll));

      await mutate();
      setIsDeleteDialogOpen(false);
      setIsDetailModalOpen(false);
      setSelectedTipeKomponen(null);
      AppMessage.success(response?.message || 'Tipe komponen payroll berhasil dihapus.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menghapus tipe komponen payroll.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, mutate, resolvedSelectedTipeKomponen]);

  return {
    tipeKomponenData,
    filteredData,
    statistics,

    formData,
    selectedTipeKomponen: resolvedSelectedTipeKomponen,
    searchQuery,
    statusFilter,

    error,
    loading: isLoading,
    validating: isValidating,
    isSubmitting,
    isPreparingEdit,
    isDetailLoading,

    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isDetailModalOpen,

    setSearchQuery,
    setStatusFilter,
    setFormValue,
    resetForm,
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

    formatDateTime,
  };
}
