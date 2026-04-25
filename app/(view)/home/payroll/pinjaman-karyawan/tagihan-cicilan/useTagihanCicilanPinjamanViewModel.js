'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { crudServiceAuth } from '@/app/utils/services/crudServiceAuth';

import {
  STATUS_CICILAN,
  STATUS_CICILAN_OPTIONS,
  buildKaryawanFilterOptions,
  buildSearchHaystack,
  calculateOutstandingAmount,
  canPostToPayroll,
  createPostPayrollPayload,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPeriodeLabel,
  getStatusCicilanMeta,
  getUserDepartment,
  getUserDisplayName,
  getUserIdentity,
  getUserPhoto,
  getUserRoleOrJob,
  normalizeSearchText,
  normalizeText,
  toNumber,
} from './utils/utils';

const FETCH_PAGE_SIZE = 100;
const CICILAN_SWR_KEY = 'payroll:cicilan-pinjaman-karyawan:list';
const PAYROLL_SWR_KEY = 'payroll:cicilan-pinjaman-karyawan:targets';

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

function buildCicilanEndpoint(query = {}) {
  return buildUrlWithQuery('/api/admin/cicilan-pinjaman-karyawan', query);
}

function buildPayrollEndpoint(query = {}) {
  return buildUrlWithQuery('/api/admin/payroll-karyawan', query);
}

function buildCicilanByIdEndpoint(id) {
  return `/api/admin/cicilan-pinjaman-karyawan/${id}`;
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

async function fetchAllCicilan() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      buildCicilanEndpoint({
        page,
        pageSize: FETCH_PAGE_SIZE,
        includeDeleted: 0,
        orderBy: 'jatuh_tempo',
        sort: 'asc',
      }),
    ),
  );
}

async function fetchAllPayrollTargets() {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      buildPayrollEndpoint({
        page,
        pageSize: FETCH_PAGE_SIZE,
        includeDeleted: 0,
        orderBy: 'created_at',
        sort: 'desc',
      }),
    ),
  );
}

function normalizeCicilanItem(item) {
  if (!item) return null;

  const id = normalizeText(item.id_cicilan_pinjaman_karyawan);
  if (!id) return null;

  const pinjaman = item.pinjaman_karyawan || null;
  const payroll = item.payroll_karyawan || null;
  const user = pinjaman?.user || null;

  const nominalTagihan = toNumber(item.nominal_tagihan);
  const nominalTerbayar = toNumber(item.nominal_terbayar);
  const outstandingNominal = calculateOutstandingAmount({
    nominal_tagihan: nominalTagihan,
    nominal_terbayar: nominalTerbayar,
  });

  return {
    ...item,
    id_cicilan_pinjaman_karyawan: id,
    id_pinjaman_karyawan: normalizeText(item.id_pinjaman_karyawan),
    id_payroll_karyawan: normalizeText(item.id_payroll_karyawan) || null,
    status_cicilan: normalizeText(item.status_cicilan).toUpperCase(),
    nominal_tagihan: nominalTagihan,
    nominal_terbayar: nominalTerbayar,
    outstanding_nominal: outstandingNominal,
    nama_pinjaman: normalizeText(pinjaman?.nama_pinjaman),
    nama_karyawan: getUserDisplayName(user),
    identitas_karyawan: getUserIdentity(user),
    payroll_status: normalizeText(payroll?.status_payroll).toUpperCase(),
    periode_payroll_label: formatPeriodeLabel(payroll?.periode),
    periode_tagihan_label: formatPeriodeLabel({
      bulan: item?.jatuh_tempo ? new Date(item.jatuh_tempo).getMonth() + 1 : null,
      tahun: item?.jatuh_tempo ? new Date(item.jatuh_tempo).getFullYear() : null,
    }),
    pinjaman_karyawan: pinjaman,
    payroll_karyawan: payroll,
    user,
    business_state: item.business_state || {
      linked_payroll: Boolean(item.id_payroll_karyawan),
      payroll_paid: payroll?.status_payroll === 'DIBAYAR',
      sudah_dibayar: normalizeText(item.status_cicilan).toUpperCase() === STATUS_CICILAN.DIBAYAR,
      bisa_diubah: true,
      bisa_dihapus: true,
    },
  };
}

function normalizePayrollTarget(item) {
  if (!item) return null;

  const id = normalizeText(item.id_payroll_karyawan);
  if (!id) return null;

  const user = item.user || null;
  const periode = item.periode || null;
  const payrollStatus = normalizeText(item.status_payroll).toUpperCase();
  const periodeStatus = normalizeText(periode?.status_periode).toUpperCase();
  const isMutable = item.business_state?.bisa_diubah !== false;

  return {
    ...item,
    id_payroll_karyawan: id,
    id_user: normalizeText(item.id_user || user?.id_user),
    payroll_status: payrollStatus,
    periode_status: periodeStatus,
    periode,
    user,
    periode_label: formatPeriodeLabel(periode),
    mutable: isMutable,
  };
}

function getCicilanPostBlockedMessage(cicilan) {
  const status = normalizeText(cicilan?.status_cicilan).toUpperCase();
  const linkedPayroll = Boolean(cicilan?.id_payroll_karyawan || cicilan?.business_state?.linked_payroll);

  if (linkedPayroll) {
    return {
      title: 'Cicilan sudah masuk payroll',
      description: 'Cicilan ini sudah terhubung ke payroll karyawan, sehingga tidak perlu diposting ulang.',
    };
  }

  if (status === STATUS_CICILAN.DIBAYAR) {
    return {
      title: 'Cicilan sudah dibayar',
      description: 'Cicilan yang sudah dibayar tidak bisa diposting lagi ke payroll.',
    };
  }

  if (cicilan?.business_state?.bisa_diubah === false) {
    return {
      title: 'Cicilan tidak bisa diubah',
      description: 'Cicilan ini terkunci oleh status payroll atau periode payroll yang sudah final.',
    };
  }

  return {
    title: 'Cicilan belum bisa diposting',
    description: 'Posting hanya bisa dilakukan untuk cicilan berstatus Menunggu atau Dilewati yang belum masuk payroll.',
  };
}

function getPayrollTargetUnavailableMessage(userPayrollTargets = []) {
  if (!userPayrollTargets.length) {
    return {
      title: 'Payroll tujuan belum tersedia',
      description: 'Belum ada payroll karyawan untuk user ini. Buat payroll pada periode yang sesuai terlebih dahulu, lalu ulangi posting cicilan.',
    };
  }

  const reasons = [];

  if (userPayrollTargets.some((item) => item.business_state?.approval_immutable)) {
    reasons.push('approval payroll sudah selesai');
  }

  if (userPayrollTargets.some((item) => item.business_state?.payroll_immutable || ['DISETUJUI', 'DIBAYAR'].includes(item.payroll_status))) {
    reasons.push('payroll sudah disetujui atau dibayar');
  }

  if (userPayrollTargets.some((item) => item.business_state?.periode_immutable || ['FINAL', 'TERKUNCI'].includes(item.periode_status))) {
    reasons.push('periode payroll sudah terkunci');
  }

  const reasonText = reasons.length ? reasons.join(', ') : 'payroll tujuan sedang tidak bisa diubah';

  return {
    title: 'Payroll tujuan belum bisa dipakai',
    description: `Payroll untuk karyawan ini belum bisa dipakai karena ${reasonText}. Posting cicilan hanya bisa ke payroll draft yang belum disetujui/dibayar dan periodenya masih terbuka.`,
  };
}

function createInitialPostFormData(overrides = {}) {
  return {
    id_payroll_karyawan: '',
    urutan_tampil: 920,
    catatan_item_payroll: '',
    ...overrides,
  };
}

function getPostComponentSnapshot(cicilan) {
  const namaPinjaman = normalizeText(cicilan?.nama_pinjaman || cicilan?.pinjaman_karyawan?.nama_pinjaman);

  return {
    tipe_komponen: 'PINJAMAN',
    nama_komponen: namaPinjaman || 'Pinjaman',
    arah_komponen: 'POTONGAN',
    nominal: toNumber(cicilan?.nominal_tagihan),
  };
}

export default function useTagihanCicilanPinjamanViewModel() {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterKaryawan, setFilterKaryawan] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedCicilan, setSelectedCicilan] = useState(null);
  const [selectedPostCicilan, setSelectedPostCicilan] = useState(null);
  const [postFormData, setPostFormData] = useState(createInitialPostFormData());
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const { data, error, isLoading, isValidating, mutate } = useSWR(CICILAN_SWR_KEY, fetchAllCicilan, {
    revalidateOnFocus: false,
  });
  const {
    data: payrollDataResponse,
    error: payrollError,
    isLoading: isPayrollLoading,
    isValidating: isPayrollValidating,
    mutate: mutatePayrollTargets,
  } = useSWR(PAYROLL_SWR_KEY, fetchAllPayrollTargets, {
    revalidateOnFocus: false,
  });

  const cicilanList = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map(normalizeCicilanItem).filter(Boolean);
  }, [data]);
  const payrollTargets = useMemo(() => {
    if (!Array.isArray(payrollDataResponse)) return [];
    return payrollDataResponse.map(normalizePayrollTarget).filter(Boolean);
  }, [payrollDataResponse]);

  useEffect(() => {
    if (!selectedCicilan) return;

    const nextSelected = cicilanList.find((item) => item.id_cicilan_pinjaman_karyawan === selectedCicilan.id_cicilan_pinjaman_karyawan);
    if (nextSelected) {
      setSelectedCicilan(nextSelected);
    }
  }, [cicilanList, selectedCicilan]);

  const karyawanOptions = useMemo(() => buildKaryawanFilterOptions(cicilanList), [cicilanList]);
  const selectedPostUserId = useMemo(() => normalizeText(selectedPostCicilan?.user?.id_user || selectedPostCicilan?.pinjaman_karyawan?.id_user), [selectedPostCicilan]);
  const selectablePayrollTargets = useMemo(() => {
    if (!selectedPostUserId) return [];

    return payrollTargets
      .filter((item) => item.id_user === selectedPostUserId && item.mutable)
      .sort((first, second) => {
        const firstDate = new Date(first.periode?.tanggal_mulai || 0).getTime();
        const secondDate = new Date(second.periode?.tanggal_mulai || 0).getTime();
        return secondDate - firstDate;
      });
  }, [payrollTargets, selectedPostUserId]);
  const payrollOptions = useMemo(() => {
    return selectablePayrollTargets.map((item) => ({
      value: item.id_payroll_karyawan,
      label: `${item.periode_label || item.id_payroll_karyawan} • ${item.payroll_status || 'DRAFT'}`,
    }));
  }, [selectablePayrollTargets]);
  const selectedPostComponentSnapshot = useMemo(
    () => getPostComponentSnapshot(selectedPostCicilan),
    [selectedPostCicilan],
  );

  const filteredCicilan = useMemo(() => {
    const search = normalizeSearchText(searchText);

    return cicilanList.filter((item) => {
      const statusMatch = filterStatus === 'ALL' || item.status_cicilan === filterStatus;

      const itemKaryawanKey = normalizeText(item.user?.id_user || item.nama_karyawan);
      const karyawanMatch = filterKaryawan === 'ALL' || itemKaryawanKey === filterKaryawan;

      const searchMatch = !search || buildSearchHaystack(item).includes(search);

      return statusMatch && karyawanMatch && searchMatch;
    });
  }, [cicilanList, filterStatus, filterKaryawan, searchText]);

  const summary = useMemo(() => {
    const totalCicilan = cicilanList.length;
    const totalNominalTagihan = cicilanList.reduce((sum, item) => sum + toNumber(item.nominal_tagihan), 0);
    const totalOutstanding = cicilanList.reduce((sum, item) => sum + calculateOutstandingAmount(item), 0);
    const totalDibayar = cicilanList.filter((item) => item.status_cicilan === STATUS_CICILAN.DIBAYAR).length;
    const totalMenunggu = cicilanList.filter((item) => item.status_cicilan === STATUS_CICILAN.MENUNGGU).length;
    const totalDiposting = cicilanList.filter((item) => item.status_cicilan === STATUS_CICILAN.DIPOSTING).length;
    const totalDilewati = cicilanList.filter((item) => item.status_cicilan === STATUS_CICILAN.DILEWATI).length;
    const totalPerluTindakLanjut = totalCicilan - totalDibayar;

    return {
      totalCicilan,
      totalNominalTagihan,
      totalOutstanding,
      totalDibayar,
      totalMenunggu,
      totalDiposting,
      totalDilewati,
      totalPerluTindakLanjut,
    };
  }, [cicilanList]);

  const openDetailModal = useCallback((cicilan) => {
    setSelectedCicilan(cicilan);
    setIsDetailModalOpen(true);
  }, []);

  const setPostFormValue = useCallback((field, value) => {
    setPostFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const openPostModal = useCallback(
    (cicilan) => {
      if (!cicilan) return false;

      if (isPayrollLoading || isPayrollValidating) {
        AppMessage.warning({
          title: 'Data payroll tujuan masih dimuat',
          description: 'Tunggu sebentar sampai daftar payroll karyawan selesai dimuat, lalu coba lagi.',
        });
        return false;
      }

      if (payrollError && payrollTargets.length === 0) {
        AppMessage.warning({
          title: 'Payroll tujuan belum tersedia',
          description: payrollError?.message || 'Terjadi kesalahan saat memuat daftar payroll karyawan.',
        });
        return false;
      }

      if (!canPostToPayroll(cicilan)) {
        AppMessage.warning(getCicilanPostBlockedMessage(cicilan));
        return false;
      }

      const userId = normalizeText(cicilan.user?.id_user || cicilan.pinjaman_karyawan?.id_user);
      const userPayrollTargets = payrollTargets.filter((item) => item.id_user === userId);
      const availableTargets = userPayrollTargets.filter((item) => item.mutable);

      if (!availableTargets.length) {
        AppMessage.warning(getPayrollTargetUnavailableMessage(userPayrollTargets));
        return false;
      }

      const dueDate = cicilan?.jatuh_tempo ? new Date(cicilan.jatuh_tempo) : null;
      const preferredTarget = availableTargets.find((item) => {
        const periodeStart = item?.periode?.tanggal_mulai ? new Date(item.periode.tanggal_mulai) : null;
        const periodeEnd = item?.periode?.tanggal_selesai ? new Date(item.periode.tanggal_selesai) : null;

        if (!dueDate || !periodeStart || !periodeEnd) return false;
        if (Number.isNaN(dueDate.getTime()) || Number.isNaN(periodeStart.getTime()) || Number.isNaN(periodeEnd.getTime())) return false;

        return dueDate >= periodeStart && dueDate <= periodeEnd;
      });

      setSelectedPostCicilan(cicilan);
      setPostFormData(
        createInitialPostFormData({
          id_payroll_karyawan: preferredTarget?.id_payroll_karyawan || availableTargets[0]?.id_payroll_karyawan || '',
        }),
      );
      setIsPostModalOpen(true);
      return true;
    },
    [isPayrollLoading, isPayrollValidating, payrollError, payrollTargets],
  );

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
  }, []);

  const closePostModal = useCallback(() => {
    setIsPostModalOpen(false);
    setSelectedPostCicilan(null);
    setPostFormData(createInitialPostFormData());
  }, []);

  useEffect(() => {
    if (!selectedPostCicilan) return;

    const nextSelected = cicilanList.find((item) => item.id_cicilan_pinjaman_karyawan === selectedPostCicilan.id_cicilan_pinjaman_karyawan);

    if (nextSelected) {
      setSelectedPostCicilan(nextSelected);
      return;
    }

    closePostModal();
  }, [cicilanList, closePostModal, selectedPostCicilan]);

  const reloadData = useCallback(async () => {
    try {
      await Promise.all([mutate(), mutatePayrollTargets()]);
    } catch (err) {
      AppMessage.error(err, 4);
    }
  }, [mutate, mutatePayrollTargets]);
 

  const handlePostToPayroll = useCallback(async () => {
    if (!selectedPostCicilan) return false;

    if (!canPostToPayroll(selectedPostCicilan)) {
      AppMessage.warning(getCicilanPostBlockedMessage(selectedPostCicilan));
      return false;
    }

    const payrollId = normalizeText(postFormData.id_payroll_karyawan);
    if (!payrollId) {
      AppMessage.warning({
        title: 'Payroll tujuan wajib dipilih',
        description: 'Pilih payroll karyawan tujuan sebelum memposting cicilan.',
      });
      return false;
    }

    const parsedUrutanTampil = Number(postFormData.urutan_tampil);
    const urutanTampil = Number.isFinite(parsedUrutanTampil) ? Math.max(Math.trunc(parsedUrutanTampil), 0) : NaN;

    if (!Number.isFinite(urutanTampil)) {
      AppMessage.warning({
        title: 'Urutan tampil tidak valid',
        description: 'Isi urutan tampil dengan angka bulat 0 atau lebih besar.',
      });
      return false;
    }

    const id = selectedPostCicilan.id_cicilan_pinjaman_karyawan;

    try {
      setActionLoadingId(id);

      const response = await crudServiceAuth.put(
        buildCicilanByIdEndpoint(id),
        createPostPayrollPayload({
          payrollId,
          urutanTampil,
          catatan: postFormData.catatan_item_payroll,
        }),
      );
      const updated = normalizeCicilanItem(response?.data);

      AppMessage.success({
        title: 'Cicilan berhasil diposting ke payroll',
        description: `${updated?.nama_karyawan || 'Karyawan'} - ${updated?.nama_pinjaman || 'Pinjaman'}`,
      });

      if (updated && selectedCicilan?.id_cicilan_pinjaman_karyawan === id) {
        setSelectedCicilan(updated);
      }

      closePostModal();
      await Promise.all([mutate(), mutatePayrollTargets()]);

      return true;
    } catch (err) {
      AppMessage.error({
        title: 'Gagal memposting cicilan',
        description: err?.message || 'Terjadi kesalahan saat memposting cicilan ke payroll.',
      });
      return false;
    } finally {
      setActionLoadingId(null);
    }
  }, [
    closePostModal,
    mutate,
    mutatePayrollTargets,
    postFormData.catatan_item_payroll,
    postFormData.id_payroll_karyawan,
    postFormData.urutan_tampil,
    selectedCicilan,
    selectedPostCicilan,
  ]);

  const selectedStatusMeta = useMemo(() => getStatusCicilanMeta(selectedCicilan?.status_cicilan), [selectedCicilan]);

  return {
    loading: Boolean(isLoading && cicilanList.length === 0),
    validating: isValidating,
    error,
    payrollTargetsLoading: Boolean(isPayrollLoading && payrollTargets.length === 0),
    payrollTargetsValidating: isPayrollValidating,
    payrollTargetsError: payrollError,

    dataSource: filteredCicilan,
    cicilanList,
    summary,

    filterStatus,
    setFilterStatus,
    filterKaryawan,
    setFilterKaryawan,
    searchText,
    setSearchText,

    statusOptions: STATUS_CICILAN_OPTIONS,
    karyawanOptions,

    isDetailModalOpen,
    isPostModalOpen,
    selectedCicilan,
    selectedPostCicilan,
    selectedStatusMeta,
    postFormData,
    payrollOptions,
    selectedPostComponentSnapshot,

    actionLoadingId,

    openDetailModal,
    closeDetailModal,
    openPostModal,
    closePostModal,
    reloadData,
    handlePostToPayroll,
    setPostFormValue,

    canPostToPayroll,
    getStatusCicilanMeta,
    getUserDisplayName,
    getUserIdentity,
    getUserDepartment,
    getUserRoleOrJob,
    getUserPhoto,
    formatCurrency,
    formatDate,
    formatDateTime,
    formatPeriodeLabel,
  };
}
