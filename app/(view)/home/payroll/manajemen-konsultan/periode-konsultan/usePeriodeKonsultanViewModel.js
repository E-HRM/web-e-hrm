'use client';

import { useCallback, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import useSWR from 'swr';

import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { ApiEndpoints } from '@/constrainst/endpoints';

import {
  BULAN_OPTIONS,
  STATUS_PERIODE_OPTIONS,
  buildDateRangeForMonth,
  createInitialPeriodeForm,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPeriodeLabel,
  formatStatusPeriode,
  serializePeriodePayload,
  toDateInputValue,
} from './utils/periodeKonsultanUtils';

const FETCH_PAGE_SIZE = 100;
const PERIODE_SWR_KEY = 'payroll:periode-konsultan:list';
const PAYOUT_SWR_KEY = 'payroll:periode-konsultan:payout';

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function apiJson(url, { method = 'GET', body } = {}) {
  const token = Cookies.get('token');
  const headers = {};

  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined && !(body instanceof FormData)) {
    headers['content-type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : await response.text().catch(() => '');

  if (!response.ok) {
    const message = typeof data === 'string' ? data : data?.message || data?.error || `Request gagal (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
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

async function fetchAllPeriodeKonsultan() {
  return fetchAllPages((page) =>
    apiJson(
      ApiEndpoints.GetPeriodeKonsultan({
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: 'tanggal_mulai',
        sort: 'desc',
      }),
    ),
  );
}

async function fetchAllPayoutKonsultan() {
  return fetchAllPages((page) =>
    apiJson(
      ApiEndpoints.GetPayoutKonsultan({
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: 'created_at',
        sort: 'desc',
      }),
    ),
  );
}

export default function usePeriodeKonsultanViewModel() {
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPeriode, setSelectedPeriode] = useState(null);
  const [formData, setFormData] = useState(createInitialPeriodeForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const {
    data: periodeResponse,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(PERIODE_SWR_KEY, fetchAllPeriodeKonsultan, {
    revalidateOnFocus: false,
  });

  const {
    data: payoutResponse,
    error: payoutError,
    isLoading: isPayoutLoading,
    isValidating: isPayoutValidating,
    mutate: mutatePayout,
  } = useSWR(PAYOUT_SWR_KEY, fetchAllPayoutKonsultan, {
    revalidateOnFocus: false,
  });

  const periodeList = useMemo(() => (Array.isArray(periodeResponse) ? periodeResponse : []), [periodeResponse]);
  const payoutList = useMemo(() => (Array.isArray(payoutResponse) ? payoutResponse : []), [payoutResponse]);

  const setFormValue = useCallback((field, value) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      if (field === 'bulan' || field === 'tahun') {
        const nextBulan = field === 'bulan' ? value : next.bulan;
        const nextTahun = field === 'tahun' ? value : next.tahun;
        const range = buildDateRangeForMonth(nextBulan, nextTahun);

        next.tanggal_mulai = range.tanggal_mulai;
        next.tanggal_selesai = range.tanggal_selesai;
      }

      return next;
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData(createInitialPeriodeForm());
  }, []);

  const openCreateModal = useCallback(() => {
    setSelectedPeriode(null);
    resetForm();
    setIsCreateModalOpen(true);
  }, [resetForm]);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    resetForm();
  }, [resetForm]);

  const openEditModal = useCallback((periode) => {
    if (!periode) return;

    setSelectedPeriode(periode);
    setFormData({
      bulan: periode.bulan || '',
      tahun: Number(periode.tahun || new Date().getFullYear()),
      tanggal_mulai: toDateInputValue(periode.tanggal_mulai),
      tanggal_selesai: toDateInputValue(periode.tanggal_selesai),
      status_periode: periode.status_periode || 'DRAFT',
      catatan: periode.catatan || '',
    });
    setIsEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedPeriode(null);
    resetForm();
  }, [resetForm]);

  const openDetailModal = useCallback((periode) => {
    if (!periode) return;
    setSelectedPeriode(periode);
    setIsDetailModalOpen(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedPeriode(null);
  }, []);

  const validateForm = useCallback(() => {
    const payload = serializePeriodePayload(formData);

    if (!payload.bulan) {
      AppMessage.warning('Bulan periode wajib dipilih.');
      return false;
    }

    if (!Number.isInteger(payload.tahun) || payload.tahun < 2000 || payload.tahun > 9999) {
      AppMessage.warning('Tahun periode harus berada pada rentang 2000 sampai 9999.');
      return false;
    }

    if (!payload.tanggal_mulai) {
      AppMessage.warning('Tanggal mulai wajib diisi.');
      return false;
    }

    if (!payload.tanggal_selesai) {
      AppMessage.warning('Tanggal selesai wajib diisi.');
      return false;
    }

    if (new Date(payload.tanggal_selesai) < new Date(payload.tanggal_mulai)) {
      AppMessage.warning('Tanggal selesai tidak boleh lebih kecil dari tanggal mulai.');
      return false;
    }

    return true;
  }, [formData]);

  const handleCreate = useCallback(async () => {
    if (!validateForm()) return false;

    setIsSubmitting(true);
    try {
      const payload = serializePeriodePayload(formData);
      await apiJson(ApiEndpoints.CreatePeriodeKonsultan(), {
        method: 'POST',
        body: payload,
      });

      AppMessage.success('Periode konsultan berhasil dibuat.');
      setIsCreateModalOpen(false);
      resetForm();
      await mutate();
      return true;
    } catch (err) {
      AppMessage.error(err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mutate, resetForm, validateForm]);

  const handleUpdate = useCallback(async () => {
    if (!selectedPeriode?.id_periode_konsultan) {
      AppMessage.warning('Periode konsultan tidak ditemukan.');
      return false;
    }

    if (!validateForm()) return false;

    setIsSubmitting(true);
    try {
      const payload = serializePeriodePayload(formData);
      await apiJson(ApiEndpoints.UpdatePeriodeKonsultan(selectedPeriode.id_periode_konsultan), {
        method: 'PUT',
        body: payload,
      });

      AppMessage.success('Periode konsultan berhasil diperbarui.');
      setIsEditModalOpen(false);
      setSelectedPeriode(null);
      resetForm();
      await mutate();
      return true;
    } catch (err) {
      AppMessage.error(err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mutate, resetForm, selectedPeriode, validateForm]);

  const handleDelete = useCallback(
    async (periode) => {
      if (!periode?.id_periode_konsultan) {
        AppMessage.warning('Periode konsultan tidak ditemukan.');
        return false;
      }

      setActionLoadingId(periode.id_periode_konsultan);
      try {
        const response = await apiJson(ApiEndpoints.DeletePeriodeKonsultan(periode.id_periode_konsultan), {
          method: 'DELETE',
        });

        const transaksiAffected = response?.cascade_summary?.transaksi_konsultan_soft_deleted ?? 0;
        const payoutAffected = response?.cascade_summary?.payout_konsultan_soft_deleted ?? 0;

        AppMessage.success(
          transaksiAffected || payoutAffected
            ? `Periode berhasil dihapus dari daftar aktif. ${transaksiAffected} transaksi dan ${payoutAffected} pencairan terkait ikut dinonaktifkan.`
            : 'Periode konsultan berhasil dihapus dari daftar aktif.',
        );

        if (selectedPeriode?.id_periode_konsultan === periode.id_periode_konsultan) {
          setIsDetailModalOpen(false);
          setSelectedPeriode(null);
        }

        await Promise.all([mutate(), mutatePayout()]);
        return true;
      } catch (err) {
        AppMessage.error(err);
        return false;
      } finally {
        setActionLoadingId(null);
      }
    },
    [mutate, mutatePayout, selectedPeriode],
  );

  const reloadData = useCallback(async () => {
    await Promise.all([mutate(), mutatePayout()]);
  }, [mutate, mutatePayout]);

  const filteredList = useMemo(() => {
    const needle = normalizeText(searchText);

    return periodeList.filter((item) => {
      const status = String(item?.status_periode || '').toUpperCase();
      const tahun = String(item?.tahun || '');
      const haystack = normalizeText(
        [formatPeriodeLabel(item), item?.catatan, formatStatusPeriode(status), item?.tanggal_mulai, item?.tanggal_selesai, `${item?._count?.transaksi_konsultan || 0}`, `${item?._count?.payout_konsultan || 0}`].join(' '),
      );

      if (needle && !haystack.includes(needle)) return false;
      if (filterStatus && status !== filterStatus) return false;
      if (filterTahun && tahun !== String(filterTahun)) return false;

      return true;
    });
  }, [filterStatus, filterTahun, periodeList, searchText]);

  const summary = useMemo(() => {
    const totalPeriode = periodeList.length;
    const totalDisetujui = periodeList.filter((item) => item?.status_periode === 'DISETUJUI').length;
    const totalTransaksi = periodeList.reduce((sum, item) => sum + toNumber(item?._count?.transaksi_konsultan), 0);
    const totalNominalPayout = payoutList.reduce((sum, item) => sum + toNumber(item?.nominal_dibayarkan), 0);

    return {
      totalPeriode,
      totalDisetujui,
      totalTransaksi,
      totalNominalPayout,
    };
  }, [periodeList, payoutList]);

  const tahunOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set([currentYear]);

    periodeList.forEach((item) => {
      if (item?.tahun) years.add(Number(item.tahun));
    });

    return [
      { value: '', label: 'Semua Tahun' },
      ...Array.from(years)
        .filter((value) => Number.isInteger(value))
        .sort((a, b) => b - a)
        .map((value) => ({
          value: String(value),
          label: String(value),
        })),
    ];
  }, [periodeList]);

  const statusOptions = useMemo(() => [{ value: '', label: 'Semua Status' }, ...STATUS_PERIODE_OPTIONS], []);

  const bulanOptions = BULAN_OPTIONS;

  return {
    error,
    payoutError,
    loading: isLoading || isPayoutLoading,
    validating: isValidating || isPayoutValidating,

    periodeList,
    payoutList,
    filteredList,
    dataSource: filteredList,
    summary,

    searchText,
    setSearchText,
    filterStatus,
    setFilterStatus,
    filterTahun,
    setFilterTahun,
    statusOptions,
    tahunOptions,
    bulanOptions,

    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    isEditModalOpen,
    openEditModal,
    closeEditModal,
    isDetailModalOpen,
    openDetailModal,
    closeDetailModal,
    selectedPeriode,

    formData,
    setFormValue,
    resetForm,
    isSubmitting,
    actionLoadingId,

    handleCreate,
    handleUpdate,
    handleDelete,
    reloadData,

    formatCurrency,
    formatDate,
    formatDateTime,
    formatPeriodeLabel,
    formatStatusPeriode,
  };
}
