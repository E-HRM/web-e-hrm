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
const FREELANCE_SWR_KEY = 'payroll:profil-payroll:freelance';

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

async function fetchAllFreelance() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetFreelance({
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: 'nama',
        sort: 'asc',
      }),
    ),
  );
}

function buildUserSubject(user) {
  const id = String(user?.id_user || '').trim();
  return {
    ...user,
    subject_key: id ? `USER:${id}` : '',
    subject_type: 'USER',
  };
}

function buildFreelanceSubject(freelance) {
  const id = String(freelance?.id_freelance || '').trim();
  return {
    ...freelance,
    subject_key: id ? `FREELANCE:${id}` : '',
    subject_type: 'FREELANCE',
    nama_pengguna: freelance?.nama,
    nomor_induk_karyawan: freelance?.email || id,
    role: 'FREELANCE',
    foto_profil_user: null,
  };
}

function getProfileSubjectKey(profile) {
  const freelanceId = String(profile?.id_freelance || '').trim();
  if (freelanceId) return `FREELANCE:${freelanceId}`;

  const userId = String(profile?.id_user || '').trim();
  return userId ? `USER:${userId}` : '';
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

  const {
    data: freelanceResponse,
    error: freelanceError,
    isLoading: isFreelanceLoading,
    isValidating: isFreelanceValidating,
    mutate: mutateFreelance,
  } = useSWR(FREELANCE_SWR_KEY, fetchAllFreelance, {
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

  useEffect(() => {
    if (!freelanceError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'profil-payroll-freelance-fetch-error',
      content: freelanceError?.message || 'Gagal memuat data freelance.',
    });
  }, [freelanceError]);

  const usersData = useMemo(() => (Array.isArray(usersResponse) ? usersResponse.map(buildUserSubject) : []), [usersResponse]);
  const freelanceData = useMemo(() => (Array.isArray(freelanceResponse) ? freelanceResponse.map(buildFreelanceSubject) : []), [freelanceResponse]);
  const payrollSubjects = useMemo(() => [...usersData, ...freelanceData], [freelanceData, usersData]);

  const subjectsMap = useMemo(() => {
    return new Map(payrollSubjects.map((subject) => [String(subject.subject_key), subject]));
  }, [payrollSubjects]);

  const profilData = useMemo(() => {
    const rawData = Array.isArray(profilResponse) ? profilResponse : [];

    return rawData.map((item) => {
      const subjectKey = getProfileSubjectKey(item);
      const fallbackUser = subjectsMap.get(subjectKey) || null;
      const resolvedUser = item?.user ? buildUserSubject(item.user) : item?.freelance ? buildFreelanceSubject(item.freelance) : fallbackUser || null;

      return {
        ...item,
        subject_key: subjectKey,
        tanggal_mulai_payroll: toDateInputValue(item?.tanggal_mulai_payroll),
        user: resolvedUser,
        user_display_name: getUserDisplayName(resolvedUser),
        user_identity: getUserIdentity(resolvedUser),
        user_department: getUserDepartment(resolvedUser),
        user_role_or_job: getUserRoleOrJob(resolvedUser),
        foto_profil_user: getUserPhoto(resolvedUser),
      };
    });
  }, [profilResponse, subjectsMap]);

  const resolvedSelectedProfil = useMemo(() => {
    if (!selectedProfil) return null;

    return profilData.find((item) => item.id_profil_payroll === selectedProfil.id_profil_payroll) || profilData.find((item) => item.subject_key === selectedProfil.subject_key) || selectedProfil;
  }, [profilData, selectedProfil]);

  const selectedFormUser = useMemo(() => {
    if (!formData.subject_key) return null;

    return subjectsMap.get(String(formData.subject_key)) || resolvedSelectedProfil?.user || null;
  }, [formData.subject_key, resolvedSelectedProfil, subjectsMap]);

  const usedUserIds = useMemo(() => {
    return new Set(profilData.map((item) => String(item.subject_key || '')).filter(Boolean));
  }, [profilData]);

  const availableUsers = useMemo(() => {
    return payrollSubjects.filter((user) => {
      const id = String(user.subject_key || '');

      if (!id) return false;
      if (resolvedSelectedProfil?.subject_key && id === String(resolvedSelectedProfil.subject_key)) return true;

      return !usedUserIds.has(id);
    });
  }, [payrollSubjects, resolvedSelectedProfil, usedUserIds]);

  const setFormValue = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSubjectChange = useCallback(
    (value) => {
      const subjectKey = String(value || '').trim();
      const subject = subjectsMap.get(subjectKey) || null;

      setFormData((prev) => ({
        ...prev,
        subject_key: subjectKey,
        id_user: subject?.subject_type === 'USER' ? String(subject.id_user || '').trim() : '',
        id_freelance: subject?.subject_type === 'FREELANCE' ? String(subject.id_freelance || '').trim() : '',
        jenis_hubungan_kerja: subject?.subject_type === 'FREELANCE' ? 'FREELANCE' : prev.jenis_hubungan_kerja === 'FREELANCE' ? 'PKWTT' : prev.jenis_hubungan_kerja,
      }));
    },
    [subjectsMap],
  );

  const resetForm = useCallback(() => {
    setFormData(createInitialProfilPayrollForm());
  }, []);

  const reloadData = useCallback(async () => {
    await Promise.all([mutateProfil(), mutateUsers(), mutateFreelance()]);
  }, [mutateFreelance, mutateProfil, mutateUsers]);

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
      subject_key: profil.subject_key || getProfileSubjectKey(profil),
      id_user: profil.id_user || '',
      id_freelance: profil.id_freelance || '',
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
    const hasUser = Boolean(String(formData.id_user || '').trim());
    const hasFreelance = Boolean(String(formData.id_freelance || '').trim());

    if (!hasUser && !hasFreelance) {
      AppMessage.warning('Karyawan atau freelance wajib dipilih.');
      return false;
    }

    if (hasUser && hasFreelance) {
      AppMessage.warning('Pilih salah satu antara karyawan atau freelance.');
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
  }, [formData.gaji_pokok, formData.id_freelance, formData.id_user, formData.jenis_hubungan_kerja, formData.tunjangan_bpjs]);

  const buildPayload = useCallback(() => {
    const isFreelance = Boolean(String(formData.id_freelance || '').trim());

    return {
      id_user: isFreelance ? null : String(formData.id_user || '').trim(),
      id_freelance: isFreelance ? String(formData.id_freelance || '').trim() : null,
      jenis_hubungan_kerja: String(isFreelance ? 'FREELANCE' : formData.jenis_hubungan_kerja || 'PKWTT')
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
    handleSubjectChange,
    resetForm,

    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isDetailModalOpen,

    loading: isProfilLoading || isUsersLoading || isFreelanceLoading,
    validating: isProfilValidating || isUsersValidating || isFreelanceValidating,
    loadingUsers: isUsersLoading || isFreelanceLoading,
    isSubmitting,
    error: profilError || usersError || freelanceError,

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
