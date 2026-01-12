"use client";

import { useMemo, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';
import useSWR from 'swr';
import { ApiEndpoints } from '../../../../constrainst/endpoints';

function safePickMessage(err, fallback = 'Terjadi kesalahan') {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err?.message) return err.message;
  return fallback;
}

async function apiJson(url, { method = 'GET', body } = {}) {
  const token = Cookies.get('token');
  const headers = {};

  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    throw new Error(data?.message || `Request gagal (${res.status})`);
  }
  return data;
}

export default function useFinanceViewModel() {
  const [activeTab, setActiveTab] = useState('pocket_money');
  const [viewMode, setViewMode] = useState('request'); // 'request' | 'category'

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

  // ✅ Date filter: ALL / DATE
  const [dateMode, setDateMode] = useState('ALL'); // 'ALL' | 'DATE'
  const [dateRange, setDateRange] = useState([null, null]); // [dayjs|null, dayjs|null]

  const filters = useMemo(() => {
    const mode = String(dateMode || 'ALL').toUpperCase();
    const d0 = dateRange?.[0] && dayjs.isDayjs(dateRange[0]) ? dateRange[0] : null;
    const d1 = dateRange?.[1] && dayjs.isDayjs(dateRange[1]) ? dateRange[1] : null;

    return {
      search,
      status,
      dateMode: mode,
      dateFrom: mode === 'DATE' && d0 ? d0.format('YYYY-MM-DD') : null,
      dateTo: mode === 'DATE' && d1 ? d1.format('YYYY-MM-DD') : null,
    };
  }, [search, status, dateMode, dateRange]);

  const qsCount = useMemo(() => ({ page: 1, perPage: 1 }), []);

  const { data: pmCountRes } = useSWR(
    ApiEndpoints.GetPocketMoneyMobile(qsCount),
    (u) => apiJson(u),
    { revalidateOnFocus: false }
  );

  const { data: rbCountRes } = useSWR(
    ApiEndpoints.GetReimburseMobile(qsCount),
    (u) => apiJson(u),
    { revalidateOnFocus: false }
  );

  const { data: pyCountRes } = useSWR(
    ApiEndpoints.GetPaymentMobile(qsCount),
    (u) => apiJson(u),
    { revalidateOnFocus: false }
  );

  const tabCounts = useMemo(() => {
    const pocket_money = Number(pmCountRes?.meta?.total || 0);
    const reimburses = Number(rbCountRes?.meta?.total || 0);
    const payment = Number(pyCountRes?.meta?.total || 0);
    return { pocket_money, reimburses, payment };
  }, [pmCountRes, rbCountRes, pyCountRes]);

  const nowISO = useCallback(() => new Date().toISOString(), []);

  return {
    activeTab,
    viewMode,
    search,
    status,
    dateMode,
    dateRange,

    filters,
    tabCounts,

    setActiveTab,
    setViewMode,
    setSearch,
    setStatus,
    setDateMode: (v) => {
      const next = String(v || 'ALL').toUpperCase();
      setDateMode(next);
      if (next === 'ALL') setDateRange([null, null]);
    },
    setDateRange,

    nowISO,
    safePickMessage,
  };
}
