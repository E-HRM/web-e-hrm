'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { crudServiceAuth } from '@/app/utils/services/crudServiceAuth';
import { ApiEndpoints } from '@/constrainst/endpoints';

import {
  buildApproverDisplayName,
  createInitialPersetujuanPayrollForm,
  formatKeputusanPersetujuan,
  formatPeriodePayrollLabel,
  formatRolePenyetuju,
  KEPUTUSAN_PERSETUJUAN_OPTIONS,
  ROLE_PENYETUJU_OPTIONS,
  serializePersetujuanPayrollPayload,
  toDateTimeLocalValue,
} from './utils/persetujuanPayrollUtils';

const FETCH_PAGE_SIZE = 100;
const PERSETUJUAN_SWR_KEY = 'payroll:persetujuan-periode-payroll:list';
const PERIODE_SWR_KEY = 'payroll:persetujuan-periode-payroll:periode';
const USERS_SWR_KEY = 'payroll:persetujuan-periode-payroll:users';

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
    const rows = Array.isArray(response?.data) ? response.data : [];

    merged.push(...rows);

    const nextTotalPages = Number(response?.pagination?.totalPages);
    totalPages = Number.isFinite(nextTotalPages) && nextTotalPages > 0 ? nextTotalPages : 1;
    page += 1;
  }

  return merged;
}

async function fetchAllPersetujuanPayroll() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetPersetujuanPeriodePayroll({
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: 'created_at',
        sort: 'desc',
      }),
    ),
  );
}

async function fetchAllPeriodePayroll() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetPeriodePayroll({
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: 'tanggal_mulai',
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

export default function usePersetujuanPayrollViewModel() {
  const searchParams = useSearchParams();
  const periodeFilterFromQuery = useMemo(() => String(searchParams?.get('id_periode_payroll') || '').trim(), [searchParams]);

  const [searchText, setSearchText] = useState('');
  const [filterKeputusan, setFilterKeputusan] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterPeriode, setFilterPeriode] = useState(periodeFilterFromQuery);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPersetujuan, setSelectedPersetujuan] = useState(null);
  const [formData, setFormData] = useState(createInitialPersetujuanPayrollForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    if (!periodeFilterFromQuery) return;

    setFilterPeriode((prev) => prev || periodeFilterFromQuery);
  }, [periodeFilterFromQuery]);

  const {
    data: persetujuanResponse,
    error: persetujuanError,
    isLoading: isPersetujuanLoading,
    isValidating: isPersetujuanValidating,
    mutate: mutatePersetujuan,
  } = useSWR(PERSETUJUAN_SWR_KEY, fetchAllPersetujuanPayroll, {
    revalidateOnFocus: false,
  });

  const {
    data: periodeResponse,
    error: periodeError,
    isLoading: isPeriodeLoading,
    isValidating: isPeriodeValidating,
    mutate: mutatePeriode,
  } = useSWR(PERIODE_SWR_KEY, fetchAllPeriodePayroll, {
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
    if (!persetujuanError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'persetujuan-payroll-fetch-error',
      content: persetujuanError?.message || 'Gagal memuat data persetujuan payroll.',
    });
  }, [persetujuanError]);

  useEffect(() => {
    if (!periodeError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'persetujuan-payroll-periode-fetch-error',
      content: periodeError?.message || 'Gagal memuat referensi periode payroll.',
    });
  }, [periodeError]);

  useEffect(() => {
    if (!usersError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'persetujuan-payroll-users-fetch-error',
      content: usersError?.message || 'Gagal memuat referensi user penyetuju.',
    });
  }, [usersError]);

  const periodeList = useMemo(() => (Array.isArray(periodeResponse) ? periodeResponse : []), [periodeResponse]);
  const usersList = useMemo(() => (Array.isArray(usersResponse) ? usersResponse : []), [usersResponse]);

  const periodeMap = useMemo(() => {
    return new Map(periodeList.map((item) => [String(item.id_periode_payroll), item]));
  }, [periodeList]);

  const usersMap = useMemo(() => {
    return new Map(usersList.map((item) => [String(item.id_user), item]));
  }, [usersList]);

  const persetujuanList = useMemo(() => {
    const rawList = Array.isArray(persetujuanResponse) ? persetujuanResponse : [];

    return rawList.map((item) => {
      const periode = item?.periode_payroll || periodeMap.get(String(item?.id_periode_payroll || '')) || null;
      const penyetuju = item?.penyetuju || usersMap.get(String(item?.id_user_penyetuju || '')) || null;

      return {
        ...item,
        periode_payroll: periode,
        penyetuju,
        periode_label: formatPeriodePayrollLabel(periode),
        approver_display_name: buildApproverDisplayName({
          ...item,
          penyetuju,
        }),
      };
    });
  }, [periodeMap, persetujuanResponse, usersMap]);

  const resolvedSelectedPersetujuan = useMemo(() => {
    if (!selectedPersetujuan) return null;

    return persetujuanList.find((item) => item.id_persetujuan_periode_payroll === selectedPersetujuan.id_persetujuan_periode_payroll) || selectedPersetujuan;
  }, [persetujuanList, selectedPersetujuan]);

  const periodeOptions = useMemo(() => {
    return periodeList
      .filter((item) => !item?.deleted_at)
      .map((item) => ({
        value: item.id_periode_payroll,
        label: `${formatPeriodePayrollLabel(item)} (${item.status_periode})`,
      }));
  }, [periodeList]);

  const usersOptions = useMemo(() => {
    return usersList
      .filter((item) => !item?.deleted_at)
      .map((item) => ({
        value: item.id_user,
        label: `${item.nama_pengguna || item.id_user}${item.role ? ` (${formatRolePenyetuju(item.role)})` : ''}`,
      }));
  }, [usersList]);

  const setFormValue = useCallback(
    (field, value) => {
      setFormData((prev) => {
        const next = {
          ...prev,
          [field]: value,
        };

        if (field === 'id_user_penyetuju') {
          const selectedUser = usersMap.get(String(value || ''));
          if (selectedUser?.role) {
            next.role_penyetuju = String(selectedUser.role || '')
              .trim()
              .toUpperCase();
          }
        }

        if (field === 'keputusan') {
          const normalized = String(value || '').trim().toLowerCase();

          if (normalized === 'pending') {
            next.diputuskan_pada = '';
          } else if (!next.diputuskan_pada) {
            next.diputuskan_pada = toDateTimeLocalValue(new Date());
          }
        }

        return next;
      });
    },
    [usersMap],
  );

  const resetForm = useCallback(() => {
    setFormData({
      ...createInitialPersetujuanPayrollForm(),
      id_periode_payroll: filterPeriode || '',
    });
  }, [filterPeriode]);

  const openCreateModal = useCallback(() => {
    setSelectedPersetujuan(null);
    resetForm();
    setIsCreateModalOpen(true);
  }, [resetForm]);

  const closeCreateModal = useCallback(() => {
    if (isSubmitting) return;

    setIsCreateModalOpen(false);
    resetForm();
  }, [isSubmitting, resetForm]);

  const openEditModal = useCallback((persetujuan) => {
    if (!persetujuan) return;

    setSelectedPersetujuan(persetujuan);
    setFormData({
      id_periode_payroll: persetujuan.id_periode_payroll || '',
      level: Number(persetujuan.level || 1),
      id_user_penyetuju: persetujuan.id_user_penyetuju || '',
      role_penyetuju: persetujuan.role_penyetuju || '',
      keputusan: persetujuan.keputusan || 'pending',
      diputuskan_pada: toDateTimeLocalValue(persetujuan.diputuskan_pada),
      catatan: persetujuan.catatan || '',
    });
    setIsEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    if (isSubmitting) return;

    setIsEditModalOpen(false);
    setSelectedPersetujuan(null);
    resetForm();
  }, [isSubmitting, resetForm]);

  const openDetailModal = useCallback((persetujuan) => {
    if (!persetujuan) return;
    setSelectedPersetujuan(persetujuan);
    setIsDetailModalOpen(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedPersetujuan(null);
  }, []);

  const validateForm = useCallback(() => {
    const payload = serializePersetujuanPayrollPayload(formData);

    if (!payload.id_periode_payroll) {
      AppMessage.warning('Periode payroll wajib dipilih.');
      return false;
    }

    if (!Number.isInteger(payload.level) || payload.level < 1) {
      AppMessage.warning('Level approval harus berupa bilangan bulat minimal 1.');
      return false;
    }

    if (!payload.id_user_penyetuju && !payload.role_penyetuju) {
      AppMessage.warning('Pilih user penyetuju atau role penyetuju.');
      return false;
    }

    return true;
  }, [formData]);

  const buildPayload = useCallback(() => {
    const payload = serializePersetujuanPayrollPayload(formData);

    if (payload.keputusan !== 'pending' && !payload.diputuskan_pada) {
      payload.diputuskan_pada = new Date().toISOString();
    }

    return payload;
  }, [formData]);

  const handleCreate = useCallback(async () => {
    if (!validateForm()) return false;

    setIsSubmitting(true);
    try {
      const response = await crudServiceAuth.post(ApiEndpoints.CreatePersetujuanPeriodePayroll(), buildPayload());

      AppMessage.success(response?.message || 'Persetujuan periode payroll berhasil dibuat.');
      setIsCreateModalOpen(false);
      resetForm();
      await mutatePersetujuan();
      return true;
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal membuat persetujuan periode payroll.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [buildPayload, mutatePersetujuan, resetForm, validateForm]);

  const handleUpdate = useCallback(async () => {
    if (!resolvedSelectedPersetujuan?.id_persetujuan_periode_payroll) {
      AppMessage.warning('Persetujuan periode payroll tidak ditemukan.');
      return false;
    }

    if (!validateForm()) return false;

    setIsSubmitting(true);
    try {
      const response = await crudServiceAuth.put(
        ApiEndpoints.UpdatePersetujuanPeriodePayroll(resolvedSelectedPersetujuan.id_persetujuan_periode_payroll),
        buildPayload(),
      );

      AppMessage.success(response?.message || 'Persetujuan periode payroll berhasil diperbarui.');
      setIsEditModalOpen(false);
      setSelectedPersetujuan(null);
      resetForm();
      await mutatePersetujuan();
      return true;
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memperbarui persetujuan periode payroll.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [buildPayload, mutatePersetujuan, resetForm, resolvedSelectedPersetujuan, validateForm]);

  const handleDelete = useCallback(
    async (persetujuan) => {
      if (!persetujuan?.id_persetujuan_periode_payroll) {
        AppMessage.warning('Persetujuan periode payroll tidak ditemukan.');
        return false;
      }

      setActionLoadingId(persetujuan.id_persetujuan_periode_payroll);
      try {
        const response = await crudServiceAuth.delete(ApiEndpoints.DeletePersetujuanPeriodePayroll(persetujuan.id_persetujuan_periode_payroll));

        AppMessage.success(response?.message || 'Persetujuan periode payroll berhasil dihapus.');

        if (resolvedSelectedPersetujuan?.id_persetujuan_periode_payroll === persetujuan.id_persetujuan_periode_payroll) {
          setIsDetailModalOpen(false);
          setSelectedPersetujuan(null);
        }

        await mutatePersetujuan();
        return true;
      } catch (err) {
        AppMessage.error(err?.message || 'Gagal menghapus persetujuan periode payroll.');
        return false;
      } finally {
        setActionLoadingId(null);
      }
    },
    [mutatePersetujuan, resolvedSelectedPersetujuan],
  );

  const reloadData = useCallback(async () => {
    await Promise.all([mutatePersetujuan(), mutatePeriode(), mutateUsers()]);
  }, [mutatePeriode, mutatePersetujuan, mutateUsers]);

  const filteredList = useMemo(() => {
    const needle = normalizeText(searchText);

    return persetujuanList.filter((item) => {
      const keputusan = String(item?.keputusan || '').toLowerCase();
      const role = String(item?.role_penyetuju || '').toUpperCase();
      const periodeId = String(item?.id_periode_payroll || '');
      const haystack = normalizeText(
        [
          item?.periode_label,
          item?.approver_display_name,
          item?.penyetuju?.email,
          item?.catatan,
          formatKeputusanPersetujuan(item?.keputusan),
          formatRolePenyetuju(item?.role_penyetuju),
          item?.level,
        ].join(' '),
      );

      if (needle && !haystack.includes(needle)) return false;
      if (filterKeputusan && keputusan !== filterKeputusan) return false;
      if (filterRole && role !== filterRole) return false;
      if (filterPeriode && periodeId !== filterPeriode) return false;

      return true;
    });
  }, [filterKeputusan, filterPeriode, filterRole, persetujuanList, searchText]);

  const summary = useMemo(() => {
    const totalPersetujuan = persetujuanList.length;
    const totalPending = persetujuanList.filter((item) => item?.keputusan === 'pending').length;
    const totalDisetujui = persetujuanList.filter((item) => item?.keputusan === 'disetujui').length;
    const totalDitolak = persetujuanList.filter((item) => item?.keputusan === 'ditolak').length;
    const totalPeriodeTercover = new Set(persetujuanList.map((item) => item.id_periode_payroll).filter(Boolean)).size;

    return {
      totalPersetujuan,
      totalPending,
      totalDisetujui,
      totalDitolak,
      totalPeriodeTercover,
    };
  }, [persetujuanList]);

  const keputusanOptions = useMemo(() => [{ value: '', label: 'Semua Keputusan' }, ...KEPUTUSAN_PERSETUJUAN_OPTIONS], []);
  const roleOptions = useMemo(() => [{ value: '', label: 'Semua Role' }, ...ROLE_PENYETUJU_OPTIONS], []);
  const periodeFilterOptions = useMemo(() => [{ value: '', label: 'Semua Periode' }, ...periodeOptions], [periodeOptions]);

  return {
    error: persetujuanError || periodeError || usersError,
    loading: isPersetujuanLoading || isPeriodeLoading || isUsersLoading,
    validating: isPersetujuanValidating || isPeriodeValidating || isUsersValidating,

    persetujuanList,
    dataSource: filteredList,
    filteredList,
    summary,

    searchText,
    setSearchText,
    filterKeputusan,
    setFilterKeputusan,
    filterRole,
    setFilterRole,
    filterPeriode,
    setFilterPeriode,
    keputusanOptions,
    roleOptions,
    periodeFilterOptions,
    periodeOptions,
    usersOptions,

    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    isEditModalOpen,
    openEditModal,
    closeEditModal,
    isDetailModalOpen,
    openDetailModal,
    closeDetailModal,
    selectedPersetujuan: resolvedSelectedPersetujuan,

    formData,
    setFormValue,
    resetForm,
    isSubmitting,
    actionLoadingId,

    handleCreate,
    handleUpdate,
    handleDelete,
    reloadData,

    formatKeputusanPersetujuan,
    formatPeriodeLabel: formatPeriodePayrollLabel,
    formatRolePenyetuju,
    buildApproverDisplayName,
  };
}
