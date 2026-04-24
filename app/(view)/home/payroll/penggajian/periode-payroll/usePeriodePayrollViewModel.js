'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { crudServiceAuth } from '@/app/utils/services/crudServiceAuth';
import { ApiEndpoints } from '@/constrainst/endpoints';

import {
  buildDateRangeForMonth,
  BULAN_OPTIONS,
  createInitialPeriodePayrollForm,
  formatDate,
  formatPeriodePayrollLabel,
  formatStatusPeriodePayroll,
  serializePeriodePayrollPayload,
  STATUS_PERIODE_PAYROLL_OPTIONS,
  toDateInputValue,
} from './utils/periodePayrollUtils';

const FETCH_PAGE_SIZE = 100;
const PERIODE_PAYROLL_SWR_KEY = 'payroll:periode-payroll:list';
const MASTER_TEMPLATE_SWR_KEY = 'payroll:master-template:list';

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

async function fetchAllMasterTemplates() {
  const response = await crudServiceAuth.get(
    ApiEndpoints.GetMasterTemplate({
      all: true,
      orderBy: 'nama_template',
      sort: 'asc',
    }),
  );

  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;

  return [];
}

export default function usePeriodePayrollViewModel() {
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPeriode, setSelectedPeriode] = useState(null);
  const [formData, setFormData] = useState(createInitialPeriodePayrollForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const {
    data: periodeResponse,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(PERIODE_PAYROLL_SWR_KEY, fetchAllPeriodePayroll, {
    revalidateOnFocus: false,
  });

  const {
    data: masterTemplateResponse,
    error: masterTemplateError,
    isLoading: isMasterTemplateLoading,
    isValidating: isMasterTemplateValidating,
  } = useSWR(MASTER_TEMPLATE_SWR_KEY, fetchAllMasterTemplates, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!error) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'periode-payroll-fetch-error',
      content: error?.message || 'Gagal memuat data periode payroll.',
    });
  }, [error]);

  useEffect(() => {
    if (!masterTemplateError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'master-template-fetch-error',
      content: masterTemplateError?.message || 'Gagal memuat daftar template slip gaji.',
    });
  }, [masterTemplateError]);

  const periodeList = useMemo(() => (Array.isArray(periodeResponse) ? periodeResponse : []), [periodeResponse]);
  const masterTemplateList = useMemo(() => (Array.isArray(masterTemplateResponse) ? masterTemplateResponse : []), [masterTemplateResponse]);

  const resolvedSelectedPeriode = useMemo(() => {
    if (!selectedPeriode) return null;

    return periodeList.find((item) => item.id_periode_payroll === selectedPeriode.id_periode_payroll) || selectedPeriode;
  }, [periodeList, selectedPeriode]);

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
    setFormData(createInitialPeriodePayrollForm());
  }, []);

  const openCreateModal = useCallback(() => {
    setSelectedPeriode(null);
    resetForm();
    setIsCreateModalOpen(true);
  }, [resetForm]);

  const closeCreateModal = useCallback(() => {
    if (isSubmitting) return;

    setIsCreateModalOpen(false);
    resetForm();
  }, [isSubmitting, resetForm]);

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
      id_master_template: periode.id_master_template || periode?.master_template?.id_master_template || '',
    });
    setIsEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    if (isSubmitting) return;

    setIsEditModalOpen(false);
    setSelectedPeriode(null);
    resetForm();
  }, [isSubmitting, resetForm]);

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
    const payload = serializePeriodePayrollPayload(formData);

    if (!payload.bulan) {
      AppMessage.warning('Bulan periode payroll wajib dipilih.');
      return false;
    }

    if (!Number.isInteger(payload.tahun) || payload.tahun < 2000 || payload.tahun > 9999) {
      AppMessage.warning('Tahun periode payroll harus berada pada rentang 2000 sampai 9999.');
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
      const payload = serializePeriodePayrollPayload(formData);
      const response = await crudServiceAuth.post(ApiEndpoints.CreatePeriodePayroll(), payload);

      AppMessage.success(response?.message || 'Periode payroll berhasil dibuat.');
      setIsCreateModalOpen(false);
      resetForm();
      await mutate();
      return true;
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal membuat periode payroll.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mutate, resetForm, validateForm]);

  const handleUpdate = useCallback(async () => {
    if (!resolvedSelectedPeriode?.id_periode_payroll) {
      AppMessage.warning('Periode payroll tidak ditemukan.');
      return false;
    }

    if (!validateForm()) return false;

    setIsSubmitting(true);
    try {
      const payload = serializePeriodePayrollPayload(formData);
      const response = await crudServiceAuth.put(ApiEndpoints.UpdatePeriodePayroll(resolvedSelectedPeriode.id_periode_payroll), payload);

      AppMessage.success(response?.message || 'Periode payroll berhasil diperbarui.');
      setIsEditModalOpen(false);
      setSelectedPeriode(null);
      resetForm();
      await mutate();
      return true;
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memperbarui periode payroll.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mutate, resetForm, resolvedSelectedPeriode, validateForm]);

  const handleDelete = useCallback(
    async (periode) => {
      if (!periode?.id_periode_payroll) {
        AppMessage.warning('Periode payroll tidak ditemukan.');
        return false;
      }

      setActionLoadingId(periode.id_periode_payroll);
      try {
        const response = await crudServiceAuth.delete(ApiEndpoints.DeletePeriodePayroll(periode.id_periode_payroll));
        const payrollAffected = response?.relation_summary?.payroll_karyawan_terhapus_mengikuti_cascade ?? 0;
        const payoutAffected = response?.relation_summary?.payout_konsultan_yang_id_periode_payroll_menjadi_null ?? 0;

        AppMessage.success(
          payrollAffected || payoutAffected
            ? `Periode payroll berhasil dihapus. ${payrollAffected} data payroll karyawan yang terkait ikut dihapus dan ${payoutAffected} payout konsultan dilepaskan dari periode ini.`
            : response?.message || 'Periode payroll berhasil dihapus.',
        );

        if (resolvedSelectedPeriode?.id_periode_payroll === periode.id_periode_payroll) {
          setIsDetailModalOpen(false);
          setSelectedPeriode(null);
        }

        await mutate();
        return true;
      } catch (err) {
        AppMessage.error(err?.message || 'Gagal menghapus periode payroll.');
        return false;
      } finally {
        setActionLoadingId(null);
      }
    },
    [mutate, resolvedSelectedPeriode],
  );

  const reloadData = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const filteredList = useMemo(() => {
    const needle = normalizeText(searchText);

    return periodeList.filter((item) => {
      const status = String(item?.status_periode || '').toUpperCase();
      const tahun = String(item?.tahun || '');
      const haystack = normalizeText(
        [
          formatPeriodePayrollLabel(item),
          item?.catatan,
          formatStatusPeriodePayroll(status),
          item?.tanggal_mulai,
          item?.tanggal_selesai,
          item?.master_template?.nama_template,
          item?.master_template?.file_template_url,
          `${item?._count?.payroll_karyawan || 0}`,
          `${item?._count?.payout_konsultan ?? item?._count?.payoutKonsultans ?? 0}`,
        ].join(' '),
      );

      if (needle && !haystack.includes(needle)) return false;
      if (filterStatus && status !== filterStatus) return false;
      if (filterTahun && tahun !== String(filterTahun)) return false;

      return true;
    });
  }, [filterStatus, filterTahun, periodeList, searchText]);

  const summary = useMemo(() => {
    const totalPeriode = periodeList.length;
    const totalDraft = periodeList.filter((item) => item?.status_periode === 'DRAFT').length;
    const totalFinal = periodeList.filter((item) => ['FINAL', 'TERKUNCI'].includes(String(item?.status_periode || '').toUpperCase())).length;
    const totalPayrollKaryawan = periodeList.reduce((sum, item) => sum + toNumber(item?._count?.payroll_karyawan), 0);
    const totalPayoutKonsultan = periodeList.reduce((sum, item) => sum + toNumber(item?._count?.payout_konsultan ?? item?._count?.payoutKonsultans), 0);

    return {
      totalPeriode,
      totalDraft,
      totalFinal,
      totalPayrollKaryawan,
      totalPayoutKonsultan,
    };
  }, [periodeList]);

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

  const statusOptions = useMemo(() => [{ value: '', label: 'Semua Status' }, ...STATUS_PERIODE_PAYROLL_OPTIONS], []);
  const templateOptions = useMemo(
    () =>
      masterTemplateList.map((item) => ({
        value: item?.id_master_template || '',
        label: item?.nama_template || 'Template tanpa nama',
      })),
    [masterTemplateList],
  );

  const resolveTemplateLabel = useCallback((source) => {
    const template = source?.master_template ?? source;
    return template?.nama_template || 'Belum memilih template slip gaji';
  }, []);

  return {
    error,
    loading: isLoading,
    validating: isValidating,

    periodeList,
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
    bulanOptions: BULAN_OPTIONS,
    templateOptions,
    templateLoading: isMasterTemplateLoading || isMasterTemplateValidating,

    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    isEditModalOpen,
    openEditModal,
    closeEditModal,
    isDetailModalOpen,
    openDetailModal,
    closeDetailModal,
    selectedPeriode: resolvedSelectedPeriode,

    formData,
    setFormValue,
    resetForm,
    isSubmitting,
    actionLoadingId,

    handleCreate,
    handleUpdate,
    handleDelete,
    reloadData,

    formatDate,
    formatPeriodeLabel: formatPeriodePayrollLabel,
    formatStatusPeriode: formatStatusPeriodePayroll,
    resolveTemplateLabel,
  };
}
