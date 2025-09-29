"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { useCallback, useMemo, useState } from "react";
import { fetcher } from "../../../../utils/fetcher";
import { ApiEndpoints } from "../../../../../constrainst/endpoints";

/** bangun querystring dgn aman */
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

export default function useKaryawanViewModel() {
  // filter & tabel state
  const [deptId, setDeptId] = useState(null);
  const [jabatanId, setJabatanId] = useState(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ====== master dropdown ====== */
  const deptKey = `${ApiEndpoints.GetDepartement}?page=1&pageSize=500`;
  const jabKey  = `${ApiEndpoints.GetJabatan}?page=1&pageSize=500`;

  const { data: deptRes } = useSWR(deptKey, fetcher);
  const { data: jabRes }  = useSWR(jabKey, fetcher);

  const deptOptions = useMemo(
    () =>
      (deptRes?.data || []).map((d) => ({
        value: d.id_departement,
        label: d.nama_departement,
      })),
    [deptRes]
  );

  const jabatanOptions = useMemo(
    () =>
      (jabRes?.data || []).map((j) => ({
        value: j.id_jabatan,
        label: j.nama_jabatan,
      })),
    [jabRes]
  );

  /* ====== list users ====== */
  const listKey = useMemo(() => {
    const qs = buildQS({
      page,
      pageSize,
      q,
      id_departement: deptId || "",
      id_jabatan: jabatanId || "",
    });
    return `${ApiEndpoints.GetUsers}${qs}`;
  }, [page, pageSize, q, deptId, jabatanId]);

  const { data: listRes, isLoading } = useSWR(listKey, fetcher, {
    keepPreviousData: true,
  });

  // stabilkan rows agar tak tripping eslint hooks
  const rawRows = useMemo(() => Array.isArray(listRes?.data) ? listRes.data : [], [listRes]);

  const rows = useMemo(() => {
    return rawRows.map((u) => {
      // nama
      const name = u.nama_pengguna || u.nama || u.name || u.email || "—";
      // email
      const email = u.email || "—";
      // jabatan & divisi (robust ambil dari berbagai property yg mungkin ada)
      const jabatan =
        u.jabatan?.nama_jabatan ||
        u.nama_jabatan ||
        (u.jabatan && u.jabatan.nama) ||
        "";
      const departemen =
        u.departement?.nama_departement ||
        u.nama_departement ||
        u.divisi ||
        "";

      // sisa cuti & tanggal reset (jika ada di API, kalau tidak tampil “—”)
      const sisaCuti = u.sisa_cuti ?? u.leave_remaining ?? "—";
      const cutiResetAt = u.cuti_reset_at ?? u.leave_reset_at ?? null;

      return {
        id: u.id_user || u.id || u.uuid,
        name,
        email,
        jabatan,
        departemen,
        sisaCuti,
        cutiResetAt,
      };
    });
  }, [rawRows]);

  const total = listRes?.pagination?.total || rows.length;

  /* ====== actions for UI ====== */
  const changePage = useCallback((p, ps) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const reload = useCallback(async () => {
    await globalMutate(listKey);
  }, [listKey]);

  return {
    // filters
    deptId, setDeptId,
    jabatanId, setJabatanId,
    q, setQ,
    deptOptions,
    jabatanOptions,

    // table
    page, pageSize, total,
    rows,
    loading: isLoading,
    changePage,
    reload,
  };
}
