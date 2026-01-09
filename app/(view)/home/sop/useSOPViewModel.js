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

function fileNameFromUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop();
    return last || '';
  } catch {
    const last = String(url).split('/').filter(Boolean).pop();
    return last || '';
  }
}

export default function useSOPViewModel() {
  const [selectedSOP, setSelectedSOP] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingSOP, setEditingSOP] = useState(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // NOTE:
  // Backend SOP kamu (/api/admin/sop-perusahaan) belum punya kategori seperti mock yang kamu tulis.
  // Jadi kategori kita tetap FE-only agar UI tidak patah.
  const [categories, setCategories] = useState([
    {
      id: 'cat-general',
      key: 'general',
      name: 'SOP General',
      description: 'Kategori default (FE-only)',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ]);

  const activeCategories = useMemo(() => categories.filter((c) => c.is_active), [categories]);

  const categoryMap = useMemo(() => {
    const m = {};
    categories.forEach((c) => (m[c.key] = c));
    return m;
  }, [categories]);

  const qs = useMemo(() => {
    // endpoint SOP admin memakai page + pageSize
    return ApiEndpoints.GetSOPPerusahaan({ page: 1, pageSize: 500 });
  }, []);

  const { data, error, isLoading, mutate } = useSWR(qs, (u) => apiJson(u), { revalidateOnFocus: false });

  const sops = useMemo(() => {
    const raw = Array.isArray(data?.data) ? data.data : [];
    return raw.map((it) => {
      const url = it?.lampiran_sop_url || '';
      const fname = fileNameFromUrl(url);

      return {
        id_sop: it?.id_sop,
        judul: it?.nama_dokumen || '-',

        // FE-only fields supaya komponen kamu tetap jalan
        kategori: 'general',
        deskripsi: it?.tanggal_terbit ? `Tanggal terbit: ${it.tanggal_terbit}` : '-',
        versi: '1.0',

        tipe_file: url ? 'upload' : 'link', // URL upload juga bentuknya URL => tetap bisa dipakai "Download"
        file_url: url || undefined,
        file_name: fname || undefined,
        link_url: url || undefined,

        status: 'active',
        created_by: '—',
        created_at: it?.created_at || '',
        updated_at: it?.updated_at || '',
        last_updated_by: '—',
      };
    });
  }, [data]);

  const nowISO = useCallback(() => new Date().toISOString(), []);

  const toSnakeCaseKey = useCallback((s) => String(s || '').trim().toLowerCase().replace(/\s+/g, '_'), []);

  const openCreate = useCallback(() => {
    setEditingSOP(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((sop) => {
    setEditingSOP(sop);
    setFormOpen(true);
  }, []);

  const saveSOP = useCallback(
    async (payload) => {
      // payload dari SOPFormModal kamu:
      // { judul, kategori, deskripsi, versi, tipe_file, file_url, file_name, link_url }
      const judul = String(payload?.judul || '').trim();
      if (!judul) throw new Error('Judul SOP wajib diisi');

      // backend wajib tanggal_terbit (YYYY-MM-DD)
      const today = new Date();
      const tanggal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const fd = new FormData();
      fd.append('nama_dokumen', judul);
      fd.append('tanggal_terbit', tanggal);

      if (payload?.tipe_file === 'upload') {
        // SOPFormModal antd Upload: fileList[0].originFileObj
        const f = payload?.fileList?.[0]?.originFileObj;
        if (f) {
          // backend cari key "lampiran_sop"
          fd.append('lampiran_sop', f);
        } else if (payload?.file_url) {
          // fallback: kalau tidak upload file, minimal kirim url
          fd.append('lampiran_sop_url', String(payload.file_url));
        }
      } else {
        if (payload?.link_url) fd.append('lampiran_sop_url', String(payload.link_url));
      }

      if (editingSOP?.id_sop) {
        await apiForm(ApiEndpoints.UpdateSOPPerusahaan(editingSOP.id_sop), { method: 'PUT', formData: fd });
      } else {
        await apiForm(ApiEndpoints.CreateSOPPerusahaan, { method: 'POST', formData: fd });
      }

      await mutate();
      setFormOpen(false);
      setEditingSOP(null);
    },
    [editingSOP, mutate]
  );

  const deleteSOP = useCallback(
    async (id) => {
      await apiJson(ApiEndpoints.DeleteSOPPerusahaan(id), { method: 'DELETE' });
      await mutate();
      if (selectedSOP?.id_sop === id) setSelectedSOP(null);
    },
    [mutate, selectedSOP]
  );

  // ===== Category FE-only (karena backend belum ada endpoint kategori SOP)
  const saveCategory = useCallback((cat) => {
    setCategories((prev) => {
      const idx = prev.findIndex((x) => x.id === cat.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = cat;
        return copy;
      }
      return [...prev, cat];
    });
  }, []);

  const deleteCategory = useCallback((id) => {
    setCategories((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toggleCategoryStatus = useCallback((id) => {
    setCategories((prev) =>
      prev.map((x) => (x.id === id ? { ...x, is_active: !x.is_active, updated_at: new Date().toISOString() } : x))
    );
  }, []);

  return {
    // loading
    loading: isLoading,
    error,

    // data
    sops,
    categories,
    activeCategories,
    categoryMap,

    // state
    selectedSOP,
    formOpen,
    editingSOP,
    categoryModalOpen,

    // setters
    setSelectedSOP,
    setFormOpen,
    setEditingSOP,
    setCategoryModalOpen,

    // actions
    openCreate,
    openEdit,
    saveSOP,
    deleteSOP,

    // category actions
    saveCategory,
    deleteCategory,
    toggleCategoryStatus,

    // helpers
    toSnakeCaseKey,
    nowISO,
  };
}
