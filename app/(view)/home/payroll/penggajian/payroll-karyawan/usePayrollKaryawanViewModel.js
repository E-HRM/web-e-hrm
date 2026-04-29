'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { useAuth } from '@/app/utils/auth/authService';
import { crudServiceAuth } from '@/app/utils/services/crudServiceAuth';
import { ApiEndpoints } from '@/constrainst/endpoints';
import { buildNextPayrollSlipNumber } from '@/helpers/payrollSlipNumber';

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
const TARIF_PAJAK_TER_SWR_KEY = 'payroll:payroll-karyawan:tarif-pajak-ter';

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

function buildDefaultForm(filterPeriode) {
  return createInitialPayrollKaryawanForm(filterPeriode && filterPeriode !== 'ALL' ? filterPeriode : '');
}

function getProfilPayrollSubjectKey(profile) {
  const idFreelance = String(profile?.id_freelance || '').trim();
  if (idFreelance) return `FREELANCE:${idFreelance}`;

  const idUser = String(profile?.id_user || '').trim();
  return idUser ? `USER:${idUser}` : '';
}

function getPayrollSubjectKey(payroll) {
  const idFreelance = String(payroll?.id_freelance || '').trim();
  if (idFreelance) return `FREELANCE:${idFreelance}`;

  const idUser = String(payroll?.id_user || '').trim();
  return idUser ? `USER:${idUser}` : '';
}

function getProfilPayrollEmployeeName(profile) {
  return String(profile?.user?.nama_pengguna || profile?.freelance?.nama || '').trim();
}

function getProfilPayrollEmployeeIdentity(profile) {
  return String(profile?.user?.nomor_induk_karyawan || profile?.freelance?.email || profile?.freelance?.kontak || profile?.id_freelance || '').trim();
}

function getProfilPayrollEmployeeDepartment(profile) {
  return String(profile?.user?.departement?.nama_departement || '').trim();
}

function getProfilPayrollEmployeeJob(profile) {
  return String(profile?.user?.jabatan?.nama_jabatan || (profile?.id_freelance ? 'Freelance' : '')).trim();
}

function buildEmployeeOption(profile) {
  const employeeName = getProfilPayrollEmployeeName(profile);
  const employeeIdentity = getProfilPayrollEmployeeIdentity(profile);
  const employeeDepartment = getProfilPayrollEmployeeDepartment(profile);
  const employeeJob = getProfilPayrollEmployeeJob(profile);
  const metadata = [employeeIdentity, employeeDepartment, employeeJob].filter(Boolean).join(' | ');

  return {
    value: getProfilPayrollSubjectKey(profile),
    label: metadata ? `${employeeName} (${metadata})` : employeeName,
    plainLabel: employeeName,
    title: employeeName,
    searchText: [employeeName, employeeIdentity, profile?.user?.email, profile?.freelance?.email, profile?.freelance?.kontak, employeeDepartment, employeeJob, profile?.id_user, profile?.id_freelance].filter(Boolean).join(' '),
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

function formatTarifPajakIncomeRange(tarif) {
  if (!tarif) return '-';

  const minIncome = formatCurrency(tarif.penghasilan_dari);
  const maxIncome = tarif.penghasilan_sampai == null ? null : formatCurrency(tarif.penghasilan_sampai);

  return maxIncome ? `${minIncome} - ${maxIncome}` : `${minIncome} ke atas`;
}

function formatTarifPajakLabel(tarif, fallbackId = null) {
  if (!tarif) {
    return fallbackId ? `Tarif tidak ditemukan (${fallbackId})` : '-';
  }

  const kodeKategoriPajak = String(tarif.kode_kategori_pajak || '').trim() || '-';
  const persenTarif = toNumber(tarif.persen_tarif).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });

  return `${kodeKategoriPajak} | ${formatTarifPajakIncomeRange(tarif)} | ${persenTarif}%`;
}

function normalizeRole(value) {
  return String(value || '')
    .trim()
    .toUpperCase();
}

function isPendingApprovalDecision(value) {
  return (
    String(value || 'pending')
      .trim()
      .toLowerCase() === 'pending'
  );
}

function findActionableApprovalStep(payroll, actorId, actorRole) {
  const approvalSteps = Array.isArray(payroll?.approval_steps) ? payroll.approval_steps : [];
  const pendingSteps = approvalSteps.filter((step) => isPendingApprovalDecision(step?.decision));

  if (pendingSteps.length === 0) return null;

  const normalizedActorId = String(actorId || '').trim();
  const normalizedActorRole = normalizeRole(actorRole);

  if (normalizedActorId) {
    const stepByUser = pendingSteps.find((step) => String(step?.approver_user_id || '').trim() === normalizedActorId);
    if (stepByUser) return stepByUser;
  }

  if (normalizedActorRole) {
    const stepByRole = pendingSteps.find((step) => !String(step?.approver_user_id || '').trim() && normalizeRole(step?.approver_role) === normalizedActorRole);
    if (stepByRole) return stepByRole;
  }

  if (normalizedActorRole === 'SUPERADMIN') {
    return pendingSteps[0] || null;
  }

  return null;
}

function clearSelectedEmployeeSnapshot(previousForm) {
  return {
    ...previousForm,
    id_user: '',
    id_freelance: '',
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
    nama_pemilik_rekening_snapshot: '',
    gaji_pokok_snapshot: 0,
    tunjangan_bpjs_snapshot: 0,
    total_pendapatan_tetap: 0,
    total_pendapatan_variabel: 0,
    total_bruto_kena_pajak: 0,
    persen_pajak: 0,
    total_pajak: 0,
    total_potongan_lain: 0,
    total_dibayarkan: 0,
  };
}

function buildTarifSnapshotFromForm(previousForm, totalBruto) {
  const persenTarifSnapshot = toNumber(previousForm.persen_tarif_snapshot);
  const totalPajak = calculatePayrollPph21Nominal(totalBruto, persenTarifSnapshot);
  const totalPotonganLain = toNumber(previousForm.total_potongan_lain);
  const tunjanganBpjs = toNumber(previousForm.tunjangan_bpjs_snapshot);

  return {
    total_bruto_kena_pajak: totalBruto,
    persen_pajak: persenTarifSnapshot,
    total_pajak: totalPajak,
    total_dibayarkan: Math.max(totalBruto - totalPajak - totalPotonganLain - tunjanganBpjs, 0),
  };
}

function applyProfilPayrollToForm(previousForm, profile) {
  if (!profile) return clearSelectedEmployeeSnapshot(previousForm);

  const idUser = String(profile.id_user || '').trim();
  const idFreelance = String(profile.id_freelance || '').trim();
  const gajiPokok = toNumber(profile?.gaji_pokok);
  const tunjanganBpjs = toNumber(profile?.tunjangan_bpjs);
  const totalPendapatanTetap = gajiPokok;
  const totalSnapshot = buildTarifSnapshotFromForm(
    {
      ...previousForm,
      tunjangan_bpjs_snapshot: tunjanganBpjs,
      total_potongan_lain: 0,
    },
    totalPendapatanTetap,
  );

  return {
    ...previousForm,
    id_user: idUser,
    id_freelance: idFreelance,
    nama_karyawan_snapshot: getProfilPayrollEmployeeName(profile),
    jenis_hubungan_snapshot: idFreelance
      ? 'FREELANCE'
      : String(profile?.jenis_hubungan_kerja || 'PKWTT')
          .trim()
          .toUpperCase(),
    nama_departement_snapshot: getProfilPayrollEmployeeDepartment(profile),
    nama_jabatan_snapshot: getProfilPayrollEmployeeJob(profile),
    nama_bank_snapshot: String((idFreelance ? profile?.freelance?.jenis_bank : profile?.user?.jenis_bank) || '').trim(),
    nomor_rekening_snapshot: String((idFreelance ? profile?.freelance?.nomor_rekening : profile?.user?.nomor_rekening) || '').trim(),
    nama_pemilik_rekening_snapshot: String((idFreelance ? profile?.freelance?.nama_pemilik_rekening : profile?.user?.nama_pemilik_rekening) || '').trim(),
    gaji_pokok_snapshot: gajiPokok,
    tunjangan_bpjs_snapshot: tunjanganBpjs,
    total_pendapatan_tetap: totalPendapatanTetap,
    total_pendapatan_variabel: 0,
    total_potongan_lain: 0,
    ...totalSnapshot,
  };
}

function applyTarifPajakToForm(previousForm, tarif) {
  const totalBruto = toNumber(previousForm.total_bruto_kena_pajak) || toNumber(previousForm.total_pendapatan_tetap) + toNumber(previousForm.total_pendapatan_variabel);

  if (!tarif) {
    const totalSnapshot = buildTarifSnapshotFromForm(
      {
        ...previousForm,
        persen_tarif_snapshot: 0,
        total_potongan_lain: previousForm.total_potongan_lain,
      },
      totalBruto,
    );

    return {
      ...previousForm,
      id_tarif_pajak_ter: '',
      kode_kategori_pajak_snapshot: '',
      persen_tarif_snapshot: 0,
      penghasilan_dari_snapshot: 0,
      penghasilan_sampai_snapshot: null,
      berlaku_mulai_tarif_snapshot: '',
      berlaku_sampai_tarif_snapshot: null,
      ...totalSnapshot,
    };
  }

  const persenTarifSnapshot = toNumber(tarif.persen_tarif);
  const totalSnapshot = buildTarifSnapshotFromForm(
    {
      ...previousForm,
      persen_tarif_snapshot: persenTarifSnapshot,
    },
    totalBruto,
  );

  return {
    ...previousForm,
    id_tarif_pajak_ter: String(tarif.id_tarif_pajak_ter || '').trim(),
    kode_kategori_pajak_snapshot: String(tarif.kode_kategori_pajak || '').trim(),
    persen_tarif_snapshot: persenTarifSnapshot,
    penghasilan_dari_snapshot: toNumber(tarif.penghasilan_dari),
    penghasilan_sampai_snapshot: tarif.penghasilan_sampai == null ? null : toNumber(tarif.penghasilan_sampai),
    berlaku_mulai_tarif_snapshot: tarif.berlaku_mulai || '',
    berlaku_sampai_tarif_snapshot: tarif.berlaku_sampai || null,
    ...totalSnapshot,
  };
}

function mapApprovalStepsForForm(payroll) {
  const sourceSteps = Array.isArray(payroll?.approval_steps) ? payroll.approval_steps : Array.isArray(payroll?.approvals) ? payroll.approvals : [];

  if (!sourceSteps.length) {
    return [createEmptyApprovalStep()];
  }

  return sourceSteps.map((step) => ({
    client_key: createEmptyApprovalStep().client_key,
    approver_user_id: String(step?.approver_user_id || '').trim(),
  }));
}

function buildIssueNumberPreview(periodeMap, payrollData, periodeId, excludePayrollId = '') {
  const normalizedPeriodeId = String(periodeId || '').trim();
  if (!normalizedPeriodeId) return '';

  const periode = periodeMap.get(normalizedPeriodeId);
  if (!periode) return '';

  const rows = payrollData.filter((item) => String(item?.id_periode_payroll || '').trim() === normalizedPeriodeId);
  return buildNextPayrollSlipNumber(periode, rows, { excludePayrollId });
}

export default function usePayrollKaryawanViewModel() {
  const searchParams = useSearchParams();
  const auth = useAuth();
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
  const [isRequestingApprovalOtp, setIsRequestingApprovalOtp] = useState(false);

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

  const {
    data: tarifPajakResponse,
    error: tarifPajakError,
    isLoading: isTarifPajakLoading,
    isValidating: isTarifPajakValidating,
    mutate: mutateTarifPajak,
  } = useSWR(TARIF_PAJAK_TER_SWR_KEY, fetchAllTarifPajakTER, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!payrollError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payroll-karyawan-fetch-error',
      content: payrollError?.message || 'Gagal memuat data penggajian karyawan.',
    });
  }, [payrollError]);

  useEffect(() => {
    if (!periodeError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payroll-karyawan-periode-fetch-error',
      content: periodeError?.message || 'Gagal memuat daftar periode penggajian.',
    });
  }, [periodeError]);

  useEffect(() => {
    if (!profilPayrollError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payroll-karyawan-profil-payroll-fetch-error',
      content: profilPayrollError?.message || 'Gagal memuat daftar profil yang dapat diproses penggajiannya.',
    });
  }, [profilPayrollError]);

  useEffect(() => {
    if (!usersError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payroll-karyawan-approver-fetch-error',
      content: usersError?.message || 'Gagal memuat daftar penyetuju.',
    });
  }, [usersError]);

  useEffect(() => {
    if (!tarifPajakError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payroll-karyawan-tarif-pajak-fetch-error',
      content: tarifPajakError?.message || 'Gagal memuat data tarif pajak TER.',
    });
  }, [tarifPajakError]);

  const periodeList = useMemo(() => (Array.isArray(periodeResponse) ? periodeResponse : []), [periodeResponse]);
  const profilPayrollList = useMemo(() => (Array.isArray(profilPayrollResponse) ? profilPayrollResponse : []), [profilPayrollResponse]);
  const usersList = useMemo(() => (Array.isArray(usersResponse) ? usersResponse : []), [usersResponse]);
  const tarifPajakList = useMemo(() => (Array.isArray(tarifPajakResponse) ? tarifPajakResponse : []), [tarifPajakResponse]);
  const payrollData = useMemo(() => {
    const rawList = Array.isArray(payrollResponse) ? payrollResponse : [];
    return rawList.map(normalizePayrollKaryawanItem).filter(Boolean);
  }, [payrollResponse]);

  const activeProfilPayrollList = useMemo(() => {
    return profilPayrollList.filter((profile) => {
      const subjectKey = getProfilPayrollSubjectKey(profile);
      const userDeleted = profile?.id_user ? Boolean(profile?.user?.deleted_at) : false;
      const freelanceDeleted = profile?.id_freelance ? Boolean(profile?.freelance?.deleted_at) : false;

      return !profile?.deleted_at && Boolean(profile?.payroll_aktif) && Boolean(subjectKey) && !userDeleted && !freelanceDeleted;
    });
  }, [profilPayrollList]);

  const activeApproverUsers = useMemo(() => {
    return usersList.filter((user) => !user?.deleted_at && String(user?.id_user || '').trim());
  }, [usersList]);

  const profilPayrollMap = useMemo(() => new Map(activeProfilPayrollList.map((profile) => [getProfilPayrollSubjectKey(profile), profile])), [activeProfilPayrollList]);
  const approverUsersMap = useMemo(() => new Map(activeApproverUsers.map((user) => [String(user.id_user), user])), [activeApproverUsers]);
  const tarifPajakMap = useMemo(() => new Map(tarifPajakList.map((tarif) => [String(tarif.id_tarif_pajak_ter), tarif])), [tarifPajakList]);

  const payrollSubjectKeysByPeriode = useMemo(() => {
    const usageMap = new Map();

    payrollData.forEach((item) => {
      const periodeId = String(item?.id_periode_payroll || '').trim();
      const subjectKey = getPayrollSubjectKey(item);

      if (!periodeId || !subjectKey) return;

      if (!usageMap.has(periodeId)) {
        usageMap.set(periodeId, new Set());
      }

      usageMap.get(periodeId).add(subjectKey);
    });

    return usageMap;
  }, [payrollData]);

  const periodeMap = useMemo(() => new Map(periodeList.map((item) => [String(item.id_periode_payroll), item])), [periodeList]);
  const getIssueNumberPreview = useCallback(
    (periodeId, excludePayrollId = '') => buildIssueNumberPreview(periodeMap, payrollData, periodeId, excludePayrollId),
    [payrollData, periodeMap],
  );

  const resolvedSelectedPayroll = useMemo(() => {
    if (!selectedPayroll) return null;

    return payrollData.find((item) => item.id_payroll_karyawan === selectedPayroll.id_payroll_karyawan) || selectedPayroll;
  }, [payrollData, selectedPayroll]);

  const resolvedApprovalTargetPayroll = useMemo(() => {
    if (!approvalTargetPayroll) return null;

    return payrollData.find((item) => item.id_payroll_karyawan === approvalTargetPayroll.id_payroll_karyawan) || approvalTargetPayroll;
  }, [approvalTargetPayroll, payrollData]);

  const getActionableApprovalStep = useCallback(
    (payroll) => {
      if (!payroll) return null;

      return findActionableApprovalStep(payroll, auth.userId, auth.role);
    },
    [auth.role, auth.userId],
  );

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
      const nextSubjectKey = String(value || '').trim();

      if (!nextSubjectKey) {
        setFormData((prev) => clearSelectedEmployeeSnapshot(prev));
        return;
      }

      const profile = profilPayrollMap.get(nextSubjectKey);

      if (!profile) {
        AppMessage.warning('Profil penggajian tidak ditemukan.');
        setFormData((prev) => clearSelectedEmployeeSnapshot(prev));
        return;
      }

      setFormData((prev) => applyProfilPayrollToForm(prev, profile));
    },
    [profilPayrollMap],
  );

  const handleTarifPajakChange = useCallback(
    (value) => {
      const nextTarifId = String(value || '').trim();

      if (!nextTarifId) {
        setFormData((prev) => applyTarifPajakToForm(prev, null));
        return;
      }

      const tarif = tarifPajakMap.get(nextTarifId);

      if (!tarif) {
        AppMessage.warning('Tarif pajak TER tidak ditemukan.');
        setFormData((prev) => applyTarifPajakToForm(prev, null));
        return;
      }

      setFormData((prev) => applyTarifPajakToForm(prev, tarif));
    },
    [tarifPajakMap],
  );

  const resetForm = useCallback(() => {
    setFormData(buildDefaultForm(filterPeriode));
  }, [filterPeriode]);

  useEffect(() => {
    if (!isCreateModalOpen) return;

    const selectedPeriodeId = String(formData.id_periode_payroll || '').trim();
    const selectedSubjectKey = getPayrollSubjectKey(formData);

    if (!selectedPeriodeId || !selectedSubjectKey) return;

    const usedSubjectKeys = payrollSubjectKeysByPeriode.get(selectedPeriodeId);

    if (!usedSubjectKeys?.has(selectedSubjectKey)) return;

    setFormData((prev) => clearSelectedEmployeeSnapshot(prev));
    AppMessage.warning('Subjek payroll yang dipilih sudah memiliki data penggajian pada periode tersebut.');
  }, [formData, isCreateModalOpen, payrollSubjectKeysByPeriode]);

  useEffect(() => {
    if (!isCreateModalOpen) return;

    const nextIssueNumber = getIssueNumberPreview(formData.id_periode_payroll);

    setFormData((prev) => {
      if (prev.issue_number === nextIssueNumber) return prev;
      return {
        ...prev,
        issue_number: nextIssueNumber,
      };
    });
  }, [formData.id_periode_payroll, getIssueNumberPreview, isCreateModalOpen]);

  useEffect(() => {
    if (!isEditModalOpen || !resolvedSelectedPayroll?.id_payroll_karyawan) return;

    const currentPeriodeId = String(formData.id_periode_payroll || '').trim();
    const originalPeriodeId = String(resolvedSelectedPayroll.id_periode_payroll || '').trim();
    const originalIssueNumber = String(resolvedSelectedPayroll.issue_number || '').trim();
    const nextIssueNumber =
      currentPeriodeId === originalPeriodeId && originalIssueNumber
        ? originalIssueNumber
        : getIssueNumberPreview(currentPeriodeId, resolvedSelectedPayroll.id_payroll_karyawan);

    setFormData((prev) => {
      if (prev.issue_number === nextIssueNumber) return prev;
      return {
        ...prev,
        issue_number: nextIssueNumber,
      };
    });
  }, [
    formData.id_periode_payroll,
    getIssueNumberPreview,
    isEditModalOpen,
    resolvedSelectedPayroll?.id_payroll_karyawan,
    resolvedSelectedPayroll?.id_periode_payroll,
    resolvedSelectedPayroll?.issue_number,
  ]);

  const validateForm = useCallback(() => {
    if (!String(formData.id_periode_payroll || '').trim()) {
      AppMessage.warning('Periode penggajian wajib dipilih.');
      return false;
    }

    const idUser = String(formData.id_user || '').trim();
    const idFreelance = String(formData.id_freelance || '').trim();

    if (!idUser && !idFreelance) {
      AppMessage.warning('Karyawan atau freelance wajib dipilih.');
      return false;
    }

    if (idUser && idFreelance) {
      AppMessage.warning('Pilih salah satu saja: karyawan atau freelance.');
      return false;
    }

    if (!String(formData.nama_karyawan_snapshot || '').trim()) {
      AppMessage.warning('Nama karyawan wajib diisi.');
      return false;
    }

    const approvalSteps = Array.isArray(formData.approval_steps) ? formData.approval_steps : [];

    if (approvalSteps.length === 0) {
      AppMessage.warning('Minimal satu penyetuju wajib dipilih.');
      return false;
    }

    const approverIds = approvalSteps.map((step) => String(step?.approver_user_id || '').trim());

    if (approverIds.some((approverId) => !approverId)) {
      AppMessage.warning('Setiap tahap persetujuan wajib memiliki penyetuju.');
      return false;
    }

    if (new Set(approverIds).size !== approverIds.length) {
      AppMessage.warning('Penyetuju tidak boleh dipilih lebih dari satu kali pada data penggajian yang sama.');
      return false;
    }

    return true;
  }, [formData.approval_steps, formData.id_freelance, formData.id_periode_payroll, formData.id_user, formData.nama_karyawan_snapshot]);

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
      id_freelance: payroll.id_freelance || '',
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
      nama_pemilik_rekening_snapshot: payroll.nama_pemilik_rekening_snapshot || '',
      gaji_pokok_snapshot: toNumber(payroll.gaji_pokok_snapshot),
      issue_number: payroll.issue_number || '',
      issued_at: formatDateTimeLocalInput(payroll.issued_at),
      company_name_snapshot: payroll.company_name_snapshot || '',
      tunjangan_bpjs_snapshot: toNumber(payroll.tunjangan_bpjs_snapshot),
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
        AppMessage.warning('Tidak ada persetujuan yang perlu Anda proses untuk data ini.');
        return;
      }

      setApprovalTargetPayroll(payroll);
      setIsApproveModalOpen(true);
    },
    [getActionableApprovalStep],
  );

  const closeApproveModal = useCallback(() => {
    if (isSubmitting || isRequestingApprovalOtp) return;

    setIsApproveModalOpen(false);
    setApprovalTargetPayroll(null);
  }, [isRequestingApprovalOtp, isSubmitting]);

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

      AppMessage.success(response?.message || 'Data penggajian karyawan berhasil ditambahkan.');
      setIsCreateModalOpen(false);
      resetForm();
      await mutatePayroll();
      return true;
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menambahkan data penggajian karyawan.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, mutatePayroll, resetForm, validateForm]);

  const handleEdit = useCallback(async () => {
    if (isSubmitting) return false;

    if (!resolvedSelectedPayroll?.id_payroll_karyawan) {
      AppMessage.warning('Data penggajian tidak ditemukan.');
      return false;
    }

    if (!validateForm()) return false;

    setIsSubmitting(true);
    try {
      const response = await crudServiceAuth.put(ApiEndpoints.UpdatePayrollKaryawan(resolvedSelectedPayroll.id_payroll_karyawan), buildPayrollKaryawanPayload(formData));

      AppMessage.success(response?.message || 'Data penggajian karyawan berhasil diperbarui.');
      setIsEditModalOpen(false);
      setSelectedPayroll(null);
      resetForm();
      await mutatePayroll();
      return true;
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memperbarui data penggajian karyawan.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, mutatePayroll, resetForm, resolvedSelectedPayroll, validateForm]);

  const handleDelete = useCallback(async () => {
    if (isSubmitting) return false;

    if (!resolvedSelectedPayroll?.id_payroll_karyawan) {
      AppMessage.warning('Data penggajian tidak ditemukan.');
      return false;
    }

    setIsSubmitting(true);
    try {
      const response = await crudServiceAuth.delete(ApiEndpoints.DeletePayrollKaryawan(resolvedSelectedPayroll.id_payroll_karyawan));

      AppMessage.success(response?.message || 'Data penggajian karyawan berhasil dihapus.');
      setIsDeleteDialogOpen(false);
      setIsDetailModalOpen(false);
      setSelectedPayroll(null);
      await mutatePayroll();
      return true;
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menghapus data penggajian karyawan.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, mutatePayroll, resolvedSelectedPayroll]);

  const handleRequestApprovalOtp = useCallback(async () => {
    if (isRequestingApprovalOtp) return false;

    const payroll = resolvedApprovalTargetPayroll;
    if (!payroll?.id_payroll_karyawan) {
      AppMessage.warning('Data persetujuan tidak ditemukan.');
      return false;
    }

    const approvalStep = getActionableApprovalStep(payroll);
    if (!approvalStep?.id_approval_payroll_karyawan) {
      AppMessage.warning('Persetujuan Anda tidak ditemukan atau sudah diproses.');
      return false;
    }

    setIsRequestingApprovalOtp(true);
    try {
      const response = await crudServiceAuth.post(ApiEndpoints.RequestPayrollKaryawanApprovalOtp(approvalStep.id_approval_payroll_karyawan), {});

      AppMessage.success(response?.message || 'Kode OTP approval telah dikirim.');
      await mutatePayroll();
      return true;
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal mengirim kode OTP approval.');
      return false;
    } finally {
      setIsRequestingApprovalOtp(false);
    }
  }, [getActionableApprovalStep, isRequestingApprovalOtp, mutatePayroll, resolvedApprovalTargetPayroll]);

  const handleApprove = useCallback(
    async ({ kodeOtp = '', note = '' } = {}) => {
      if (isSubmitting) return false;

      const payroll = resolvedApprovalTargetPayroll;
      if (!payroll?.id_payroll_karyawan) {
        AppMessage.warning('Data persetujuan tidak ditemukan.');
        return false;
      }

      const approvalStep = getActionableApprovalStep(payroll);
      if (!approvalStep?.id_approval_payroll_karyawan) {
        AppMessage.warning('Persetujuan Anda tidak ditemukan atau sudah diproses.');
        return false;
      }

      const normalizedOtp = String(kodeOtp || '').trim();
      const normalizedNote = String(note || '').trim();

      if (!/^\d{6}$/.test(normalizedOtp)) {
        AppMessage.warning('Kode OTP wajib 6 digit.');
        return false;
      }

      setIsSubmitting(true);
      try {
        const response = await crudServiceAuth.patch(ApiEndpoints.ApprovePayrollKaryawan(approvalStep.id_approval_payroll_karyawan), {
          decision: 'disetujui',
          kode_otp: normalizedOtp,
          ...(normalizedNote ? { note: normalizedNote } : {}),
        });

        AppMessage.success(response?.message || 'Persetujuan penggajian karyawan berhasil disimpan.');
        setIsApproveModalOpen(false);
        setApprovalTargetPayroll(null);
        await mutatePayroll();
        return true;
      } catch (err) {
        AppMessage.error(err?.message || 'Gagal menyimpan persetujuan penggajian karyawan.');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [getActionableApprovalStep, isSubmitting, mutatePayroll, resolvedApprovalTargetPayroll],
  );

  const handleUploadBuktiBayar = useCallback(
    async ({ proofFiles = [] } = {}) => {
      if (isSubmitting) return false;

      const payroll = resolvedSelectedPayroll;
      if (!payroll?.id_payroll_karyawan) {
        AppMessage.warning('Data penggajian tidak ditemukan.');
        return false;
      }

      if (!payroll.can_upload_bukti_bayar) {
        AppMessage.warning('Bukti bayar hanya dapat diunggah setelah seluruh approval disetujui.');
        return false;
      }

      const fileObj = proofFiles?.[0]?.originFileObj;
      if (!fileObj) {
        AppMessage.warning('Bukti bayar wajib diunggah.');
        return false;
      }

      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('bukti_bayar', fileObj);

        const response = await crudServiceAuth.patchForm(ApiEndpoints.UploadBuktiBayarPayrollKaryawan(payroll.id_payroll_karyawan), formData);

        AppMessage.success(response?.message || 'Bukti bayar berhasil diunggah.');
        if (response?.data) {
          setSelectedPayroll(normalizePayrollKaryawanItem(response.data));
        }
        await mutatePayroll();
        return true;
      } catch (err) {
        AppMessage.error(err?.message || 'Gagal mengunggah bukti bayar.');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, mutatePayroll, resolvedSelectedPayroll],
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
    const selectedSubjectKey = getPayrollSubjectKey(formData);
    const usedSubjectKeys = selectedPeriodeId ? payrollSubjectKeysByPeriode.get(selectedPeriodeId) : null;

    return activeProfilPayrollList.filter((profile) => {
      const subjectKey = getProfilPayrollSubjectKey(profile);

      if (!subjectKey) return false;
      if (selectedSubjectKey && subjectKey === selectedSubjectKey) return true;
      if (!usedSubjectKeys) return true;

      return !usedSubjectKeys.has(subjectKey);
    });
  }, [activeProfilPayrollList, formData, payrollSubjectKeysByPeriode]);

  const employeeOptions = useMemo(() => availableEmployeeProfiles.map(buildEmployeeOption), [availableEmployeeProfiles]);
  const approverOptions = useMemo(() => activeApproverUsers.map(buildApproverOption), [activeApproverUsers]);
  const tarifPajakOptions = useMemo(() => {
    return [...tarifPajakList]
      .filter((tarif) => !tarif?.deleted_at)
      .sort((a, b) => {
        const kodeA = String(a?.kode_kategori_pajak || '');
        const kodeB = String(b?.kode_kategori_pajak || '');

        if (kodeA !== kodeB) {
          return kodeA.localeCompare(kodeB);
        }

        return Number(a?.penghasilan_dari || 0) - Number(b?.penghasilan_dari || 0);
      })
      .map((tarif) => ({
        value: tarif.id_tarif_pajak_ter,
        label: formatTarifPajakLabel(tarif),
      }));
  }, [tarifPajakList]);

  const selectedEmployeeProfile = useMemo(() => {
    const selectedSubjectKey = getPayrollSubjectKey(formData);
    if (!selectedSubjectKey) return null;

    return profilPayrollMap.get(selectedSubjectKey) || null;
  }, [formData, profilPayrollMap]);

  const selectedEmployeeValue = useMemo(() => getPayrollSubjectKey(formData), [formData]);

  const selectedEmployeeTarifLabel = useMemo(() => formatTarifPajakSnapshot(formData.kode_kategori_pajak_snapshot, formData.persen_tarif_snapshot), [formData.kode_kategori_pajak_snapshot, formData.persen_tarif_snapshot]);
  const tarifPajakSelectionHint = useMemo(() => {
    if (isTarifPajakLoading) {
      return 'Memuat daftar tarif pajak TER...';
    }

    if (tarifPajakOptions.length === 0) {
      return 'Belum ada tarif pajak TER aktif. Payroll tetap bisa disimpan tanpa tarif TER.';
    }

    return 'Opsional. Jika dikosongkan, PPh 21 dihitung 0.';
  }, [isTarifPajakLoading, tarifPajakOptions.length]);

  const employeeSelectionHint = useMemo(() => {
    if (isProfilPayrollLoading) {
      return 'Memuat daftar karyawan dan freelance yang dapat digaji...';
    }

    if (activeProfilPayrollList.length === 0) {
      return 'Belum ada profil penggajian aktif yang bisa digunakan. Lengkapi profil penggajian terlebih dahulu.';
    }

    if (!String(formData.id_periode_payroll || '').trim()) {
      return 'Pilih periode penggajian terlebih dahulu agar daftar sesuai dengan periode tersebut.';
    }

    if (employeeOptions.length === 0) {
      return 'Semua karyawan atau freelance dengan profil penggajian aktif sudah memiliki data penggajian pada periode ini.';
    }

    return 'Cari berdasarkan nama, NIK, email, departemen, atau jabatan.';
  }, [activeProfilPayrollList.length, employeeOptions.length, formData.id_periode_payroll, isProfilPayrollLoading]);

  const approverSelectionHint = useMemo(() => {
    if (isUsersLoading) {
      return 'Memuat daftar penyetuju...';
    }

    if (activeApproverUsers.length === 0) {
      return 'Belum ada pengguna aktif yang bisa dipilih sebagai penyetuju.';
    }

    return 'Tambahkan satu penyetuju, atau tambahkan beberapa penyetuju bila penggajian perlu diperiksa lebih dari satu pihak.';
  }, [activeApproverUsers.length, isUsersLoading]);

  const getPeriodeInfo = useCallback(
    (id) => {
      const periode = periodeMap.get(String(id || ''));
      if (!periode) return 'Tidak diketahui';

      return formatPeriodeLabel(periode);
    },
    [periodeMap],
  );

  const reloadData = useCallback(async () => {
    await Promise.all([mutatePayroll(), mutatePeriode(), mutateProfilPayroll(), mutateUsers(), mutateTarifPajak()]);
  }, [mutatePayroll, mutatePeriode, mutateProfilPayroll, mutateTarifPajak, mutateUsers]);

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
    tarifPajakOptions,
    selectedEmployeeProfile,
    selectedEmployeeValue,
    selectedEmployeeTarifLabel,
    employeeSelectionHint,
    approverSelectionHint,
    tarifPajakSelectionHint,

    formData,
    filterStatus,
    filterPeriode,
    searchQuery,

    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isDetailModalOpen,
    isApproveModalOpen,

    loading: isPayrollLoading || isPeriodeLoading || isProfilPayrollLoading || isUsersLoading || isTarifPajakLoading,
    validating: isPayrollValidating || isPeriodeValidating || isProfilPayrollValidating || isUsersValidating || isTarifPajakValidating,
    isTarifPajakLoading,
    isSubmitting,
    isRequestingApprovalOtp,
    error: payrollError || periodeError || profilPayrollError || usersError || tarifPajakError,

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
    handleTarifPajakChange,
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
    handleRequestApprovalOtp,
    handleApprove,
    getActionableApprovalStep,
    handleUploadBuktiBayar,

    openDeleteDialog,
    closeDeleteDialog,
    handleDelete,

    statusOptions: STATUS_PAYROLL_OPTIONS,
    filterEmployeeOption,
    filterApproverOption,
    getApproverById: (id) => approverUsersMap.get(String(id || '').trim()) || null,
  };
}
