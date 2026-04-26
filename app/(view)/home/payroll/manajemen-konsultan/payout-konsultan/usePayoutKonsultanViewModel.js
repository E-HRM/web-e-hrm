'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { useAuth } from '@/app/utils/auth/authService';
import { crudServiceAuth } from '@/app/utils/services/crudServiceAuth';
import { ApiEndpoints } from '@/constrainst/endpoints';

import {
  STATUS_PAYOUT_KONSULTAN,
  calculateNominalDibayarkan,
  createInitialPayoutKonsultanForm,
  createInitialPostPayrollForm,
  formatCurrency,
  formatDate,
  formatPeriodeKonsultanLabel,
  formatPeriodePayrollLabel,
  getConsultantDisplayName,
  getConsultantIdentity,
  normalizeIdArray,
  normalizeText,
  toNonNegativeInt,
  toDecimalPayload,
  toNumber,
} from './data/payoutKonsultanShared';

const FETCH_PAGE_SIZE = 100;
const PAYOUT_SWR_KEY = 'payroll:payout-konsultan:list';
const PAYOUT_DETAIL_SWR_KEY = 'payroll:payout-konsultan:detail';
const USERS_SWR_KEY = 'payroll:payout-konsultan:users';
const PERIODE_KONSULTAN_SWR_KEY = 'payroll:payout-konsultan:periode-konsultan';
const PERIODE_PAYROLL_SWR_KEY = 'payroll:payout-konsultan:periode-payroll';
const DEFINISI_KOMPONEN_SWR_KEY = 'payroll:payout-konsultan:definisi-komponen';

const ALLOWED_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const LOCKED_PERIODE_KONSULTAN_STATUS = 'TERKUNCI';
const IMMUTABLE_PERIODE_PAYROLL_STATUS = new Set(['TERKUNCI']);

function normalizeRole(value) {
  return String(value || '')
    .trim()
    .toUpperCase();
}

function normalizeNullableText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeUpperText(value) {
  return normalizeText(value).toUpperCase();
}

function formatEnumLabel(value) {
  const raw = normalizeText(value);

  if (!raw) return '-';

  return raw
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeDefinition(item) {
  if (!item) return null;

  const id = normalizeText(item.id_definisi_komponen_payroll);
  if (!id) return null;

  const tipeKomponen = typeof item.tipe_komponen === 'string' ? item.tipe_komponen : item.tipe_komponen?.nama_tipe_komponen;

  return {
    id_definisi_komponen_payroll: id,
    id_tipe_komponen_payroll: normalizeText(item.id_tipe_komponen_payroll),
    nama_komponen: normalizeText(item.nama_komponen),
    tipe_komponen: normalizeUpperText(tipeKomponen),
    arah_komponen: normalizeUpperText(item.arah_komponen),
    aktif: Boolean(item.aktif),
    deleted_at: item.deleted_at || null,
  };
}

function buildUrlWithQuery(baseUrl, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    const normalized = String(value).trim();
    if (!normalized) return;

    query.set(key, normalized);
  });

  const queryString = query.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

function isReleasedHeldDetail(detail) {
  return Boolean(detail?.ditahan) && detail?.payout?.status_payout && detail?.payout?.status_payout !== STATUS_PAYOUT_KONSULTAN.DRAFT;
}

function getPayoutMutationBlockedReason(payout) {
  if (!payout) return 'Data pembayaran konsultan tidak ditemukan.';
  if (payout?.business_state?.payout_posted) return 'Pembayaran konsultan sudah masuk penggajian dan tidak dapat diubah.';
  if (payout?.business_state?.periode_terkunci) return 'Periode konsultan untuk pembayaran ini sudah terkunci.';
  if (payout?.business_state?.periode_deleted) return 'Periode konsultan untuk pembayaran ini sudah dihapus.';
  if (payout?.business_state?.payout_deleted) return 'Data pembayaran konsultan ini sudah dihapus.';
  return 'Pembayaran konsultan ini tidak dapat diproses.';
}

function getPayoutUnpostBlockedReason(payout) {
  if (!payout) return 'Data pembayaran konsultan tidak ditemukan.';
  if (!payout?.business_state?.payout_posted) return 'Pembayaran konsultan ini belum masuk penggajian.';
  if (payout?.business_state?.payout_deleted) return 'Data pembayaran konsultan ini sudah dihapus.';
  if (payout?.business_state?.periode_deleted) return 'Periode konsultan untuk pembayaran ini sudah dihapus.';
  if (payout?.business_state?.periode_terkunci) return 'Periode konsultan untuk pembayaran ini sudah terkunci.';
  if (!payout?.business_state?.payroll_attached) return 'Pembayaran konsultan ini belum memiliki periode penggajian tujuan yang aktif.';
  if (payout?.business_state?.payroll_deleted) return 'Periode penggajian tujuan pembayaran ini sudah dihapus.';
  if (payout?.business_state?.payroll_immutable) return 'Periode penggajian tujuan sudah terkunci.';
  return 'Pembayaran konsultan ini belum dapat dibatalkan dari penggajian.';
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

async function fetchAllPayoutKonsultan() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetPayoutKonsultan({
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: 'created_at',
        sort: 'desc',
      }),
    ),
  );
}

async function fetchAllPayoutKonsultanDetail() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetPayoutKonsultanDetail({
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

async function fetchAllPeriodeKonsultan() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetPeriodeKonsultan({
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: 'tanggal_mulai',
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

async function fetchAllDefinisiKomponenPayroll() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetDefinisiKomponenPayroll({
        page,
        pageSize: FETCH_PAGE_SIZE,
        aktif: 'true',
        orderBy: 'nama_komponen',
        sort: 'asc',
      }),
    ),
  );
}

async function fetchTransaksiByPeriode(idPeriodeKonsultan) {
  if (!idPeriodeKonsultan) return [];

  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetTransaksiKonsultan({
        page,
        pageSize: FETCH_PAGE_SIZE,
        id_periode_konsultan: idPeriodeKonsultan,
        include_carry_forward_ditahan: true,
        sudah_posting_payroll: false,
        orderBy: 'tanggal_transaksi',
        sort: 'asc',
      }),
    ),
  );
}

export default function usePayoutKonsultanViewModel() {
  const auth = useAuth();

  const [filterPeriode, setFilterPeriode] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [formData, setFormData] = useState(createInitialPayoutKonsultanForm());
  const [postFormData, setPostFormData] = useState(createInitialPostPayrollForm());
  const [isNominalPenyesuaianManual, setIsNominalPenyesuaianManual] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingActionId, setPendingActionId] = useState('');

  const canAccess = useMemo(() => {
    if (!auth.isLoggedIn) return false;
    return ALLOWED_ROLES.has(normalizeRole(auth.role));
  }, [auth.isLoggedIn, auth.role]);

  const shouldFetch = !auth.isLoading && canAccess;

  const {
    data: payoutResponse,
    error: payoutError,
    isLoading: isPayoutLoading,
    isValidating: isPayoutValidating,
    mutate: mutatePayout,
  } = useSWR(shouldFetch ? PAYOUT_SWR_KEY : null, fetchAllPayoutKonsultan, {
    revalidateOnFocus: false,
  });

  const {
    data: payoutDetailResponse,
    error: payoutDetailError,
    isLoading: isPayoutDetailLoading,
    isValidating: isPayoutDetailValidating,
    mutate: mutatePayoutDetail,
  } = useSWR(shouldFetch ? PAYOUT_DETAIL_SWR_KEY : null, fetchAllPayoutKonsultanDetail, {
    revalidateOnFocus: false,
  });

  const {
    data: usersResponse,
    error: usersError,
    isLoading: isUsersLoading,
    isValidating: isUsersValidating,
    mutate: mutateUsers,
  } = useSWR(shouldFetch ? USERS_SWR_KEY : null, fetchAllUsers, {
    revalidateOnFocus: false,
  });

  const {
    data: periodeKonsultanResponse,
    error: periodeKonsultanError,
    isLoading: isPeriodeKonsultanLoading,
    isValidating: isPeriodeKonsultanValidating,
    mutate: mutatePeriodeKonsultan,
  } = useSWR(shouldFetch ? PERIODE_KONSULTAN_SWR_KEY : null, fetchAllPeriodeKonsultan, {
    revalidateOnFocus: false,
  });

  const {
    data: periodePayrollResponse,
    error: periodePayrollError,
    isLoading: isPeriodePayrollLoading,
    isValidating: isPeriodePayrollValidating,
    mutate: mutatePeriodePayroll,
  } = useSWR(shouldFetch ? PERIODE_PAYROLL_SWR_KEY : null, fetchAllPeriodePayroll, {
    revalidateOnFocus: false,
  });

  const {
    data: definisiKomponenResponse,
    error: definisiKomponenError,
    isLoading: isDefinisiKomponenLoading,
    isValidating: isDefinisiKomponenValidating,
    mutate: mutateDefinisiKomponen,
  } = useSWR(shouldFetch ? DEFINISI_KOMPONEN_SWR_KEY : null, fetchAllDefinisiKomponenPayroll, {
    revalidateOnFocus: false,
  });

  const formPeriodeId = useMemo(() => {
    if (!shouldFetch) return '';
    if (!isCreateModalOpen && !isEditModalOpen) return '';
    return normalizeText(formData.id_periode_konsultan);
  }, [formData.id_periode_konsultan, isCreateModalOpen, isEditModalOpen, shouldFetch]);

  const previewTransaksiKey = useMemo(() => {
    return formPeriodeId ? ['payroll:payout-konsultan:preview-transaksi', formPeriodeId] : null;
  }, [formPeriodeId]);

  const {
    data: previewTransaksiResponse,
    error: previewTransaksiError,
    isLoading: isPreviewTransaksiLoading,
    isValidating: isPreviewTransaksiValidating,
    mutate: mutatePreviewTransaksi,
  } = useSWR(previewTransaksiKey, ([, periodeId]) => fetchTransaksiByPeriode(periodeId), {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!payoutError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payout-konsultan-list-error',
      content: payoutError?.message || 'Gagal memuat daftar pembayaran konsultan.',
    });
  }, [payoutError]);

  useEffect(() => {
    if (!payoutDetailError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payout-konsultan-detail-error',
      content: payoutDetailError?.message || 'Gagal memuat rincian pembayaran konsultan.',
    });
  }, [payoutDetailError]);

  useEffect(() => {
    if (!usersError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payout-konsultan-users-error',
      content: usersError?.message || 'Gagal memuat data konsultan.',
    });
  }, [usersError]);

  useEffect(() => {
    if (!periodeKonsultanError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payout-konsultan-periode-konsultan-error',
      content: periodeKonsultanError?.message || 'Gagal memuat periode konsultan.',
    });
  }, [periodeKonsultanError]);

  useEffect(() => {
    if (!periodePayrollError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payout-konsultan-periode-payroll-error',
      content: periodePayrollError?.message || 'Gagal memuat periode penggajian.',
    });
  }, [periodePayrollError]);

  useEffect(() => {
    if (!definisiKomponenError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payout-konsultan-definisi-komponen-error',
      content: definisiKomponenError?.message || 'Gagal memuat jenis komponen penggajian.',
    });
  }, [definisiKomponenError]);

  useEffect(() => {
    if (!previewTransaksiError) return;

    AppMessage.once({
      type: 'error',
      onceKey: `payout-konsultan-preview-transaksi-error:${formPeriodeId || 'none'}`,
      content: previewTransaksiError?.message || 'Gagal memuat ringkasan transaksi konsultan.',
    });
  }, [formPeriodeId, previewTransaksiError]);

  const payoutData = useMemo(() => {
    const rawItems = Array.isArray(payoutResponse) ? payoutResponse : [];
    return rawItems.filter((item) => item?.id_payout_konsultan && !item?.deleted_at);
  }, [payoutResponse]);

  const payoutDetailData = useMemo(() => {
    const rawItems = Array.isArray(payoutDetailResponse) ? payoutDetailResponse : [];
    return rawItems.filter((item) => item?.id_payout_konsultan_detail && !item?.deleted_at && !item?.payout?.deleted_at);
  }, [payoutDetailResponse]);

  const usersData = useMemo(() => {
    const rawItems = Array.isArray(usersResponse) ? usersResponse : [];
    return rawItems.filter((item) => item?.id_user && !item?.deleted_at);
  }, [usersResponse]);

  const periodeKonsultanData = useMemo(() => {
    const rawItems = Array.isArray(periodeKonsultanResponse) ? periodeKonsultanResponse : [];
    return rawItems.filter((item) => item?.id_periode_konsultan);
  }, [periodeKonsultanResponse]);

  const periodePayrollData = useMemo(() => {
    const rawItems = Array.isArray(periodePayrollResponse) ? periodePayrollResponse : [];
    return rawItems.filter((item) => item?.id_periode_payroll && !item?.deleted_at);
  }, [periodePayrollResponse]);

  const definisiKomponenData = useMemo(() => {
    const rawItems = Array.isArray(definisiKomponenResponse) ? definisiKomponenResponse : [];
    return rawItems.map(normalizeDefinition).filter((item) => item && !item.deleted_at && item.aktif);
  }, [definisiKomponenResponse]);

  const previewTransaksiData = useMemo(() => {
    const rawItems = Array.isArray(previewTransaksiResponse) ? previewTransaksiResponse : [];
    return rawItems.filter((item) => item?.id_transaksi_konsultan && !item?.deleted_at);
  }, [previewTransaksiResponse]);

  const usersMap = useMemo(() => {
    return new Map(usersData.map((item) => [normalizeText(item.id_user), item]));
  }, [usersData]);

  const periodeKonsultanMap = useMemo(() => {
    return new Map(periodeKonsultanData.map((item) => [normalizeText(item.id_periode_konsultan), item]));
  }, [periodeKonsultanData]);

  const periodePayrollMap = useMemo(() => {
    return new Map(periodePayrollData.map((item) => [normalizeText(item.id_periode_payroll), item]));
  }, [periodePayrollData]);

  const definisiKomponenMap = useMemo(() => {
    return new Map(definisiKomponenData.map((item) => [normalizeText(item.id_definisi_komponen_payroll), item]));
  }, [definisiKomponenData]);

  const detailCountMap = useMemo(() => {
    const map = new Map();

    payoutDetailData.forEach((item) => {
      const payoutId = normalizeText(item?.id_payout_konsultan || item?.payout?.id_payout_konsultan);
      if (!payoutId) return;

      map.set(payoutId, (map.get(payoutId) || 0) + 1);
    });

    return map;
  }, [payoutDetailData]);

  const linkedTransactionMap = useMemo(() => {
    const map = new Map();

    payoutDetailData.forEach((item) => {
      if (isReleasedHeldDetail(item)) return;

      const transaksiId = normalizeText(item.id_transaksi_konsultan);
      const payoutId = normalizeText(item?.id_payout_konsultan || item?.payout?.id_payout_konsultan);

      if (!transaksiId || !payoutId) return;

      map.set(transaksiId, payoutId);
    });

    return map;
  }, [payoutDetailData]);

  const selectedPayoutDetailRows = useMemo(() => {
    const selectedPayoutId = normalizeText(selectedPayout?.id_payout_konsultan);
    if (!selectedPayoutId) return [];

    return payoutDetailData.filter((item) => normalizeText(item.id_payout_konsultan) === selectedPayoutId);
  }, [payoutDetailData, selectedPayout?.id_payout_konsultan]);

  const payoutWithMeta = useMemo(() => {
    const statusOrder = {
      [STATUS_PAYOUT_KONSULTAN.DRAFT]: 0,
      [STATUS_PAYOUT_KONSULTAN.DISETUJUI]: 1,
      [STATUS_PAYOUT_KONSULTAN.DITAHAN]: 2,
      [STATUS_PAYOUT_KONSULTAN.DIPOSTING_KE_PAYROLL]: 3,
    };

    return payoutData
      .map((item) => {
        const user = item.user || usersMap.get(normalizeText(item.id_user)) || null;
        const periodeKonsultan = item.periode_konsultan || periodeKonsultanMap.get(normalizeText(item.id_periode_konsultan)) || null;
        const periodePayroll = item.periode_payroll || periodePayrollMap.get(normalizeText(item.id_periode_payroll)) || null;

        return {
          ...item,
          user,
          periode_konsultan: periodeKonsultan,
          periode_payroll: periodePayroll,
          user_display_name: getConsultantDisplayName(user),
          user_identity: getConsultantIdentity(user),
          periode_label: formatPeriodeKonsultanLabel(periodeKonsultan || item.id_periode_konsultan),
          payroll_periode_label: formatPeriodePayrollLabel(periodePayroll || item.id_periode_payroll),
          transaksiCount: detailCountMap.get(normalizeText(item.id_payout_konsultan)) || 0,
        };
      })
      .sort((first, second) => {
        const firstOrder = statusOrder[first.status_payout] ?? 99;
        const secondOrder = statusOrder[second.status_payout] ?? 99;

        if (firstOrder !== secondOrder) {
          return firstOrder - secondOrder;
        }

        const firstName = normalizeText(first.user_display_name || first.id_user);
        const secondName = normalizeText(second.user_display_name || second.id_user);
        return firstName.localeCompare(secondName);
      });
  }, [detailCountMap, payoutData, periodeKonsultanMap, periodePayrollMap, usersMap]);

  const filteredPayoutWithMeta = useMemo(() => {
    const periodeId = normalizeText(filterPeriode);
    if (!periodeId) return payoutWithMeta;

    return payoutWithMeta.filter((item) => normalizeText(item.id_periode_konsultan) === periodeId);
  }, [filterPeriode, payoutWithMeta]);

  const resolvedSelectedPayout = useMemo(() => {
    if (!selectedPayout?.id_payout_konsultan) return null;

    return payoutWithMeta.find((item) => item.id_payout_konsultan === selectedPayout.id_payout_konsultan) || selectedPayout;
  }, [payoutWithMeta, selectedPayout]);

  const selectedPayoutPostingSummary = useMemo(() => {
    const heldCount = selectedPayoutDetailRows.filter((item) => item.ditahan).length;
    const detailCount = selectedPayoutDetailRows.length;

    return {
      detailCount,
      detailPostingCount: Math.max(detailCount - heldCount, 0),
      detailDitahanCount: heldCount,
      nominalDibayarkan: toNumber(resolvedSelectedPayout?.nominal_dibayarkan),
    };
  }, [resolvedSelectedPayout?.nominal_dibayarkan, selectedPayoutDetailRows]);

  const defaultCreatePeriodeId = useMemo(() => {
    const preferred = periodeKonsultanData.find((item) => !item?.deleted_at && item?.status_periode !== LOCKED_PERIODE_KONSULTAN_STATUS);
    return preferred?.id_periode_konsultan || '';
  }, [periodeKonsultanData]);

  const periodeKonsultanOptions = useMemo(() => {
    return periodeKonsultanData.map((item) => ({
      value: item.id_periode_konsultan,
      label: `${formatPeriodeKonsultanLabel(item)} - ${formatEnumLabel(item.status_periode || 'BELUM_DIATUR')}`,
      disabled: Boolean(item.deleted_at) || item.status_periode === LOCKED_PERIODE_KONSULTAN_STATUS,
    }));
  }, [periodeKonsultanData]);

  const filterPeriodeOptions = useMemo(() => {
    return periodeKonsultanData.map((item) => ({
      value: item.id_periode_konsultan,
      label: `${formatPeriodeKonsultanLabel(item)} - ${formatEnumLabel(item.status_periode || 'BELUM_DIATUR')}`,
      disabled: Boolean(item.deleted_at),
    }));
  }, [periodeKonsultanData]);

  useEffect(() => {
    if (filterPeriodeOptions.length === 0) {
      if (filterPeriode) {
        setFilterPeriode('');
      }
      return;
    }

    const selectedOption = filterPeriodeOptions.find((item) => item.value === filterPeriode);
    if (selectedOption && !selectedOption.disabled) return;

    const preferredOption = filterPeriodeOptions.find((item) => !item.disabled) || filterPeriodeOptions[0];
    const nextFilterPeriode = preferredOption?.value || '';

    if (nextFilterPeriode !== filterPeriode) {
      setFilterPeriode(nextFilterPeriode);
    }
  }, [filterPeriode, filterPeriodeOptions]);

  const activeFilterPeriode = useMemo(() => {
    return periodeKonsultanMap.get(normalizeText(filterPeriode)) || null;
  }, [filterPeriode, periodeKonsultanMap]);

  const createModalPeriodeId = useMemo(() => {
    const selectedOption = periodeKonsultanOptions.find((item) => item.value === filterPeriode && !item.disabled);
    return selectedOption?.value || defaultCreatePeriodeId;
  }, [defaultCreatePeriodeId, filterPeriode, periodeKonsultanOptions]);

  const payrollOptions = useMemo(() => {
    return periodePayrollData.map((item) => ({
      value: item.id_periode_payroll,
      label: `${formatPeriodePayrollLabel(item)} - ${formatEnumLabel(item.status_periode || 'BELUM_DIATUR')}`,
      disabled: IMMUTABLE_PERIODE_PAYROLL_STATUS.has(String(item.status_periode || '').toUpperCase()),
    }));
  }, [periodePayrollData]);

  const selectablePayrollOptions = useMemo(() => {
    return payrollOptions.filter((item) => !item.disabled);
  }, [payrollOptions]);

  const definisiKomponenOptions = useMemo(() => {
    return definisiKomponenData.map((item) => ({
      value: item.id_definisi_komponen_payroll,
      label: `${item.nama_komponen} - ${formatEnumLabel(item.tipe_komponen)} - ${formatEnumLabel(item.arah_komponen)}`,
    }));
  }, [definisiKomponenData]);

  const defaultPostingDefinitionId = useMemo(() => {
    const preferred = definisiKomponenData.find((item) => item.tipe_komponen === 'INSENTIF_KONSULTAN' && item.arah_komponen === 'PEMASUKAN');

    return preferred?.id_definisi_komponen_payroll || definisiKomponenData[0]?.id_definisi_komponen_payroll || '';
  }, [definisiKomponenData]);

  const selectedPostingDefinition = useMemo(() => {
    return definisiKomponenMap.get(normalizeText(postFormData.id_definisi_komponen_payroll)) || null;
  }, [definisiKomponenMap, postFormData.id_definisi_komponen_payroll]);

  const previewTransactions = useMemo(() => {
    return previewTransaksiData.map((item) => ({
      ...item,
      konsultan: item.konsultan || usersMap.get(normalizeText(item.id_user_konsultan)) || null,
      periode_konsultan: item.periode_konsultan || periodeKonsultanMap.get(normalizeText(item.id_periode_konsultan)) || null,
    }));
  }, [periodeKonsultanMap, previewTransaksiData, usersMap]);

  const createConsultantSummaryMap = useMemo(() => {
    const map = new Map();

    if (!isCreateModalOpen || !formPeriodeId) return map;

    previewTransactions.forEach((item) => {
      const userId = normalizeText(item.id_user_konsultan);
      const transaksiId = normalizeText(item.id_transaksi_konsultan);

      if (!userId || !transaksiId || item.sudah_posting_payroll) return;
      if (linkedTransactionMap.has(transaksiId)) return;

      const current = map.get(userId) || {
        id_user: userId,
        user: item.konsultan || usersMap.get(userId) || null,
        detailCount: 0,
        totalIncome: 0,
        totalShare: 0,
        totalOss: 0,
      };

      current.detailCount += 1;
      current.totalIncome += toNumber(item.total_income);
      current.totalShare += toNumber(item.nominal_share);
      current.totalOss += toNumber(item.nominal_oss);

      map.set(userId, current);
    });

    return map;
  }, [formPeriodeId, isCreateModalOpen, linkedTransactionMap, previewTransactions, usersMap]);

  const createConsultantOptions = useMemo(() => {
    return Array.from(createConsultantSummaryMap.values())
      .sort((first, second) => {
        const firstName = normalizeText(getConsultantDisplayName(first.user));
        const secondName = normalizeText(getConsultantDisplayName(second.user));
        return firstName.localeCompare(secondName);
      })
      .map((item) => ({
        value: item.id_user,
        label: `${getConsultantDisplayName(item.user)} - ${getConsultantIdentity(item.user)} - ${item.detailCount} transaksi - ${formatCurrency(item.totalShare)}`,
      }));
  }, [createConsultantSummaryMap]);

  const identityConsultantOptions = useMemo(() => {
    const selectedUserId = normalizeText(formData.id_user);
    if (!selectedUserId) return [];

    const user = usersMap.get(selectedUserId) || resolvedSelectedPayout?.user || null;

    return [
      {
        value: selectedUserId,
        label: `${getConsultantDisplayName(user)} - ${getConsultantIdentity(user)}`,
      },
    ];
  }, [formData.id_user, resolvedSelectedPayout?.user, usersMap]);

  const previewExcludePayoutId = useMemo(() => {
    if (!isEditModalOpen) return '';
    return normalizeText(resolvedSelectedPayout?.id_payout_konsultan);
  }, [isEditModalOpen, resolvedSelectedPayout?.id_payout_konsultan]);

  const selectedEligibleTransactions = useMemo(() => {
    const selectedUserId = normalizeText(formData.id_user);
    const targetPeriodeId = normalizeText(formData.id_periode_konsultan);
    if (!selectedUserId) return [];

    const rows = [];
    const seen = new Set();

    const appendRow = (item, overrides = {}) => {
      const transaksiId = normalizeText(overrides.id_transaksi_konsultan ?? item?.id_transaksi_konsultan);
      const sourcePeriodeId = normalizeText(overrides.id_periode_konsultan ?? item?.id_periode_konsultan);
      if (!transaksiId || seen.has(transaksiId)) return;

      const linkedPayoutId = linkedTransactionMap.get(transaksiId);
      if (linkedPayoutId && linkedPayoutId !== previewExcludePayoutId) return;

      seen.add(transaksiId);
      rows.push({
        ...item,
        ...overrides,
        id_transaksi_konsultan: transaksiId,
        id_periode_konsultan: sourcePeriodeId,
        is_carry_forward: Boolean(targetPeriodeId && sourcePeriodeId && sourcePeriodeId !== targetPeriodeId),
      });
    };

    previewTransactions.forEach((item) => {
      if (normalizeText(item.id_user_konsultan) !== selectedUserId) return;
      if (item.sudah_posting_payroll) return;

      appendRow(item, {
        konsultan: item.konsultan || usersMap.get(selectedUserId) || null,
      });
    });

    selectedPayoutDetailRows.forEach((detail) => {
      const transaksi = detail?.transaksi;
      if (!transaksi) return;
      if (normalizeText(transaksi.id_user_konsultan) !== selectedUserId) return;

      appendRow(transaksi, {
        id_transaksi_konsultan: detail.id_transaksi_konsultan,
        nominal_share: detail.nominal_share,
        nominal_oss: detail.nominal_oss,
        ditahan: Boolean(detail.ditahan),
        konsultan: transaksi.konsultan || usersMap.get(selectedUserId) || null,
        periode_konsultan: transaksi.periode_konsultan || periodeKonsultanMap.get(normalizeText(transaksi.id_periode_konsultan)) || null,
      });
    });

    return rows;
  }, [formData.id_periode_konsultan, formData.id_user, linkedTransactionMap, periodeKonsultanMap, previewExcludePayoutId, previewTransactions, selectedPayoutDetailRows, usersMap]);

  const formSummary = useMemo(() => {
    const heldTransactionIds = new Set(normalizeIdArray(formData.id_transaksi_konsultan_ditahan));

    return selectedEligibleTransactions.reduce(
      (acc, item) => {
        const transaksiId = normalizeText(item.id_transaksi_konsultan);
        const isHeld = heldTransactionIds.has(transaksiId);
        const nominalShare = toNumber(item.nominal_share);

        acc.detailCount += 1;
        acc.totalIncome += toNumber(item.total_income);
        acc.totalShareBruto += nominalShare;
        acc.totalOss += toNumber(item.nominal_oss);

        if (isHeld) {
          acc.detailDitahanCount += 1;
          acc.totalDitahan += nominalShare;
        } else {
          acc.totalShare += nominalShare;
        }

        return acc;
      },
      {
        detailCount: 0,
        detailDitahanCount: 0,
        totalIncome: 0,
        totalShare: 0,
        totalShareBruto: 0,
        totalOss: 0,
        totalDitahan: 0,
      },
    );
  }, [formData.id_transaksi_konsultan_ditahan, selectedEligibleTransactions]);

  const nominalDibayarkanPreview = useMemo(() => {
    return calculateNominalDibayarkan({
      nominal_penyesuaian: formData.nominal_penyesuaian,
    });
  }, [formData.nominal_penyesuaian]);

  const summary = useMemo(() => {
    return {
      totalShare: filteredPayoutWithMeta.reduce((acc, item) => acc + toNumber(item.total_share), 0),
      totalDitahan: filteredPayoutWithMeta.reduce((acc, item) => acc + toNumber(item.nominal_ditahan), 0),
      totalDibayarkan: filteredPayoutWithMeta.reduce((acc, item) => acc + toNumber(item.nominal_dibayarkan), 0),
    };
  }, [filteredPayoutWithMeta]);

  const statusCounts = useMemo(() => {
    return {
      draft: filteredPayoutWithMeta.filter((item) => item.status_payout === STATUS_PAYOUT_KONSULTAN.DRAFT).length,
      disetujui: filteredPayoutWithMeta.filter((item) => item.status_payout === STATUS_PAYOUT_KONSULTAN.DISETUJUI).length,
      diposting: filteredPayoutWithMeta.filter((item) => item.status_payout === STATUS_PAYOUT_KONSULTAN.DIPOSTING_KE_PAYROLL).length,
      ditahan: filteredPayoutWithMeta.filter((item) => item.status_payout === STATUS_PAYOUT_KONSULTAN.DITAHAN).length,
    };
  }, [filteredPayoutWithMeta]);

  const loading = auth.isLoading || (shouldFetch && (isPayoutLoading || isPayoutDetailLoading || isUsersLoading || isPeriodeKonsultanLoading || isPeriodePayrollLoading || isDefinisiKomponenLoading));

  const refreshing = isPayoutValidating || isPayoutDetailValidating || isUsersValidating || isPeriodeKonsultanValidating || isPeriodePayrollValidating || isDefinisiKomponenValidating;

  const isPreviewLoading = Boolean(formPeriodeId) && (isPreviewTransaksiLoading || isPreviewTransaksiValidating);

  const error = payoutError || payoutDetailError || usersError || periodeKonsultanError || periodePayrollError || definisiKomponenError || previewTransaksiError;

  const setFormValue = useCallback((field, value) => {
    if (field === 'nominal_penyesuaian') {
      setIsNominalPenyesuaianManual(true);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const toggleHeldTransaction = useCallback((transactionId, checked) => {
    const normalizedId = normalizeText(transactionId);
    if (!normalizedId) return;

    setFormData((prev) => {
      const nextIds = new Set(normalizeIdArray(prev.id_transaksi_konsultan_ditahan));

      if (checked) {
        nextIds.add(normalizedId);
      } else {
        nextIds.delete(normalizedId);
      }

      return {
        ...prev,
        id_transaksi_konsultan_ditahan: Array.from(nextIds),
      };
    });
  }, []);

  const setPostFormValue = useCallback((field, value) => {
    setPostFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const resetForm = useCallback(
    (periodeId = createModalPeriodeId) => {
      setIsNominalPenyesuaianManual(false);
      setFormData(createInitialPayoutKonsultanForm({ id_periode_konsultan: periodeId }));
    },
    [createModalPeriodeId],
  );

  const resetPostForm = useCallback((periodePayrollId = '', definisiKomponenId = '') => {
    setPostFormData(
      createInitialPostPayrollForm({
        id_periode_payroll: periodePayrollId,
        id_definisi_komponen_payroll: definisiKomponenId,
      }),
    );
  }, []);

  useEffect(() => {
    if (!isCreateModalOpen || isPreviewLoading) return;

    const selectedUserId = normalizeText(formData.id_user);
    const stillEligible = createConsultantOptions.some((item) => item.value === selectedUserId);
    const nextUserId = stillEligible ? selectedUserId : createConsultantOptions[0]?.value || '';

    if (nextUserId === selectedUserId) return;

    setFormData((prev) => ({
      ...prev,
      id_user: nextUserId,
    }));
  }, [createConsultantOptions, formData.id_user, isCreateModalOpen, isPreviewLoading]);

  useEffect(() => {
    if (!isCreateModalOpen && !isEditModalOpen) return;

    const allowedIds = new Set(selectedEligibleTransactions.map((item) => normalizeText(item.id_transaksi_konsultan)));

    setFormData((prev) => {
      const currentIds = normalizeIdArray(prev.id_transaksi_konsultan_ditahan);
      const nextIds = currentIds.filter((id) => allowedIds.has(id));

      if (currentIds.length === nextIds.length && currentIds.every((id, index) => id === nextIds[index])) {
        return prev;
      }

      return {
        ...prev,
        id_transaksi_konsultan_ditahan: nextIds,
      };
    });
  }, [isCreateModalOpen, isEditModalOpen, selectedEligibleTransactions]);

  useEffect(() => {
    if (!isCreateModalOpen || isPreviewLoading || isNominalPenyesuaianManual) return;

    const nextNominalPenyesuaian = Math.max(formSummary.totalShare, 0);

    setFormData((prev) => {
      if (toNumber(prev.nominal_penyesuaian) === nextNominalPenyesuaian) {
        return prev;
      }

      return {
        ...prev,
        nominal_penyesuaian: nextNominalPenyesuaian,
      };
    });
  }, [formSummary.totalDitahan, formSummary.totalShare, isCreateModalOpen, isNominalPenyesuaianManual, isPreviewLoading]);

  useEffect(() => {
    if (!isPostModalOpen) return;
    if (normalizeText(postFormData.id_definisi_komponen_payroll)) return;
    if (!defaultPostingDefinitionId) return;

    setPostFormData((prev) => ({
      ...prev,
      id_definisi_komponen_payroll: defaultPostingDefinitionId,
    }));
  }, [defaultPostingDefinitionId, isPostModalOpen, postFormData.id_definisi_komponen_payroll]);

  const refreshPayoutCollections = useCallback(async () => {
    await Promise.all([mutatePayout(), mutatePayoutDetail(), previewTransaksiKey ? mutatePreviewTransaksi() : Promise.resolve()]);
  }, [mutatePayout, mutatePayoutDetail, mutatePreviewTransaksi, previewTransaksiKey]);

  const reloadData = useCallback(async () => {
    if (!shouldFetch) return;

    await Promise.all([mutatePayout(), mutatePayoutDetail(), mutateUsers(), mutatePeriodeKonsultan(), mutatePeriodePayroll(), mutateDefinisiKomponen(), previewTransaksiKey ? mutatePreviewTransaksi() : Promise.resolve()]);
  }, [mutateDefinisiKomponen, mutatePeriodeKonsultan, mutatePeriodePayroll, mutatePayout, mutatePayoutDetail, mutatePreviewTransaksi, mutateUsers, previewTransaksiKey, shouldFetch]);

  const openCreateModal = useCallback(() => {
    if (!createModalPeriodeId) {
      AppMessage.warning('Belum ada periode konsultan aktif yang bisa digunakan untuk pembayaran.');
      return;
    }

    setSelectedPayout(null);
    resetForm(createModalPeriodeId);
    setIsCreateModalOpen(true);
  }, [createModalPeriodeId, resetForm]);

  const closeCreateModal = useCallback(() => {
    if (isSubmitting) return;

    setIsCreateModalOpen(false);
    setSelectedPayout(null);
    resetForm(createModalPeriodeId);
  }, [createModalPeriodeId, isSubmitting, resetForm]);

  const openEditModal = useCallback(
    (payout) => {
      if (!payout) return;

      if (!payout?.business_state?.bisa_diubah) {
        AppMessage.warning(getPayoutMutationBlockedReason(payout));
        return;
      }

      const heldTransactionIds = normalizeIdArray(
        payoutDetailData.filter((detail) => normalizeText(detail.id_payout_konsultan) === normalizeText(payout.id_payout_konsultan) && detail.ditahan).map((detail) => detail.id_transaksi_konsultan),
      );

      setSelectedPayout(payout);
      setIsNominalPenyesuaianManual(true);
      setFormData(
        createInitialPayoutKonsultanForm({
          id_user: payout.id_user,
          id_periode_konsultan: payout.id_periode_konsultan,
          nominal_penyesuaian: payout.nominal_dibayarkan,
          id_transaksi_konsultan_ditahan: heldTransactionIds,
          catatan: payout.catatan,
        }),
      );
      setIsEditModalOpen(true);
    },
    [payoutDetailData],
  );

  const closeEditModal = useCallback(() => {
    if (isSubmitting) return;

    setIsEditModalOpen(false);
    setSelectedPayout(null);
    resetForm(createModalPeriodeId);
  }, [createModalPeriodeId, isSubmitting, resetForm]);

  const openDeleteDialog = useCallback((payout) => {
    if (!payout) return;

    if (!payout?.business_state?.bisa_dihapus) {
      AppMessage.warning(getPayoutMutationBlockedReason(payout));
      return;
    }

    setSelectedPayout(payout);
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    if (isSubmitting) return;

    setIsDeleteDialogOpen(false);
    setSelectedPayout(null);
  }, [isSubmitting]);

  const openPostModal = useCallback(
    (payout) => {
      if (!payout) return;

      if (!payout?.business_state?.bisa_diubah) {
        AppMessage.warning(getPayoutMutationBlockedReason(payout));
        return;
      }

      if (payout.status_payout !== STATUS_PAYOUT_KONSULTAN.DISETUJUI) {
        AppMessage.warning('Hanya pembayaran yang sudah disetujui yang dapat dimasukkan ke penggajian.');
        return;
      }

      if (!selectablePayrollOptions.length) {
        AppMessage.warning('Belum ada periode penggajian yang dapat dipilih.');
        return;
      }

      setSelectedPayout(payout);
      resetPostForm(payout.id_periode_payroll || selectablePayrollOptions[0]?.value || '', defaultPostingDefinitionId);
      setIsPostModalOpen(true);
    },
    [defaultPostingDefinitionId, resetPostForm, selectablePayrollOptions],
  );

  const closePostModal = useCallback(() => {
    if (isSubmitting) return;

    setIsPostModalOpen(false);
    setSelectedPayout(null);
    resetPostForm();
  }, [isSubmitting, resetPostForm]);

  const validateForm = useCallback(() => {
    const periodeId = normalizeText(formData.id_periode_konsultan);
    const userId = normalizeText(formData.id_user);
    const periode = periodeKonsultanMap.get(periodeId) || resolvedSelectedPayout?.periode_konsultan || null;

    if (!periodeId) {
      AppMessage.warning('Pilih periode konsultan terlebih dahulu.');
      return false;
    }

    if (periode?.deleted_at) {
      AppMessage.warning('Periode konsultan yang dipilih sudah dihapus.');
      return false;
    }

    if (periode?.status_periode === LOCKED_PERIODE_KONSULTAN_STATUS) {
      AppMessage.warning('Periode konsultan yang dipilih sudah terkunci.');
      return false;
    }

    if (!userId) {
      AppMessage.warning('Pilih konsultan terlebih dahulu.');
      return false;
    }

    if (isPreviewLoading) {
      AppMessage.warning('Transaksi yang siap dibayar masih dimuat. Coba lagi sebentar lagi.');
      return false;
    }

    if (formSummary.detailCount <= 0 || formSummary.totalShareBruto <= 0) {
      AppMessage.warning('Belum ada transaksi konsultan yang siap dibayarkan untuk konsultan dan periode ini.');
      return false;
    }

    if (nominalDibayarkanPreview < 0) {
      AppMessage.warning('Nominal yang akan dibayarkan tidak boleh kurang dari nol.');
      return false;
    }

    return true;
  }, [formData.id_periode_konsultan, formData.id_user, formSummary.detailCount, formSummary.totalShareBruto, isPreviewLoading, nominalDibayarkanPreview, periodeKonsultanMap, resolvedSelectedPayout?.periode_konsultan]);

  const buildPayload = useCallback(() => {
    return {
      id_user: normalizeText(formData.id_user),
      id_periode_konsultan: normalizeText(formData.id_periode_konsultan),
      nominal_penyesuaian: toDecimalPayload(formData.nominal_penyesuaian),
      id_transaksi_konsultan_ditahan: normalizeIdArray(formData.id_transaksi_konsultan_ditahan),
      catatan: normalizeNullableText(formData.catatan),
    };
  }, [formData]);

  const handleCreate = useCallback(async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.post(ApiEndpoints.CreatePayoutKonsultan(), buildPayload());

      await refreshPayoutCollections();

      setIsCreateModalOpen(false);
      setSelectedPayout(null);
      resetForm(createModalPeriodeId);

      AppMessage.success(response?.message || 'Pembayaran konsultan berhasil dibuat.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal membuat pembayaran konsultan.');
    } finally {
      setIsSubmitting(false);
    }
  }, [buildPayload, createModalPeriodeId, isSubmitting, refreshPayoutCollections, resetForm, validateForm]);

  const handleEdit = useCallback(async () => {
    if (isSubmitting) return;

    if (!resolvedSelectedPayout?.id_payout_konsultan) {
      AppMessage.warning('Data pembayaran konsultan tidak ditemukan.');
      return;
    }

    if (!resolvedSelectedPayout?.business_state?.bisa_diubah) {
      AppMessage.warning(getPayoutMutationBlockedReason(resolvedSelectedPayout));
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.put(ApiEndpoints.UpdatePayoutKonsultan(resolvedSelectedPayout.id_payout_konsultan), buildPayload());

      await refreshPayoutCollections();

      setIsEditModalOpen(false);
      setSelectedPayout(null);
      resetForm(createModalPeriodeId);

      AppMessage.success(response?.message || 'Pembayaran konsultan berhasil diperbarui.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memperbarui pembayaran konsultan.');
    } finally {
      setIsSubmitting(false);
    }
  }, [buildPayload, createModalPeriodeId, isSubmitting, refreshPayoutCollections, resetForm, resolvedSelectedPayout, validateForm]);

  const handleDelete = useCallback(async () => {
    if (isSubmitting) return;

    if (!resolvedSelectedPayout?.id_payout_konsultan) {
      AppMessage.warning('Data pembayaran konsultan tidak ditemukan.');
      return;
    }

    if (!resolvedSelectedPayout?.business_state?.bisa_dihapus) {
      AppMessage.warning(getPayoutMutationBlockedReason(resolvedSelectedPayout));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.delete(ApiEndpoints.DeletePayoutKonsultan(resolvedSelectedPayout.id_payout_konsultan));

      await refreshPayoutCollections();

      setIsDeleteDialogOpen(false);
      setSelectedPayout(null);

      AppMessage.success(response?.message || 'Pembayaran konsultan berhasil dihapus.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menghapus pembayaran konsultan.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, refreshPayoutCollections, resolvedSelectedPayout]);

  const updatePayoutStatus = useCallback(
    async (payout, payload, fallbackMessage) => {
      if (!payout?.id_payout_konsultan) return;
      if (pendingActionId) return;

      if (!payout?.business_state?.bisa_diubah) {
        AppMessage.warning(getPayoutMutationBlockedReason(payout));
        return;
      }

      setPendingActionId(payout.id_payout_konsultan);

      try {
        const response = await crudServiceAuth.put(ApiEndpoints.UpdatePayoutKonsultan(payout.id_payout_konsultan), payload);

        await refreshPayoutCollections();

        AppMessage.success(response?.message || fallbackMessage);
      } catch (err) {
        AppMessage.error(err?.message || 'Gagal memperbarui status pembayaran konsultan.');
      } finally {
        setPendingActionId('');
      }
    },
    [pendingActionId, refreshPayoutCollections],
  );

  const handleApprovePayout = useCallback(
    async (payout) => {
      await updatePayoutStatus(payout, { status_payout: STATUS_PAYOUT_KONSULTAN.DISETUJUI }, 'Pembayaran konsultan berhasil disetujui.');
    },
    [updatePayoutStatus],
  );

  const handleHoldPayment = useCallback(
    async (payout) => {
      await updatePayoutStatus(payout, { status_payout: STATUS_PAYOUT_KONSULTAN.DITAHAN }, 'Pembayaran konsultan berhasil ditahan.');
    },
    [updatePayoutStatus],
  );

  const handleReleaseHold = useCallback(
    async (payout) => {
      await updatePayoutStatus(payout, { status_payout: STATUS_PAYOUT_KONSULTAN.DISETUJUI }, 'Pembayaran konsultan siap dilanjutkan.');
    },
    [updatePayoutStatus],
  );

  const handleUnpostPayout = useCallback(
    async (payout) => {
      if (!payout?.id_payout_konsultan) return;
      if (pendingActionId) return;

      if (!payout?.business_state?.bisa_lepas_posting) {
        AppMessage.warning(getPayoutUnpostBlockedReason(payout));
        return;
      }

      setPendingActionId(payout.id_payout_konsultan);

      try {
        const response = await crudServiceAuth.post(ApiEndpoints.UnpostPayoutKonsultan(payout.id_payout_konsultan));

        await refreshPayoutCollections();
        setSelectedPayout((prev) => (normalizeText(prev?.id_payout_konsultan) === normalizeText(payout.id_payout_konsultan) ? null : prev));

        AppMessage.success(response?.message || 'Pembayaran berhasil dibatalkan dari penggajian. Statusnya kembali menjadi belum disetujui dan bisa diubah lagi.');
      } catch (err) {
        AppMessage.error(err?.message || 'Gagal membatalkan pembayaran dari penggajian.');
      } finally {
        setPendingActionId('');
      }
    },
    [pendingActionId, refreshPayoutCollections],
  );

  const handlePostToPayroll = useCallback(async () => {
    if (isSubmitting) return;

    if (!resolvedSelectedPayout?.id_payout_konsultan) {
      AppMessage.warning('Data pembayaran konsultan tidak ditemukan.');
      return;
    }

    if (!resolvedSelectedPayout?.business_state?.bisa_diubah) {
      AppMessage.warning(getPayoutMutationBlockedReason(resolvedSelectedPayout));
      return;
    }

    if (resolvedSelectedPayout.status_payout !== STATUS_PAYOUT_KONSULTAN.DISETUJUI) {
      AppMessage.warning('Pembayaran harus disetujui sebelum dimasukkan ke penggajian.');
      return;
    }

    if (!normalizeText(postFormData.id_periode_payroll)) {
      AppMessage.warning('Pilih periode penggajian sebelum melanjutkan.');
      return;
    }

    if (!normalizeText(postFormData.id_definisi_komponen_payroll)) {
      AppMessage.warning('Pilih jenis komponen penggajian sebelum melanjutkan.');
      return;
    }

    if (!selectedPostingDefinition) {
      AppMessage.warning('Jenis komponen penggajian yang dipilih tidak valid.');
      return;
    }

    if (!Number.isInteger(Number(postFormData.urutan_tampil)) || Number(postFormData.urutan_tampil) < 0) {
      AppMessage.warning('Urutan tampilan harus berupa angka 0 atau lebih.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await crudServiceAuth.put(ApiEndpoints.UpdatePayoutKonsultan(resolvedSelectedPayout.id_payout_konsultan), {
        status_payout: STATUS_PAYOUT_KONSULTAN.DIPOSTING_KE_PAYROLL,
        id_periode_payroll: normalizeText(postFormData.id_periode_payroll),
        id_definisi_komponen_payroll: normalizeText(postFormData.id_definisi_komponen_payroll),
        urutan_tampil: toNonNegativeInt(postFormData.urutan_tampil, 900),
      });

      await refreshPayoutCollections();

      setIsPostModalOpen(false);
      setSelectedPayout(null);
      resetPostForm();

      AppMessage.success(response?.message || 'Pembayaran konsultan berhasil dimasukkan ke penggajian.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memasukkan pembayaran konsultan ke penggajian.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, postFormData.id_definisi_komponen_payroll, postFormData.id_periode_payroll, postFormData.urutan_tampil, refreshPayoutCollections, resetPostForm, resolvedSelectedPayout, selectedPostingDefinition]);

  return {
    auth,
    canAccess,

    payoutWithMeta,
    filteredPayoutWithMeta,
    summary,
    statusCounts,
    formSummary,
    selectedEligibleTransactions,
    selectedPayoutPostingSummary,
    nominalDibayarkanPreview,

    formData,
    postFormData,
    selectedPayout: resolvedSelectedPayout,
    filterPeriode,
    setFilterPeriode,
    activeFilterPeriode,

    filterPeriodeOptions,
    periodeKonsultanOptions,
    createConsultantOptions,
    identityConsultantOptions,
    payrollOptions,
    definisiKomponenOptions,
    selectedPostingDefinition,

    loading,
    refreshing,
    isSubmitting,
    isPreviewLoading,
    isDefinisiKomponenLoading,
    pendingActionId,
    error,

    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isPostModalOpen,

    formatCurrency,
    formatDate,
    formatPeriodeKonsultanLabel,

    setFormValue,
    toggleHeldTransaction,
    setPostFormValue,
    reloadData,

    openCreateModal,
    closeCreateModal,
    handleCreate,

    openEditModal,
    closeEditModal,
    handleEdit,

    openDeleteDialog,
    closeDeleteDialog,
    handleDelete,

    openPostModal,
    closePostModal,
    handlePostToPayroll,

    handleApprovePayout,
    handleHoldPayment,
    handleReleaseHold,
    handleUnpostPayout,
  };
}
