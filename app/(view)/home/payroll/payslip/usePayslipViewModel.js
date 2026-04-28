'use client';

import Cookies from 'js-cookie';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { crudServiceAuth } from '@/app/utils/services/crudServiceAuth';
import { ApiEndpoints } from '@/constrainst/endpoints';

const PAYROLL_LIST_SWR_KEY = 'payroll:payslip:list';
const PAYROLL_SLIP_SWR_KEY = 'payroll:payslip:detail';
const USER_CC_SWR_KEY = 'payroll:payslip:cc-users';
const FETCH_PAGE_SIZE = 100;
const PAYSLIP_EMAIL_TEMPLATE = `Dear [Employee Name],

We would like to inform you that your salary for the period of [Month Year] has been successfully processed and transferred to your registered bank account.

Please find your payslip attached to this email for your reference and record. Kindly review the details, and do not hesitate to reach out if you require any clarification.

We truly appreciate your contribution and commitment. We encourage you to continue giving your best effort and working with dedication, as your performance plays an important role in our collective success.

Thank you for your hard work.

Warm regards,
HRD CV OSS Bali International`;

function normalizeText(value) {
  return String(value || '').trim();
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

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatBulan(value) {
  const map = {
    JANUARI: 'Januari',
    FEBRUARI: 'Februari',
    MARET: 'Maret',
    APRIL: 'April',
    MEI: 'Mei',
    JUNI: 'Juni',
    JULI: 'Juli',
    AGUSTUS: 'Agustus',
    SEPTEMBER: 'September',
    OKTOBER: 'Oktober',
    NOVEMBER: 'November',
    DESEMBER: 'Desember',
  };

  return map[normalizeText(value).toUpperCase()] || '-';
}

function formatBulanEmail(value) {
  const map = {
    JANUARI: 'January',
    FEBRUARI: 'February',
    MARET: 'March',
    APRIL: 'April',
    MEI: 'May',
    JUNI: 'June',
    JULI: 'July',
    AGUSTUS: 'August',
    SEPTEMBER: 'September',
    OKTOBER: 'October',
    NOVEMBER: 'November',
    DESEMBER: 'December',
  };

  return map[normalizeText(value).toUpperCase()] || formatBulan(value);
}

function formatPeriodeLabel(periode) {
  if (!periode) return '-';
  return `${formatBulan(periode.bulan)} ${periode.tahun || '-'}`;
}

function formatPeriodeEmailLabel(periode) {
  if (!periode) return '-';
  return `${formatBulanEmail(periode.bulan)} ${periode.tahun || '-'}`;
}

function isValidEmail(value) {
  const email = normalizeText(value).toLowerCase();
  return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

function splitEmailList(value) {
  const values = Array.isArray(value) ? value : [value];

  return values
    .flatMap((item) =>
      normalizeText(item)
        .split(/[,\n;]/)
        .map((email) => email.trim()),
    )
    .filter(Boolean);
}

function normalizeCcValues(value) {
  const seen = new Set();

  return splitEmailList(value).reduce((emails, item) => {
    const email = normalizeText(item).toLowerCase();
    if (!email || seen.has(email)) return emails;

    seen.add(email);
    emails.push(email);
    return emails;
  }, []);
}

function getUserDisplayName(user) {
  return normalizeText(user?.nama_pengguna || user?.name || user?.email || user?.id_user) || 'User';
}

function buildCcUserOptions(users) {
  const seen = new Set();

  return (Array.isArray(users) ? users : []).reduce((options, user) => {
    const email = normalizeText(user?.email).toLowerCase();
    if (!isValidEmail(email) || seen.has(email)) return options;

    seen.add(email);

    const name = getUserDisplayName(user);
    const metadata = [user?.role, user?.jabatan?.nama_jabatan, user?.departement?.nama_departement].filter(Boolean).join(' | ');
    const label = metadata ? `${name} <${email}> - ${metadata}` : `${name} <${email}>`;

    options.push({
      value: email,
      label,
      title: label,
    });

    return options;
  }, []);
}

function buildPayslipEmailMessage(employeeName = '[Employee Name]', monthYear = '[Month Year]') {
  return PAYSLIP_EMAIL_TEMPLATE.replaceAll('[Employee Name]', employeeName || '[Employee Name]').replaceAll('[Month Year]', monthYear || '[Month Year]');
}

async function fetchAllPages(fetcher) {
  const rows = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await fetcher(page);
    const data = Array.isArray(response?.data) ? response.data : [];

    rows.push(...data);

    const nextTotalPages = Number(response?.pagination?.totalPages);
    totalPages = Number.isFinite(nextTotalPages) && nextTotalPages > 0 ? nextTotalPages : 1;
    page += 1;
  }

  return rows;
}

async function fetchPayrollByPeriode(idPeriodePayroll) {
  return fetchAllPages((page) =>
    crudServiceAuth.get(
      ApiEndpoints.GetPayrollKaryawan({
        id_periode_payroll: idPeriodePayroll,
        page,
        pageSize: FETCH_PAGE_SIZE,
        orderBy: 'nama_karyawan',
        sort: 'asc',
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

async function fetchPdfBlob(url, signal) {
  const token = Cookies.get('token');
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include',
    signal,
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await res.json().catch(() => ({})) : await res.text().catch(() => '');

    const message = typeof payload === 'string' ? payload || `Gagal memuat preview PDF (${res.status}).` : payload?.message || payload?.error || `Gagal memuat preview PDF (${res.status}).`;

    throw new Error(message);
  }

  return res.blob();
}

async function sendPayslipEmailRequest(payrollId, payload) {
  return crudServiceAuth.post(ApiEndpoints.SendPayrollSlipEmailKaryawanById(payrollId), payload);
}

async function sendBulkPayslipEmailRequest(payload) {
  return crudServiceAuth.post(ApiEndpoints.SendPayrollSlipEmailKaryawanBulk(), payload);
}

function normalizePayrollListItem(item) {
  if (!item) return null;

  return {
    id_payroll_karyawan: item.id_payroll_karyawan,
    id_periode_payroll: item.id_periode_payroll,
    nama_karyawan: item.nama_karyawan || item?.user?.nama_pengguna || item?.freelance?.nama || '-',
    email: normalizeText(item?.user?.email || item?.freelance?.email),
    has_valid_email: isValidEmail(item?.user?.email || item?.freelance?.email),
    issue_number: item.issue_number || null,
    period_label: item?.periode ? formatPeriodeLabel(item.periode) : '-',
    email_period_label: item?.periode ? formatPeriodeEmailLabel(item.periode) : '-',
    status_payroll: item.status_payroll || 'DRAFT',
    pendapatan_bersih: toNumber(item.pendapatan_bersih),
  };
}

function getSlipEmployeeName(slip) {
  return slip?.employee?.nama_karyawan || slip?.payroll?.user?.nama_pengguna || slip?.payroll?.freelance?.nama || slip?.payroll?.nama_karyawan || 'Karyawan';
}

function getSlipEmailPeriodLabel(slip) {
  return formatPeriodeEmailLabel(slip?.period || slip?.payroll?.periode);
}

function buildSearchParams(searchParams, nextPayrollId) {
  const nextParams = new URLSearchParams(searchParams?.toString() || '');

  if (nextPayrollId) {
    nextParams.set('payroll', nextPayrollId);
  } else {
    nextParams.delete('payroll');
  }

  return nextParams.toString();
}

export default function usePayslipViewModel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedPayrollId = useMemo(() => normalizeText(searchParams?.get('payroll') || searchParams?.get('id_payroll_karyawan')), [searchParams]);
  const requestedPeriodeId = useMemo(() => normalizeText(searchParams?.get('periode') || searchParams?.get('id_periode_payroll')), [searchParams]);

  const [selectedPayrollId, setSelectedPayrollId] = useState(requestedPayrollId);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [pdfPreviewError, setPdfPreviewError] = useState('');
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    cc: [],
    message: '',
  });
  const [emailSending, setEmailSending] = useState(false);
  const [selectedPayrollIds, setSelectedPayrollIds] = useState([]);
  const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);
  const [bulkEmailForm, setBulkEmailForm] = useState({
    cc: [],
    message: buildPayslipEmailMessage(),
  });
  const [bulkEmailSending, setBulkEmailSending] = useState(false);

  useEffect(() => {
    setSelectedPayrollId(requestedPayrollId);
  }, [requestedPayrollId]);

  const {
    data: payrollListResponse,
    error: payrollListError,
    isLoading: isPayrollListLoading,
    isValidating: isPayrollListValidating,
    mutate: mutatePayrollList,
  } = useSWR(requestedPeriodeId ? [PAYROLL_LIST_SWR_KEY, requestedPeriodeId] : null, ([, periodeId]) => fetchPayrollByPeriode(periodeId), {
    revalidateOnFocus: false,
  });

  const payrollList = useMemo(() => {
    const rows = Array.isArray(payrollListResponse) ? payrollListResponse : [];
    return rows.map(normalizePayrollListItem).filter(Boolean);
  }, [payrollListResponse]);

  useEffect(() => {
    if (!payrollList.length) {
      setSelectedPayrollIds([]);
      return;
    }

    const selectableIds = new Set(payrollList.filter((item) => item.has_valid_email).map((item) => item.id_payroll_karyawan));
    setSelectedPayrollIds((current) => current.filter((id) => selectableIds.has(id)));
  }, [payrollList]);

  useEffect(() => {
    if (!payrollListError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payroll-slip-list-error',
      content: payrollListError?.message || 'Gagal memuat daftar slip payroll.',
    });
  }, [payrollListError]);

  useEffect(() => {
    if (!payrollList.length) return;

    const hasRequestedPayroll = requestedPayrollId && payrollList.some((item) => item.id_payroll_karyawan === requestedPayrollId);
    if (hasRequestedPayroll) return;

    if (selectedPayrollId && payrollList.some((item) => item.id_payroll_karyawan === selectedPayrollId)) return;

    const firstPayroll = payrollList[0];
    if (!firstPayroll?.id_payroll_karyawan) return;

    setSelectedPayrollId(firstPayroll.id_payroll_karyawan);

    const nextQuery = buildSearchParams(searchParams, firstPayroll.id_payroll_karyawan);
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, payrollList, requestedPayrollId, router, searchParams, selectedPayrollId]);

  const activePayrollId = selectedPayrollId || requestedPayrollId || payrollList[0]?.id_payroll_karyawan || '';

  const {
    data: slipResponse,
    error: slipError,
    isLoading: isSlipLoading,
    isValidating: isSlipValidating,
    mutate: mutateSlip,
  } = useSWR(activePayrollId ? [PAYROLL_SLIP_SWR_KEY, activePayrollId] : null, ([, payrollId]) => crudServiceAuth.get(ApiEndpoints.GetPayrollSlipKaryawanById(payrollId)), {
    revalidateOnFocus: false,
  });

  const {
    data: ccUsersResponse,
    error: ccUsersError,
    isLoading: isCcUsersLoading,
  } = useSWR(emailModalOpen || bulkEmailModalOpen ? USER_CC_SWR_KEY : null, fetchAllUsers, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!slipError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payroll-slip-detail-error',
      content: slipError?.message || 'Gagal memuat detail slip payroll.',
    });
  }, [slipError]);

  useEffect(() => {
    if (!ccUsersError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payroll-slip-cc-users-error',
      content: ccUsersError?.message || 'Gagal memuat daftar user untuk CC.',
    });
  }, [ccUsersError]);

  const slip = useMemo(() => slipResponse?.data || null, [slipResponse]);

  const payslipEmailTo = useMemo(() => normalizeText(slip?.payroll?.user?.email || slip?.payroll?.freelance?.email), [slip]);
  const canSendPayslipEmail = Boolean(activePayrollId && payslipEmailTo);
  const defaultPayslipEmailMessage = useMemo(() => buildPayslipEmailMessage(getSlipEmployeeName(slip), getSlipEmailPeriodLabel(slip)), [slip]);
  const ccUserOptions = useMemo(() => buildCcUserOptions(ccUsersResponse), [ccUsersResponse]);
  const selectedPayrollIdSet = useMemo(() => new Set(selectedPayrollIds), [selectedPayrollIds]);
  const bulkSelectedPayrolls = useMemo(() => payrollList.filter((item) => selectedPayrollIdSet.has(item.id_payroll_karyawan)), [payrollList, selectedPayrollIdSet]);
  const bulkEligibleSelectedPayrolls = useMemo(() => bulkSelectedPayrolls.filter((item) => item.has_valid_email), [bulkSelectedPayrolls]);
  const bulkSelectablePayrollIds = useMemo(() => payrollList.filter((item) => item.has_valid_email).map((item) => item.id_payroll_karyawan), [payrollList]);
  const allBulkSelectableChecked = bulkSelectablePayrollIds.length > 0 && bulkSelectablePayrollIds.every((id) => selectedPayrollIdSet.has(id));
  const canOpenBulkEmailModal = bulkEligibleSelectedPayrolls.length > 0;
  const canSendBulkPayslipEmail = canOpenBulkEmailModal && !bulkEmailSending;

  useEffect(() => {
    let objectUrl = '';
    const controller = new AbortController();

    if (!activePayrollId) {
      setPdfPreviewUrl((current) => {
        if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
        return '';
      });
      setPdfPreviewError('');
      setPdfPreviewLoading(false);
      return () => controller.abort();
    }

    setPdfPreviewLoading(true);
    setPdfPreviewError('');
    setPdfPreviewUrl((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
      return '';
    });

    fetchPdfBlob(ApiEndpoints.GetPayrollSlipPdfKaryawanById(activePayrollId), controller.signal)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setPdfPreviewUrl(objectUrl);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setPdfPreviewError(error?.message || 'Gagal memuat preview PDF slip payroll.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setPdfPreviewLoading(false);
        }
      });

    return () => {
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [activePayrollId, pdfRefreshKey]);

  const selectPayroll = useCallback(
    (payrollId) => {
      const nextPayrollId = normalizeText(payrollId);
      if (!nextPayrollId) return;

      setSelectedPayrollId(nextPayrollId);

      const nextQuery = buildSearchParams(searchParams, nextPayrollId);
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const reloadData = useCallback(async () => {
    await Promise.all([mutatePayrollList(), mutateSlip()]);
    setPdfRefreshKey((current) => current + 1);
  }, [mutatePayrollList, mutateSlip]);

  const backHref = useMemo(() => {
    if (requestedPeriodeId) {
      const query = new URLSearchParams();
      query.set('id_periode_payroll', requestedPeriodeId);
      return `/home/payroll/penggajian/payroll-karyawan?${query.toString()}`;
    }

    return '/home/payroll/penggajian/payroll-karyawan';
  }, [requestedPeriodeId]);

  const buildItemKomponenHref = useCallback((payroll) => {
    const source = payroll?.payroll || payroll;
    if (!source?.id_payroll_karyawan) return '/home/payroll/penggajian/payroll-karyawan';

    const query = new URLSearchParams({
      id_payroll_karyawan: source.id_payroll_karyawan || '',
      id_periode_payroll: source.id_periode_payroll || '',
      id_user: source.id_user || '',
      id_freelance: source.id_freelance || '',
      id_tarif_pajak_ter: source.id_tarif_pajak_ter || '',
      nama_karyawan: source.nama_karyawan || source?.user?.nama_pengguna || source?.freelance?.nama || '',
      departement: source?.user?.departement?.nama_departement || '',
      jabatan: source?.user?.jabatan?.nama_jabatan || (source?.id_freelance ? 'Freelance' : ''),
      periode_label: source?.periode ? formatPeriodeLabel(source.periode) : '-',
      jenis_hubungan_kerja: source.jenis_hubungan_kerja || '',
      kode_kategori_pajak_snapshot: source.kode_kategori_pajak_snapshot || '',
      persen_tarif_snapshot: String(source.persen_tarif_snapshot ?? ''),
      status_payroll: source.status_payroll || '',
      periode_status: source?.periode?.status_periode || '',
      total_pendapatan_bruto: String(source.total_pendapatan_bruto ?? ''),
      total_potongan: String(source.total_potongan ?? ''),
      pph21_nominal: String(source.pph21_nominal ?? ''),
      pendapatan_bersih: String(source.pendapatan_bersih ?? ''),
    });

    return `/home/payroll/penggajian/payroll-karyawan/item-komponen?${query.toString()}`;
  }, []);

  const openPdfPreview = useCallback(() => {
    if (!pdfPreviewUrl || typeof window === 'undefined') return;
    window.open(pdfPreviewUrl, '_blank', 'noopener,noreferrer');
  }, [pdfPreviewUrl]);

  const openEmailModal = useCallback(() => {
    if (!canSendPayslipEmail) {
      AppMessage.error('Email penerima payroll tidak tersedia, payslip belum bisa dikirim.');
      return;
    }

    setEmailForm({
      cc: [],
      message: defaultPayslipEmailMessage,
    });
    setEmailModalOpen(true);
  }, [canSendPayslipEmail, defaultPayslipEmailMessage]);

  const closeEmailModal = useCallback(() => {
    if (emailSending) return;
    setEmailModalOpen(false);
  }, [emailSending]);

  const updateEmailForm = useCallback((field, value) => {
    setEmailForm((current) => ({
      ...current,
      [field]: field === 'cc' ? normalizeCcValues(value) : value,
    }));
  }, []);

  const updateBulkEmailForm = useCallback((field, value) => {
    setBulkEmailForm((current) => ({
      ...current,
      [field]: field === 'cc' ? normalizeCcValues(value) : value,
    }));
  }, []);

  const togglePayrollSelection = useCallback((payrollId, checked) => {
    const normalizedId = normalizeText(payrollId);
    if (!normalizedId) return;

    setSelectedPayrollIds((current) => {
      if (checked) {
        if (current.includes(normalizedId)) return current;
        return [...current, normalizedId];
      }

      return current.filter((id) => id !== normalizedId);
    });
  }, []);

  const toggleAllPayrollSelection = useCallback(
    (checked) => {
      setSelectedPayrollIds(checked ? bulkSelectablePayrollIds : []);
    },
    [bulkSelectablePayrollIds],
  );

  const openBulkEmailModal = useCallback(() => {
    if (!canOpenBulkEmailModal) {
      AppMessage.error('Centang minimal satu payslip yang memiliki email valid.');
      return;
    }

    setBulkEmailForm({
      cc: [],
      message: buildPayslipEmailMessage(),
    });
    setBulkEmailModalOpen(true);
  }, [canOpenBulkEmailModal]);

  const closeBulkEmailModal = useCallback(() => {
    if (bulkEmailSending) return;
    setBulkEmailModalOpen(false);
  }, [bulkEmailSending]);

  const resetEmailForm = useCallback(() => {
    setEmailForm({
      cc: [],
      message: '',
    });
  }, []);

  const resetBulkEmailForm = useCallback(() => {
    setBulkEmailForm({
      cc: [],
      message: buildPayslipEmailMessage(),
    });
  }, []);

  const sendPayslipEmail = useCallback(async () => {
    if (!activePayrollId) {
      AppMessage.error('Payroll belum dipilih.');
      return false;
    }

    if (!payslipEmailTo) {
      AppMessage.error('Email penerima payroll tidak tersedia, payslip belum bisa dikirim.');
      return false;
    }

    setEmailSending(true);

    try {
      await sendPayslipEmailRequest(activePayrollId, {
        cc: emailForm.cc,
        message: emailForm.message,
      });

      AppMessage.success('Payslip berhasil dikirim ke email penerima payroll.');
      resetEmailForm();
      setEmailModalOpen(false);
      return true;
    } catch (error) {
      AppMessage.error(error?.message || 'Gagal mengirim payslip.');
      return false;
    } finally {
      setEmailSending(false);
    }
  }, [activePayrollId, emailForm.cc, emailForm.message, payslipEmailTo, resetEmailForm]);

  const sendBulkPayslipEmail = useCallback(async () => {
    if (!bulkEligibleSelectedPayrolls.length) {
      AppMessage.error('Centang minimal satu payslip yang memiliki email valid.');
      return false;
    }

    setBulkEmailSending(true);

    try {
      const response = await sendBulkPayslipEmailRequest({
        payroll_ids: bulkEligibleSelectedPayrolls.map((item) => item.id_payroll_karyawan),
        cc: bulkEmailForm.cc,
        message: bulkEmailForm.message,
      });

      const sent = Number(response?.data?.sent || 0);
      const failed = Number(response?.data?.failed || 0);

      if (failed > 0) {
        AppMessage.warning(`Payslip massal selesai. Berhasil: ${sent}, gagal: ${failed}.`);
      } else {
        AppMessage.success(`Payslip massal berhasil dikirim ke ${sent} penerima.`);
      }

      resetBulkEmailForm();
      setSelectedPayrollIds([]);
      setBulkEmailModalOpen(false);
      return true;
    } catch (error) {
      AppMessage.error(error?.message || 'Gagal mengirim payslip massal.');
      return false;
    } finally {
      setBulkEmailSending(false);
    }
  }, [bulkEligibleSelectedPayrolls, bulkEmailForm.cc, bulkEmailForm.message, resetBulkEmailForm]);

  return {
    slip,
    payrollList,
    activePayrollId,
    backHref,

    pdfPreviewUrl,
    pdfPreviewError,
    pdfPreviewLoading,

    emailModalOpen,
    emailForm,
    emailSending,
    payslipEmailTo,
    canSendPayslipEmail,
    ccUserOptions,
    ccUserOptionsLoading: isCcUsersLoading,
    selectedPayrollIds,
    selectedPayrollIdSet,
    bulkSelectedPayrolls,
    bulkEligibleSelectedPayrolls,
    bulkEmailModalOpen,
    bulkEmailForm,
    bulkEmailSending,
    allBulkSelectableChecked,
    canOpenBulkEmailModal,
    canSendBulkPayslipEmail,

    loading: isPayrollListLoading || isSlipLoading,
    validating: isPayrollListValidating || isSlipValidating,
    hasFilters: Boolean(requestedPeriodeId || requestedPayrollId),

    selectPayroll,
    reloadData,
    buildItemKomponenHref,
    openPdfPreview,
    openEmailModal,
    closeEmailModal,
    updateEmailForm,
    updateBulkEmailForm,
    togglePayrollSelection,
    toggleAllPayrollSelection,
    openBulkEmailModal,
    closeBulkEmailModal,
    sendPayslipEmail,
    sendBulkPayslipEmail,
  };
}
