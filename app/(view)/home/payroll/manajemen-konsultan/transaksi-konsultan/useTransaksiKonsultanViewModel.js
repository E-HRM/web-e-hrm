'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import useSWR from 'swr';

import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { ApiEndpoints } from '@/constrainst/endpoints';

import {
  buildPeriodeOption,
  createInitialTransaksiForm,
  formatCurrency,
  formatDate,
  formatDecimalPercent,
  formatPeriodeLabel,
  formatPeriodeFromItem,
  formatStatusPeriode,
  getConsultantDisplayName,
  getConsultantIdentity,
  getConsultantPhoto,
  getConsultantSecondaryText,
  toDateInputValue,
} from './utils/transaksiKonsultanUtils';

const FETCH_PAGE_SIZE = 100;
const PERIODE_SWR_KEY = 'payroll:transaksi-konsultan:periode';
const USERS_SWR_KEY = 'payroll:transaksi-konsultan:users';
const PRODUK_SWR_KEY = 'payroll:transaksi-konsultan:produk';

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDecimalInput(value, { allowNull = false, fallback = '0' } = {}) {
  if (value === undefined || value === null) {
    return allowNull ? null : fallback;
  }

  const normalized = String(value).trim().replace(',', '.');

  if (!normalized) {
    return allowNull ? null : fallback;
  }

  return normalized;
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

function sanitizeFilenamePart(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'periode';
}

function getProdukDisplayName(produk) {
  return produk?.nama_produk || produk?.id_jenis_produk_konsultan || '-';
}

function getProdukShareDefault(produk) {
  if (produk?.persen_share_default === null || produk?.persen_share_default === undefined || produk?.persen_share_default === '') {
    return null;
  }

  return String(produk.persen_share_default);
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

function getFriendlyErrorMessage(error, fallback = 'Terjadi kendala pada sistem. Silakan coba lagi.') {
  const rawMessage = typeof error === 'string' ? error : error?.message;
  const message = String(rawMessage || fallback || '').trim();

  if (!message) return fallback;

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('forbidden')) {
    return 'Anda belum memiliki akses untuk melakukan tindakan ini.';
  }

  if (lowerMessage.includes('payload json')) {
    return 'Data yang dikirim belum sesuai. Silakan muat ulang halaman lalu coba lagi.';
  }

  if (lowerMessage.includes('request gagal')) {
    return fallback;
  }

  if (lowerMessage.includes('server error')) {
    return 'Terjadi kendala pada sistem. Silakan coba lagi.';
  }

  if (lowerMessage.includes('endpoint crud')) {
    return 'Status payroll tidak dapat diubah dari halaman ini.';
  }

  return message
    .replace(/backend/gi, 'sistem')
    .replace(/server/gi, 'sistem')
    .replace(/soft delete/gi, 'disembunyikan dari daftar')
    .replace(/field/gi, 'kolom')
    .replace(/mapping/gi, 'pencocokan data')
    .replace(/validasi/gi, 'pemeriksaan')
    .replace(/diimport/gi, 'diimpor')
    .replace(/import/gi, 'impor')
    .replace(/diexport/gi, 'diekspor')
    .replace(/export/gi, 'ekspor')
    .replace(/posted/gi, 'sudah masuk payroll')
    .replace(/posting/gi, 'masuk payroll')
    .replace(/total_income/gi, 'total pendapatan')
    .replace(/nominal_debit/gi, 'pemasukan')
    .replace(/nominal_kredit/gi, 'pengeluaran')
    .replace(/nominal_share/gi, 'bagian konsultan')
    .replace(/nominal_oss/gi, 'bagian OSS')
    .replace(/persen_share_default/gi, 'persentase share standar')
    .replace(/persen_share_override/gi, 'persentase share khusus')
    .replace(/id_user_konsultan/gi, 'konsultan')
    .replace(/id_periode_konsultan/gi, 'periode')
    .replace(/id_jenis_produk_konsultan/gi, 'layanan atau produk');
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

async function fetchAllUsers() {
  return fetchAllPages((page) =>
    apiJson(
      buildUrlWithQuery(ApiEndpoints.GetUsers, {
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: 'nama_pengguna',
        sort: 'asc',
      }),
    ),
  );
}

async function fetchAllProdukKonsultan() {
  return fetchAllPages((page) =>
    apiJson(
      ApiEndpoints.GetProdukKonsultan({
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: 'nama_produk',
        sort: 'asc',
      }),
    ),
  );
}

async function fetchTransaksiByPeriode(idPeriodeKonsultan) {
  if (!idPeriodeKonsultan) return [];

  return fetchAllPages((page) =>
    apiJson(
      ApiEndpoints.GetTransaksiKonsultan({
        page,
        pageSize: FETCH_PAGE_SIZE,
        id_periode_konsultan: idPeriodeKonsultan,
        orderBy: 'tanggal_transaksi',
        sort: 'desc',
      }),
    ),
  );
}

function buildActionLockReason(transaksi) {
  if (!transaksi) return 'Transaksi tidak ditemukan.';

  if (transaksi?.business_state?.sudah_posting_payroll) {
    return 'Transaksi sudah masuk payroll dan tidak dapat diubah.';
  }

  if (transaksi?.business_state?.periode_terkunci) {
    return 'Periode transaksi ini sudah terkunci.';
  }

  if (transaksi?.business_state?.periode_deleted) {
    return 'Periode transaksi ini sudah dihapus.';
  }

  return 'Transaksi ini tidak dapat diubah.';
}

const KONSULTAN_MAPPING_ERROR_CODES = new Set(['KONSULTAN_EMPTY', 'KONSULTAN_NOT_FOUND', 'KONSULTAN_AMBIGUOUS']);
const PRODUK_MAPPING_WARNING_CODES = new Set(['PRODUK_NOT_FOUND']);

function getIssueMessage(issue) {
  if (!issue) return '';
  if (typeof issue === 'string') return getFriendlyErrorMessage(issue, issue);
  return getFriendlyErrorMessage(issue.message || '', issue.message || '');
}

function resolveImportRowIssues(row) {
  if (row?.selected === false) {
    return {
      errors: [],
      warnings: [],
      status: 'ignored',
    };
  }

  const idUserKonsultan = String(row?.id_user_konsultan || '').trim();
  const idProdukKonsultan = String(row?.id_jenis_produk_konsultan || '').trim();

  const errors = Array.isArray(row?.errors) ? row.errors.filter((item) => !KONSULTAN_MAPPING_ERROR_CODES.has(item?.code)) : [];
  const warnings = Array.isArray(row?.warnings) ? row.warnings.filter((item) => !PRODUK_MAPPING_WARNING_CODES.has(item?.code)) : [];

  if (!row?.is_oss && !idUserKonsultan) {
    errors.push({
      code: 'KONSULTAN_NOT_SELECTED',
      message: 'Mohon pilih konsultan, kecuali untuk baris OSS.',
    });
  }

  if (!idProdukKonsultan) {
    warnings.push({
      code: 'PRODUK_NOT_SELECTED',
      message: 'Layanan atau produk belum dipilih. Baris tetap bisa disimpan tanpa produk.',
    });
  }

  return {
    errors,
    warnings,
    status: errors.length ? 'error' : warnings.length ? 'warning' : 'valid',
  };
}

function buildImportSummary(rows) {
  return rows.reduce(
    (summary, row) => {
      if (row.selected === false) {
        summary.ignored_rows += 1;
        return summary;
      }

      summary.total_rows += 1;
      summary.total_debit += toNumber(row.nominal_debit);
      summary.total_kredit += toNumber(row.nominal_kredit);
      summary.total_income += toNumber(row.total_income);
      summary.total_share += toNumber(row.nominal_share);
      summary.total_oss += toNumber(row.nominal_oss);

      if (row.status === 'error') summary.error_rows += 1;
      else if (row.status === 'warning') summary.warning_rows += 1;
      else summary.valid_rows += 1;

      return summary;
    },
    {
      total_rows: 0,
      valid_rows: 0,
      warning_rows: 0,
      error_rows: 0,
      total_debit: 0,
      total_kredit: 0,
      total_income: 0,
      total_share: 0,
      total_oss: 0,
      ignored_rows: 0,
    },
  );
}

function getExportSheetName(activePeriodeLabel) {
  const normalized = String(activePeriodeLabel || 'Transaksi')
    .replace(/[\\/?*[\]:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (normalized.split(' ')[0] || normalized || 'Transaksi').slice(0, 31);
}

function getExportDateValue(value) {
  const ymd = toDateInputValue(value);
  if (!ymd) return value || '';

  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getConsultantExportLabel(transaksi) {
  if (!transaksi?.id_user_konsultan) return null;

  const name = String(transaksi.konsultan_display_name || transaksi.konsultan?.nama_pengguna || '').trim();
  if (!name) return transaksi.id_user_konsultan;

  return name.split(/\s+/)[0] || name;
}

function buildConsultantExportColumns(transaksiList) {
  const byUser = new Map();

  transaksiList.forEach((transaksi) => {
    if (!transaksi?.id_user_konsultan || byUser.has(transaksi.id_user_konsultan)) return;

    byUser.set(transaksi.id_user_konsultan, {
      id: transaksi.id_user_konsultan,
      shortLabel: getConsultantExportLabel(transaksi),
      fullLabel: String(transaksi.konsultan_display_name || transaksi.konsultan?.nama_pengguna || transaksi.id_user_konsultan).trim(),
    });
  });

  const shortCounts = new Map();
  Array.from(byUser.values()).forEach((item) => {
    shortCounts.set(item.shortLabel, (shortCounts.get(item.shortLabel) || 0) + 1);
  });

  return Array.from(byUser.values()).map((item) => ({
    id: item.id,
    label: shortCounts.get(item.shortLabel) > 1 ? item.fullLabel : item.shortLabel,
  }));
}

function addExportAmount(map, key, amount) {
  map.set(key, (map.get(key) || 0) + toNumber(amount));
}

function classifyIncomeCategory(transaksi) {
  const source = `${transaksi?.produk_display_name || ''} ${transaksi?.jenis_produk?.nama_produk || ''} ${transaksi?.deskripsi || ''}`.toLowerCase();

  if (source.includes('english') || source.includes('ielts') || source.includes('course')) return 'Income English Course';
  if (source.includes('service fee')) return 'Income Service Fee';
  if (source.includes('commission') && (source.includes('study') || source.includes('school') || source.includes('college') || source.includes('university'))) return 'Income Commission Study';
  if (source.includes('commission') && (source.includes('work') || source.includes('job') || source.includes('career'))) return 'Income Commission Work';

  return 'Income Lainnya (Translate Dokumen, Selisih Kurs Pembayaran, Event, Expo)';
}

export default function useTransaksiKonsultanViewModel() {
  const [filterPeriode, setFilterPeriode] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaksi, setSelectedTransaksi] = useState(null);
  const [formData, setFormData] = useState(createInitialTransaksiForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importRows, setImportRows] = useState([]);
  const [importPreviewPage, setImportPreviewPage] = useState(1);
  const [isImportPreviewing, setIsImportPreviewing] = useState(false);
  const [isImportCommitting, setIsImportCommitting] = useState(false);

  const {
    data: periodeResponse,
    error: periodeError,
    isLoading: isPeriodeLoading,
    isValidating: isPeriodeValidating,
    mutate: mutatePeriode,
  } = useSWR(PERIODE_SWR_KEY, fetchAllPeriodeKonsultan, {
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
    data: produkResponse,
    error: produkError,
    isLoading: isProdukLoading,
    isValidating: isProdukValidating,
    mutate: mutateProduk,
  } = useSWR(PRODUK_SWR_KEY, fetchAllProdukKonsultan, {
    revalidateOnFocus: false,
  });

  const transaksiSWRKey = useMemo(() => (filterPeriode ? ['payroll:transaksi-konsultan:list', filterPeriode] : null), [filterPeriode]);

  const {
    data: transaksiResponse,
    error: transaksiError,
    isLoading: isTransaksiLoading,
    isValidating: isTransaksiValidating,
    mutate: mutateTransaksi,
  } = useSWR(transaksiSWRKey, ([, periodeId]) => fetchTransaksiByPeriode(periodeId), {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!periodeError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'transaksi-konsultan-periode-error',
      content: getFriendlyErrorMessage(periodeError, 'Data periode konsultan belum berhasil dimuat.'),
    });
  }, [periodeError]);

  useEffect(() => {
    if (!usersError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'transaksi-konsultan-users-error',
      content: getFriendlyErrorMessage(usersError, 'Data konsultan belum berhasil dimuat.'),
    });
  }, [usersError]);

  useEffect(() => {
    if (!produkError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'transaksi-konsultan-produk-error',
      content: getFriendlyErrorMessage(produkError, 'Data layanan atau produk belum berhasil dimuat.'),
    });
  }, [produkError]);

  useEffect(() => {
    if (!transaksiError) return;

    AppMessage.once({
      type: 'error',
      onceKey: `transaksi-konsultan-list-error:${filterPeriode || 'none'}`,
      content: getFriendlyErrorMessage(transaksiError, 'Data transaksi konsultan belum berhasil dimuat.'),
    });
  }, [filterPeriode, transaksiError]);

  const periodeData = useMemo(() => (Array.isArray(periodeResponse) ? periodeResponse : []), [periodeResponse]);

  const usersData = useMemo(() => {
    const rawUsers = Array.isArray(usersResponse) ? usersResponse : [];
    return rawUsers.filter((item) => !item?.deleted_at);
  }, [usersResponse]);

  const produkData = useMemo(() => {
    const rawProduk = Array.isArray(produkResponse) ? produkResponse : [];
    return rawProduk.filter((item) => !item?.deleted_at);
  }, [produkResponse]);

  const periodeOptions = useMemo(() => {
    return periodeData.map(buildPeriodeOption);
  }, [periodeData]);

  useEffect(() => {
    if (filterPeriode || periodeOptions.length === 0) return;

    const preferred = periodeOptions.find((item) => !item.disabled) || periodeOptions[0];
    if (preferred?.value) {
      setFilterPeriode(preferred.value);
      setFormData(createInitialTransaksiForm(preferred.value));
    }
  }, [filterPeriode, periodeOptions]);

  const periodeMap = useMemo(() => {
    return new Map(periodeData.map((item) => [String(item.id_periode_konsultan), item]));
  }, [periodeData]);

  const usersMap = useMemo(() => {
    return new Map(usersData.map((item) => [String(item.id_user), item]));
  }, [usersData]);

  const produkMap = useMemo(() => {
    return new Map(produkData.map((item) => [String(item.id_jenis_produk_konsultan), item]));
  }, [produkData]);

  const transaksiList = useMemo(() => {
    const rawData = Array.isArray(transaksiResponse) ? transaksiResponse : [];

    return rawData.map((item) => {
      const fallbackUser = usersMap.get(String(item?.id_user_konsultan || '')) || null;
      const fallbackPeriode = periodeMap.get(String(item?.id_periode_konsultan || '')) || null;
      const fallbackProduk = produkMap.get(String(item?.id_jenis_produk_konsultan || '')) || null;
      const konsultan = item?.konsultan || fallbackUser || null;
      const periode = item?.periode_konsultan || fallbackPeriode || null;
      const jenisProduk = item?.jenis_produk || fallbackProduk || null;

      return {
        ...item,
        konsultan,
        periode_konsultan: periode,
        jenis_produk: jenisProduk,
        konsultan_display_name: konsultan ? getConsultantDisplayName(konsultan) : 'OSS',
        konsultan_identity: konsultan ? getConsultantIdentity(konsultan) : 'Bagian perusahaan',
        konsultan_photo: getConsultantPhoto(konsultan),
        konsultan_secondary_text: konsultan ? getConsultantSecondaryText(konsultan) : 'Tanpa user konsultan',
        produk_display_name: getProdukDisplayName(jenisProduk),
        periode_label: formatPeriodeFromItem(periode),
      };
    });
  }, [periodeMap, produkMap, transaksiResponse, usersMap]);

  const resolvedSelectedTransaksi = useMemo(() => {
    if (!selectedTransaksi) return null;

    return transaksiList.find((item) => item.id_transaksi_konsultan === selectedTransaksi.id_transaksi_konsultan) || selectedTransaksi;
  }, [selectedTransaksi, transaksiList]);

  const activePeriode = useMemo(() => {
    return periodeMap.get(String(filterPeriode || '')) || null;
  }, [filterPeriode, periodeMap]);

  const activePeriodeLabel = useMemo(() => {
    return formatPeriodeLabel(filterPeriode, periodeOptions);
  }, [filterPeriode, periodeOptions]);

  const activePeriodeStatus = useMemo(() => {
    return activePeriode?.status_periode || null;
  }, [activePeriode]);

  const canCreateInActivePeriode = useMemo(() => {
    if (!activePeriode) return false;
    if (activePeriode.deleted_at) return false;
    return activePeriode.status_periode !== 'TERKUNCI';
  }, [activePeriode]);

  const importRowsWithState = useMemo(() => {
    return importRows.map((row) => {
      const issues = resolveImportRowIssues(row);
      return {
        ...row,
        errors: issues.errors,
        warnings: issues.warnings,
        status: issues.status,
      };
    });
  }, [importRows]);

  const importSummary = useMemo(() => {
    const summary = buildImportSummary(importRowsWithState);
    return {
      ...(importPreview?.summary || {}),
      ...summary,
    };
  }, [importPreview?.summary, importRowsWithState]);

  const canCommitImport = useMemo(() => {
    return importSummary.total_rows > 0 && importSummary.error_rows === 0 && !isImportPreviewing && !isImportCommitting;
  }, [importSummary.error_rows, importSummary.total_rows, isImportCommitting, isImportPreviewing]);

  const totalIncome = useMemo(() => transaksiList.reduce((sum, item) => sum + toNumber(item.total_income), 0), [transaksiList]);
  const totalShare = useMemo(() => transaksiList.reduce((sum, item) => sum + toNumber(item.nominal_share), 0), [transaksiList]);
  const totalOSS = useMemo(() => transaksiList.reduce((sum, item) => sum + toNumber(item.nominal_oss), 0), [transaksiList]);
  const sudahPosting = useMemo(() => transaksiList.filter((item) => item.sudah_posting_payroll).length, [transaksiList]);
  const belumPosting = useMemo(() => transaksiList.filter((item) => !item.sudah_posting_payroll).length, [transaksiList]);

  const setFormValue = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const setProdukValue = useCallback(
    (value) => {
      const selectedProduk = value ? produkMap.get(String(value)) : null;
      const selectedShareDefault = getProdukShareDefault(selectedProduk);

      setFormData((prev) => ({
        ...prev,
        id_jenis_produk_konsultan: value || '',
        ...(selectedShareDefault !== null ? { persen_share_default: selectedShareDefault } : {}),
      }));
    },
    [produkMap],
  );

  const resetForm = useCallback(
    (periodeId = filterPeriode) => {
      setFormData(createInitialTransaksiForm(periodeId || ''));
    },
    [filterPeriode],
  );

  const formatCompactCurrency = useCallback((value) => {
    return formatCurrency(value).split(',')[0];
  }, []);

  const getPersenShare = useCallback((transaksi) => {
    const explicitShare = transaksi?.effective_persen_share ?? transaksi?.persen_share_override ?? transaksi?.persen_share_default;
    if (explicitShare !== null && explicitShare !== undefined && explicitShare !== '') return explicitShare;

    const total = toNumber(transaksi?.total_income);
    if (total === 0) return 0;

    return (toNumber(transaksi?.nominal_share) / total) * 100;
  }, []);

  const getDisabledActionReason = useCallback((transaksi) => {
    return buildActionLockReason(transaksi);
  }, []);

  const reloadData = useCallback(async () => {
    await Promise.all([mutatePeriode(), mutateUsers(), mutateProduk(), transaksiSWRKey ? mutateTransaksi() : Promise.resolve()]);
  }, [mutatePeriode, mutateProduk, mutateTransaksi, mutateUsers, transaksiSWRKey]);

  const openCreateModal = useCallback(() => {
    if (!filterPeriode) {
      AppMessage.warning('Mohon pilih periode konsultan terlebih dahulu.');
      return;
    }

    if (!canCreateInActivePeriode) {
      AppMessage.warning('Periode yang dipilih belum bisa digunakan untuk membuat transaksi baru.');
      return;
    }

    setSelectedTransaksi(null);
    setFormData(createInitialTransaksiForm(filterPeriode));
    setIsCreateModalOpen(true);
  }, [canCreateInActivePeriode, filterPeriode]);

  const closeCreateModal = useCallback(() => {
    if (isSubmitting) return;
    setIsCreateModalOpen(false);
    resetForm();
  }, [isSubmitting, resetForm]);

  const closeEditModal = useCallback(() => {
    if (isSubmitting) return;
    setIsEditModalOpen(false);
    setSelectedTransaksi(null);
    resetForm();
  }, [isSubmitting, resetForm]);

  const closeDeleteDialog = useCallback(() => {
    if (isSubmitting) return;
    setIsDeleteDialogOpen(false);
    setSelectedTransaksi(null);
  }, [isSubmitting]);

  const openImportModal = useCallback(() => {
    if (!filterPeriode) {
      AppMessage.warning('Mohon pilih periode konsultan terlebih dahulu.');
      return;
    }

    if (!canCreateInActivePeriode) {
      AppMessage.warning('Periode yang dipilih belum bisa digunakan untuk impor transaksi.');
      return;
    }

    setImportFile(null);
    setImportPreview(null);
    setImportRows([]);
    setImportPreviewPage(1);
    setIsImportModalOpen(true);
  }, [canCreateInActivePeriode, filterPeriode]);

  const closeImportModal = useCallback(() => {
    if (isImportPreviewing || isImportCommitting) return;
    setIsImportModalOpen(false);
    setImportFile(null);
    setImportPreview(null);
    setImportRows([]);
    setImportPreviewPage(1);
  }, [isImportCommitting, isImportPreviewing]);

  const setImportRowValue = useCallback((importKey, field, value) => {
    setImportRows((prev) =>
      prev.map((row) =>
        row.import_key === importKey
          ? {
              ...row,
              [field]: value || null,
            }
          : row,
      ),
    );
  }, []);

  const setImportRowSelected = useCallback((importKey, selected) => {
    setImportRows((prev) =>
      prev.map((row) =>
        row.import_key === importKey
          ? {
              ...row,
              selected: Boolean(selected),
            }
          : row,
      ),
    );
  }, []);

  const setImportFileForPreview = useCallback((file) => {
    setImportFile(file || null);
    setImportPreview(null);
    setImportRows([]);
    setImportPreviewPage(1);
  }, []);

  const openEditModal = useCallback(
    (transaksi) => {
      if (!transaksi) return;

      if (!transaksi?.business_state?.bisa_diubah) {
        AppMessage.warning(buildActionLockReason(transaksi));
        return;
      }

      setSelectedTransaksi(transaksi);
      setFormData({
        id_user_konsultan: transaksi.id_user_konsultan || '',
        id_jenis_produk_konsultan: transaksi.id_jenis_produk_konsultan || '',
        id_periode_konsultan: transaksi.id_periode_konsultan || filterPeriode,
        tanggal_transaksi: toDateInputValue(transaksi.tanggal_transaksi),
        nama_klien: transaksi.nama_klien || '',
        deskripsi: transaksi.deskripsi || '',
        nominal_debit: String(transaksi.nominal_debit ?? '0'),
        nominal_kredit: String(transaksi.nominal_kredit ?? '0'),
        persen_share_default: transaksi.persen_share_default == null ? '' : String(transaksi.persen_share_default),
        persen_share_override: transaksi.persen_share_override == null ? '' : String(transaksi.persen_share_override),
        nominal_share: transaksi.nominal_share == null ? '' : String(transaksi.nominal_share),
        nominal_oss: transaksi.nominal_oss == null ? '' : String(transaksi.nominal_oss),
        override_manual: Boolean(transaksi.override_manual),
      });
      setIsEditModalOpen(true);
    },
    [filterPeriode],
  );

  const openDeleteDialog = useCallback((transaksi) => {
    if (!transaksi) return;

    if (!transaksi?.business_state?.bisa_dihapus) {
      AppMessage.warning(buildActionLockReason(transaksi));
      return;
    }

    setSelectedTransaksi(transaksi);
    setIsDeleteDialogOpen(true);
  }, []);

  const validateForm = useCallback(() => {
    if (!String(formData.id_user_konsultan || '').trim()) {
      AppMessage.warning('Mohon pilih konsultan terlebih dahulu.');
      return false;
    }

    if (!String(formData.id_periode_konsultan || '').trim()) {
      AppMessage.warning('Mohon pilih periode terlebih dahulu.');
      return false;
    }

    if (!String(formData.tanggal_transaksi || '').trim()) {
      AppMessage.warning('Mohon isi tanggal transaksi.');
      return false;
    }

    if (!String(formData.deskripsi || '').trim()) {
      AppMessage.warning('Mohon isi keterangan transaksi.');
      return false;
    }

    const nominalDebit = toNumber(formData.nominal_debit);
    const nominalKredit = toNumber(formData.nominal_kredit);
    const totalIncome = nominalDebit - nominalKredit;

    if (nominalDebit < 0) {
      AppMessage.warning('Nominal pemasukan minimal 0.');
      return false;
    }

    if (nominalKredit < 0) {
      AppMessage.warning('Nominal pengeluaran minimal 0.');
      return false;
    }

    const persenShareDefault = normalizeDecimalInput(formData.persen_share_default, { allowNull: true });
    const persenShareOverride = normalizeDecimalInput(formData.persen_share_override, { allowNull: true });
    const nominalShareManual = normalizeDecimalInput(formData.nominal_share, { allowNull: true });
    const nominalOssManual = normalizeDecimalInput(formData.nominal_oss, { allowNull: true });
    const overrideManual = Boolean(formData.override_manual);
    const hasManualNominal = nominalShareManual !== null || nominalOssManual !== null;

    if (!overrideManual || !hasManualNominal) {
      if (persenShareDefault === null && persenShareOverride === null) {
        AppMessage.warning('Mohon isi persentase share, atau aktifkan pengaturan nominal manual.');
        return false;
      }
    }

    if (persenShareDefault !== null) {
      const parsedDefault = Number(persenShareDefault);
      if (!Number.isFinite(parsedDefault) || parsedDefault < 0 || parsedDefault > 100) {
        AppMessage.warning('Masukkan persentase share standar antara 0 sampai 100.');
        return false;
      }
    }

    if (persenShareOverride !== null) {
      const parsedOverride = Number(persenShareOverride);
      if (!Number.isFinite(parsedOverride) || parsedOverride < 0 || parsedOverride > 100) {
        AppMessage.warning('Masukkan persentase share khusus antara 0 sampai 100.');
        return false;
      }
    }

    if (overrideManual && nominalShareManual !== null) {
      const parsedNominalShare = Number(nominalShareManual);
      if (!Number.isFinite(parsedNominalShare)) {
        AppMessage.warning('Masukkan bagian konsultan dengan angka yang benar.');
        return false;
      }
    }

    if (overrideManual && nominalOssManual !== null) {
      const parsedNominalOss = Number(nominalOssManual);
      if (!Number.isFinite(parsedNominalOss)) {
        AppMessage.warning('Masukkan bagian OSS dengan angka yang benar.');
        return false;
      }
    }

    if (overrideManual && nominalShareManual !== null && nominalOssManual !== null) {
      const manualTotal = Number(nominalShareManual) + Number(nominalOssManual);
      if (Math.abs(manualTotal - totalIncome) > 0.009) {
        AppMessage.warning('Total bagian konsultan dan bagian OSS harus sama dengan total pendapatan.');
        return false;
      }
    }

    return true;
  }, [
    formData.deskripsi,
    formData.id_periode_konsultan,
    formData.id_user_konsultan,
    formData.nominal_debit,
    formData.nominal_kredit,
    formData.nominal_oss,
    formData.nominal_share,
    formData.override_manual,
    formData.persen_share_default,
    formData.persen_share_override,
    formData.tanggal_transaksi,
  ]);

  const buildPayload = useCallback(() => {
    const overrideManual = Boolean(formData.override_manual);
    const nominalShareManual = normalizeDecimalInput(formData.nominal_share, { allowNull: true });
    const nominalOssManual = normalizeDecimalInput(formData.nominal_oss, { allowNull: true });

    return {
      id_user_konsultan: String(formData.id_user_konsultan || '').trim(),
      id_jenis_produk_konsultan: String(formData.id_jenis_produk_konsultan || '').trim() || null,
      id_periode_konsultan: String(formData.id_periode_konsultan || '').trim(),
      tanggal_transaksi: String(formData.tanggal_transaksi || '').trim(),
      nama_klien: String(formData.nama_klien || '').trim() || null,
      deskripsi: String(formData.deskripsi || '').trim(),
      nominal_debit: normalizeDecimalInput(formData.nominal_debit, { fallback: '0' }),
      nominal_kredit: normalizeDecimalInput(formData.nominal_kredit, { fallback: '0' }),
      persen_share_default: normalizeDecimalInput(formData.persen_share_default, { allowNull: true }),
      persen_share_override: normalizeDecimalInput(formData.persen_share_override, { allowNull: true }),
      override_manual: overrideManual,
      ...(overrideManual && nominalShareManual !== null ? { nominal_share: nominalShareManual } : {}),
      ...(overrideManual && nominalOssManual !== null ? { nominal_oss: nominalOssManual } : {}),
    };
  }, [formData]);

  const handleCreate = useCallback(async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    const payload = buildPayload();

    setIsSubmitting(true);

    try {
      await apiJson(ApiEndpoints.CreateTransaksiKonsultan(), {
        method: 'POST',
        body: payload,
      });

      const targetPeriode = payload.id_periode_konsultan;

      if (targetPeriode && targetPeriode !== filterPeriode) {
        setFilterPeriode(targetPeriode);
      } else if (transaksiSWRKey) {
        await mutateTransaksi();
      }

      setIsCreateModalOpen(false);
      resetForm(targetPeriode);
      AppMessage.success('Transaksi konsultan berhasil ditambahkan.');
    } catch (err) {
      AppMessage.error(getFriendlyErrorMessage(err, 'Transaksi konsultan belum berhasil ditambahkan.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [buildPayload, filterPeriode, isSubmitting, mutateTransaksi, resetForm, transaksiSWRKey, validateForm]);

  const handleEdit = useCallback(async () => {
    if (isSubmitting) return;

    if (!resolvedSelectedTransaksi) {
      AppMessage.warning('Transaksi tidak ditemukan.');
      return;
    }

    if (!resolvedSelectedTransaksi?.business_state?.bisa_diubah) {
      AppMessage.warning(buildActionLockReason(resolvedSelectedTransaksi));
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await apiJson(ApiEndpoints.UpdateTransaksiKonsultan(resolvedSelectedTransaksi.id_transaksi_konsultan), {
        method: 'PUT',
        body: buildPayload(),
      });

      await mutateTransaksi();
      setIsEditModalOpen(false);
      setSelectedTransaksi(null);
      resetForm();
      AppMessage.success('Transaksi konsultan berhasil diperbarui.');
    } catch (err) {
      AppMessage.error(getFriendlyErrorMessage(err, 'Transaksi konsultan belum berhasil diperbarui.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [buildPayload, isSubmitting, mutateTransaksi, resetForm, resolvedSelectedTransaksi, validateForm]);

  const handleDelete = useCallback(async () => {
    if (isSubmitting) return;

    if (!resolvedSelectedTransaksi) {
      AppMessage.warning('Transaksi tidak ditemukan.');
      return;
    }

    if (!resolvedSelectedTransaksi?.business_state?.bisa_dihapus) {
      AppMessage.warning(buildActionLockReason(resolvedSelectedTransaksi));
      return;
    }

    setIsSubmitting(true);

    try {
      await apiJson(ApiEndpoints.DeleteTransaksiKonsultan(resolvedSelectedTransaksi.id_transaksi_konsultan), {
        method: 'DELETE',
      });

      await mutateTransaksi();
      setIsDeleteDialogOpen(false);
      setSelectedTransaksi(null);
      AppMessage.success('Transaksi berhasil disembunyikan dari daftar.');
    } catch (err) {
      AppMessage.error(getFriendlyErrorMessage(err, 'Transaksi konsultan belum berhasil dihapus.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, mutateTransaksi, resolvedSelectedTransaksi]);

  const handlePreviewImport = useCallback(async () => {
    if (isImportPreviewing) return;

    if (!filterPeriode) {
      AppMessage.warning('Mohon pilih periode konsultan terlebih dahulu.');
      return;
    }

    if (!importFile) {
      AppMessage.warning('Mohon pilih file Excel terlebih dahulu.');
      return;
    }

    setIsImportPreviewing(true);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('id_periode_konsultan', filterPeriode);

      const response = await apiJson(ApiEndpoints.PreviewImportTransaksiKonsultan(), {
        method: 'POST',
        body: formData,
      });

      const data = response?.data || {};
      setImportPreview(data);
      setImportRows(Array.isArray(data?.rows) ? data.rows : []);
      setImportPreviewPage(1);
      AppMessage.success('File berhasil dibaca. Silakan cek datanya sebelum disimpan.');
    } catch (err) {
      setImportPreview(null);
      setImportRows([]);
      AppMessage.error(getFriendlyErrorMessage(err, 'File Excel belum berhasil dibaca.'));
    } finally {
      setIsImportPreviewing(false);
    }
  }, [filterPeriode, importFile, isImportPreviewing]);

  const handleCommitImport = useCallback(async () => {
    if (isImportCommitting) return;

    if (!canCommitImport) {
      AppMessage.warning('Periksa kembali baris yang bermasalah sebelum menyimpan data impor.');
      return;
    }

    setIsImportCommitting(true);

    try {
      await apiJson(ApiEndpoints.CommitImportTransaksiKonsultan(), {
        method: 'POST',
        body: {
          id_periode_konsultan: filterPeriode,
          rows: importRowsWithState,
        },
      });

      await mutateTransaksi();
      setIsImportModalOpen(false);
      setImportFile(null);
      setImportPreview(null);
      setImportRows([]);
      setImportPreviewPage(1);
      AppMessage.success('Data transaksi berhasil diimpor.');
    } catch (err) {
      const details = Array.isArray(err?.payload?.errors)
        ? ` ${err.payload.errors
            .slice(0, 3)
            .map((item) => `Baris ${item.row || '-'}: ${item.message}`)
            .join(' ')}`
        : '';
      AppMessage.error(`${getFriendlyErrorMessage(err, 'Data transaksi belum berhasil diimpor.')}${details}`);
    } finally {
      setIsImportCommitting(false);
    }
  }, [canCommitImport, filterPeriode, importRowsWithState, isImportCommitting, mutateTransaksi]);

  const handleExport = useCallback(async () => {
    if (isExporting) return;

    if (transaksiList.length === 0) {
      AppMessage.warning('Belum ada transaksi yang bisa diekspor.');
      return;
    }

    setIsExporting(true);

    try {
      const XLSX = await import('xlsx');
      const consultantColumns = buildConsultantExportColumns(transaksiList);
      const consultantIdToColumnIndex = new Map(consultantColumns.map((item, index) => [item.id, index]));
      const consultantTotals = new Map(consultantColumns.map((item) => [item.id, 0]));
      const categoryTotals = new Map([
        ['Income English Course', 0],
        ['Income Service Fee', 0],
        ['Income Commission Study', 0],
        ['Income Commission Work', 0],
        ['Income Lainnya (Translate Dokumen, Selisih Kurs Pembayaran, Event, Expo)', 0],
      ]);

      const fixedHeader = ['Tanggal', 'Nama', 'Keterangan', 'Debet', 'Kredit', 'Total Income', 'Sharing income', '', '', ''];
      const subHeader = ['', 'Student', '', '', '', '', 'Consultant', 'Income 25% (Kecuali Service Fee I Tetap 50%)', 'OSS - 75% (Kecuali Service Fee I Tetap 50%)', ''];
      const rows = [
        [...fixedHeader, ...consultantColumns.map((item) => item.label), 'OSS'],
        [...subHeader, ...consultantColumns.map((item) => item.label), 'OSS'],
      ];

      transaksiList.forEach((transaksi) => {
        const consultantValues = consultantColumns.map(() => '');
        const consultantColumnIndex = consultantIdToColumnIndex.get(transaksi.id_user_konsultan);
        const nominalShare = toNumber(transaksi.nominal_share);
        const nominalOss = toNumber(transaksi.nominal_oss);

        if (consultantColumnIndex !== undefined) {
          consultantValues[consultantColumnIndex] = nominalShare || '';
          addExportAmount(consultantTotals, transaksi.id_user_konsultan, nominalShare);
        }

        addExportAmount(categoryTotals, classifyIncomeCategory(transaksi), transaksi.total_income);

        rows.push([
          getExportDateValue(transaksi.tanggal_transaksi),
          transaksi.nama_klien || '',
          transaksi.deskripsi || '',
          toNumber(transaksi.nominal_debit) || '',
          toNumber(transaksi.nominal_kredit) || '',
          toNumber(transaksi.total_income) || '',
          transaksi.id_user_konsultan ? getConsultantExportLabel(transaksi) : 'OSS',
          nominalShare || '',
          nominalOss || '',
          '',
          ...consultantValues,
          nominalOss || '',
        ]);
      });

      rows.push([]);
      rows.push([
        'TOTAL',
        '',
        '',
        transaksiList.reduce((sum, item) => sum + toNumber(item.nominal_debit), 0),
        transaksiList.reduce((sum, item) => sum + toNumber(item.nominal_kredit), 0),
        totalIncome,
        '',
        totalShare,
        totalOSS,
        '',
        ...consultantColumns.map((item) => consultantTotals.get(item.id) || ''),
        totalOSS,
      ]);

      rows.push([]);
      rows.push([]);

      categoryTotals.forEach((amount, label) => {
        rows.push(['', '', label, amount, '', '', '', '', '', '', ...consultantColumns.map(() => ''), '']);
      });

      rows.push(['', '', 'TOTAL INCOME', totalIncome, '', '', '', '', '', '', ...consultantColumns.map(() => ''), '']);

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(rows, { cellDates: true });
      const lastColumnIndex = 10 + consultantColumns.length;
      worksheet['!cols'] = [
        { wch: 14 },
        { wch: 26 },
        { wch: 58 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
        { wch: 24 },
        { wch: 26 },
        { wch: 3 },
        ...consultantColumns.map(() => ({ wch: 14 })),
        { wch: 18 },
      ];

      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let rowIndex = 2; rowIndex <= range.e.r; rowIndex += 1) {
        const dateCell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 0 })];
        if (dateCell && dateCell.v instanceof Date) dateCell.z = 'dd/mm/yyyy';

        for (let colIndex = 3; colIndex <= lastColumnIndex; colIndex += 1) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })];
          if (cell && typeof cell.v === 'number') cell.z = '#,##0';
        }
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, getExportSheetName(activePeriodeLabel));

      const workbookOutput = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([workbookOutput], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `transaksi-konsultan-${sanitizeFilenamePart(activePeriodeLabel)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      AppMessage.success(`File Excel periode ${activePeriodeLabel} berhasil dibuat.`);
    } catch (err) {
      AppMessage.error(getFriendlyErrorMessage(err, 'File Excel transaksi konsultan belum berhasil dibuat.'));
    } finally {
      setIsExporting(false);
    }
  }, [activePeriodeLabel, isExporting, totalIncome, totalOSS, totalShare, transaksiList]);

  const loading = isPeriodeLoading || isUsersLoading || isProdukLoading || (Boolean(filterPeriode) && isTransaksiLoading);
  const validating = isPeriodeValidating || isUsersValidating || isProdukValidating || (Boolean(filterPeriode) && isTransaksiValidating);

  const konsultanOptions = useMemo(() => {
    return usersData.map((item) => ({
      value: item.id_user,
      label: `${getConsultantDisplayName(item)} • ${getConsultantIdentity(item)}`,
    }));
  }, [usersData]);

  const produkOptions = useMemo(() => {
    return produkData.map((item) => {
      const shareDefault = getProdukShareDefault(item);
      const statusLabel = item.aktif ? 'Aktif' : 'Tidak Aktif';
      const shareLabel = shareDefault === null ? 'Share belum diatur' : `${formatDecimalPercent(shareDefault)}%`;

      return {
        value: item.id_jenis_produk_konsultan,
        label: `${getProdukDisplayName(item)} - ${shareLabel} - ${statusLabel}`,
        disabled: !item.aktif,
        persen_share_default: shareDefault,
      };
    });
  }, [produkData]);

  return {
    filterPeriode,
    setFilterPeriode,

    transaksiList,
    totalIncome,
    totalShare,
    totalOSS,
    sudahPosting,
    belumPosting,

    activePeriode,
    activePeriodeLabel,
    activePeriodeStatus,
    canCreateInActivePeriode,

    periodeOptions,
    konsultanOptions,
    produkOptions,

    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isImportModalOpen,
    selectedTransaksi: resolvedSelectedTransaksi,

    formData,
    setFormValue,
    setProdukValue,
    importFile,
    setImportFile: setImportFileForPreview,
    importPreview,
    importRows: importRowsWithState,
    importSummary,
    importPreviewPage,
    setImportPreviewPage,
    canCommitImport,
    isImportPreviewing,
    isImportCommitting,
    setImportRowValue,
    setImportRowSelected,

    loading,
    validating,
    isSubmitting,
    isExporting,
    error: transaksiError || periodeError || usersError || produkError,

    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openDeleteDialog,
    closeDeleteDialog,
    openImportModal,
    closeImportModal,
    reloadData,

    handleCreate,
    handleEdit,
    handleDelete,
    handleExport,
    handlePreviewImport,
    handleCommitImport,
    getIssueMessage,
    getFriendlyErrorMessage,

    getPersenShare,
    getDisabledActionReason,
    formatCurrency,
    formatCompactCurrency,
    formatDate,
    formatDecimalPercent,
    formatStatusPeriode,
    getConsultantDisplayName,
    getConsultantIdentity,
    getConsultantPhoto,
    getConsultantSecondaryText,
  };
}
