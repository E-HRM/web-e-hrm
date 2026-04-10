'use client';

import { useMemo, useState, useCallback } from 'react';
import useSWR from 'swr';
import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { ApiEndpoints } from '@/constrainst/endpoints';
import { fetcher } from '@/app/utils/fetcher';
import { handoverPlainText, extractHandoverTags, mergeUsers } from '@/app/api/mobile/tag-users/helpers/tagged-text';
import { useAuth } from '@/app/utils/auth/authService';

/* ===== Utils kecil ===== */
const norm = (v) =>
  String(v ?? '')
    .trim()
    .toLowerCase();
const normRole = (v) =>
  String(v ?? '')
    .trim()
    .toUpperCase();
const toLabelStatus = (s) => (norm(s) === 'disetujui' ? 'Disetujui' : norm(s) === 'ditolak' ? 'Ditolak' : 'Menunggu');

function getApprovalsArray(item) {
  const candidates = [item?.approvals, item?.approval_pengajuan_cuti, item?.approvalPengajuanCuti];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}

function pickApprovalId(item, actorId, actorRole) {
  const approvals = getApprovalsArray(item);
  const pending = approvals.filter((a) => !a?.deleted_at).filter((a) => norm(a?.decision) === 'pending'); // ← hanya pending
  if (!pending.length) return null;

  const actorIdStr = actorId ? String(actorId) : '';
  const actorRoleNorm = actorRole ? normRole(actorRole) : '';

  if (actorIdStr) {
    const byUser = pending.find((a) => String(a?.approver_user_id ?? a?.approver?.id_user ?? '') === actorIdStr);
    if (byUser) return byUser?.id_approval_pengajuan_cuti || byUser?.id || null;
  }

  if (actorRoleNorm) {
    const byRole = pending.find((a) => normRole(a?.approver_role ?? a?.approver?.role) === actorRoleNorm);
    if (byRole) return byRole?.id_approval_pengajuan_cuti || byRole?.id || null;
  }

  const fallback = pending[0];
  return fallback?.id_approval_pengajuan_cuti || fallback?.id || null;
}

function pickLatestDecisionInfo(item, want) {
  const approvals = getApprovalsArray(item);
  if (!approvals.length) return null;
  const desired = ['disetujui', 'ditolak'].includes(norm(want)) ? norm(want) : null;
  const filtered = approvals.filter((a) => (desired ? norm(a?.decision) === desired : Boolean(a?.decided_at)));
  if (!filtered.length) return null;
  const sorted = filtered.sort((a, b) => {
    const ta = new Date(a?.decided_at || 0).getTime();
    const tb = new Date(b?.decided_at || 0).getTime();
    return tb - ta;
  });
  const top = sorted[0];
  return {
    id: top?.id_approval_pengajuan_cuti || top?.id || null,
    note: top?.note || '',
    decided_at: top?.decided_at || null,
    decision: top?.decision || null,
  };
}

function safeToDate(v) {
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapItemToRow(item, actor) {
  const actorId = actor?.id ?? null;
  const actorRole = actor?.role ?? null;
  const statusRaw = norm(item?.status);
  const latest = pickLatestDecisionInfo(item, statusRaw);

  // === 1) Ambil teks handover mentah & rapikan jadi @nama ===
  const rawHandover = item?.handover ?? item?.handover_text ?? item?.keterangan_handover ?? '—';
  const handoverClean = handoverPlainText(rawHandover); // ← jadi "@nama" saja

  // === 2) Normalisasi handover_users dari API (kalau ada) ===
  const apiHandoverUsers = Array.isArray(item?.handover_users)
    ? item.handover_users
        .map((h) => {
          const u = h?.user ?? h;
          if (!u) return null;
          return {
            id: u.id_user ?? u.id ?? u.uuid ?? null,
            name: u.nama_pengguna ?? u.name ?? '—',
            photo: u.foto_profil_user ?? u.photo ?? '/avatar-placeholder.jpg',
          };
        })
        .filter(Boolean)
    : [];

  // === 3) Fallback: ambil user langsung dari tag di teks ===
  const tagUsers = extractHandoverTags(rawHandover).map((t) => ({
    id: t.id, // UUID dari tag
    name: t.name, // Nama dari tag
    photo: '/avatar-placeholder.jpg',
  }));

  // === 4) Gabungkan & deduplikasi (by id atau name) ===
  const handoverUsers = mergeUsers(apiHandoverUsers, tagUsers);

  // === 5) Tanggal cuti (tetap seperti semula) ===
  const tglCutiList = Array.isArray(item?.tanggal_list)
    ? item.tanggal_list
        .map((d) => (d instanceof Date || typeof d === 'string' || typeof d === 'number' ? safeToDate(d) : safeToDate(d?.tanggal_cuti ?? d?.tanggal ?? d?.date)))
        .filter(Boolean)
        .filter((v, i, a) => a.findIndex((x) => x.getTime() === v.getTime()) === i)
        .sort((a, b) => a.getTime() - b.getTime())
    : [];
  const tglCutiFirst = safeToDate(item?.tanggal_cuti) || tglCutiList[0] || null;
  const tglCutiLast = safeToDate(item?.tanggal_selesai) || tglCutiList[tglCutiList.length - 1] || null;

  // === 6) Jabatan | Divisi (tetap) ===
  const user = item?.user || {};
  const jabatanName = user?.jabatan?.nama_jabatan ?? null;
  const divisiName = user?.departement?.nama_departement ?? user?.divisi ?? null;
  const jabatanDivisi = [jabatanName, divisiName].filter(Boolean).join(' | ') || user?.role || '—';

  return {
    id: item?.id_pengajuan_cuti,
    nama: user?.nama_pengguna ?? '—',
    jabatanDivisi,
    foto: user?.foto_profil_user || '/avatar-placeholder.jpg',
    jenisCuti: item?.kategori_cuti?.nama_kategori ?? '—',
    tglPengajuan: item?.created_at ?? item?.createdAt ?? null,

    // UI
    tglCutiList,
    tglCutiFirst,
    tglCutiLast,
    totalHariCuti: tglCutiList.length,

    tglMasuk: item?.tanggal_masuk_kerja ?? null,

    keterangan: item?.keperluan ?? '—',
    handover: handoverClean, // ← sudah rapi: hanya @nama
    handoverUsers, // ← chip “penerima handover” tetap jalan
    buktiUrl: item?.lampiran_cuti_url ?? null,

    status: toLabelStatus(item?.status),
    alasan: latest?.note || '',
    tglKeputusan: latest?.decided_at ?? item?.updated_at ?? item?.updatedAt ?? null,
    approvalId: pickApprovalId(item, actorId, actorRole),
    cancelApprovalId: latest?.id || null,
  };
}

function statusFromTab(tab) {
  if (tab === 'disetujui') return 'disetujui';
  if (tab === 'ditolak') return 'ditolak';
  return 'pending'; // tab "pengajuan"
}

/* ===== Helper normalize list pola kerja -> options ===== */
function formatJam(hhmmss) {
  if (!hhmmss) return null;
  const s = String(hhmmss);
  return s.length >= 5 ? s.slice(0, 5) : s; // "HH:MM"
}
function toPolaOptions(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map((p) => {
    const id = p?.id_pola_kerja ?? p?.id ?? p?.uuid ?? p?.pola_id ?? String(Math.random());
    const nama = p?.nama_pola ?? p?.nama_pola_kerja ?? p?.nama ?? p?.kode ?? p?.label ?? 'Pola';
    const jm = formatJam(p?.jam_masuk || p?.mulai || p?.start_at || p?.jam_masuk_kerja);
    const jp = formatJam(p?.jam_pulang || p?.selesai || p?.end_at || p?.jam_pulang_kerja);
    const jam = jm && jp ? `${jm}–${jp}` : null;
    return { value: String(id), label: jam ? `${nama} (${jam})` : `${nama}` };
  });
}

export default function useCutiViewModel() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // reset halaman saat ganti tab / keyword
  const [tab, _setTab] = useState('pengajuan');
  const setTab = useCallback((t) => {
    _setTab(t);
    setPage(1);
  }, []);
  const [search, _setSearch] = useState('');
  const setSearch = useCallback((s) => {
    _setSearch(s);
    setPage(1);
  }, []);

  // List pengajuan (tab aktif)
  const listKey = useMemo(() => {
    const qs = { status: statusFromTab(tab), page, perPage: pageSize, all: 1 };
    return ApiEndpoints.GetPengajuanCutiMobile(qs);
  }, [tab, page, pageSize]);

  const { data, isLoading, mutate } = useSWR(listKey, fetcher, {
    revalidateOnFocus: false,
  });

  // ===== COUNTS per status (ringan: ambil 1 item agar dapat total dari pagination) =====
  const countKey = useCallback((status) => ApiEndpoints.GetPengajuanCutiMobile({ status, page: 1, perPage: 1 }), []);

  const swrCntPending = useSWR(countKey('pending'), fetcher, { revalidateOnFocus: false });
  const swrCntApproved = useSWR(countKey('disetujui'), fetcher, { revalidateOnFocus: false });
  const swrCntRejected = useSWR(countKey('ditolak'), fetcher, { revalidateOnFocus: false });

  const totalOf = (json) => {
    const r = json || {};
    // Support beberapa bentuk response
    return r.pagination?.total ?? r.total ?? r.meta?.total ?? (Array.isArray(r.data) ? r.data.length : 0);
  };

  const tabCounts = useMemo(
    () => ({
      pengajuan: totalOf(swrCntPending.data),
      disetujui: totalOf(swrCntApproved.data),
      ditolak: totalOf(swrCntRejected.data),
    }),
    [swrCntPending.data, swrCntApproved.data, swrCntRejected.data]
  );

  // Mapping rows untuk tabel
  const rows = useMemo(() => {
    const items = Array.isArray(data?.data) ? data.data : [];
    return items.map((item) => mapItemToRow(item, { id: auth.userId, role: auth.role }));
  }, [data, auth.userId, auth.role]);

  // Pencarian lokal (ikut tanggal-tanggal cuti + penerima handover)
  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((d) => {
      const tanggalStr = (d.tglCutiList || []).map((t) => (t instanceof Date ? t.toISOString().slice(0, 10) : String(t))).join(' ');
      const handoverNames = (d.handoverUsers || []).map((u) => u.name).join(' ');
      return [d.nama, d.jabatanDivisi, d.jenisCuti, d.keterangan, d.handover, handoverNames, d.tglMasuk, tanggalStr].join(' ').toLowerCase().includes(term);
    });
  }, [rows, search]);

  // ==== Pola Kerja untuk modal "Setujui" ====
  const { data: polaRes } = useSWR(ApiEndpoints.GetPolaKerja, fetcher, {
    revalidateOnFocus: false,
  });
  const polaOptions = useMemo(() => {
    const list = Array.isArray(polaRes?.data) ? polaRes.data : polaRes?.items || polaRes || [];
    return toPolaOptions(list);
  }, [polaRes]);

  // ==== Actions ====
  const approve = useCallback(
    async (id, note, returnShift /* { date: 'YYYY-MM-DD', id_pola_kerja: '...' } */) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return;

      if (!row.approvalId) {
        AppMessage.error('Tidak menemukan id approval pada pengajuan ini. Pastikan API list mengembalikan approvals.');
        return;
      }

      const body = { decision: 'disetujui', note: note ?? null };
      if (returnShift && returnShift.date && returnShift.id_pola_kerja) {
        body.return_shift = {
          date: returnShift.date,
          id_pola_kerja: returnShift.id_pola_kerja,
        };
      }

      try {
        const res = await fetch(ApiEndpoints.DecidePengajuanCutiMobile(row.approvalId), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok || json?.ok === false) throw new Error(json?.message || 'Gagal');
        AppMessage.success('Pengajuan cuti disetujui');
        await Promise.all([mutate(), swrCntPending.mutate(), swrCntApproved.mutate(), swrCntRejected.mutate()]);
      } catch (e) {
        AppMessage.error(e?.message || 'Gagal menyimpan keputusan.');
      }
    },
    [rows, mutate, swrCntPending, swrCntApproved, swrCntRejected]
  );

  const reject = useCallback(
    async (id, note) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return false;

      const reason = String(note ?? '').trim();
      if (!reason) {
        AppMessage.error('Alasan wajib diisi saat menolak.');
        return false; // <- penting: biar caller tahu gagal
      }

      if (!row.approvalId) {
        AppMessage.error('Tidak menemukan id approval pada pengajuan ini. Pastikan API list mengembalikan approvals.');
        return false;
      }

      try {
        const res = await fetch(ApiEndpoints.DecidePengajuanCutiMobile(row.approvalId), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'ditolak', note: reason }),
        });
        const json = await res.json();
        if (!res.ok || json?.ok === false) throw new Error(json?.message || 'Gagal');

        AppMessage.success('Pengajuan cuti ditolak');
        await Promise.all([mutate(), swrCntPending.mutate(), swrCntApproved.mutate(), swrCntRejected.mutate()]);
        return true; // <- sukses
      } catch (e) {
        AppMessage.error(e?.message || 'Gagal menyimpan keputusan.');
        return false;
      }
    },
    [rows, mutate, swrCntPending, swrCntApproved, swrCntRejected]
  );

  const cancelDecision = useCallback(
    async (id) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return false;

      if (!row.cancelApprovalId) {
        AppMessage.error('Tidak menemukan approval yang bisa dikembalikan ke pending.');
        return false;
      }

      try {
        const res = await fetch(ApiEndpoints.DecidePengajuanCutiMobile(row.cancelApprovalId), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'pending' }),
        });
        const json = await res.json();
        if (!res.ok || json?.ok === false) throw new Error(json?.message || 'Gagal');

        AppMessage.success('Status approval berhasil dikembalikan ke pending');
        await Promise.all([mutate(), swrCntPending.mutate(), swrCntApproved.mutate(), swrCntRejected.mutate()]);
        return true;
      } catch (e) {
        AppMessage.error(e?.message || 'Gagal mengembalikan approval ke pending.');
        return false;
      }
    },
    [rows, mutate, swrCntPending, swrCntApproved, swrCntRejected]
  );

  const refresh = useCallback(() => Promise.all([mutate(), swrCntPending.mutate(), swrCntApproved.mutate(), swrCntRejected.mutate()]), [mutate, swrCntPending, swrCntApproved, swrCntRejected]);

  return {
    data: rows,
    filteredData,
    tabCounts, // untuk badge tab

    // filters & pagination (terkontrol)
    tab,
    setTab,
    search,
    setSearch,
    page,
    pageSize,
    changePage: (p, ps) => {
      setPage(p);
      setPageSize(ps);
    },

    // actions
    approve,
    reject,
    cancelDecision,
    refresh,

    // pola kerja
    polaOptions,

    loading: isLoading,
  };
}
