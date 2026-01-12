"use client";

import { useCallback, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import useSWR from 'swr';
import { ApiEndpoints } from '../../../../../constrainst/endpoints';

import { mapApiStatusToUI, matchDateFilter, normUpper } from '../component_finance/financeFilterHelpers';

function applyClientFilters(rows, filters) {
  const q = String(filters?.search || '').trim().toLowerCase();
  const st = normUpper(filters?.status);

  let xs = rows;

  if (q) {
    xs = xs.filter((r) => {
      return (
        String(r?.title || '').toLowerCase().includes(q) ||
        String(r?.number || '').toLowerCase().includes(q) ||
        String(r?.employeeName || '').toLowerCase().includes(q) ||
        String(r?.department || '').toLowerCase().includes(q) ||
        String(r?.category || '').toLowerCase().includes(q)
      );
    });
  }

  if (st && st !== 'ALL') xs = xs.filter((r) => normUpper(r?.status) === st);

  xs = xs.filter((r) => matchDateFilter(r?.dateISO, filters));
  return xs;
}

async function apiJson(url, { method = 'GET', body } = {}) {
  const token = Cookies.get('token');
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';

  const res = await fetch(url, { method, headers, credentials: 'include', body: body ? JSON.stringify(body) : undefined });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || `Request gagal (${res.status})`);
  return data;
}

async function apiForm(url, { method = 'POST', formData }) {
  const token = Cookies.get('token');
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(url, { method, headers, credentials: 'include', body: formData });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || `Request gagal (${res.status})`);
  return data;
}

function pickApproval(item) {
  const approvals = Array.isArray(item?.approvals) ? item.approvals : [];
  return approvals.find((a) => !a?.decision) || approvals[0] || null;
}

function pickEmployeeName(item) {
  const u = item?.user;
  return u?.nama_pengguna || u?.name || u?.email || '—';
}

function pickDepartment(item) {
  return item?.departement?.nama_departement || item?.departement?.name || '—';
}

export default function useReimbursesViewModel(filters) {
  const [selected, setSelected] = useState(null);

  const qs = useMemo(() => ApiEndpoints.GetReimburseMobile({ page: 1, perPage: 500 }), []);

  const { data, error, isLoading, mutate } = useSWR(qs, (u) => apiJson(u), { revalidateOnFocus: false });

  const raw = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data]);

  const rows = useMemo(() => {
    return raw.map((it) => {
      const approval = pickApproval(it);
      const st = mapApiStatusToUI(it?.status_persetujuan_reimburse);

      const id =
        approval?.id ||
        approval?.id_approval_reimburse ||
        it?.id_reimburse ||
        it?.id ||
        `${it?.nomor_reimburse || ''}`;

      return {
        id,
        requestId: it?.id_reimburse || it?.id || null,

        type: 'Reimburse',
        title: it?.keterangan || 'Reimburse',
        number: it?.nomor_reimburse || it?.nomor || '-',

        status: st.key,
        statusLabel: st.label,
        statusTone: st.tone,

        employeeName: pickEmployeeName(it),
        department: pickDepartment(it),

        dateLabel: it?.tanggal_reimburse ? new Date(it.tanggal_reimburse).toLocaleDateString('id-ID') : '-',
        dateISO: it?.tanggal_reimburse || it?.created_at || null,

        method: it?.metode_pembayaran || '-',
        category: it?.kategori_reimburse?.nama_kategori_reimburse || it?.kategori || '-',

        totalAmount: Number(it?.nominal_reimburse || 0),
        note: it?.keterangan || '',

        rejectReason: approval?.note || it?.note || null,
        adminProof: approval?.proof_url ? { name: approval.proof_url } : null,
      };
    });
  }, [raw]);

  const filteredRows = useMemo(() => applyClientFilters(rows, filters), [rows, filters]);

  const openDetail = useCallback((row) => setSelected(row), []);

  const approve = useCallback(
    async ({ id, proofFiles }) => {
      const fd = new FormData();
      fd.append('decision', 'APPROVED');

      const fileObj = proofFiles?.[0]?.originFileObj;
      if (fileObj) fd.append('bukti_approval_reimburse', fileObj);

      await apiForm(ApiEndpoints.DecideReimburseMobile(id), { method: 'PATCH', formData: fd });
      await mutate();
    },
    [mutate]
  );

  const reject = useCallback(
    async ({ id, reason }) => {
      const fd = new FormData();
      fd.append('decision', 'REJECTED');
      if (reason) fd.append('note', String(reason));

      await apiForm(ApiEndpoints.DecideReimburseMobile(id), { method: 'PATCH', formData: fd });
      await mutate();
    },
    [mutate]
  );

  return {
    loading: isLoading,
    error,

    rows: filteredRows,
    selected,

    openDetail,
    closeDetail: () => setSelected(null),

    approve,
    reject,
  };
}
