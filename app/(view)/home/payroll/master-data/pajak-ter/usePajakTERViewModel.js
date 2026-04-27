// app/(view)/home/payroll/pajak-ter/usePajakTERViewModel.js
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { crudServiceAuth } from '@/app/utils/services/crudServiceAuth';
import { ApiEndpoints } from '@/constrainst/endpoints';

import {
  buildTarifSearchText,
  compareKodeKategoriPajak,
  createInitialTarifPajakTERForm,
  createTarifFormData,
  formatCurrency,
  formatDate,
  formatKodeKategoriPajak,
  formatIncomeRange,
  formatPercent,
  normalizeDecimalInput,
  normalizeTarifTERItem,
  toDateInputValue,
  toNullableNumber,
} from './utils/tarifTERUtils';

const FETCH_PAGE_SIZE = 100;
const SWR_KEY = 'payroll:tarif-pajak-ter:list';

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getDateTimestamp(value) {
  const normalized = toDateInputValue(value);
  if (!normalized) return null;

  const time = new Date(`${normalized}T00:00:00`).getTime();
  return Number.isNaN(time) ? null : time;
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

async function fetchAllTarifPajakTER() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetTarifPajakTER({
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: 'kode_kategori_pajak',
        sort: 'asc',
      }),
    ),
  );
}

async function fetchTarifPajakTERById(id) {
  const response = await crudServiceAuth.get(ApiEndpoints.GetTarifPajakTERById(id));
  return normalizeTarifTERItem(response?.data || null);
}

export default function usePajakTERViewModel() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTarif, setSelectedTarif] = useState(null);
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(createInitialTarifPajakTERForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingEdit, setIsPreparingEdit] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const { data, error, isLoading, isValidating, mutate } = useSWR(SWR_KEY, fetchAllTarifPajakTER, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!error) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'pajak-ter-fetch-error',
      content: error?.message || 'Gagal memuat data tarif pajak TER.',
    });
  }, [error]);

  const tarifData = useMemo(() => {
    const rawData = Array.isArray(data) ? data : [];
    return rawData.map(normalizeTarifTERItem).filter(Boolean);
  }, [data]);

  const kategoriPajakOptions = useMemo(() => {
    const availableValues = Array.from(new Set(tarifData.map((item) => item.kode_kategori_pajak).filter(Boolean))).sort(compareKodeKategoriPajak);

    return [
      { value: 'ALL', label: 'Semua Kode Kategori Pajak' },
      ...availableValues.map((value) => ({
        value,
        label: formatKodeKategoriPajak(value),
      })),
    ];
  }, [tarifData]);

  const resolvedSelectedTarif = useMemo(() => {
    if (!selectedTarif) return null;

    return normalizeTarifTERItem(selectedTarif) || tarifData.find((item) => item.id_tarif_pajak_ter === selectedTarif.id_tarif_pajak_ter) || null;
  }, [selectedTarif, tarifData]);

  const setFormValue = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(createInitialTarifPajakTERForm());
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
    setSelectedTarif(null);
    resetForm();
  }, [isPreparingEdit, isSubmitting, resetForm]);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedTarif(null);
    setIsDetailLoading(false);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    if (isSubmitting) return;

    setIsDeleteDialogOpen(false);
    setSelectedTarif(null);
  }, [isSubmitting]);

  const openCreateModal = useCallback(() => {
    setSelectedTarif(null);
    resetForm();
    setIsCreateModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback(
    async (tarif) => {
      if (!tarif?.id_tarif_pajak_ter || isPreparingEdit || isSubmitting) return;

      const normalizedTarif = normalizeTarifTERItem(tarif);

      setSelectedTarif(normalizedTarif);
      setFormData(createTarifFormData(normalizedTarif));
      setIsEditModalOpen(true);
      setIsPreparingEdit(true);

      try {
        const freshTarif = await fetchTarifPajakTERById(tarif.id_tarif_pajak_ter);

        if (!freshTarif) {
          AppMessage.warning('Data tarif tidak ditemukan.');
          setIsEditModalOpen(false);
          setSelectedTarif(null);
          resetForm();
          return;
        }

        setSelectedTarif(freshTarif);
        setFormData(createTarifFormData(freshTarif));
      } catch (err) {
        setIsEditModalOpen(false);
        setSelectedTarif(null);
        resetForm();
        AppMessage.error(err?.message || 'Gagal memuat data tarif pajak TER.');
      } finally {
        setIsPreparingEdit(false);
      }
    },
    [isPreparingEdit, isSubmitting, resetForm],
  );

  const openDetailModal = useCallback(async (tarif) => {
    if (!tarif?.id_tarif_pajak_ter) return;

    const normalizedTarif = normalizeTarifTERItem(tarif);

    setSelectedTarif(normalizedTarif);
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);

    try {
      const freshTarif = await fetchTarifPajakTERById(tarif.id_tarif_pajak_ter);

      if (freshTarif) {
        setSelectedTarif(freshTarif);
      }
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memuat detail tarif pajak TER.');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const openDeleteDialog = useCallback((tarif) => {
    if (!tarif?.id_tarif_pajak_ter) return;

    setSelectedTarif(normalizeTarifTERItem(tarif));
    setIsDeleteDialogOpen(true);
  }, []);

  const validateForm = useCallback(() => {
    const kodeKategoriPajak = String(formData.kode_kategori_pajak || '')
      .trim()
      .toUpperCase();
    const penghasilanDari = toNullableNumber(formData.penghasilan_dari);
    const penghasilanSampai = toNullableNumber(formData.penghasilan_sampai);
    const persenTarif = toNullableNumber(formData.persen_tarif);
    const berlakuMulai = toDateInputValue(formData.berlaku_mulai);
    const berlakuSampai = toDateInputValue(formData.berlaku_sampai);
    const berlakuMulaiTs = getDateTimestamp(berlakuMulai);
    const berlakuSampaiTs = getDateTimestamp(berlakuSampai);

    if (!kodeKategoriPajak) {
      AppMessage.warning('Kode kategori pajak wajib diisi.');
      return false;
    }

    if (penghasilanDari === null) {
      AppMessage.warning('Penghasilan dari wajib diisi.');
      return false;
    }

    if (penghasilanDari < 0) {
      AppMessage.warning('Penghasilan dari tidak boleh kurang dari 0.');
      return false;
    }

    if (penghasilanSampai !== null && penghasilanSampai < penghasilanDari) {
      AppMessage.warning('Penghasilan sampai harus lebih besar atau sama dengan penghasilan dari.');
      return false;
    }

    if (persenTarif === null) {
      AppMessage.warning('Persentase tarif wajib diisi.');
      return false;
    }

    if (persenTarif < 0) {
      AppMessage.warning('Persentase tarif tidak boleh kurang dari 0.');
      return false;
    }

    if (persenTarif > 100) {
      AppMessage.warning('Persentase tarif tidak boleh lebih besar dari 100.');
      return false;
    }

    if (!berlakuMulai) {
      AppMessage.warning('Tanggal berlaku mulai wajib diisi.');
      return false;
    }

    if (berlakuSampai && berlakuMulaiTs !== null && berlakuSampaiTs !== null && berlakuSampaiTs < berlakuMulaiTs) {
      AppMessage.warning('Tanggal berlaku sampai harus setelah atau sama dengan berlaku mulai.');
      return false;
    }

    return true;
  }, [formData]);

  const buildPayload = useCallback(() => {
    return {
      kode_kategori_pajak: String(formData.kode_kategori_pajak || '').trim(),
      penghasilan_dari: normalizeDecimalInput(formData.penghasilan_dari, { fallback: '0' }),
      penghasilan_sampai: normalizeDecimalInput(formData.penghasilan_sampai, { allowNull: true }),
      persen_tarif: normalizeDecimalInput(formData.persen_tarif, { fallback: '0' }),
      berlaku_mulai: toDateInputValue(formData.berlaku_mulai),
      berlaku_sampai: toDateInputValue(formData.berlaku_sampai) || null,
    };
  }, [formData]);

  const handleCreate = useCallback(async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await crudServiceAuth.post(ApiEndpoints.CreateTarifPajakTER(), buildPayload());

      await mutate();
      setIsCreateModalOpen(false);
      resetForm();
      AppMessage.success('Tarif pajak TER berhasil ditambahkan.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menambahkan tarif pajak TER.');
    } finally {
      setIsSubmitting(false);
    }
  }, [buildPayload, isSubmitting, mutate, resetForm, validateForm]);

  const handleEdit = useCallback(async () => {
    if (isSubmitting) return;

    if (!resolvedSelectedTarif?.id_tarif_pajak_ter) {
      AppMessage.warning('Data tarif tidak ditemukan.');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await crudServiceAuth.put(ApiEndpoints.UpdateTarifPajakTER(resolvedSelectedTarif.id_tarif_pajak_ter), buildPayload());

      await mutate();
      setIsEditModalOpen(false);
      setSelectedTarif(null);
      resetForm();
      AppMessage.success('Tarif pajak TER berhasil diperbarui.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memperbarui tarif pajak TER.');
    } finally {
      setIsSubmitting(false);
    }
  }, [buildPayload, isSubmitting, mutate, resetForm, resolvedSelectedTarif, validateForm]);

  const handleDelete = useCallback(async () => {
    if (isSubmitting) return;

    if (!resolvedSelectedTarif?.id_tarif_pajak_ter) {
      AppMessage.warning('Data tarif tidak ditemukan.');
      return;
    }

    setIsSubmitting(true);

    try {
      await crudServiceAuth.delete(ApiEndpoints.DeleteTarifPajakTER(resolvedSelectedTarif.id_tarif_pajak_ter));

      await mutate();
      setIsDeleteDialogOpen(false);
      setIsDetailModalOpen(false);
      setSelectedTarif(null);
      AppMessage.success('Tarif pajak TER berhasil dihapus.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menghapus tarif pajak TER.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, mutate, resolvedSelectedTarif]);

  const filteredData = useMemo(() => {
    const search = normalizeText(searchQuery);

    return tarifData.filter((tarif) => {
      const matchKategori = filterKategori === 'ALL' ? true : tarif.kode_kategori_pajak === filterKategori;
      const matchSearch = !search || buildTarifSearchText(tarif).includes(search);

      return matchKategori && matchSearch;
    });
  }, [filterKategori, searchQuery, tarifData]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (a.kode_kategori_pajak !== b.kode_kategori_pajak) {
        return compareKodeKategoriPajak(a.kode_kategori_pajak, b.kode_kategori_pajak);
      }

      if (a.penghasilan_dari_number !== b.penghasilan_dari_number) {
        return a.penghasilan_dari_number - b.penghasilan_dari_number;
      }

      const startA = getDateTimestamp(a.berlaku_mulai) || 0;
      const startB = getDateTimestamp(b.berlaku_mulai) || 0;

      if (startA !== startB) {
        return startA - startB;
      }

      return a.persen_tarif_number - b.persen_tarif_number;
    });
  }, [filteredData]);

  const statistics = useMemo(() => {
    const today = getDateTimestamp(new Date());
    const uniqueKategori = new Set(tarifData.map((item) => item.kode_kategori_pajak).filter(Boolean));

    return {
      totalTarif: tarifData.length,
      totalKategoriPajak: uniqueKategori.size,
      tarifAktifHariIni: tarifData.filter((item) => {
        const mulai = getDateTimestamp(item.berlaku_mulai);
        const sampai = getDateTimestamp(item.berlaku_sampai);

        if (mulai === null || today === null) return false;

        return mulai <= today && (sampai === null || sampai >= today);
      }).length,
      tarifTanpaBatasAkhir: tarifData.filter((item) => !item.berlaku_sampai).length,
    };
  }, [tarifData]);

  return {
    tarifData,
    selectedTarif: resolvedSelectedTarif,
    formData,
    filterKategori,
    searchQuery,
    sortedData,
    statistics,
    kategoriPajakOptions,
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

    formatCurrency,
    formatDate,
    formatIncomeRange,
    formatKodeKategoriPajak,
    formatPercent,

    setFormValue,
    resetForm,
    setFilterKategori,
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
