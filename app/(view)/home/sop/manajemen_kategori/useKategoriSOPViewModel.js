'use client';

import { useCallback, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import useSWR from 'swr';

const API_KATEGORI_SOP = '/api/admin/kategori-sop';

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
  const data = ct.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) throw new Error(data?.message || `Request gagal (${res.status})`);
  return data;
}

function mapKategoriApiToUi(item) {
  const id = item?.id_kategori_sop ? String(item.id_kategori_sop) : '';
  return {
    // dipakai UI (SOPTable/SOPFormModal)
    id,
    key: id, // key kita samakan dengan id_kategori_sop agar konsisten dengan SOP (FK)
    name: item?.nama_kategori || '-',
    is_active: !item?.deleted_at,

    // raw meta (kalau butuh)
    id_kategori_sop: id,
    nama_kategori: item?.nama_kategori || '-',
    created_at: item?.created_at || null,
    updated_at: item?.updated_at || null,
    deleted_at: item?.deleted_at || null,
  };
}

export default function useKategoriSOPViewModel() {
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // ambil semua kategori biar simpel untuk dropdown dan table
  const qs = useMemo(() => `${API_KATEGORI_SOP}?all=true&includeDeleted=true&orderBy=created_at&sort=desc`, []);

  const { data, error, isLoading, mutate } = useSWR(qs, (u) => apiJson(u), {
    revalidateOnFocus: false,
  });

  const categories = useMemo(() => {
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : [];
    return items.map(mapKategoriApiToUi);
  }, [data]);

  // kategori pseudo untuk SOP yang belum punya kategori (FK null)
  const uncategorized = useMemo(
    () => ({
      id: 'uncategorized',
      key: 'uncategorized',
      name: 'Tanpa Kategori',
      is_active: true,
      system: true,
    }),
    []
  );

  // yang dipakai dropdown SOP: aktif + uncategorized
  const categoriesForSOP = useMemo(() => {
    const active = categories.filter((c) => c.is_active);
    return [uncategorized, ...active];
  }, [categories, uncategorized]);

  const activeCategories = useMemo(() => categoriesForSOP.filter((c) => c.is_active), [categoriesForSOP]);

  const categoryMap = useMemo(() => {
    const m = {};
    categoriesForSOP.forEach((c) => {
      m[c.key] = c;
    });
    return m;
  }, [categoriesForSOP]);

  const nowISO = useCallback(() => new Date().toISOString(), []);

  // create/update dari modal form
  const saveCategory = useCallback(
    async (payload) => {
      const id = payload?.id ? String(payload.id).trim() : null;
      const nama_kategori = String(payload?.nama_kategori || '').trim();

      if (!nama_kategori) throw new Error('nama_kategori wajib diisi.');

      if (id) {
        await apiJson(`${API_KATEGORI_SOP}/${id}`, {
          method: 'PUT',
          body: { nama_kategori },
        });
      } else {
        await apiJson(API_KATEGORI_SOP, {
          method: 'POST',
          body: { nama_kategori },
        });
      }

      await mutate();
    },
    [mutate]
  );

  // delete soft/hard
  const deleteCategory = useCallback(
    async (id, { hard = false } = {}) => {
      const cid = String(id || '').trim();
      if (!cid) return;

      const url = hard ? `${API_KATEGORI_SOP}/${cid}?hard=true` : `${API_KATEGORI_SOP}/${cid}`;
      await apiJson(url, { method: 'DELETE' });
      await mutate();
    },
    [mutate]
  );

  return {
    // state
    categoryModalOpen,
    setCategoryModalOpen,

    // loading
    loading: isLoading,
    error,

    // data
    categories, // untuk modal (termasuk deleted untuk info)
    categoriesForSOP, // untuk SOP table/form (aktif + uncategorized)
    activeCategories,
    categoryMap,

    // actions
    saveCategory,
    deleteCategory,

    // helper
    nowISO,
  };
}
