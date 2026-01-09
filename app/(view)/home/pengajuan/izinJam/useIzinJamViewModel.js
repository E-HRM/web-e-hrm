'use client';

import { useMemo, useState, useCallback } from 'react';
import useSWR from 'swr';
import AppMessage from '@/app/(view)/component_shared/AppMessage';
import { ApiEndpoints } from '@/constrainst/endpoints';
import { fetcher } from '@/app/utils/fetcher';
import { handoverPlainText, extractHandoverTags, mergeUsers } from '@/app/api/mobile/tag-users/helpers/tagged-text';

/* ============ Helpers ============ */
const norm = (v) =>
  String(v ?? '')
    .trim()
    .toLowerCase();

function statusFromTab(tab) {
  if (tab === 'disetujui') return 'disetujui';
  if (tab === 'ditolak') return 'ditolak';
  return 'pending';
}
function toLabelStatus(s) {
  const v = norm(s);
  if (v === 'disetujui') return 'Disetujui';
  if (v === 'ditolak') return 'Ditolak';
  return 'Menunggu';
}
/** Ambil "HH:MM" dari string apapun tanpa konversi TZ */
function toHM(value) {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const m = s.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (!m) return null;
  const hh = String(m[1]).padStart(2, '0');
  const mm = m[2];
  return `${hh}:${mm}`;
}

function getApprovalsArray(item) {
  const candidates = [item?.approvals, item?.approval_pengajuan_izin_jam, item?.approval_izin_jam, item?.approvalIzinJam];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}

function pickApprovalId(item) {
  const approvals = getApprovalsArray(item);
  const pending = approvals.filter((a) => !a?.deleted_at).find((a) => ['', 'pending', 'menunggu'].includes(norm(a?.decision)));
  return pending?.id_approval_pengajuan_izin_jam ?? pending?.id_approval_izin_jam ?? pending?.id ?? null;
}

function pickLatestDecisionInfo(item, want) {
  const approvals = getApprovalsArray(item);
  if (!approvals.length) return null;

  const desired = ['disetujui', 'ditolak'].includes(norm(want)) ? norm(want) : null;

  const filtered = approvals
    .filter((a) => !a?.deleted_at)
    .filter((a) => {
      const d = norm(a?.decision);
      return desired ? d === desired : Boolean(a?.decided_at || a?.updated_at);
    });

  if (!filtered.length) return null;

  const top = filtered.sort((a, b) => {
    const tb = new Date(b?.decided_at ?? b?.updated_at ?? 0).getTime();
    const ta = new Date(a?.decided_at ?? a?.updated_at ?? 0).getTime();
    return tb - ta;
  })[0];

  return {
    note: top?.note ?? top?.catatan ?? top?.comment ?? '',
    decided_at: top?.decided_at ?? top?.updated_at ?? null,
  };
}

/* ============ Map API item -> Row ============ */
function mapItemToRow(item) {
  const u = item?.user || {};
  const jabatanName = u?.jabatan?.nama_jabatan ?? null;
  const divisiName = u?.departement?.nama_departement ?? u?.divisi ?? null;
  const jabatanDivisi = [jabatanName, divisiName].filter(Boolean).join(' | ') || u?.role || '—';

  // ambil note/decided_at dari approvals
  const statusRaw = norm(item?.status);
  const latest = pickLatestDecisionInfo(item, statusRaw);

  // handover users + @nama rapi
  const rawHandover = item?.handover ?? item?.handover_text ?? item?.keterangan_handover ?? '—';
  const handover = handoverPlainText(rawHandover);

  const apiHandoverUsers = Array.isArray(item?.handover_users)
    ? item.handover_users
        .map((h) => {
          const usr = h?.user ?? h;
          if (!usr) return null;
          return {
            id: usr.id_user ?? usr.id ?? usr.uuid ?? null,
            name: usr.nama_pengguna ?? usr.name ?? '—',
            photo: usr.foto_profil_user || '/avatar-placeholder.jpg',
          };
        })
        .filter(Boolean)
    : [];

  const tagUsers = extractHandoverTags(rawHandover).map((t) => ({
    id: t.id,
    name: t.name,
    photo: '/avatar-placeholder.jpg',
  }));

  const handoverUsers = mergeUsers(apiHandoverUsers, tagUsers);

  return {
    id: item?.id_pengajuan_izin_jam,

    // user
    nama: u?.nama_pengguna ?? '—',
    jabatanDivisi,
    foto: u?.foto_profil_user || '/avatar-placeholder.jpg',

    // waktu
    tglPengajuan: item?.created_at ?? item?.createdAt ?? null,
    tglIzin: item?.tanggal_izin ?? null,
    jamMulai: toHM(item?.jam_mulai) ?? '—',
    jamSelesai: toHM(item?.jam_selesai) ?? '—',

    // pengganti
    pgTglMulai: item?.tanggal_pengganti ?? null,
    pgJamMulai: toHM(item?.jam_mulai_pengganti) ?? null,
    pgTglSelesai: item?.tanggal_pengganti ?? null,
    pgJamSelesai: toHM(item?.jam_selesai_pengganti) ?? null,

    // detail
    kategori: item?.kategori?.nama_kategori ?? '—',
    keperluan: item?.keperluan ?? '—',
    handover,
    buktiUrl: item?.lampiran_izin_jam_url ?? null,
    handoverUsers,

    // status & keputusan
    status: toLabelStatus(item?.status),
    alasan: latest?.note ?? '',
    tglKeputusan: latest?.decided_at ?? item?.updated_at ?? item?.updatedAt ?? null,

    // approval
    approvalId: pickApprovalId(item),
  };
}

/* ============ Hook ============ */
export default function useIzinJamViewModel() {
  const [tab, _setTab] = useState('pengajuan');
  const [search, _setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const setTab = useCallback((t) => {
    _setTab(t);
    setPage(1);
  }, []);
  const setSearch = useCallback((s) => {
    _setSearch(s);
    setPage(1);
  }, []);

  // list (tab aktif)
  const listKey = useMemo(() => {
    const qs = { status: statusFromTab(tab), page, perPage, all: 1 };
    return ApiEndpoints.GetPengajuanIzinJamMobile(qs);
  }, [tab, page, perPage]);

  const { data, isLoading, mutate } = useSWR(listKey, fetcher, {
    revalidateOnFocus: false,
  });

  // counts (pakai all:1 juga)
  const countKey = useCallback(
    (status) =>
      ApiEndpoints.GetPengajuanIzinJamMobile({
        status,
        page: 1,
        perPage: 1,
        all: 1,
      }),
    []
  );

  const swrCntPending = useSWR(countKey('pending'), fetcher, {
    revalidateOnFocus: false,
  });
  const swrCntApproved = useSWR(countKey('disetujui'), fetcher, {
    revalidateOnFocus: false,
  });
  const swrCntRejected = useSWR(countKey('ditolak'), fetcher, {
    revalidateOnFocus: false,
  });

  const totalOf = (json) => {
    const r = json || {};
    return r?.pagination?.total ?? r?.total ?? r?.meta?.total ?? (Array.isArray(r?.data) ? r.data.length : 0);
  };

  const tabCounts = useMemo(
    () => ({
      pengajuan: totalOf(swrCntPending.data),
      disetujui: totalOf(swrCntApproved.data),
      ditolak: totalOf(swrCntRejected.data),
    }),
    [swrCntPending.data, swrCntApproved.data, swrCntRejected.data]
  );

  // rows
  const rows = useMemo(() => {
    const items = Array.isArray(data?.data) ? data.data : [];
    return items.map(mapItemToRow);
  }, [data]);

  // filter lokal
  const filteredData = useMemo(() => {
    const term = String(search).trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((d) => {
      const handoverNames = (d.handoverUsers || []).map((u) => u.name).join(' ');
      return [d.nama, d.jabatanDivisi, d.kategori, d.keperluan, d.handover, d.tglIzin, d.jamMulai, d.jamSelesai, d.pgTglMulai, d.pgTglSelesai, d.pgJamMulai, d.pgJamSelesai, handoverNames].join(' ').toLowerCase().includes(term);
    });
  }, [rows, search]);

  // actions
  const approve = useCallback(
    async (id, note) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      if (!row.approvalId) {
        AppMessage.error('Tidak menemukan id approval pada pengajuan ini. Pastikan API list mengembalikan approvals.');
        return;
      }
      try {
        const res = await fetch(ApiEndpoints.DecidePengajuanIzinJamMobile(row.approvalId), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'disetujui', note: note ?? null }),
        });
        const json = await res.json();
        if (!res.ok || json?.ok === false) throw new Error(json?.message || 'Gagal menyimpan keputusan.');
        AppMessage.success('Pengajuan izin jam disetujui');
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
        return false;
      }
      if (!row.approvalId) {
        AppMessage.error('Tidak menemukan id approval pada pengajuan ini. Pastikan API list mengembalikan approvals.');
        return false;
      }

      try {
        const res = await fetch(ApiEndpoints.DecidePengajuanIzinJamMobile(row.approvalId), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'ditolak', note: reason }),
        });
        const json = await res.json();
        if (!res.ok || json?.ok === false) throw new Error(json?.message || 'Gagal');

        AppMessage.success('Pengajuan izin jam ditolak');
        await Promise.all([mutate(), swrCntPending.mutate(), swrCntApproved.mutate(), swrCntRejected.mutate()]);
        return true;
      } catch (e) {
        AppMessage.error(e?.message || 'Gagal menyimpan keputusan.');
        return false;
      }
    },
    [rows, mutate, swrCntPending, swrCntApproved, swrCntRejected]
  );

  const refresh = useCallback(() => Promise.all([mutate(), swrCntPending.mutate(), swrCntApproved.mutate(), swrCntRejected.mutate()]), [mutate, swrCntPending, swrCntApproved, swrCntRejected]);

  return {
    data: rows,
    rows,
    filteredData,
    tabCounts,

    tab,
    setTab,
    search,
    setSearch,

    page,
    pageSize: perPage,
    changePage: (p, ps) => {
      setPage(p);
      setPerPage(ps);
    },

    approve,
    reject,
    refresh,
    loading: isLoading,
  };
}
