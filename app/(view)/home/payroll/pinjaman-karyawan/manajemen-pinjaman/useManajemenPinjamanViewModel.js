'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { crudServiceAuth } from '@/app/utils/services/crudServiceAuth';
import { ApiEndpoints } from '@/constrainst/endpoints';

import { STATUS_PINJAMAN, calculateNominalCicilan, createInitialPinjamanForm, formatCurrency, formatDate, toDateInputValue, toNumber } from './utils/utils';

const FETCH_PAGE_SIZE = 100;
const PINJAMAN_SWR_KEY = 'payroll:pinjaman-karyawan:list';
const USERS_SWR_KEY = 'payroll:pinjaman-karyawan:users';

function buildUrlWithQuery(baseUrl, query = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    const normalized = String(value).trim();
    if (!normalized) return;

    params.set(key, normalized);
  });

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

function buildPinjamanEndpoint(query = {}) {
  return buildUrlWithQuery('/api/admin/pinjaman-karyawan', query);
}

function buildPinjamanByIdEndpoint(id) {
  return `/api/admin/pinjaman-karyawan/${id}`;
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeSearchText(value) {
  return normalizeText(value).toLowerCase();
}

function getUserDisplayName(user) {
  return normalizeText(user?.nama_pengguna || user?.nama || user?.name || user?.email || user?.id_user) || '-';
}

function getUserIdentity(user) {
  return normalizeText(user?.nomor_induk_karyawan || user?.email || user?.id_user) || '-';
}

function getUserDepartment(user) {
  return normalizeText(user?.departement?.nama_departement || user?.divisi);
}

function getUserRoleOrJob(user) {
  return normalizeText(user?.jabatan?.nama_jabatan || user?.role);
}

function getUserPhoto(user) {
  const raw = normalizeText(user?.foto_profil_user);
  return raw || null;
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

async function fetchAllPinjaman() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      buildPinjamanEndpoint({
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: 'created_at',
        sort: 'desc',
      }),
    ),
  );
}

async function fetchAllUsers() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      buildUrlWithQuery(ApiEndpoints.GetUsers, {
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: 'nama_pengguna',
        sort: 'asc',
      }),
    ),
  );
}

function calculateProgress(pinjaman) {
  const total = toNumber(pinjaman?.nominal_pinjaman);
  const sisa = toNumber(pinjaman?.sisa_saldo);

  if (total <= 0) return 0;

  const paid = total - sisa;
  const progress = (paid / total) * 100;

  if (progress < 0) return 0;
  if (progress > 100) return 100;
  return progress;
}

function canDeletePinjamanItem(pinjaman) {
  const status = normalizeText(pinjaman?.status_pinjaman).toUpperCase();
  return status === STATUS_PINJAMAN.DRAFT || status === STATUS_PINJAMAN.DIBATALKAN;
}

function normalizePinjamanItem(item, usersMap) {
  if (!item) return null;

  const id = normalizeText(item.id_pinjaman_karyawan);
  if (!id) return null;

  const fallbackUser = usersMap.get(String(item.id_user || '')) || null;
  const user = item.user || fallbackUser || null;
  const tenorBulan = Math.trunc(toNumber(item.tenor_bulan));
  const nominalCicilan = item.nominal_cicilan !== undefined && item.nominal_cicilan !== null ? toNumber(item.nominal_cicilan) : calculateNominalCicilan(item.nominal_pinjaman, tenorBulan);

  return {
    ...item,
    id_pinjaman_karyawan: id,
    id_user: normalizeText(item.id_user),
    nama_pinjaman: normalizeText(item.nama_pinjaman),
    nominal_pinjaman: toNumber(item.nominal_pinjaman),
    tenor_bulan: tenorBulan,
    nominal_cicilan: nominalCicilan,
    sisa_saldo: toNumber(item.sisa_saldo),
    tanggal_mulai: item.tanggal_mulai || null,
    tanggal_selesai: item.tanggal_selesai || null,
    status_pinjaman: normalizeText(item.status_pinjaman).toUpperCase() || STATUS_PINJAMAN.DRAFT,
    catatan: normalizeText(item.catatan),
    created_at: item.created_at || null,
    updated_at: item.updated_at || null,
    deleted_at: item.deleted_at || null,
    jumlah_cicilan: Number(item?._count?.cicilan || 0),
    user,
    user_display_name: getUserDisplayName(user),
    user_identity: getUserIdentity(user),
    user_department: getUserDepartment(user),
    user_role_or_job: getUserRoleOrJob(user),
    foto_profil_user: getUserPhoto(user),
  };
}

export default function useManajemenPinjamanViewModel() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPinjaman, setSelectedPinjaman] = useState(null);
  const [formData, setFormData] = useState(createInitialPinjamanForm());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: pinjamanResponse,
    error: pinjamanError,
    isLoading: isPinjamanLoading,
    isValidating: isPinjamanValidating,
    mutate: mutatePinjaman,
  } = useSWR(PINJAMAN_SWR_KEY, fetchAllPinjaman, {
    revalidateOnFocus: false,
  });

  const {
    data: usersResponse,
    error: usersError,
    isLoading: isUsersLoading,
    isValidating: isUsersValidating,
    mutate: mutateUsers,
  } = useSWR(USERS_SWR_KEY, fetchAllUsers, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!pinjamanError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'pinjaman-karyawan-fetch-error',
      content: pinjamanError?.message || 'Gagal memuat data pinjaman karyawan.',
    });
  }, [pinjamanError]);

  useEffect(() => {
    if (!usersError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'pinjaman-karyawan-users-fetch-error',
      content: usersError?.message || 'Gagal memuat data karyawan.',
    });
  }, [usersError]);

  const usersData = useMemo(() => (Array.isArray(usersResponse) ? usersResponse : []), [usersResponse]);

  const usersMap = useMemo(() => {
    return new Map(usersData.map((user) => [String(user.id_user), user]));
  }, [usersData]);

  const pinjamanData = useMemo(() => {
    const rawData = Array.isArray(pinjamanResponse) ? pinjamanResponse : [];

    return rawData.map((item) => normalizePinjamanItem(item, usersMap)).filter(Boolean);
  }, [pinjamanResponse, usersMap]);

  const resolvedSelectedPinjaman = useMemo(() => {
    if (!selectedPinjaman) return null;

    return pinjamanData.find((item) => item.id_pinjaman_karyawan === selectedPinjaman.id_pinjaman_karyawan) || selectedPinjaman;
  }, [pinjamanData, selectedPinjaman]);

  const selectedFormUser = useMemo(() => {
    if (!formData.id_user) return resolvedSelectedPinjaman?.user || null;

    return usersMap.get(String(formData.id_user)) || resolvedSelectedPinjaman?.user || null;
  }, [formData.id_user, resolvedSelectedPinjaman, usersMap]);

  const availableUsers = useMemo(() => {
    return usersData.filter((user) => !user?.deleted_at);
  }, [usersData]);

  const setFormValue = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(createInitialPinjamanForm());
  }, []);

  const reloadData = useCallback(async () => {
    await Promise.all([mutatePinjaman(), mutateUsers()]);
  }, [mutatePinjaman, mutateUsers]);

  const closeCreateModal = useCallback(() => {
    if (isSubmitting) return;

    setIsCreateModalOpen(false);
    resetForm();
  }, [isSubmitting, resetForm]);

  const closeEditModal = useCallback(() => {
    if (isSubmitting) return;

    setIsEditModalOpen(false);
    setSelectedPinjaman(null);
    resetForm();
  }, [isSubmitting, resetForm]);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedPinjaman(null);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    if (isSubmitting) return;

    setIsDeleteDialogOpen(false);
    setSelectedPinjaman(null);
  }, [isSubmitting]);

  const openCreateModal = useCallback(() => {
    setSelectedPinjaman(null);
    resetForm();
    setIsCreateModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback((pinjaman) => {
    if (!pinjaman) return;

    setSelectedPinjaman(pinjaman);
    setFormData({
      id_user: pinjaman.id_user || '',
      nama_pinjaman: pinjaman.nama_pinjaman || '',
      nominal_pinjaman: toNumber(pinjaman.nominal_pinjaman),
      tenor_bulan: Math.trunc(toNumber(pinjaman.tenor_bulan)),
      tanggal_mulai: toDateInputValue(pinjaman.tanggal_mulai),
      status_pinjaman: pinjaman.status_pinjaman === STATUS_PINJAMAN.LUNAS ? STATUS_PINJAMAN.AKTIF : pinjaman.status_pinjaman || STATUS_PINJAMAN.DRAFT,
      catatan: pinjaman.catatan || '',
    });
    setIsEditModalOpen(true);
  }, []);

  const openDetailModal = useCallback((pinjaman) => {
    if (!pinjaman) return;

    setSelectedPinjaman(pinjaman);
    setIsDetailModalOpen(true);
  }, []);

  const openDeleteDialog = useCallback((pinjaman) => {
    if (!pinjaman) return;

    if (!canDeletePinjamanItem(pinjaman)) {
      AppMessage.warning('Pinjaman hanya bisa dihapus jika masih Draft atau sudah Dibatalkan.');
      return;
    }

    setSelectedPinjaman(pinjaman);
    setIsDeleteDialogOpen(true);
  }, []);

  const duplicateNameForUser = useMemo(() => {
    const idUser = normalizeSearchText(formData.id_user);
    const namaPinjaman = normalizeSearchText(formData.nama_pinjaman);

    if (!idUser || !namaPinjaman) return false;

    return pinjamanData.some((item) => {
      if (resolvedSelectedPinjaman && item.id_pinjaman_karyawan === resolvedSelectedPinjaman.id_pinjaman_karyawan) {
        return false;
      }

      return normalizeSearchText(item.id_user) === idUser && normalizeSearchText(item.nama_pinjaman) === namaPinjaman;
    });
  }, [formData.id_user, formData.nama_pinjaman, pinjamanData, resolvedSelectedPinjaman]);

  const validateForm = useCallback(() => {
    if (!normalizeText(formData.id_user)) {
      AppMessage.warning('Karyawan wajib dipilih.');
      return false;
    }

    if (!normalizeText(formData.nama_pinjaman)) {
      AppMessage.warning('Nama pinjaman wajib diisi.');
      return false;
    }

    if (duplicateNameForUser) {
      AppMessage.warning('Nama pinjaman untuk karyawan ini sudah digunakan.');
      return false;
    }

    if (toNumber(formData.nominal_pinjaman) <= 0) {
      AppMessage.warning('Nominal pinjaman harus lebih dari 0.');
      return false;
    }

    const tenorBulan = toNumber(formData.tenor_bulan);
    if (!Number.isInteger(tenorBulan) || tenorBulan <= 0) {
      AppMessage.warning('Tenor bulan harus berupa angka bulat lebih dari 0.');
      return false;
    }

    if (!normalizeText(formData.tanggal_mulai)) {
      AppMessage.warning('Tanggal mulai wajib diisi.');
      return false;
    }

    if (!normalizeText(formData.status_pinjaman)) {
      AppMessage.warning('Status pinjaman wajib dipilih.');
      return false;
    }

    return true;
  }, [duplicateNameForUser, formData.id_user, formData.nama_pinjaman, formData.nominal_pinjaman, formData.status_pinjaman, formData.tanggal_mulai, formData.tenor_bulan]);

  const buildCreatePayload = useCallback(() => {
    return {
      id_user: normalizeText(formData.id_user),
      nama_pinjaman: normalizeText(formData.nama_pinjaman),
      nominal_pinjaman: toNumber(formData.nominal_pinjaman),
      tenor_bulan: Math.trunc(toNumber(formData.tenor_bulan)),
      tanggal_mulai: normalizeText(formData.tanggal_mulai),
      status_pinjaman: normalizeText(formData.status_pinjaman || STATUS_PINJAMAN.DRAFT).toUpperCase(),
      catatan: normalizeText(formData.catatan) || null,
    };
  }, [formData]);

  const buildEditPayload = useCallback(() => {
    if (!resolvedSelectedPinjaman) return null;

    return {
      id_user: normalizeText(formData.id_user || resolvedSelectedPinjaman.id_user),
      nama_pinjaman: normalizeText(formData.nama_pinjaman),
      nominal_pinjaman: toNumber(formData.nominal_pinjaman),
      tenor_bulan: Math.trunc(toNumber(formData.tenor_bulan)),
      tanggal_mulai: normalizeText(formData.tanggal_mulai),
      status_pinjaman: normalizeText(formData.status_pinjaman || STATUS_PINJAMAN.DRAFT).toUpperCase(),
      catatan: normalizeText(formData.catatan) || null,
    };
  }, [formData, resolvedSelectedPinjaman]);

  const handleCreate = useCallback(async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.post(buildPinjamanEndpoint(), buildCreatePayload());

      await mutatePinjaman();
      setIsCreateModalOpen(false);
      resetForm();
      AppMessage.success(response?.message || 'Pinjaman baru berhasil ditambahkan.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menambahkan pinjaman.');
    } finally {
      setIsSubmitting(false);
    }
  }, [buildCreatePayload, isSubmitting, mutatePinjaman, resetForm, validateForm]);

  const handleEdit = useCallback(async () => {
    if (isSubmitting) return;

    if (!resolvedSelectedPinjaman) {
      AppMessage.warning('Data pinjaman tidak ditemukan.');
      return;
    }

    if (!validateForm()) return;

    const payload = buildEditPayload();
    if (!payload) {
      AppMessage.warning('Data pinjaman belum lengkap atau tidak sesuai.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.put(buildPinjamanByIdEndpoint(resolvedSelectedPinjaman.id_pinjaman_karyawan), payload);

      await mutatePinjaman();
      setIsEditModalOpen(false);
      setSelectedPinjaman(null);
      resetForm();
      AppMessage.success(response?.message || 'Pinjaman berhasil diperbarui.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memperbarui pinjaman.');
    } finally {
      setIsSubmitting(false);
    }
  }, [buildEditPayload, isSubmitting, mutatePinjaman, resetForm, resolvedSelectedPinjaman, validateForm]);

  const handleDelete = useCallback(async () => {
    if (isSubmitting) return;

    if (!resolvedSelectedPinjaman) {
      AppMessage.warning('Data pinjaman tidak ditemukan.');
      return;
    }

    if (!canDeletePinjamanItem(resolvedSelectedPinjaman)) {
      AppMessage.warning('Pinjaman hanya bisa dihapus jika masih Draft atau sudah Dibatalkan.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.delete(buildPinjamanByIdEndpoint(resolvedSelectedPinjaman.id_pinjaman_karyawan));

      await mutatePinjaman();
      setIsDeleteDialogOpen(false);
      setIsDetailModalOpen(false);
      setSelectedPinjaman(null);
      AppMessage.success(response?.message || 'Pinjaman berhasil dihapus.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menghapus pinjaman.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, mutatePinjaman, resolvedSelectedPinjaman]);

  const pinjamanList = useMemo(() => {
    const statusWeight = {
      [STATUS_PINJAMAN.DRAFT]: 0,
      [STATUS_PINJAMAN.AKTIF]: 1,
      [STATUS_PINJAMAN.LUNAS]: 2,
      [STATUS_PINJAMAN.DIBATALKAN]: 3,
    };

    return [...pinjamanData].sort((a, b) => {
      const weightA = statusWeight[a.status_pinjaman] ?? 99;
      const weightB = statusWeight[b.status_pinjaman] ?? 99;

      if (weightA !== weightB) return weightA - weightB;

      const dateA = new Date(a.tanggal_mulai || 0).getTime();
      const dateB = new Date(b.tanggal_mulai || 0).getTime();

      return dateB - dateA;
    });
  }, [pinjamanData]);

  const totalAktifList = useMemo(() => pinjamanData.filter((item) => item.status_pinjaman === STATUS_PINJAMAN.AKTIF), [pinjamanData]);

  const totalAktif = useMemo(() => totalAktifList.length, [totalAktifList]);

  const totalNominalAktif = useMemo(() => totalAktifList.reduce((sum, item) => sum + toNumber(item.sisa_saldo), 0), [totalAktifList]);

  const totalLunas = useMemo(() => pinjamanData.filter((item) => item.status_pinjaman === STATUS_PINJAMAN.LUNAS).length, [pinjamanData]);

  const summary = useMemo(
    () => ({
      totalAktif,
      totalNominalAktif,
      totalLunas,
    }),
    [totalAktif, totalLunas, totalNominalAktif],
  );

  const statusFieldHint = useMemo(() => 'Cicilan akan dibuat otomatis saat status pinjaman diubah menjadi Aktif.', []);

  const isStatusOptionDisabled = useCallback(() => false, []);

  const canDeletePinjaman = useCallback((pinjaman) => canDeletePinjamanItem(pinjaman), []);

  return {
    formData,
    selectedPinjaman: resolvedSelectedPinjaman,
    selectedFormUser,
    pinjamanList,
    summary,
    availableUsers,

    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isDetailModalOpen,

    loading: isPinjamanLoading || isUsersLoading,
    validating: isPinjamanValidating || isUsersValidating,
    isSubmitting,
    error: pinjamanError || usersError,

    formatCurrency,
    formatDate,
    calculateProgress,
    duplicateNameForUser,
    statusFieldHint,

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
    canDeletePinjaman,
    isStatusOptionDisabled,

    getUserDisplayName,
    getUserIdentity,
    getUserDepartment,
    getUserRoleOrJob,
    getUserPhoto,
  };
}
