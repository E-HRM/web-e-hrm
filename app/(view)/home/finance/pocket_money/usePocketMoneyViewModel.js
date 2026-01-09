'use client';

import { useCallback, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import useSWR from 'swr';
import { ApiEndpoints } from '../../../../../constrainst/endpoints';

function normUpper(s) {
  return String(s || '').trim().toUpperCase();
}

function mapApiStatusToUI(apiStatus) {
  const s = String(apiStatus || '').toLowerCase();
  if (s === 'pending') return { key: 'PENDING', label: 'Pending', tone: 'warning' };
  if (s === 'disetujui' || s === 'approved') return { key: 'APPROVED', label: 'Approved', tone: 'success' };
  if (s === 'ditolak' || s === 'rejected') return { key: 'REJECTED', label: 'Rejected', tone: 'danger' };
  return { key: 'IN_REVIEW', label: 'In Review', tone: 'info' };
}

function applyClientFilters(rows, filters) {
  const q = String(filters?.search || '').trim().toLowerCase();
  const st = normUpper(filters?.status);
  const preset = normUpper(filters?.datePreset);

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

  if (st) {
    xs = xs.filter((r) => normUpper(r?.status) === st);
  }

  // datePreset masih client-side (kalau kamu mau server-side, tinggal kirim param date range)
  if (preset && preset !== 'ALL') {
    // kamu sebelumnya pakai TODAY / TOMORROW
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (preset === 'TODAY') {
      xs = xs.filter((r) => {
        const d = r?.dateISO ? new Date(r.dateISO) : null;
        return d && d >= start && d <= end;
      });
    }
    if (preset === 'TOMORROW') {
      const t0 = new Date(start);
      t0.setDate(t0.getDate() + 1);
      const t1 = new Date(end);
      t1.setDate(t1.getDate() + 1);
      xs = xs.filter((r) => {
        const d = r?.dateISO ? new Date(r.dateISO) : null;
        return d && d >= t0 && d <= t1;
      });
    }
  }

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
  // pilih yang masih pending (decision null)
  return approvals.find((a) => !a?.decision) || approvals[0] || null;
}

function pickEmployeeName(item) {
  const u = item?.user;
  return u?.nama_pengguna || u?.name || u?.email || '—';
}

function pickDepartment(item) {
  return item?.departement?.nama_departement || item?.departement?.name || '—';
}

export default function usePocketMoneyViewModel(filters) {
  const [selected, setSelected] = useState(null);

  const qs = useMemo(() => {
    // Ambil banyak dulu, nanti filter di client agar UX tetap sama dengan sebelumnya
    return ApiEndpoints.GetPocketMoneyMobile({ page: 1, perPage: 500 });
  }, []);

  const { data, error, isLoading, mutate } = useSWR(qs, (u) => apiJson(u), { revalidateOnFocus: false });

  const raw = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data]);

  const rows = useMemo(() => {
    return raw.map((it) => {
      const approval = pickApproval(it);
      const st = mapApiStatusToUI(it?.status_persetujuan_pocket_money);

      const id = approval?.id || approval?.id_approval_pocket_money || it?.id_pocket_money || it?.id || `${it?.nomor_pocket_money || ''}`;

      return {
        // IMPORTANT: id dipakai untuk aksi approve/reject => kita pakai approval id kalau ada
        id,

        requestId: it?.id_pocket_money || it?.id || null,

        type: 'Pocket Money',
        title: it?.keterangan || 'Pocket Money',
        number: it?.nomor_pocket_money || it?.nomor || '-',

        status: st.key,
        statusLabel: st.label,
        statusTone: st.tone,

        employeeName: pickEmployeeName(it),
        department: pickDepartment(it),

        dateLabel: it?.tanggal_pocket_money ? new Date(it.tanggal_pocket_money).toLocaleDateString('id-ID') : '-',
        dateISO: it?.tanggal_pocket_money || it?.created_at || null,

        method: it?.metode_pembayaran || '-',
        category: it?.kategori_pocket_money?.nama_kategori_pocket_money || it?.kategori || '-',

        totalAmount: Number(it?.nominal_pocket_money || 0),
        note: it?.keterangan || '',

        // rekening (kalau ada)
        bankName: it?.bank || it?.nama_bank || '-',
        accountName: it?.nama_rekening || '-',
        accountNumber: it?.nomor_rekening || '-',

        rejectReason: approval?.note || it?.note || null,
        adminProof: approval?.proof_url ? { name: approval.proof_url } : null,
      };
    });
  }, [raw]);

  const filteredRows = useMemo(() => applyClientFilters(rows, filters), [rows, filters]);

  const openDetail = useCallback((row) => setSelected(row), []);

  const approve = useCallback(
    async ({ id, proofFiles }) => {
      // Pocket money backend menerima file optional, tapi UI requireProof=false (boleh kosong)
      const fd = new FormData();
      fd.append('decision', 'APPROVED');

      const fileObj = proofFiles?.[0]?.originFileObj;
      if (fileObj) {
        // backend pocket-money approvals cari key "bukti_approval_pocket_money"
        fd.append('bukti_approval_pocket_money', fileObj);
      }

      await apiForm(ApiEndpoints.DecidePocketMoneyMobile(id), { method: 'PATCH', formData: fd });
      await mutate();
    },
    [mutate]
  );

  const reject = useCallback(
    async ({ id, reason }) => {
      const fd = new FormData();
      fd.append('decision', 'REJECTED');
      if (reason) fd.append('note', String(reason));

      await apiForm(ApiEndpoints.DecidePocketMoneyMobile(id), { method: 'PATCH', formData: fd });
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
