// app/(view)/home/payroll/usePayrollDashboardViewModel.js
'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

import { crudServiceAuth } from '@/app/utils/services/crudServiceAuth';
import { ApiEndpoints } from '@/constrainst/endpoints';

const SWR_KEY = 'payroll:dashboard';

const BULAN_LABELS = {
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

const BULAN_BY_NUMBER = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

async function fetchPayrollDashboard() {
  const response = await crudServiceAuth.get(ApiEndpoints.GetPayrollDashboard());
  return response?.data || {};
}

function toNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatCompactCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 1,
    notation: 'compact',
    compactDisplay: 'short',
  }).format(toNumber(value));
}

function formatBulan(bulan) {
  if (typeof bulan === 'number') {
    return BULAN_BY_NUMBER[bulan - 1] || '-';
  }

  const normalized = String(bulan || '')
    .trim()
    .toUpperCase();

  if (/^\d+$/.test(normalized)) {
    return BULAN_BY_NUMBER[Number(normalized) - 1] || '-';
  }

  return BULAN_LABELS[normalized] || bulan || '-';
}

function formatStatusPayroll(status) {
  const normalized = String(status || '')
    .trim()
    .toUpperCase();

  const map = {
    DIBAYAR: {
      label: 'Dibayar',
      tone: 'success',
    },
    DISETUJUI: {
      label: 'Disetujui',
      tone: 'info',
    },
    DRAFT: {
      label: 'Draft',
      tone: 'warning',
    },
  };

  return (
    map[normalized] || {
      label: status || '-',
      tone: 'neutral',
    }
  );
}

function formatStatusPeriode(status) {
  const normalized = String(status || '')
    .trim()
    .toUpperCase();

  const map = {
    DRAFT: {
      label: 'Dalam Persiapan',
      tone: 'warning',
    },
    DIPROSES: {
      label: 'Diproses',
      tone: 'info',
    },
    TERKUNCI: {
      label: 'Terkunci',
      tone: 'neutral',
    },
    AKTIF: {
      label: 'Aktif',
      tone: 'info',
    },
    SELESAI: {
      label: 'Selesai',
      tone: 'success',
    },
  };

  return (
    map[normalized] || {
      label: status || '-',
      tone: 'neutral',
    }
  );
}

export default function usePayrollDashboardViewModel() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(SWR_KEY, fetchPayrollDashboard, {
    revalidateOnFocus: false,
  });

  const dashboardData = data || {};
  const summary = dashboardData.summary || {};

  const currentPeriod = useMemo(() => dashboardData.currentPeriod || null, [dashboardData.currentPeriod]);
  const periodeList = useMemo(() => (Array.isArray(dashboardData.periodeList) ? dashboardData.periodeList : []), [dashboardData.periodeList]);
  const payrollList = useMemo(() => (Array.isArray(dashboardData.payrollList) ? dashboardData.payrollList : []), [dashboardData.payrollList]);
  const pinjamanList = useMemo(() => (Array.isArray(dashboardData.pinjamanList) ? dashboardData.pinjamanList : []), [dashboardData.pinjamanList]);

  return {
    currentPeriod,
    periodeList,
    payrollList,
    pinjamanList,
    totalKaryawan: toNumber(summary.totalKaryawan),
    totalPayrollKaryawan: toNumber(summary.totalPayrollKaryawan),
    totalDibayarkan: toNumber(summary.totalDibayarkan),
    payrollDibayar: toNumber(summary.payrollDibayar),
    payrollDraft: toNumber(summary.payrollDraft),
    pinjamanAktif: toNumber(summary.pinjamanAktif),
    loading: isLoading,
    refreshing: isValidating && !isLoading,
    error,
    reloadData: mutate,
    formatCurrency,
    formatCompactCurrency,
    formatBulan,
    formatStatusPayroll,
    formatStatusPeriode,
  };
}
