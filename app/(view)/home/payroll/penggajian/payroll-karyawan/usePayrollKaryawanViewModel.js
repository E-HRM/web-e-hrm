'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { crudServiceAuth } from '@/app/utils/services/crudServiceAuth';
import { ApiEndpoints } from '@/constrainst/endpoints';

import {
  buildPayrollKaryawanPayload,
  calculatePayrollPph21Nominal,
  createEmptyApprovalStep,
  createInitialPayrollKaryawanForm,
  formatApproverRole,
  formatBulan,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDateTimeLocalInput,
  formatJenisHubungan,
  formatPeriodeLabel,
  formatStatusApproval,
  formatStatusPayroll,
  formatTarifPajakSnapshot,
  normalizePayrollKaryawanItem,
  normalizeText,
  STATUS_PAYROLL_OPTIONS,
  toNumber,
} from './utils/payrollKaryawanUtils';

const FETCH_PAGE_SIZE = 100;
const PAYROLL_KARYAWAN_SWR_KEY = 'payroll:payroll-karyawan:list';
const PERIODE_PAYROLL_SWR_KEY = 'payroll:payroll-karyawan:periode';
const PROFIL_PAYROLL_SWR_KEY = 'payroll:payroll-karyawan:profil-payroll';
const USERS_SWR_KEY = 'payroll:payroll-karyawan:users';

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

async function fetchAllPayrollKaryawan() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetPayrollKaryawan({
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

async function fetchAllProfilPayroll() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetProfilPayroll({
        page,
        pageSize: FETCH_PAGE_SIZE,
        payroll_aktif: 'true',
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

function buildDefaultForm(filterPeriode) {
  return createInitialPayrollKaryawanForm(filterPeriode && filterPeriode !== 'ALL' ? filterPeriode : '');
}

function getProfilPayrollEmployeeName(profile) {
  return String(profile?.user?.nama_pengguna || '').trim();
}

function getProfilPayrollEmployeeIdentity(profile) {
  return String(profile?.user?.nomor_induk_karyawan || '').trim();
}

function getProfilPayrollEmployeeDepartment(profile) {
  return String(profile?.user?.departement?.nama_departement || '').trim();
}

function getProfilPayrollEmployeeJob(profile) {
  return String(profile?.user?.jabatan?.nama_jabatan || '').trim();
}

function buildEmployeeOption(profile) {
  const employeeName = getProfilPayrollEmployeeName(profile);
  const employeeIdentity = getProfilPayrollEmployeeIdentity(profile);
  const employeeDepartment = getProfilPayrollEmployeeDepartment(profile);
  const employeeJob = getProfilPayrollEmployeeJob(profile);
  const metadata = [employeeIdentity, employeeDepartment, employeeJob].filter(Boolean).join(' | ');

  return {
    value: profile.id_user,
    label: metadata ? `${employeeName} (${metadata})` : employeeName,
    plainLabel: employeeName,
    title: employeeName,
    searchText: [employeeName, employeeIdentity, profile?.user?.email, employeeDepartment, employeeJob, profile?.id_user].filter(Boolean).join(' '),
  };
}

function filterEmployeeOption(input, option) {
  return String(option?.searchText || '')
    .toLowerCase()
    .includes(String(input || '').toLowerCase());
}

function getUserRole(user) {
  return String(user?.role || '')
    .trim()
    .toUpperCase();
}

function buildApproverOption(user) {
  const approverName = String(user?.nama_pengguna || '').trim();
  const approverRole = getUserRole(user);
  const email = String(user?.email || '').trim();
  const nik = String(user?.nomor_induk_karyawan || '').trim();
  const metadata = [approverRole ? formatApproverRole(approverRole) : '', email].filter(Boolean).join(' | ');

  return {
    value: user.id_user,
    label: metadata ? `${approverName} (${metadata})` : approverName,
    plainLabel: approverName,
    title: approverName,
    searchText: [approverName, email, nik, approverRole, formatApproverRole(approverRole), user?.id_user].filter(Boolean).join(' '),
  };
}

function filterApproverOption(input, option) {
  return String(option?.searchText || '')
    .toLowerCase()
    .includes(String(input || '').toLowerCase());
}

function clearSelectedEmployeeSnapshot(previousForm) {
  return {
    ...previousForm,
    id_user: '',
    nama_karyawan_snapshot: '',
    jenis_hubungan_snapshot: 'PKWTT',
    id_tarif_pajak_ter: '',
    kode_kategori_pajak_snapshot: '',
    persen_tarif_snapshot: 0,
    penghasilan_dari_snapshot: 0,
    penghasilan_sampai_snapshot: null,
    berlaku_mulai_tarif_snapshot: '',
    berlaku_sampai_tarif_snapshot: null,
    nama_departement_snapshot: '',
    nama_jabatan_snapshot: '',
    nama_bank_snapshot: '',
    nomor_rekening_snapshot: '',
    total_pendapatan_tetap: 0,
    total_pendapatan_variabel: 0,
    total_bruto_kena_pajak: 0,
    persen_pajak: 0,
    total_pajak: 0,
    total_potongan_lain: 0,
    total_dibayarkan: 0,
  };
}

function applyProfilPayrollToForm(previousForm, profile) {
  if (!profile) return clearSelectedEmployeeSnapshot(previousForm);

  const tarif = profile?.tarif_pajak_ter;
  const gajiPokok = toNumber(profile?.gaji_pokok);
  const persenTarifSnapshot = toNumber(tarif?.persen_tarif);
  const totalPajak = calculatePayrollPph21Nominal(gajiPokok, persenTarifSnapshot);
  const totalDibayarkan = Math.max(gajiPokok - totalPajak, 0);

  return {
    ...previousForm,
    id_user: String(profile.id_user || '').trim(),
    nama_karyawan_snapshot: getProfilPayrollEmployeeName(profile),
    jenis_hubungan_snapshot: String(profile?.jenis_hubungan_kerja || 'PKWTT')
      .trim()
      .toUpperCase(),
    id_tarif_pajak_ter: String(profile?.id_tarif_pajak_ter || '').trim(),
    kode_kategori_pajak_snapshot: String(tarif?.kode_kategori_pajak || '').trim(),
    persen_tarif_snapshot: persenTarifSnapshot,
    penghasilan_dari_snapshot: toNumber(tarif?.penghasilan_dari),
    penghasilan_sampai_snapshot: tarif?.penghasilan_sampai == null ? null : toNumber(tarif?.penghasilan_sampai),
    berlaku_mulai_tarif_snapshot: tarif?.berlaku_mulai || '',
    berlaku_sampai_tarif_snapshot: tarif?.berlaku_sampai || null,
    persen_pajak: persenTarifSnapshot,
    nama_departement_snapshot: getProfilPayrollEmployeeDepartment(profile),
    nama_jabatan_snapshot: getProfilPayrollEmployeeJob(profile),
    nama_bank_snapshot: String(profile?.user?.jenis_bank || '').trim(),
    nomor_rekening_snapshot: String(profile?.user?.nomor_rekening || '').trim(),
    total_pendapatan_tetap: gajiPokok,
    total_pendapatan_variabel: 0,
    total_bruto_kena_pajak: gajiPokok,
    total_pajak: totalPajak,
    total_potongan_lain: 0,
    total_dibayarkan: totalDibayarkan,
  };
}

function mapApprovalStepsForForm(payroll) {
  const sourceSteps = Array.isArray(payroll?.approval_steps)
    ? payroll.approval_steps
    : Array.isArray(payroll?.approvals)
      ? payroll.approvals
      : [];

  if (!sourceSteps.length) {
    return [createEmptyApprovalStep()];
  }

  return sourceSteps.map((step) => ({
    client_key: createEmptyApprovalStep().client_key,
    approver_user_id: String(step?.approver_user_id || '').trim(),
  }));
}

export default function usePayrollKaryawanViewModel() {
  const searchParams = useSearchParams();
  const periodeFilterFromQuery = useMemo(() => String(searchParams?.get('id_periode_payroll') || '').trim(), [searchParams]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [approvalTargetPayroll, setApprovalTargetPayroll] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPeriode, setFilterPeriode] = useState(periodeFilterFromQuery || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(buildDefaultForm(periodeFilterFromQuery || 'ALL'));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!periodeFilterFromQuery) return;

    setFilterPeriode((prev) => (prev === 'ALL' ? periodeFilterFromQuery : prev));
  }, [periodeFilterFromQuery]);

  const {
    data: payrollResponse,
    error: payrollError,
    isLoading: isPayrollLoading,
    isValidating: isPayrollValidating,
    mutate: mutatePayroll,
  } = useSWR(PAYROLL_KARYAWAN_SWR_KEY, fetchAllPayrollKaryawan, {
    revalidateOnFocus: false,
  });

  const {
    data: periodeResponse,
    error: periodeError,
    isLoading: isPeriodeLoading,
    isValidating: isPeriodeValidating,
    mutate: mutatePeriode,
  } = useSWR(PERIODE_PAYROLL_SWR_KEY, fetchAllPeriodePayroll, {
    revalidateOnFocus: false,
  });

  const {
    data: profilPayrollResponse,
    error: profilPayrollError,
    isLoading: isProfilPayrollLoading,
    isValidating: isProfilPayrollValidating,
    mutate: mutateProfilPayroll,
  } = useSWR(PROFIL_PAYROLL_SWR_KEY, fetchAllProfilPayroll, {
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
    if (!payrollError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payroll-karyawan-fetch-error',
      content: payrollError?.message || 'Gagal memuat data payroll karyawan.',
    });
  }, [payrollError]);

  useEffect(() => {
    if (!periodeError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payroll-karyawan-periode-fetch-error',
      content: periodeError?.message || 'Gagal memuat referensi periode payroll.',
    });
  }, [periodeError]);

  useEffect(() => {
    if (!profilPayrollError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payroll-karyawan-profil-payroll-fetch-error',
      content: profilPayrollError?.message || 'Gagal memuat kandidat karyawan payroll.',
    });
  }, [profilPayrollError]);

  useEffect(() => {
    if (!usersError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payroll-karyawan-approver-fetch-error',
      content: usersError?.message || 'Gagal memuat referensi user approval payroll.',
    });
  }, [usersError]);

  const periodeList = useMemo(() => (Array.isArray(periodeResponse) ? periodeResponse : []), [periodeResponse]);
  const profilPayrollList = useMemo(() => (Array.isArray(profilPayrollResponse) ? profilPayrollResponse : []), [profilPayrollResponse]);
  const usersList = useMemo(() => (Array.isArray(usersResponse) ? usersResponse : []), [usersResponse]);
  const payrollData = useMemo(() => {
    const rawList = Array.isArray(payrollResponse) ? payrollResponse : [];
    return rawList.map(normalizePayrollKaryawanItem).filter(Boolean);
  }, [payrollResponse]);

  const activeProfilPayrollList = useMemo(() => {
    return profilPayrollList.filter((profile) => {
      return !profile?.deleted_at && Boolean(profile?.payroll_aktif) && !profile?.user?.deleted_at && !profile?.tarif_pajak_ter?.deleted_at && String(profile?.id_user || '').trim();
    });
  }, [profilPayrollList]);

  const activeApproverUsers = useMemo(() => {
    return usersList.filter((user) => !user?.deleted_at && String(user?.id_user || '').trim());
  }, [usersList]);

  const profilPayrollMap = useMemo(() => new Map(activeProfilPayrollList.map((profile) => [String(profile.id_user), profile])), [activeProfilPayrollList]);
  const approverUsersMap = useMemo(() => new Map(activeApproverUsers.map((user) => [String(user.id_user), user])), [activeApproverUsers]);

  const payrollUserIdsByPeriode = useMemo(() => {
    const usageMap = new Map();

    payrollData.forEach((item) => {
      const periodeId = String(item?.id_periode_payroll || '').trim();
      const userId = String(item?.id_user || '').trim();

      if (!periodeId || !userId) return;

      if (!usageMap.has(periodeId)) {
        usageMap.set(periodeId, new Set());
      }

      usageMap.get(periodeId).add(userId);
    });

    return usageMap;
  }, [payrollData]);

  const periodeMap = useMemo(() => new Map(periodeList.map((item) => [String(item.id_periode_payroll), item])), [periodeList]);

  const resolvedSelectedPayroll = useMemo(() => {
    if (!selectedPayroll) return null;

    return payrollData.find((item) => item.id_payroll_karyawan === selectedPayroll.id_payroll_karyawan) || selectedPayroll;
  }, [payrollData, selectedPayroll]);

  const resolvedApprovalTargetPayroll = useMemo(() => {
    if (!approvalTargetPayroll) return null;

    return payrollData.find((item) => item.id_payroll_karyawan === approvalTargetPayroll.id_payroll_karyawan) || approvalTargetPayroll;
  }, [approvalTargetPayroll, payrollData]);

  const getActionableApprovalStep = useCallback((payroll) => {
    if (!payroll) return null;

    const approvalSteps = Array.isArray(payroll?.approval_steps) ? payroll.approval_steps : [];
    const currentApprovalLevel = Number(payroll?.current_level_approval || 0) || null;
    const currentPendingStep =
      approvalSteps.find(
        (step) =>
          Number(step?.level || 0) === currentApprovalLevel &&
          String(step?.decision || '')
            .trim()
            .toLowerCase() === 'pending',
      ) || null;

    return (
      currentPendingStep ||
      approvalSteps.find(
        (step) =>
          String(step?.decision || '')
            .trim()
            .toLowerCase() === 'pending',
      ) ||
      null
    );
  }, []);

  const setFormValue = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const addApprovalStep = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      approval_steps: [...(Array.isArray(prev.approval_steps) ? prev.approval_steps : []), createEmptyApprovalStep()],
    }));
  }, []);

  const removeApprovalStep = useCallback((clientKey) => {
    setFormData((prev) => {
      const existingSteps = Array.isArray(prev.approval_steps) ? prev.approval_steps : [];
      const nextSteps = existingSteps.filter((step) => step.client_key !== clientKey);

      return {
        ...prev,
        approval_steps: nextSteps.length > 0 ? nextSteps : [createEmptyApprovalStep()],
      };
    });
  }, []);

  const updateApprovalStep = useCallback((clientKey, approverUserId) => {
    setFormData((prev) => ({
      ...prev,
      approval_steps: (Array.isArray(prev.approval_steps) ? prev.approval_steps : []).map((step) =>
        step.client_key === clientKey
          ? {
              ...step,
              approver_user_id: String(approverUserId || '').trim(),
            }
          : step,
      ),
    }));
  }, []);

  const handleEmployeeChange = useCallback(
    (value) => {
      const nextUserId = String(value || '').trim();

      if (!nextUserId) {
        setFormData((prev) => clearSelectedEmployeeSnapshot(prev));
        return;
      }

      const profile = profilPayrollMap.get(nextUserId);

      if (!profile) {
        AppMessage.warning('Profil payroll karyawan tidak ditemukan.');
        setFormData((prev) => clearSelectedEmployeeSnapshot(prev));
        return;
      }

      setFormData((prev) => applyProfilPayrollToForm(prev, profile));
    },
    [profilPayrollMap],
  );

  const resetForm = useCallback(() => {
    setFormData(buildDefaultForm(filterPeriode));
  }, [filterPeriode]);

  useEffect(() => {
    if (!isCreateModalOpen) return;

    const selectedPeriodeId = String(formData.id_periode_payroll || '').trim();
    const selectedUserId = String(formData.id_user || '').trim();

    if (!selectedPeriodeId || !selectedUserId) return;

    const usedUserIds = payrollUserIdsByPeriode.get(selectedPeriodeId);

    if (!usedUserIds?.has(selectedUserId)) return;

    setFormData((prev) => clearSelectedEmployeeSnapshot(prev));
    AppMessage.warning('Karyawan yang dipilih sudah memiliki payroll pada periode tersebut.');
  }, [formData.id_periode_payroll, formData.id_user, isCreateModalOpen, payrollUserIdsByPeriode]);

  const validateForm = useCallback(() => {
    if (!String(formData.id_periode_payroll || '').trim()) {
      AppMessage.warning('Periode payroll wajib dipilih.');
      return false;
    }

    if (!String(formData.id_user || '').trim()) {
      AppMessage.warning('ID user wajib diisi.');
      return false;
    }

    if (!String(formData.nama_karyawan_snapshot || '').trim()) {
      AppMessage.warning('Nama karyawan wajib diisi.');
      return false;
    }

    const approvalSteps = Array.isArray(formData.approval_steps) ? formData.approval_steps : [];

    if (approvalSteps.length === 0) {
      AppMessage.warning('Minimal satu approval payroll wajib dipilih.');
      return false;
    }

    const approverIds = approvalSteps.map((step) => String(step?.approver_user_id || '').trim());

    if (approverIds.some((approverId) => !approverId)) {
      AppMessage.warning('Setiap level approval payroll wajib memilih user approver.');
      return false;
    }

    if (new Set(approverIds).size !== approverIds.length) {
      AppMessage.warning('User approver tidak boleh dipilih lebih dari satu kali pada payroll yang sama.');
      return false;
    }

    return true;
  }, [formData.approval_steps, formData.id_periode_payroll, formData.id_user, formData.nama_karyawan_snapshot]);

  const openCreateModal = useCallback(() => {
    setSelectedPayroll(null);
    resetForm();
    setIsCreateModalOpen(true);
  }, [resetForm]);

  const closeCreateModal = useCallback(() => {
    if (isSubmitting) return;

    setIsCreateModalOpen(false);
    resetForm();
  }, [isSubmitting, resetForm]);

  const openEditModal = useCallback((payroll) => {
    if (!payroll) return;

    setSelectedPayroll(payroll);
    setFormData({
      id_periode_payroll: payroll.id_periode_payroll || '',
      id_user: payroll.id_user || '',
      nama_karyawan_snapshot: payroll.nama_karyawan_snapshot || '',
      jenis_hubungan_snapshot: payroll.jenis_hubungan_snapshot || 'PKWTT',
      id_tarif_pajak_ter: payroll.id_tarif_pajak_ter || '',
      kode_kategori_pajak_snapshot: payroll.kode_kategori_pajak_snapshot || '',
      persen_tarif_snapshot: toNumber(payroll.persen_tarif_snapshot),
      penghasilan_dari_snapshot: toNumber(payroll.penghasilan_dari_snapshot),
      penghasilan_sampai_snapshot: payroll.penghasilan_sampai_snapshot == null ? null : toNumber(payroll.penghasilan_sampai_snapshot),
      berlaku_mulai_tarif_snapshot: payroll.berlaku_mulai_tarif_snapshot || '',
      berlaku_sampai_tarif_snapshot: payroll.berlaku_sampai_tarif_snapshot || null,
      nama_departement_snapshot: payroll.nama_departement_snapshot || '',
      nama_jabatan_snapshot: payroll.nama_jabatan_snapshot || '',
      nama_bank_snapshot: payroll.nama_bank_snapshot || '',
      nomor_rekening_snapshot: payroll.nomor_rekening_snapshot || '',
      issue_number: payroll.issue_number || '',
      issued_at: formatDateTimeLocalInput(payroll.issued_at),
      company_name_snapshot: payroll.company_name_snapshot || '',
      total_pendapatan_tetap: toNumber(payroll.total_pendapatan_tetap),
      total_pendapatan_variabel: toNumber(payroll.total_pendapatan_variabel),
      total_bruto_kena_pajak: toNumber(payroll.total_bruto_kena_pajak),
      persen_pajak: toNumber(payroll.persen_pajak),
      total_pajak: toNumber(payroll.total_pajak),
      total_potongan_lain: toNumber(payroll.total_potongan_lain),
      total_dibayarkan: toNumber(payroll.total_dibayarkan),
      status_payroll: payroll.status_payroll || 'DRAFT',
      status_approval: payroll.status_approval || 'pending',
      current_level_approval: payroll.current_level_approval || 1,
      approval_steps: mapApprovalStepsForForm(payroll),
      dibayar_pada: payroll.dibayar_pada || null,
      catatan: payroll.catatan || '',
    });
    setIsEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    if (isSubmitting) return;

    setIsEditModalOpen(false);
    setSelectedPayroll(null);
    resetForm();
  }, [isSubmitting, resetForm]);

  const openDetailModal = useCallback((payroll) => {
    if (!payroll) return;
    setSelectedPayroll(payroll);
    setIsDetailModalOpen(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedPayroll(null);
  }, []);

  const openApproveModal = useCallback(
    (payroll) => {
      if (!payroll) return;

      const approvalStep = getActionableApprovalStep(payroll);
      if (!approvalStep?.id_approval_payroll_karyawan) {
        AppMessage.warning('Payroll ini tidak memiliki approval aktif yang bisa diproses.');
        return;
      }

      setApprovalTargetPayroll(payroll);
      setIsApproveModalOpen(true);
    },
    [getActionableApprovalStep],
  );

  const closeApproveModal = useCallback(() => {
    if (isSubmitting) return;

    setIsApproveModalOpen(false);
    setApprovalTargetPayroll(null);
  }, [isSubmitting]);

  const openDeleteDialog = useCallback((payroll) => {
    if (!payroll) return;
    setSelectedPayroll(payroll);
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    if (isSubmitting) return;

    setIsDeleteDialogOpen(false);
    setSelectedPayroll(null);
  }, [isSubmitting]);

  const handleCreate = useCallback(async () => {
    if (isSubmitting) return false;
    if (!validateForm()) return false;

    setIsSubmitting(true);
    try {
      const response = await crudServiceAuth.post(ApiEndpoints.CreatePayrollKaryawan(), buildPayrollKaryawanPayload(formData));

      AppMessage.success(response?.message || 'Payroll karyawan berhasil ditambahkan.');
      setIsCreateModalOpen(false);
      resetForm();
      await mutatePayroll();
      return true;
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menambahkan payroll karyawan.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, mutatePayroll, resetForm, validateForm]);

  const handleEdit = useCallback(async () => {
    if (isSubmitting) return false;

    if (!resolvedSelectedPayroll?.id_payroll_karyawan) {
      AppMessage.warning('Data payroll tidak ditemukan.');
      return false;
    }

    if (!validateForm()) return false;

    setIsSubmitting(true);
    try {
      const response = await crudServiceAuth.put(ApiEndpoints.UpdatePayrollKaryawan(resolvedSelectedPayroll.id_payroll_karyawan), buildPayrollKaryawanPayload(formData));

      AppMessage.success(response?.message || 'Payroll karyawan berhasil diperbarui.');
      setIsEditModalOpen(false);
      setSelectedPayroll(null);
      resetForm();
      await mutatePayroll();
      return true;
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memperbarui payroll karyawan.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, mutatePayroll, resetForm, resolvedSelectedPayroll, validateForm]);

  const handleDelete = useCallback(async () => {
    if (isSubmitting) return false;

    if (!resolvedSelectedPayroll?.id_payroll_karyawan) {
      AppMessage.warning('Data payroll tidak ditemukan.');
      return false;
    }

    setIsSubmitting(true);
    try {
      const response = await crudServiceAuth.delete(ApiEndpoints.DeletePayrollKaryawan(resolvedSelectedPayroll.id_payroll_karyawan));

      AppMessage.success(response?.message || 'Payroll karyawan berhasil dihapus.');
      setIsDeleteDialogOpen(false);
      setIsDetailModalOpen(false);
      setSelectedPayroll(null);
      await mutatePayroll();
      return true;
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menghapus payroll karyawan.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, mutatePayroll, resolvedSelectedPayroll]);

  const handleApprove = useCallback(
    async ({ ttdFiles = [], note = '' } = {}) => {
      if (isSubmitting) return false;

      const payroll = resolvedApprovalTargetPayroll;
      if (!payroll?.id_payroll_karyawan) {
        AppMessage.warning('Data payroll approval tidak ditemukan.');
        return false;
      }

      const approvalStep = getActionableApprovalStep(payroll);
      if (!approvalStep?.id_approval_payroll_karyawan) {
        AppMessage.warning('Approval aktif payroll tidak ditemukan.');
        return false;
      }

      const fileObj = ttdFiles?.[0]?.originFileObj;
      const normalizedNote = String(note || '').trim();

      if (!fileObj) {
        AppMessage.warning('TTD approval wajib diisi.');
        return false;
      }

      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('decision', 'disetujui');

        formData.append('ttd_approval', fileObj);

        if (normalizedNote) {
          formData.append('note', normalizedNote);
        }

        const response = await crudServiceAuth.patchForm(
          ApiEndpoints.ApprovePayrollKaryawan(approvalStep.id_approval_payroll_karyawan),
          formData,
        );

        AppMessage.success(response?.message || 'Approval payroll karyawan berhasil disimpan.');
        setIsApproveModalOpen(false);
        setApprovalTargetPayroll(null);
        await mutatePayroll();
        return true;
      } catch (err) {
        AppMessage.error(err?.message || 'Gagal menyimpan approval payroll karyawan.');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [getActionableApprovalStep, isSubmitting, mutatePayroll, resolvedApprovalTargetPayroll],
  );

  const filteredData = useMemo(() => {
    return payrollData.filter((payroll) => {
      const matchStatus = filterStatus === 'ALL' ? true : payroll.status_payroll === filterStatus;
      const matchPeriode = filterPeriode === 'ALL' ? true : payroll.id_periode_payroll === filterPeriode;
      const search = normalizeText(searchQuery);
      const matchSearch =
        !search ||
        normalizeText(payroll.nama_karyawan_snapshot).includes(search) ||
        normalizeText(payroll.nama_departement_snapshot).includes(search) ||
        normalizeText(payroll.nama_jabatan_snapshot).includes(search) ||
        normalizeText(payroll.kode_kategori_pajak_snapshot).includes(search) ||
        normalizeText(payroll.periode_label).includes(search) ||
        normalizeText(payroll.current_approval_label).includes(search);

      return matchStatus && matchPeriode && matchSearch;
    });
  }, [filterPeriode, filterStatus, payrollData, searchQuery]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const periodeA = periodeMap.get(a.id_periode_payroll);
      const periodeB = periodeMap.get(b.id_periode_payroll);
      const dateA = new Date(periodeA?.tanggal_mulai || 0).getTime();
      const dateB = new Date(periodeB?.tanggal_mulai || 0).getTime();

      if (dateA !== dateB) {
        return dateB - dateA;
      }

      return String(a.nama_karyawan_snapshot || '').localeCompare(String(b.nama_karyawan_snapshot || ''));
    });
  }, [filteredData, periodeMap]);

  const statistics = useMemo(() => {
    return {
      totalPayroll: payrollData.length,
      totalApprovalPending: payrollData.filter((item) => item.status_approval === 'pending').length,
      totalDibayar: payrollData.filter((item) => item.status_payroll === 'DIBAYAR').length,
      totalPendapatan: payrollData.reduce((sum, item) => sum + toNumber(item.total_bruto_kena_pajak), 0),
      totalDibayarkan: payrollData.reduce((sum, item) => sum + toNumber(item.total_dibayarkan), 0),
    };
  }, [payrollData]);

  const periodeOptions = useMemo(() => {
    return periodeList.map((periode) => ({
      value: periode.id_periode_payroll,
      label: formatPeriodeLabel(periode),
    }));
  }, [periodeList]);

  const availableEmployeeProfiles = useMemo(() => {
    const selectedPeriodeId = String(formData.id_periode_payroll || '').trim();
    const selectedUserId = String(formData.id_user || '').trim();
    const usedUserIds = selectedPeriodeId ? payrollUserIdsByPeriode.get(selectedPeriodeId) : null;

    return activeProfilPayrollList.filter((profile) => {
      const userId = String(profile?.id_user || '').trim();

      if (!userId) return false;
      if (selectedUserId && userId === selectedUserId) return true;
      if (!usedUserIds) return true;

      return !usedUserIds.has(userId);
    });
  }, [activeProfilPayrollList, formData.id_periode_payroll, formData.id_user, payrollUserIdsByPeriode]);

  const employeeOptions = useMemo(() => availableEmployeeProfiles.map(buildEmployeeOption), [availableEmployeeProfiles]);
  const approverOptions = useMemo(() => activeApproverUsers.map(buildApproverOption), [activeApproverUsers]);

  const selectedEmployeeProfile = useMemo(() => {
    const selectedUserId = String(formData.id_user || '').trim();
    if (!selectedUserId) return null;

    return profilPayrollMap.get(selectedUserId) || null;
  }, [formData.id_user, profilPayrollMap]);

  const selectedEmployeeTarifLabel = useMemo(() => formatTarifPajakSnapshot(formData.kode_kategori_pajak_snapshot, formData.persen_tarif_snapshot), [formData.kode_kategori_pajak_snapshot, formData.persen_tarif_snapshot]);

  const employeeSelectionHint = useMemo(() => {
    if (isProfilPayrollLoading) {
      return 'Memuat kandidat karyawan payroll...';
    }

    if (activeProfilPayrollList.length === 0) {
      return 'Belum ada profil payroll aktif yang bisa dipakai. Lengkapi profil payroll terlebih dahulu.';
    }

    if (!String(formData.id_periode_payroll || '').trim()) {
      return 'Pilih periode payroll terlebih dahulu agar kandidat karyawan bisa difilter per periode.';
    }

    if (employeeOptions.length === 0) {
      return 'Semua karyawan dengan profil payroll aktif sudah memiliki payroll pada periode ini.';
    }

    return 'Cari berdasarkan nama, NIK, email, departemen, atau jabatan.';
  }, [activeProfilPayrollList.length, employeeOptions.length, formData.id_periode_payroll, isProfilPayrollLoading]);

  const approverSelectionHint = useMemo(() => {
    if (isUsersLoading) {
      return 'Memuat user approver payroll...';
    }

    if (activeApproverUsers.length === 0) {
      return 'Belum ada user aktif yang bisa dipilih sebagai approver payroll.';
    }

    return 'Tambahkan satu level untuk single approver, atau beberapa level untuk approval berjenjang.';
  }, [activeApproverUsers.length, isUsersLoading]);

  const getPeriodeInfo = useCallback(
    (id) => {
      const periode = periodeMap.get(String(id || ''));
      if (!periode) return 'Unknown';

      return formatPeriodeLabel(periode);
    },
    [periodeMap],
  );

  const reloadData = useCallback(async () => {
    await Promise.all([mutatePayroll(), mutatePeriode(), mutateProfilPayroll(), mutateUsers()]);
  }, [mutatePayroll, mutatePeriode, mutateProfilPayroll, mutateUsers]);

  const focusedPeriode = useMemo(() => {
    if (!filterPeriode || filterPeriode === 'ALL') return null;
    return periodeMap.get(filterPeriode) || null;
  }, [filterPeriode, periodeMap]);

  return {
    payrollData,
    selectedPayroll: resolvedSelectedPayroll,
    sortedData,
    statistics,
    periodeOptions,
    focusedPeriode,
    employeeOptions,
    approverOptions,
    selectedEmployeeProfile,
    selectedEmployeeTarifLabel,
    employeeSelectionHint,
    approverSelectionHint,

    formData,
    filterStatus,
    filterPeriode,
    searchQuery,

    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isDetailModalOpen,
    isApproveModalOpen,

    loading: isPayrollLoading || isPeriodeLoading || isProfilPayrollLoading || isUsersLoading,
    validating: isPayrollValidating || isPeriodeValidating || isProfilPayrollValidating || isUsersValidating,
    isSubmitting,
    error: payrollError || periodeError || profilPayrollError || usersError,

    formatCurrency,
    formatDate,
    formatDateTime,
    formatStatusPayroll,
    formatStatusApproval,
    formatApproverRole,
    formatJenisHubungan,
    formatTarifPajakSnapshot,
    formatBulan,
    getPeriodeInfo,
    reloadData,

    setFormValue,
    handleEmployeeChange,
    addApprovalStep,
    removeApprovalStep,
    updateApprovalStep,
    resetForm,
    setFilterStatus,
    setFilterPeriode,
    setSearchQuery,

    openCreateModal,
    closeCreateModal,
    handleCreate,

    openEditModal,
    closeEditModal,
    handleEdit,

    openDetailModal,
    closeDetailModal,

    approvalTargetPayroll: resolvedApprovalTargetPayroll,
    openApproveModal,
    closeApproveModal,
    handleApprove,
    getActionableApprovalStep,

    openDeleteDialog,
    closeDeleteDialog,
    handleDelete,

    statusOptions: STATUS_PAYROLL_OPTIONS,
    filterEmployeeOption,
    filterApproverOption,
    getApproverById: (id) => approverUsersMap.get(String(id || '').trim()) || null,
  };
}
