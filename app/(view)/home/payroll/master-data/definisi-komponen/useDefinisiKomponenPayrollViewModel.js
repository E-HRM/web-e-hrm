'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { crudServiceAuth } from '@/app/utils/services/crudServiceAuth';
import { ApiEndpoints } from '@/constrainst/endpoints';

import {
  createDefinisiKomponenPayrollFormData,
  createInitialDefinisiKomponenPayrollForm,
  formatDateTime,
  formatKomponenLabel,
  normalizeDefinisiKomponenPayrollItem,
  normalizeText,
  normalizeUppercaseText,
} from './utils/definisiKomponenPayroll.utils';

const FETCH_PAGE_SIZE = 100;
const SWR_KEY = 'payroll:definisi-komponen-payroll:list';
const TIPE_KOMPONEN_SWR_KEY = 'payroll:tipe-komponen-payroll:active-options';

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

async function fetchAllDefinisiKomponenPayroll() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetDefinisiKomponenPayroll({
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: 'created_at',
        sort: 'desc',
      }),
    ),
  );
}

async function fetchActiveTipeKomponenPayroll() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetTipeKomponenPayroll({
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: 'nama_tipe_komponen',
        sort: 'asc',
      }),
    ),
  );
}

async function fetchDefinisiKomponenPayrollById(id) {
  const response = await crudServiceAuth.get(ApiEndpoints.GetDefinisiKomponenPayrollById(id));
  return normalizeDefinisiKomponenPayrollItem(response?.data || null);
}

function buildDefinisiKomponenPayload(formData) {
  return {
    id_tipe_komponen_payroll: normalizeText(formData?.id_tipe_komponen_payroll),
    nama_komponen: normalizeText(formData?.nama_komponen),
    arah_komponen: normalizeUppercaseText(formData?.arah_komponen || 'PEMASUKAN'),
    kena_pajak_default: Boolean(formData?.kena_pajak_default),
    berulang_default: Boolean(formData?.berulang_default),
    aktif: Boolean(formData?.aktif),
    catatan: normalizeText(formData?.catatan) || null,
  };
}

function normalizeTipeKomponenOption(item) {
  if (!item) return null;

  const id = normalizeText(item.id_tipe_komponen_payroll);
  const nama = normalizeText(item.nama_tipe_komponen);

  if (!id || !nama) return null;

  return {
    id_tipe_komponen_payroll: id,
    nama_tipe_komponen: nama,
    deleted_at: item.deleted_at || null,
  };
}

export default function useDefinisiKomponenPayrollViewModel() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [selectedKomponen, setSelectedKomponen] = useState(null);
  const [formData, setFormData] = useState(createInitialDefinisiKomponenPayrollForm());
  const [quickAddFormData, setQuickAddFormData] = useState({ nama_tipe_komponen: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingQuickAdd, setIsSubmittingQuickAdd] = useState(false);
  const [isPreparingEdit, setIsPreparingEdit] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const { data, error, isLoading, isValidating, mutate } = useSWR(SWR_KEY, fetchAllDefinisiKomponenPayroll, {
    revalidateOnFocus: false,
  });

  const {
    data: tipeKomponenDataRaw,
    error: tipeKomponenError,
    isLoading: isTipeKomponenLoading,
    isValidating: isTipeKomponenValidating,
    mutate: mutateTipeKomponen,
  } = useSWR(TIPE_KOMPONEN_SWR_KEY, fetchActiveTipeKomponenPayroll, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!error) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'definisi-komponen-payroll-fetch-error',
      content: error?.message || 'Gagal memuat definisi komponen payroll.',
    });
  }, [error]);

  useEffect(() => {
    if (!tipeKomponenError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'tipe-komponen-payroll-options-fetch-error',
      content: tipeKomponenError?.message || 'Gagal memuat opsi tipe komponen payroll.',
    });
  }, [tipeKomponenError]);

  const komponenData = useMemo(() => {
    const rawData = Array.isArray(data) ? data : [];
    return rawData.map(normalizeDefinisiKomponenPayrollItem).filter(Boolean);
  }, [data]);

  const tipeKomponenOptions = useMemo(() => {
    const rawData = Array.isArray(tipeKomponenDataRaw) ? tipeKomponenDataRaw : [];
    return rawData.map(normalizeTipeKomponenOption).filter((item) => item && !item.deleted_at);
  }, [tipeKomponenDataRaw]);

  const resolvedSelectedKomponen = useMemo(() => {
    if (!selectedKomponen) return null;

    return normalizeDefinisiKomponenPayrollItem(selectedKomponen) || komponenData.find((item) => item.id_definisi_komponen_payroll === selectedKomponen.id_definisi_komponen_payroll) || null;
  }, [komponenData, selectedKomponen]);

  const setFormValue = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const setQuickAddFormValue = useCallback((field, value) => {
    setQuickAddFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(createInitialDefinisiKomponenPayrollForm());
  }, []);

  const resetQuickAddForm = useCallback(() => {
    setQuickAddFormData({ nama_tipe_komponen: '' });
  }, []);

  const reloadData = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const closeCreateModal = useCallback(() => {
    if (isSubmitting || isSubmittingQuickAdd) return;

    setIsCreateModalOpen(false);
    resetForm();
    setIsQuickAddModalOpen(false);
    resetQuickAddForm();
  }, [isSubmitting, isSubmittingQuickAdd, resetForm, resetQuickAddForm]);

  const closeEditModal = useCallback(() => {
    if (isSubmitting || isPreparingEdit || isSubmittingQuickAdd) return;

    setIsEditModalOpen(false);
    setSelectedKomponen(null);
    resetForm();
    setIsQuickAddModalOpen(false);
    resetQuickAddForm();
  }, [isPreparingEdit, isSubmitting, isSubmittingQuickAdd, resetForm, resetQuickAddForm]);

  const closeDeleteDialog = useCallback(() => {
    if (isSubmitting) return;

    setIsDeleteDialogOpen(false);
    setSelectedKomponen(null);
  }, [isSubmitting]);

  const closeDetailModal = useCallback(() => {
    if (isSubmitting) return;

    setIsDetailModalOpen(false);
    setSelectedKomponen(null);
    setIsDetailLoading(false);
  }, [isSubmitting]);

  const openQuickAddModal = useCallback(() => {
    if (isSubmitting || isPreparingEdit) return;

    resetQuickAddForm();
    setIsQuickAddModalOpen(true);
  }, [isPreparingEdit, isSubmitting, resetQuickAddForm]);

  const closeQuickAddModal = useCallback(() => {
    if (isSubmittingQuickAdd) return;

    setIsQuickAddModalOpen(false);
    resetQuickAddForm();
  }, [isSubmittingQuickAdd, resetQuickAddForm]);

  const openCreateModal = useCallback(() => {
    setSelectedKomponen(null);
    resetForm();
    resetQuickAddForm();
    setIsQuickAddModalOpen(false);
    setIsCreateModalOpen(true);
  }, [resetForm, resetQuickAddForm]);

  const openEditModal = useCallback(
    async (komponen) => {
      if (!komponen?.id_definisi_komponen_payroll || isPreparingEdit || isSubmitting) return;

      const normalizedKomponen = normalizeDefinisiKomponenPayrollItem(komponen);

      setSelectedKomponen(normalizedKomponen);
      setFormData(createDefinisiKomponenPayrollFormData(normalizedKomponen));
      setIsEditModalOpen(true);
      setIsQuickAddModalOpen(false);
      resetQuickAddForm();
      setIsPreparingEdit(true);

      try {
        const freshKomponen = await fetchDefinisiKomponenPayrollById(komponen.id_definisi_komponen_payroll);

        if (!freshKomponen) {
          AppMessage.warning('Data definisi komponen payroll tidak ditemukan.');
          setIsEditModalOpen(false);
          setSelectedKomponen(null);
          resetForm();
          return;
        }

        setSelectedKomponen(freshKomponen);
        setFormData(createDefinisiKomponenPayrollFormData(freshKomponen));
      } catch (err) {
        setIsEditModalOpen(false);
        setSelectedKomponen(null);
        resetForm();
        AppMessage.error(err?.message || 'Gagal memuat data definisi komponen payroll.');
      } finally {
        setIsPreparingEdit(false);
      }
    },
    [isPreparingEdit, isSubmitting, resetForm, resetQuickAddForm],
  );

  const openDetailModal = useCallback(async (komponen) => {
    if (!komponen?.id_definisi_komponen_payroll) return;

    const normalizedKomponen = normalizeDefinisiKomponenPayrollItem(komponen);

    setSelectedKomponen(normalizedKomponen);
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);

    try {
      const freshKomponen = await fetchDefinisiKomponenPayrollById(komponen.id_definisi_komponen_payroll);

      if (freshKomponen) {
        setSelectedKomponen(freshKomponen);
      }
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memuat detail definisi komponen payroll.');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const openDeleteDialog = useCallback(
    (komponen) => {
      if (!komponen?.id_definisi_komponen_payroll || isSubmitting) return;

      setSelectedKomponen(normalizeDefinisiKomponenPayrollItem(komponen));
      setIsDeleteDialogOpen(true);
    },
    [isSubmitting],
  );

  const validateForm = useCallback(() => {
    const idTipeKomponenPayroll = normalizeText(formData.id_tipe_komponen_payroll);
    const namaKomponen = normalizeText(formData.nama_komponen);
    const arahKomponen = normalizeUppercaseText(formData.arah_komponen);

    if (!idTipeKomponenPayroll) {
      AppMessage.warning('Tipe komponen wajib dipilih.');
      return false;
    }

    if (!namaKomponen) {
      AppMessage.warning('Nama komponen wajib diisi.');
      return false;
    }

    if (namaKomponen.length > 255) {
      AppMessage.warning('Nama komponen maksimal 255 karakter.');
      return false;
    }

    if (!arahKomponen) {
      AppMessage.warning('Arah komponen wajib dipilih.');
      return false;
    }

    return true;
  }, [formData]);

  const validateQuickAddForm = useCallback(() => {
    const namaTipeKomponen = normalizeText(quickAddFormData.nama_tipe_komponen);

    if (!namaTipeKomponen) {
      AppMessage.warning('Nama tipe komponen wajib diisi.');
      return false;
    }

    if (namaTipeKomponen.length > 100) {
      AppMessage.warning('Nama tipe komponen maksimal 100 karakter.');
      return false;
    }

    return true;
  }, [quickAddFormData.nama_tipe_komponen]);

  const handleCreate = useCallback(async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.post(ApiEndpoints.CreateDefinisiKomponenPayroll(), buildDefinisiKomponenPayload(formData));

      await mutate();
      setIsCreateModalOpen(false);
      resetForm();
      AppMessage.success(response?.message || 'Definisi komponen payroll berhasil ditambahkan.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menambahkan definisi komponen payroll.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, mutate, resetForm, validateForm]);

  const handleEdit = useCallback(async () => {
    if (isSubmitting) return;

    if (!resolvedSelectedKomponen?.id_definisi_komponen_payroll) {
      AppMessage.warning('Data definisi komponen payroll tidak ditemukan.');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.put(ApiEndpoints.UpdateDefinisiKomponenPayroll(resolvedSelectedKomponen.id_definisi_komponen_payroll), buildDefinisiKomponenPayload(formData));

      await mutate();
      setIsEditModalOpen(false);
      setSelectedKomponen(null);
      resetForm();
      AppMessage.success(response?.message || 'Definisi komponen payroll berhasil diperbarui.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memperbarui definisi komponen payroll.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, mutate, resetForm, resolvedSelectedKomponen, validateForm]);

  const handleDelete = useCallback(async () => {
    if (isSubmitting) return;

    if (!resolvedSelectedKomponen?.id_definisi_komponen_payroll) {
      AppMessage.warning('Data definisi komponen payroll tidak ditemukan.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.delete(ApiEndpoints.DeleteDefinisiKomponenPayroll(resolvedSelectedKomponen.id_definisi_komponen_payroll));

      await mutate();
      setIsDeleteDialogOpen(false);
      setIsDetailModalOpen(false);
      setSelectedKomponen(null);
      AppMessage.success(response?.message || 'Definisi komponen payroll berhasil dihapus.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menghapus definisi komponen payroll.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, mutate, resolvedSelectedKomponen]);

  const handleQuickAddTipeKomponen = useCallback(async () => {
    if (isSubmittingQuickAdd) return;
    if (!validateQuickAddForm()) return;

    setIsSubmittingQuickAdd(true);

    try {
      const response = await crudServiceAuth.post(ApiEndpoints.CreateTipeKomponenPayroll(), {
        nama_tipe_komponen: normalizeText(quickAddFormData.nama_tipe_komponen),
      });

      const createdItem = normalizeTipeKomponenOption(response?.data);

      await mutateTipeKomponen();

      if (createdItem?.id_tipe_komponen_payroll) {
        setFormValue('id_tipe_komponen_payroll', createdItem.id_tipe_komponen_payroll);
      }

      setIsQuickAddModalOpen(false);
      resetQuickAddForm();
      AppMessage.success(response?.message || 'Tipe komponen payroll berhasil ditambahkan.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menambahkan tipe komponen payroll.');
    } finally {
      setIsSubmittingQuickAdd(false);
    }
  }, [isSubmittingQuickAdd, mutateTipeKomponen, quickAddFormData.nama_tipe_komponen, resetQuickAddForm, setFormValue, validateQuickAddForm]);

  const kompPendapatan = useMemo(() => komponenData.filter((item) => item.arah_komponen === 'PEMASUKAN'), [komponenData]);

  const kompPotongan = useMemo(() => komponenData.filter((item) => item.arah_komponen === 'POTONGAN'), [komponenData]);

  const kompAktif = useMemo(() => komponenData.filter((item) => item.aktif).length, [komponenData]);

  const kompBerulang = useMemo(() => komponenData.filter((item) => item.berulang_default).length, [komponenData]);

  return {
    komponenData,
    kompPendapatan,
    kompPotongan,
    kompAktif,
    kompBerulang,

    formData,
    quickAddFormData,
    tipeKomponenOptions,
    selectedKomponen: resolvedSelectedKomponen,

    error,
    loading: isLoading,
    validating: isValidating,
    isSubmitting,
    isPreparingEdit,
    isDetailLoading,

    tipeKomponenError,
    isTipeKomponenLoading,
    isTipeKomponenValidating,
    isSubmittingQuickAdd,

    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isDetailModalOpen,
    isQuickAddModalOpen,

    setFormValue,
    setQuickAddFormValue,
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

    openQuickAddModal,
    closeQuickAddModal,
    handleQuickAddTipeKomponen,

    formatDateTime,
    formatKomponenLabel,
  };
}
