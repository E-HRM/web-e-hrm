"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetcher } from "../../../../utils/fetcher";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";
import { crudService } from "../../../../../app/utils/services/crudService";

/** Bangun querystring aman */
function buildQS(obj) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      p.set(k, String(v).trim());
    }
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Normalisasi URL foto */
function normalizePhotoUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) {
    if (typeof window !== "undefined") return `${window.location.origin}${url}`;
    return url;
  }
  return url;
}

/** Debounce value sederhana */
function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = useRef(null);
  useEffect(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeoutRef.current);
  }, [value, delay]);
  return debounced;
}

export default function useKaryawanViewModel() {
  // filter & tabel state
  const [deptId, setDeptId] = useState(null);
  const [jabatanId, setJabatanId] = useState(null);
  const [statusCuti, setStatusCuti] = useState(null); // 'aktif' | 'nonaktif' | null
  const [showDeleted, setShowDeleted] = useState(false); // tampilkan yg soft-deleted
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // state aksi
  const [deletingId, setDeletingId] = useState(null);

  // debounce pencarian
  const qDebounced = useDebounced(q, 300);

  /* ====== master dropdown ====== */
  const deptKey = `${ApiEndpoints.GetDepartement}?page=1&pageSize=500`;
  const jabKey = `${ApiEndpoints.GetJabatan}?page=1&pageSize=500`;

  const { data: deptRes } = useSWR(deptKey, fetcher);
  const { data: jabRes } = useSWR(jabKey, fetcher);

  const deptOptions = useMemo(
    () => (deptRes?.data || []).map((d) => ({ value: d.id_departement, label: d.nama_departement })),
    [deptRes]
  );
  const jabatanOptions = useMemo(
    () => (jabRes?.data || []).map((j) => ({ value: j.id_jabatan, label: j.nama_jabatan })),
    [jabRes]
  );

  /* ====== list users ====== */
  const listKey = useMemo(() => {
    const qs = buildQS({
      page,
      pageSize,
      search: qDebounced || "",
      departementId: deptId || "",
      jabatanId: jabatanId || "",
      statusCuti: statusCuti || "",
      includeDeleted: showDeleted ? "1" : "",
    });
    return `${ApiEndpoints.GetUsers}${qs}`;
  }, [page, pageSize, qDebounced, deptId, jabatanId, statusCuti, showDeleted]);

  const { data: listRes, isLoading } = useSWR(listKey, fetcher, { keepPreviousData: true });

  // reset ke page 1 saat filter berubah
  useEffect(() => { setPage(1); }, [qDebounced, deptId, jabatanId, statusCuti, showDeleted]);

  const rawRows = useMemo(() => (Array.isArray(listRes?.data) ? listRes.data : []), [listRes]);

  const rows = useMemo(() => {
    return rawRows.map((u) => {
      const name = u.nama_pengguna || u.nama || u.name || u.email || "—";
      const email = u.email || "—";
      const jabatan =
        u.jabatan?.nama_jabatan || u.nama_jabatan || (u.jabatan && u.jabatan.nama) || "";
      const departemen =
        u.departement?.nama_departement || u.nama_departement || u.divisi || "";

      const fotoRaw = (u.foto_profil_user && String(u.foto_profil_user).trim()) || null;
      const foto = normalizePhotoUrl(fotoRaw);

      return {
        id: u.id_user || u.id || u.uuid,
        name,
        email,
        jabatan,
        departemen,
        avatarUrl: foto,
        foto_profil_user: foto,

        // NEW: status cuti + soft delete & catatan
        statusCuti: u.status_cuti || null, // 'aktif' | 'nonaktif'
        deletedAt: u.deleted_at || null,
        deleteNote: u.catatan_delete || null,

        // NEW: kontak darurat (untuk view/tooltip jika perlu)
        emergencyName: u.nama_kontak_darurat || null,
        emergencyPhone: u.kontak_darurat || null,
      };
    });
  }, [rawRows]);

  const total = listRes?.pagination?.total ?? rows.length;

  /* ====== actions (CRUD) ====== */
  const changePage = useCallback((p, ps) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const reload = useCallback(async () => { await globalMutate(listKey); }, [listKey]);

  // NOTE support catatan delete → dikirim via ?note= supaya aman ke semua fetcher
  const deleteById = useCallback(
    async (id, note) => {
      try {
        setDeletingId(id);
        const base =
          (ApiEndpoints.DeleteUser && ApiEndpoints.DeleteUser(id)) ||
          (ApiEndpoints.UpdateUser && ApiEndpoints.UpdateUser(id)) ||
          `/api/admin/users/${id}`;
        const url = note ? `${base}?note=${encodeURIComponent(note)}` : base;
        await crudService.delete(url);
        await globalMutate(listKey);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e?.message || "Gagal menghapus." };
      } finally {
        setDeletingId(null);
      }
    },
    [listKey]
  );

  return {
    // filters
    deptId, setDeptId,
    jabatanId, setJabatanId,
    statusCuti, setStatusCuti,
    showDeleted, setShowDeleted,
    q, setQ,
    deptOptions, jabatanOptions,

    // table
    page, pageSize, total, rows, loading: isLoading,
    changePage, reload,

    // actions
    deleteById, deletingId,
  };
}
