'use client';

import { useMemo, useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import useSWR from 'swr';
import { ApiEndpoints } from '../../../../constrainst/endpoints';

function safePickMessage(err, fallback = 'Terjadi kesalahan') {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err?.message) return err.message;
  return fallback;
}

/**
 * Aman untuk semua route kamu:
 * - Selalu kirim cookies (NextAuth session) => credentials: 'include'
 * - Authorization hanya dipasang kalau token cookie benar-benar ada
 * - Tidak akan pernah mengirim "Bearer undefined"
 */
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
  const [status, setStatus] = useState(''); // '' | 'PENDING' | 'APPROVED' | 'REJECTED' (client-side)
  const [datePreset, setDatePreset] = useState('ALL'); // client-side

  const filters = useMemo(() => ({ search, status, datePreset }), [search, status, datePreset]);

  // ambil counts dari meta.total (request kecil: perPage=1)
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
    // state
    activeTab,
    viewMode,
    search,
    status,
    datePreset,

    // derived
    filters,
    tabCounts,

    // actions
    setActiveTab,
    setViewMode,
    setSearch,
    setStatus,
    setDatePreset,

    nowISO,

    // helper (optional)
    safePickMessage,
  };
}
