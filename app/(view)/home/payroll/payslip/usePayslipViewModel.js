'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { crudServiceAuth } from '@/app/utils/services/crudServiceAuth';
import { ApiEndpoints } from '@/constrainst/endpoints';

const PAYROLL_LIST_SWR_KEY = 'payroll:payslip:list';
const PAYROLL_SLIP_SWR_KEY = 'payroll:payslip:detail';
const FETCH_PAGE_SIZE = 100;

function normalizeText(value) {
  return String(value || '').trim();
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
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

function formatPeriodeLabel(periode) {
  if (!periode) return '-';
  return `${formatBulan(periode.bulan)} ${periode.tahun || '-'}`;
}

function formatJenisHubungan(value) {
  const map = {
    PKWTT: 'PKWTT',
    PKWT: 'PKWT',
    FREELANCE: 'Freelance',
    INTERNSHIP: 'Internship',
  };

  return map[normalizeText(value).toUpperCase()] || value || '-';
}

function formatStatusPayroll(status) {
  const map = {
    DRAFT: { label: 'Draft', tone: 'neutral' },
    TERSIMPAN: { label: 'Tersimpan', tone: 'info' },
    DISETUJUI: { label: 'Disetujui', tone: 'info' },
    DIBAYAR: { label: 'Dibayar', tone: 'success' },
  };

  return map[normalizeText(status).toUpperCase()] || { label: status || '-', tone: 'neutral' };
}

function formatStatusApproval(status) {
  const map = {
    pending: { label: 'Pending', tone: 'warning' },
    disetujui: { label: 'Disetujui', tone: 'success' },
    ditolak: { label: 'Ditolak', tone: 'danger' },
  };

  return map[normalizeText(status).toLowerCase()] || { label: status || '-', tone: 'neutral' };
}

function formatApproverRole(role) {
  const map = {
    KARYAWAN: 'Karyawan',
    HR: 'HR',
    OPERASIONAL: 'Operasional',
    DIREKTUR: 'Direktur',
    SUPERADMIN: 'Superadmin',
    SUBADMIN: 'Subadmin',
    SUPERVISI: 'Supervisi',
  };

  return map[normalizeText(role).toUpperCase()] || role || '-';
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

function normalizePayrollListItem(item) {
  if (!item) return null;

  return {
    id_payroll_karyawan: item.id_payroll_karyawan,
    id_periode_payroll: item.id_periode_payroll,
    nama_karyawan: item.nama_karyawan || item?.user?.nama_pengguna || '-',
    issue_number: item.issue_number || null,
    issued_at: item.issued_at || null,
    company_name_snapshot: item.company_name_snapshot || null,
    period_label: item?.periode ? formatPeriodeLabel(item.periode) : '-',
    status_payroll: item.status_payroll || 'DRAFT',
    status_approval: item.status_approval || 'pending',
    pendapatan_bersih: toNumber(item.pendapatan_bersih),
  };
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

function isVisualTemplate(url) {
  const value = normalizeText(url).toLowerCase();
  if (!value) return false;
  if (value.startsWith('data:image/')) return true;
  return /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(value);
}

export default function usePayslipViewModel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedPayrollId = useMemo(() => normalizeText(searchParams?.get('payroll') || searchParams?.get('id_payroll_karyawan')), [searchParams]);
  const requestedPeriodeId = useMemo(() => normalizeText(searchParams?.get('periode') || searchParams?.get('id_periode_payroll')), [searchParams]);

  const [selectedPayrollId, setSelectedPayrollId] = useState(requestedPayrollId);

  useEffect(() => {
    setSelectedPayrollId(requestedPayrollId);
  }, [requestedPayrollId]);

  const {
    data: payrollListResponse,
    error: payrollListError,
    isLoading: isPayrollListLoading,
    isValidating: isPayrollListValidating,
    mutate: mutatePayrollList,
  } = useSWR(
    requestedPeriodeId ? [PAYROLL_LIST_SWR_KEY, requestedPeriodeId] : null,
    ([, periodeId]) => fetchPayrollByPeriode(periodeId),
    {
      revalidateOnFocus: false,
    },
  );

  const payrollList = useMemo(() => {
    const rows = Array.isArray(payrollListResponse) ? payrollListResponse : [];
    return rows.map(normalizePayrollListItem).filter(Boolean);
  }, [payrollListResponse]);

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
  } = useSWR(
    activePayrollId ? [PAYROLL_SLIP_SWR_KEY, activePayrollId] : null,
    ([, payrollId]) => crudServiceAuth.get(ApiEndpoints.GetPayrollSlipKaryawanById(payrollId)),
    {
      revalidateOnFocus: false,
    },
  );

  useEffect(() => {
    if (!slipError) return;

    AppMessage.once({
      type: 'error',
      onceKey: 'payroll-slip-detail-error',
      content: slipError?.message || 'Gagal memuat detail slip payroll.',
    });
  }, [slipError]);

  const slip = useMemo(() => slipResponse?.data || null, [slipResponse]);

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
  }, [mutatePayrollList, mutateSlip]);

  const handlePrint = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.print();
  }, []);

  const selectedPayrollListItem = useMemo(() => {
    if (!activePayrollId) return null;
    return payrollList.find((item) => item.id_payroll_karyawan === activePayrollId) || null;
  }, [activePayrollId, payrollList]);

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
      id_tarif_pajak_ter: source.id_tarif_pajak_ter || '',
      nama_karyawan: source.nama_karyawan || '',
      departement: source?.user?.departement?.nama_departement || '',
      jabatan: source?.user?.jabatan?.nama_jabatan || '',
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

  const headerTemplate = useMemo(() => {
    const template = slip?.templates?.header;
    if (!template?.file_template_url || !isVisualTemplate(template.file_template_url)) return null;
    return template;
  }, [slip]);

  const footerTemplate = useMemo(() => {
    const template = slip?.templates?.footer;
    if (!template?.file_template_url || !isVisualTemplate(template.file_template_url)) return null;
    return template;
  }, [slip]);

  return {
    slip,
    payrollList,
    selectedPayrollListItem,
    activePayrollId,
    backHref,
    headerTemplate,
    footerTemplate,

    loading: isPayrollListLoading || isSlipLoading,
    validating: isPayrollListValidating || isSlipValidating,
    hasFilters: Boolean(requestedPeriodeId || requestedPayrollId),

    formatCurrency,
    formatDate,
    formatDateTime,
    formatJenisHubungan,
    formatPeriodeLabel,
    formatStatusPayroll,
    formatStatusApproval,
    formatApproverRole,

    selectPayroll,
    reloadData,
    handlePrint,
    buildItemKomponenHref,
  };
}
