// app/(view)/home/payroll/usePayrollDashboardViewModel.js
'use client';

import { useMemo } from 'react';
import { mockPeriodePayroll, mockPayrollKaryawan, mockPinjamanKaryawan, formatCurrency, formatBulan, formatStatusPayroll, formatStatusPeriode } from './data/mockData';

export default function usePayrollDashboardViewModel() {
  const currentPeriod = useMemo(() => mockPeriodePayroll[0] || null, []);
  const totalKaryawan = useMemo(() => mockPayrollKaryawan.length, []);
  const totalDibayarkan = useMemo(() => mockPayrollKaryawan.reduce((sum, item) => sum + Number(item.total_dibayarkan || 0), 0), []);
  const payrollDibayar = useMemo(() => mockPayrollKaryawan.filter((item) => item.status_payroll === 'DIBAYAR').length, []);
  const payrollDraft = useMemo(() => mockPayrollKaryawan.filter((item) => item.status_payroll === 'DRAFT').length, []);
  const pinjamanAktif = useMemo(() => mockPinjamanKaryawan.filter((item) => item.status_pinjaman === 'AKTIF').length, []);

  const formatCompactCurrency = (value) => {
    const formatted = formatCurrency(value);
    return formatted.split(',')[0];
  };

  return {
    currentPeriod,
    periodeList: mockPeriodePayroll,
    payrollList: mockPayrollKaryawan,
    pinjamanList: mockPinjamanKaryawan,
    totalKaryawan,
    totalDibayarkan,
    payrollDibayar,
    payrollDraft,
    pinjamanAktif,
    formatCurrency,
    formatCompactCurrency,
    formatBulan,
    formatStatusPayroll,
    formatStatusPeriode,
  };
}
