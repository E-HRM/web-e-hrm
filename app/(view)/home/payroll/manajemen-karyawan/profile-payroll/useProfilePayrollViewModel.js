// app/(view)/home/payroll/profile-payroll/useProfilePayrollViewModel.js
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { crudServiceAuth } from '@/app/utils/services/crudServiceAuth';
import { ApiEndpoints } from '@/constrainst/endpoints';

import {
  createInitialProfilPayrollForm,
  formatCurrency,
  formatDate,
  formatJenisHubungan,
  toDateInputValue,
  getUserDepartment,
  getUserDisplayName,
  getUserIdentity,
  getUserPhoto,
  getUserRoleOrJob,
  JENIS_HUBUNGAN_OPTIONS,
} from './utils/profilePayrollUtils';

const FETCH_PAGE_SIZE = 100;
const PROFILE_SWR_KEY = 'payroll:profil-payroll:list';
const USERS_SWR_KEY = 'payroll:profil-payroll:users';

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

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

async function fetchAllProfilPayroll() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetProfilPayroll({
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

export default function useProfilPayrollViewModel() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProfil, setSelectedProfil] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(createInitialProfilPayrollForm());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: profilResponse,
    error: profilError,
    isLoading: isProfilLoading,
    isValidating: isProfilValidating,
    mutate: mutateProfil,
  } = useSWR(PROFILE_SWR_KEY, fetchAllProfilPayroll, {
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
    if (!profilError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'profil-payroll-fetch-error',
      content: profilError?.message || 'Gagal memuat data profil payroll.',
    });
  }, [profilError]);

  useEffect(() => {
    if (!usersError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'profil-payroll-users-fetch-error',
      content: usersError?.message || 'Gagal memuat data karyawan.',
    });
  }, [usersError]);

  const usersData = useMemo(() => (Array.isArray(usersResponse) ? usersResponse : []), [usersResponse]);

  const usersMap = useMemo(() => {
    return new Map(usersData.map((user) => [String(user.id_user), user]));
  }, [usersData]);

  const profilData = useMemo(() => {
    const rawData = Array.isArray(profilResponse) ? profilResponse : [];

    return rawData.map((item) => {
      const fallbackUser = usersMap.get(String(item?.id_user || '')) || null;
      const resolvedUser = item?.user || fallbackUser || null;

      return {
        ...item,
        tanggal_mulai_payroll: toDateInputValue(item?.tanggal_mulai_payroll),
        user: resolvedUser,
        user_display_name: getUserDisplayName(resolvedUser),
        user_identity: getUserIdentity(resolvedUser),
        user_department: getUserDepartment(resolvedUser),
        user_role_or_job: getUserRoleOrJob(resolvedUser),
        foto_profil_user: getUserPhoto(resolvedUser),
      };
    });
  }, [profilResponse, usersMap]);

  const resolvedSelectedProfil = useMemo(() => {
    if (!selectedProfil) return null;

    return profilData.find((item) => item.id_profil_payroll === selectedProfil.id_profil_payroll) || profilData.find((item) => item.id_user === selectedProfil.id_user) || selectedProfil;
  }, [profilData, selectedProfil]);

  const selectedFormUser = useMemo(() => {
    if (!formData.id_user) return null;

    return usersMap.get(String(formData.id_user)) || resolvedSelectedProfil?.user || null;
  }, [formData.id_user, resolvedSelectedProfil, usersMap]);

  const usedUserIds = useMemo(() => {
    return new Set(profilData.map((item) => String(item.id_user || '')).filter(Boolean));
  }, [profilData]);

  const availableUsers = useMemo(() => {
    return usersData.filter((user) => {
      const id = String(user.id_user || '');

      if (!id) return false;
      if (resolvedSelectedProfil?.id_user && id === String(resolvedSelectedProfil.id_user)) return true;

      return !usedUserIds.has(id);
    });
  }, [resolvedSelectedProfil, usedUserIds, usersData]);

  const setFormValue = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(createInitialProfilPayrollForm());
  }, []);

  const reloadData = useCallback(async () => {
    await Promise.all([mutateProfil(), mutateUsers()]);
  }, [mutateProfil, mutateUsers]);

  const closeCreateModal = useCallback(() => {
    if (isSubmitting) return;

    setIsCreateModalOpen(false);
    resetForm();
  }, [isSubmitting, resetForm]);

  const closeEditModal = useCallback(() => {
    if (isSubmitting) return;

    setIsEditModalOpen(false);
    setSelectedProfil(null);
    resetForm();
  }, [isSubmitting, resetForm]);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedProfil(null);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    if (isSubmitting) return;

    setIsDeleteDialogOpen(false);
    setSelectedProfil(null);
  }, [isSubmitting]);

  const openCreateModal = useCallback(() => {
    setSelectedProfil(null);
    resetForm();
    setIsCreateModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback((profil) => {
    if (!profil) return;

    setSelectedProfil(profil);
    setFormData({
      id_user: profil.id_user || '',
      jenis_hubungan_kerja: profil.jenis_hubungan_kerja || 'PKWTT',
      gaji_pokok: profil.gaji_pokok ?? 0,
      tunjangan_bpjs: profil.tunjangan_bpjs ?? 0,
      payroll_aktif: Boolean(profil.payroll_aktif),
      tanggal_mulai_payroll: toDateInputValue(profil.tanggal_mulai_payroll),
      catatan: profil.catatan || '',
    });
    setIsEditModalOpen(true);
  }, []);

  const openDetailModal = useCallback((profil) => {
    if (!profil) return;

    setSelectedProfil(profil);
    setIsDetailModalOpen(true);
  }, []);

  const openDeleteDialog = useCallback((profil) => {
    if (!profil) return;

    setSelectedProfil(profil);
    setIsDeleteDialogOpen(true);
  }, []);

  const openEditFromDetail = useCallback(() => {
    if (!resolvedSelectedProfil) return;

    setIsDetailModalOpen(false);
    openEditModal(resolvedSelectedProfil);
  }, [openEditModal, resolvedSelectedProfil]);

  const filteredData = useMemo(() => {
    const query = normalizeText(searchQuery);

    return profilData.filter((profil) => {
      const matchFilter = filter === 'ALL' ? true : filter === 'ACTIVE' ? Boolean(profil.payroll_aktif) : !profil.payroll_aktif;

      const searchable = [
        profil.user_display_name,
        profil.user_identity,
        profil.user_department,
        profil.user_role_or_job,
        profil.user?.email,
        profil.gaji_pokok,
        profil.tunjangan_bpjs,
        profil.jenis_hubungan_kerja,
        profil.catatan,
      ]
        .map((value) => normalizeText(value))
        .join(' ');

      return matchFilter && (!query || searchable.includes(query));
    });
  }, [filter, profilData, searchQuery]);

  const totalProfil = useMemo(() => profilData.length, [profilData]);
  const activeProfil = useMemo(() => profilData.filter((item) => item.payroll_aktif).length, [profilData]);
  const inactiveProfil = useMemo(() => profilData.filter((item) => !item.payroll_aktif).length, [profilData]);

  const validateForm = useCallback(() => {
    if (!String(formData.id_user || '').trim()) {
      AppMessage.warning('Karyawan wajib dipilih.');
      return false;
    }

    if (!String(formData.jenis_hubungan_kerja || '').trim()) {
      AppMessage.warning('Jenis hubungan kerja wajib dipilih.');
      return false;
    }

    const gajiPokok = Number(formData.gaji_pokok);
    if (!Number.isFinite(gajiPokok) || gajiPokok < 0) {
      AppMessage.warning('Gaji pokok wajib diisi dengan angka yang valid.');
      return false;
    }

    const tunjanganBpjs = Number(formData.tunjangan_bpjs);
    if (!Number.isFinite(tunjanganBpjs) || tunjanganBpjs < 0) {
      AppMessage.warning('Tunjangan BPJS wajib diisi dengan angka yang valid.');
      return false;
    }

    return true;
  }, [formData.gaji_pokok, formData.id_user, formData.jenis_hubungan_kerja, formData.tunjangan_bpjs]);

  const buildPayload = useCallback(() => {
    return {
      id_user: String(formData.id_user || '').trim(),
      jenis_hubungan_kerja: String(formData.jenis_hubungan_kerja || 'PKWTT')
        .trim()
        .toUpperCase(),
      gaji_pokok: Number(formData.gaji_pokok || 0),
      tunjangan_bpjs: Number(formData.tunjangan_bpjs || 0),
      payroll_aktif: Boolean(formData.payroll_aktif),
      tanggal_mulai_payroll: String(formData.tanggal_mulai_payroll || '').trim() || null,
      catatan: String(formData.catatan || '').trim(),
    };
  }, [formData]);

  const handleCreate = useCallback(async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.post(ApiEndpoints.CreateProfilPayroll(), buildPayload());

      await mutateProfil();
      setIsCreateModalOpen(false);
      resetForm();
      AppMessage.success(response?.message || 'Profil payroll berhasil ditambahkan.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menambahkan profil payroll.');
    } finally {
      setIsSubmitting(false);
    }
  }, [buildPayload, isSubmitting, mutateProfil, resetForm, validateForm]);

  const handleEdit = useCallback(async () => {
    if (isSubmitting) return;

    if (!resolvedSelectedProfil) {
      AppMessage.warning('Profil payroll tidak ditemukan.');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.put(ApiEndpoints.UpdateProfilPayroll(resolvedSelectedProfil.id_profil_payroll), buildPayload());

      await mutateProfil();
      setIsEditModalOpen(false);
      setSelectedProfil(null);
      resetForm();
      AppMessage.success(response?.message || 'Profil payroll berhasil diperbarui.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memperbarui profil payroll.');
    } finally {
      setIsSubmitting(false);
    }
  }, [buildPayload, isSubmitting, mutateProfil, resetForm, resolvedSelectedProfil, validateForm]);

  const handleDelete = useCallback(async () => {
    if (isSubmitting) return;

    if (!resolvedSelectedProfil) {
      AppMessage.warning('Profil payroll tidak ditemukan.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.delete(ApiEndpoints.DeleteProfilPayroll(resolvedSelectedProfil.id_profil_payroll));

      await mutateProfil();
      setIsDeleteDialogOpen(false);
      setIsDetailModalOpen(false);
      setSelectedProfil(null);
      AppMessage.success(response?.message || 'Profil payroll berhasil dihapus.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menghapus profil payroll.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, mutateProfil, resolvedSelectedProfil]);

  return {
    profilData,
    filteredData,
    totalProfil,
    activeProfil,
    inactiveProfil,

    filter,
    setFilter,
    searchQuery,
    setSearchQuery,

    selectedProfil: resolvedSelectedProfil,
    selectedFormUser,
    availableUsers,
    formData,
    setFormValue,
    resetForm,

    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isDetailModalOpen,

    loading: isProfilLoading || isUsersLoading,
    validating: isProfilValidating || isUsersValidating,
    loadingUsers: isUsersLoading,
    isSubmitting,
    error: profilError || usersError,

    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openDetailModal,
    closeDetailModal,
    openDeleteDialog,
    closeDeleteDialog,
    openEditFromDetail,
    reloadData,

    handleCreate,
    handleEdit,
    handleDelete,

    jenisHubunganOptions: JENIS_HUBUNGAN_OPTIONS,
    formatCurrency,
    formatDate,
    formatJenisHubungan,
    getUserDisplayName,
    getUserIdentity,
    getUserDepartment,
    getUserRoleOrJob,
    getUserPhoto,
  };
}
