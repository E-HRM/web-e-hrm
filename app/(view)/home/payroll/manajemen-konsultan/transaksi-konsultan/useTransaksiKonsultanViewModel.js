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
    return 'Transaksi sudah diposting ke payroll dan tidak dapat diubah.';
  }

  if (transaksi?.business_state?.periode_terkunci) {
    return 'Periode transaksi ini sudah terkunci.';
  }

  if (transaksi?.business_state?.periode_deleted) {
    return 'Periode transaksi ini sudah dihapus.';
  }

  return 'Transaksi ini tidak dapat diproses.';
}

const KONSULTAN_MAPPING_ERROR_CODES = new Set(['KONSULTAN_EMPTY', 'KONSULTAN_NOT_FOUND', 'KONSULTAN_AMBIGUOUS']);
const PRODUK_MAPPING_WARNING_CODES = new Set(['PRODUK_NOT_FOUND']);

function getIssueMessage(issue) {
  if (!issue) return '';
  if (typeof issue === 'string') return issue;
  return issue.message || '';
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

  const errors = Array.isArray(row?.errors)
    ? row.errors.filter((item) => !KONSULTAN_MAPPING_ERROR_CODES.has(item?.code))
    : [];
  const warnings = Array.isArray(row?.warnings)
    ? row.warnings.filter((item) => !PRODUK_MAPPING_WARNING_CODES.has(item?.code))
    : [];

  if (!row?.is_oss && !idUserKonsultan) {
    errors.push({
      code: 'KONSULTAN_NOT_SELECTED',
      message: 'Konsultan wajib dipilih, kecuali untuk baris OSS.',
    });
  }

  if (!idProdukKonsultan) {
    warnings.push({
      code: 'PRODUK_NOT_SELECTED',
      message: 'Kategori/produk belum dipilih. Baris tetap bisa diimpor tanpa produk.',
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
      content: periodeError?.message || 'Gagal memuat data periode konsultan.',
    });
  }, [periodeError]);

  useEffect(() => {
    if (!usersError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'transaksi-konsultan-users-error',
      content: usersError?.message || 'Gagal memuat data konsultan.',
    });
  }, [usersError]);

  useEffect(() => {
    if (!produkError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'transaksi-konsultan-produk-error',
      content: produkError?.message || 'Gagal memuat data produk konsultan.',
    });
  }, [produkError]);

  useEffect(() => {
    if (!transaksiError) return;

    AppMessage.once({
      type: 'error',
      onceKey: `transaksi-konsultan-list-error:${filterPeriode || 'none'}`,
      content: transaksiError?.message || 'Gagal memuat transaksi konsultan.',
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
      AppMessage.warning('Pilih periode konsultan terlebih dahulu.');
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
      AppMessage.warning('Pilih periode konsultan terlebih dahulu.');
      return;
    }

    if (!canCreateInActivePeriode) {
      AppMessage.warning('Periode yang dipilih belum bisa digunakan untuk import transaksi.');
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
      AppMessage.warning('Konsultan wajib dipilih.');
      return false;
    }

    if (!String(formData.id_periode_konsultan || '').trim()) {
      AppMessage.warning('Periode konsultan wajib dipilih.');
      return false;
    }

    if (!String(formData.tanggal_transaksi || '').trim()) {
      AppMessage.warning('Tanggal transaksi wajib diisi.');
      return false;
    }

    if (!String(formData.deskripsi || '').trim()) {
      AppMessage.warning('Deskripsi transaksi wajib diisi.');
      return false;
    }

    const nominalDebit = toNumber(formData.nominal_debit);
    const nominalKredit = toNumber(formData.nominal_kredit);
    const totalIncome = nominalDebit - nominalKredit;

    if (nominalDebit < 0) {
      AppMessage.warning('Nominal debit tidak boleh kurang dari 0.');
      return false;
    }

    if (nominalKredit < 0) {
      AppMessage.warning('Nominal kredit tidak boleh kurang dari 0.');
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
        AppMessage.warning('Persen share default atau override wajib diisi.');
        return false;
      }
    }

    if (persenShareDefault !== null) {
      const parsedDefault = Number(persenShareDefault);
      if (!Number.isFinite(parsedDefault) || parsedDefault < 0 || parsedDefault > 100) {
        AppMessage.warning('Persen share default harus berada pada rentang 0 sampai 100.');
        return false;
      }
    }

    if (persenShareOverride !== null) {
      const parsedOverride = Number(persenShareOverride);
      if (!Number.isFinite(parsedOverride) || parsedOverride < 0 || parsedOverride > 100) {
        AppMessage.warning('Persen share override harus berada pada rentang 0 sampai 100.');
        return false;
      }
    }

    if (overrideManual && nominalShareManual !== null) {
      const parsedNominalShare = Number(nominalShareManual);
      if (!Number.isFinite(parsedNominalShare)) {
        AppMessage.warning('Nominal share manual harus berupa angka valid.');
        return false;
      }
    }

    if (overrideManual && nominalOssManual !== null) {
      const parsedNominalOss = Number(nominalOssManual);
      if (!Number.isFinite(parsedNominalOss)) {
        AppMessage.warning('Nominal OSS manual harus berupa angka valid.');
        return false;
      }
    }

    if (overrideManual && nominalShareManual !== null && nominalOssManual !== null) {
      const manualTotal = Number(nominalShareManual) + Number(nominalOssManual);
      if (Math.abs(manualTotal - totalIncome) > 0.009) {
        AppMessage.warning('Total nominal share manual dan nominal OSS manual harus sama dengan total income.');
        return false;
      }
    }

    return true;
  }, [formData.deskripsi, formData.id_periode_konsultan, formData.id_user_konsultan, formData.nominal_debit, formData.nominal_kredit, formData.nominal_oss, formData.nominal_share, formData.override_manual, formData.persen_share_default, formData.persen_share_override, formData.tanggal_transaksi]);

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
      const response = await apiJson(ApiEndpoints.CreateTransaksiKonsultan(), {
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
      AppMessage.success(response?.message || 'Transaksi konsultan berhasil ditambahkan.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menambahkan transaksi konsultan.');
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
      const response = await apiJson(ApiEndpoints.UpdateTransaksiKonsultan(resolvedSelectedTransaksi.id_transaksi_konsultan), {
        method: 'PUT',
        body: buildPayload(),
      });

      await mutateTransaksi();
      setIsEditModalOpen(false);
      setSelectedTransaksi(null);
      resetForm();
      AppMessage.success(response?.message || 'Transaksi konsultan berhasil diperbarui.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal memperbarui transaksi konsultan.');
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
      const response = await apiJson(ApiEndpoints.DeleteTransaksiKonsultan(resolvedSelectedTransaksi.id_transaksi_konsultan), {
        method: 'DELETE',
      });

      await mutateTransaksi();
      setIsDeleteDialogOpen(false);
      setSelectedTransaksi(null);
      AppMessage.success(response?.message || 'Transaksi konsultan berhasil dihapus.');
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal menghapus transaksi konsultan.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, mutateTransaksi, resolvedSelectedTransaksi]);

  const handlePreviewImport = useCallback(async () => {
    if (isImportPreviewing) return;

    if (!filterPeriode) {
      AppMessage.warning('Pilih periode konsultan terlebih dahulu.');
      return;
    }

    if (!importFile) {
      AppMessage.warning('Pilih file Excel terlebih dahulu.');
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
      AppMessage.success(response?.message || 'Preview import berhasil dibuat.');
    } catch (err) {
      setImportPreview(null);
      setImportRows([]);
      AppMessage.error(err?.message || 'Gagal membaca file Excel transaksi konsultan.');
    } finally {
      setIsImportPreviewing(false);
    }
  }, [filterPeriode, importFile, isImportPreviewing]);

  const handleCommitImport = useCallback(async () => {
    if (isImportCommitting) return;

    if (!canCommitImport) {
      AppMessage.warning('Selesaikan error mapping dan validasi sebelum import.');
      return;
    }

    setIsImportCommitting(true);

    try {
      const response = await apiJson(ApiEndpoints.CommitImportTransaksiKonsultan(), {
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
      AppMessage.success(response?.message || 'Import transaksi konsultan selesai.');
    } catch (err) {
      const details = Array.isArray(err?.payload?.errors)
        ? ` ${err.payload.errors
            .slice(0, 3)
            .map((item) => `Baris ${item.row || '-'}: ${item.message}`)
            .join(' ')}`
        : '';
      AppMessage.error(`${err?.message || 'Gagal menyimpan import transaksi konsultan.'}${details}`);
    } finally {
      setIsImportCommitting(false);
    }
  }, [canCommitImport, filterPeriode, importRowsWithState, isImportCommitting, mutateTransaksi]);

  const handleExport = useCallback(async () => {
    if (isExporting) return;

    if (transaksiList.length === 0) {
      AppMessage.warning('Tidak ada transaksi konsultan untuk diexport.');
      return;
    }

    setIsExporting(true);

    try {
      const XLSX = await import('xlsx');
      const rows = transaksiList.map((transaksi, index) => ({
        No: index + 1,
        Periode: transaksi.periode_label || activePeriodeLabel,
        Tanggal: toDateInputValue(transaksi.tanggal_transaksi) || transaksi.tanggal_transaksi || '',
        Konsultan: transaksi.konsultan_display_name || '-',
        'Identitas Konsultan': transaksi.konsultan_identity || '-',
        Produk: transaksi.produk_display_name || getProdukDisplayName(transaksi.jenis_produk),
        Klien: transaksi.nama_klien || '-',
        Deskripsi: transaksi.deskripsi || '-',
        'Nominal Debit': toNumber(transaksi.nominal_debit),
        'Nominal Kredit': toNumber(transaksi.nominal_kredit),
        'Total Income': toNumber(transaksi.total_income),
        'Persen Share Efektif (%)': toNumber(getPersenShare(transaksi)),
        'Persen Share Default (%)': transaksi.persen_share_default == null ? '' : toNumber(transaksi.persen_share_default),
        'Persen Share Override (%)': transaksi.persen_share_override == null ? '' : toNumber(transaksi.persen_share_override),
        'Nominal Share': toNumber(transaksi.nominal_share),
        'Nominal OSS': toNumber(transaksi.nominal_oss),
        'Override Manual': transaksi.override_manual ? 'Ya' : 'Tidak',
        'Status Posting': transaksi.sudah_posting_payroll ? 'Sudah Posting' : 'Belum Posting',
      }));

      rows.push({
        No: '',
        Periode: 'TOTAL',
        Tanggal: '',
        Konsultan: '',
        'Identitas Konsultan': '',
        Produk: '',
        Klien: '',
        Deskripsi: '',
        'Nominal Debit': transaksiList.reduce((sum, item) => sum + toNumber(item.nominal_debit), 0),
        'Nominal Kredit': transaksiList.reduce((sum, item) => sum + toNumber(item.nominal_kredit), 0),
        'Total Income': totalIncome,
        'Persen Share Efektif (%)': '',
        'Persen Share Default (%)': '',
        'Persen Share Override (%)': '',
        'Nominal Share': totalShare,
        'Nominal OSS': totalOSS,
        'Override Manual': '',
        'Status Posting': '',
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 18 },
        { wch: 14 },
        { wch: 28 },
        { wch: 26 },
        { wch: 28 },
        { wch: 26 },
        { wch: 36 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 22 },
        { wch: 22 },
        { wch: 24 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi Konsultan');

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

      AppMessage.success(`Export Excel periode ${activePeriodeLabel} berhasil dibuat.`);
    } catch (err) {
      AppMessage.error(err?.message || 'Gagal membuat file Excel transaksi konsultan.');
    } finally {
      setIsExporting(false);
    }
  }, [activePeriodeLabel, getPersenShare, isExporting, totalIncome, totalOSS, totalShare, transaksiList]);

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
