"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import { message } from "antd";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";

// Map status API -> label UI
function toLabelStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v === "disetujui") return "Disetujui";
  if (v === "ditolak") return "Ditolak";
  return "Menunggu"; // pending/menunggu -> Menunggu
}

// Ambil approvalId (jika API list sudah include approvals milik actor)
function pickApprovalId(item) {
  const approvals = Array.isArray(item?.approvals) ? item.approvals : [];
  const pending = approvals.find((a) =>
    ["pending", "menunggu"].includes(String(a?.decision || "").toLowerCase())
  );
  return pending?.id_approval_pengajuan_cuti || null;
}

// Map item API → row yang dipakai CutiContent
function mapItemToRow(item) {
  return {
    id: item?.id_pengajuan_cuti,
    nama: item?.user?.nama_pengguna ?? "—",
    jabatan: item?.user?.role ?? "—", // sesuaikan jika backend kirim jabatan/divisi
    foto: item?.user?.foto_profil_user || "/avatar-placeholder.jpg",
    jenisCuti: item?.kategori_cuti?.nama_kategori ?? "—",
    tglPengajuan: item?.created_at ?? item?.createdAt ?? null,
    tglMulai: item?.tanggal_mulai ?? null,
    tglMasuk: item?.tanggal_masuk_kerja ?? null,
    keterangan: item?.keperluan ?? "—",
    handover: item?.handover ?? "—",
    buktiUrl: item?.lampiran_cuti_url ?? null,
    status: toLabelStatus(item?.status),
    alasan: "", // biasanya ada di note approval (detail), list tidak wajib
    tempAlasan: "",
    tglKeputusan: item?.updated_at ?? item?.updatedAt ?? null,
    approvalId: pickApprovalId(item), // penting untuk approve/reject
  };
}

function statusFromTab(tab) {
  if (tab === "disetujui") return "disetujui";
  if (tab === "ditolak") return "ditolak";
  return "menunggu"; // tab "pengajuan"
}

export default function useCutiViewModel() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pengajuan"); // 'pengajuan' | 'disetujui' | 'ditolak'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reasonDraft, setReasonDraft] = useState({}); // simpan alasan sementara per id

  // Key untuk SWR
  const listKey = useMemo(() => {
    const qs = { status: statusFromTab(tab), page, perPage: pageSize };
    return ApiEndpoints.GetPengajuanCutiMobile(qs);
  }, [tab, page, pageSize]);

  const { data, isLoading, mutate } = useSWR(listKey, fetcher, {
    revalidateOnFocus: false,
  });

  // Rows hasil map dari API
  const rows = useMemo(() => {
    const items = Array.isArray(data?.data) ? data.data : [];
    return items.map(mapItemToRow);
  }, [data]);

  // Pencarian client-side
  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((d) =>
      [
        d.nama,
        d.jabatan,
        d.jenisCuti,
        d.keterangan,
        d.handover,
        d.tglMulai,
        d.tglMasuk,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [rows, search]);

  // Simpan catatan penolakan sementara (dipakai modal sebelum submit)
  function handleAlasanChange(id, value) {
    setReasonDraft((prev) => ({ ...prev, [id]: value }));
  }

  // Approve
  const approve = useCallback(
    async (id, note) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      if (!row.approvalId) {
        message.error(
          "Tidak menemukan id approval pada pengajuan ini. Pastikan API list mengembalikan approvals."
        );
        return;
      }
      try {
        const res = await fetch(
          ApiEndpoints.DecidePengajuanCutiMobile(row.approvalId),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "disetujui", note: note ?? null }),
          }
        );
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.message || "Gagal");
        message.success("Pengajuan cuti disetujui");
        mutate();
      } catch (e) {
        message.error(e?.message || "Gagal menyimpan keputusan.");
      }
    },
    [rows, mutate]
  );

  // Reject
  const reject = useCallback(
    async (id, note) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      const reason = (note ?? reasonDraft[id] ?? "").trim();
      if (!reason) {
        message.error("Alasan wajib diisi saat menolak.");
        return;
      }
      if (!row.approvalId) {
        message.error(
          "Tidak menemukan id approval pada pengajuan ini. Pastikan API list mengembalikan approvals."
        );
        return;
      }
      try {
        const res = await fetch(
          ApiEndpoints.DecidePengajuanCutiMobile(row.approvalId),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "ditolak", note: reason }),
          }
        );
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.message || "Gagal");
        message.success("Pengajuan cuti ditolak");
        mutate();
      } catch (e) {
        message.error(e?.message || "Gagal menyimpan keputusan.");
      }
    },
    [rows, reasonDraft, mutate]
  );

  const refresh = useCallback(() => mutate(), [mutate]);

  return {
    // data untuk tabel
    data: rows,
    filteredData,

    // UI state
    tab,
    setTab,
    search,
    setSearch,

    // pagination (opsional dipakai)
    page,
    pageSize,
    changePage: (p, ps) => {
      setPage(p);
      setPageSize(ps);
    },

    // actions
    handleAlasanChange,
    approve,
    reject,
    refresh,

    loading: isLoading,
  };
}
