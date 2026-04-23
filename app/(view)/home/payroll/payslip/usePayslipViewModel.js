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
const FETCH_PAGE_SIZE = 100;

function normalizeText(value) {
  return String(value || '').trim();
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

function formatPeriodeLabel(periode) {
  if (!periode) return '-';
  return `${formatBulan(periode.bulan)} ${periode.tahun || '-'}`;
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
    const payload = contentType.includes('application/json')
      ? await res.json().catch(() => ({}))
      : await res.text().catch(() => '');

    const message =
      typeof payload === 'string'
        ? payload || `Gagal memuat preview PDF (${res.status}).`
        : payload?.message || payload?.error || `Gagal memuat preview PDF (${res.status}).`;

    throw new Error(message);
  }

  return res.blob();
}

function normalizePayrollListItem(item) {
  if (!item) return null;

  return {
    id_payroll_karyawan: item.id_payroll_karyawan,
    id_periode_payroll: item.id_periode_payroll,
    nama_karyawan: item.nama_karyawan || item?.user?.nama_pengguna || '-',
    issue_number: item.issue_number || null,
    period_label: item?.periode ? formatPeriodeLabel(item.periode) : '-',
    status_payroll: item.status_payroll || 'DRAFT',
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

export default function usePayslipViewModel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedPayrollId = useMemo(
    () => normalizeText(searchParams?.get('payroll') || searchParams?.get('id_payroll_karyawan')),
    [searchParams],
  );
  const requestedPeriodeId = useMemo(
    () => normalizeText(searchParams?.get('periode') || searchParams?.get('id_periode_payroll')),
    [searchParams],
  );

  const [selectedPayrollId, setSelectedPayrollId] = useState(requestedPayrollId);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [pdfPreviewError, setPdfPreviewError] = useState('');
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0);

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

    const hasRequestedPayroll =
      requestedPayrollId && payrollList.some((item) => item.id_payroll_karyawan === requestedPayrollId);
    if (hasRequestedPayroll) return;

    if (selectedPayrollId && payrollList.some((item) => item.id_payroll_karyawan === selectedPayrollId)) return;

    const firstPayroll = payrollList[0];
    if (!firstPayroll?.id_payroll_karyawan) return;

    setSelectedPayrollId(firstPayroll.id_payroll_karyawan);

    const nextQuery = buildSearchParams(searchParams, firstPayroll.id_payroll_karyawan);
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, payrollList, requestedPayrollId, router, searchParams, selectedPayrollId]);

  const activePayrollId =
    selectedPayrollId || requestedPayrollId || payrollList[0]?.id_payroll_karyawan || '';

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

  const openPdfPreview = useCallback(() => {
    if (!pdfPreviewUrl || typeof window === 'undefined') return;
    window.open(pdfPreviewUrl, '_blank', 'noopener,noreferrer');
  }, [pdfPreviewUrl]);

  return {
    slip,
    payrollList,
    activePayrollId,
    backHref,

    pdfPreviewUrl,
    pdfPreviewError,
    pdfPreviewLoading,

    loading: isPayrollListLoading || isSlipLoading,
    validating: isPayrollListValidating || isSlipValidating,
    hasFilters: Boolean(requestedPeriodeId || requestedPayrollId),

    selectPayroll,
    reloadData,
    buildItemKomponenHref,
    openPdfPreview,
  };
}
