'use client';

import { useCallback, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import useSWR from 'swr';
import { ApiEndpoints } from '../../../../constrainst/endpoints';

async function apiJson(url, { method = 'GET', body } = {}) {
  const token = Cookies.get('token');
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => '');

  if (!res.ok) {
    const msg = typeof data === 'string' ? data : data?.message || data?.error || 'Request gagal';
    throw new Error(msg);
  }

  return data;
}

function fileNameFromUrl(url) {
  try {
    if (!url) return '';
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop() || '';
    return decodeURIComponent(last);
  } catch {
    const parts = String(url || '').split('/').filter(Boolean);
    return decodeURIComponent(parts[parts.length - 1] || '');
  }
}

function inferTipeFile(url) {
  const raw = String(url || '').trim();
  if (!raw) return 'link';

  const u = raw.toLowerCase();

  // Supabase Storage (public / signed) => pasti file upload
  if (u.includes('/storage/v1/object/')) return 'upload';

  // Folder SOP (baik provider storage utama maupun supabase)
  if (u.includes('sop-perusahaan')) return 'upload';

  // File ekstensi (kadang ada query params)
  if (/\.pdf(\?|$)/i.test(raw)) return 'upload';

  return 'link';
}

function nowISO() {
  return new Date().toISOString();
}

/**
 * ✅ FIX UTAMA:
 * SOP model prisma pakai id_sop_karyawan sebagai PK.
 * Jadi kita normalize supaya UI selalu punya `id_sop`.
 */
function normalizeSopId(obj) {
  if (!obj) return '';
  return (
    obj?.id_sop ??
    obj?.id_sop_karyawan ?? // ✅ paling penting
    obj?.id ?? // fallback umum
    obj?.sop_id ??
    obj?.id_sop_perusahaan ??
    ''
  );
}

export default function useSOPViewModel() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingSOP, setEditingSOP] = useState(null);
  const [selectedSOP, setSelectedSOP] = useState(null);

  const qs = useMemo(() => ApiEndpoints.GetSOPPerusahaan({ page: 1, pageSize: 200 }), []);

  const { data, error, isLoading, mutate } = useSWR(qs, (u) => apiJson(u), {
    revalidateOnFocus: false,
  });

  const sops = useMemo(() => {
    const raw =
      Array.isArray(data?.data) ? data.data : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

    return raw.map((it) => {
      const url = it?.lampiran_sop_url || '';
      const tipe_file = inferTipeFile(url);
      const fname = fileNameFromUrl(url);

      const kategoriId =
        it?.id_kategori_sop ||
        it?.kategori_sop?.id_kategori_sop ||
        it?.kategori_sop?.id ||
        null;

      const id_sop = normalizeSopId(it);

      return {
        id_sop,
        judul: it?.nama_dokumen || '-',
        kategori: kategoriId || 'uncategorized',
        deskripsi: it?.deskripsi || it?.keterangan || '-',
        tipe_file,
        raw_url: url || undefined,
        file_url: tipe_file === 'upload' ? (url || undefined) : undefined,
        file_name: tipe_file === 'upload' ? (fname || 'dokumen.pdf') : undefined,
        link_url: tipe_file === 'link' ? (url || undefined) : undefined,
        created_by: it?.created_by_snapshot_nama_pengguna || it?.created_by || '—',
        created_at: it?.created_at || '',
        updated_at: it?.updated_at || '',
        last_updated_by: it?.updated_by_snapshot_nama_pengguna || it?.updated_by || '—',
      };
    });
  }, [data]);

  const openCreate = useCallback(() => {
    setEditingSOP(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((sop) => {
    setEditingSOP(sop || null);
    setFormOpen(true);
  }, []);

  const openDetail = useCallback((sop) => {
    setSelectedSOP(sop || null);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedSOP(null);
  }, []);

  const saveSOP = useCallback(
    async (payload) => {
      const judul = String(payload?.judul || '').trim();
      if (!judul) throw new Error('Judul SOP wajib diisi');

      const kategori = String(payload?.kategori || '').trim();
      if (!kategori) throw new Error('Kategori SOP wajib dipilih');

      const deskripsi = String(payload?.deskripsi || '').trim();
      if (!deskripsi) throw new Error('Deskripsi SOP wajib diisi');

      const fd = new FormData();
      fd.append('nama_dokumen', judul);
      fd.append('id_kategori_sop', kategori);
      fd.append('deskripsi', deskripsi);

      if (payload?.tipe_file === 'upload') {
        const f = payload?.fileList?.[0]?.originFileObj;
        if (f) {
          fd.append('lampiran_sop', f);
        } else if (payload?.file_url) {
          fd.append('lampiran_sop_url', String(payload.file_url));
        } else {
          fd.append('lampiran_sop_url', '');
        }
      } else {
        const link = String(payload?.link_url || '').trim();
        if (!link) throw new Error('Link URL wajib diisi');
        fd.append('lampiran_sop_url', link);
      }

      const sopId = normalizeSopId(payload);
      const isEdit = Boolean(String(sopId || '').trim());

      const token = Cookies.get('token');
      const headers = {};
      if (token) headers.authorization = `Bearer ${token}`;

      const url = isEdit ? ApiEndpoints.UpdateSOPPerusahaan(sopId) : ApiEndpoints.CreateSOPPerusahaan();
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers, credentials: 'include', body: fd });
      const ct = res.headers.get('content-type') || '';
      const isJson = ct.includes('application/json');
      const resp = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => '');
      if (!res.ok) {
        const msg = typeof resp === 'string' ? resp : resp?.message || resp?.error || 'Request gagal';
        throw new Error(msg);
      }

      await mutate();
      setFormOpen(false);
      setEditingSOP(null);
    },
    [mutate]
  );

  const deleteSOP = useCallback(
    async (idOrRecord) => {
      const rawId = (idOrRecord && typeof idOrRecord === 'object' ? normalizeSopId(idOrRecord) : idOrRecord) ?? '';
      const sopId = String(rawId || '').trim();
      if (!sopId) throw new Error('ID SOP tidak valid');

      await apiJson(ApiEndpoints.DeleteSOPPerusahaan(sopId), { method: 'DELETE' });
      await mutate();
    },
    [mutate]
  );

  return {
    sops,
    loading: isLoading,
    error,

    formOpen,
    setFormOpen,

    editingSOP,
    setEditingSOP,

    selectedSOP,
    setSelectedSOP,

    openCreate,
    openEdit,
    openDetail,
    closeDetail,

    saveSOP,
    deleteSOP,

    nowISO,
  };
}
