"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import { message } from "antd";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";

function toLabelStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v === "disetujui") return "Disetujui";
  if (v === "ditolak") return "Ditolak";
  return "Menunggu";
}

function pickApprovalId(item) {
  const approvals = Array.isArray(item?.approvals) ? item.approvals : [];
  const pending = approvals.find((a) =>
    ["pending", "menunggu"].includes(String(a?.decision || "").toLowerCase())
  );
  return pending?.id_approval_izin_tukar_hari || null;
}

function mapItemToRow(item) {
  // tanggal/hari — menyesuaikan field di DB kamu
  const hariIzin =
    item?.hari_izin || item?.tanggal_izin || item?.tgl_izin || item?.tanggal || null;
  const hariPengganti =
    item?.hari_pengganti || item?.tanggal_pengganti || item?.tgl_pengganti || null;

  return {
    id: item?.id_izin_tukar_hari,
    nama: item?.user?.nama_pengguna ?? "—",
    jabatan: item?.user?.role ?? "—",
    foto: item?.user?.foto_profil_user || "/avatar-placeholder.jpg",

    tglPengajuan: item?.created_at ?? item?.createdAt ?? null,
    hariIzin,
    hariPengganti,

    kategori: item?.kategori?.nama_kategori ?? item?.kategori ?? "—",
    keperluan: item?.keperluan ?? "—",
    buktiUrl: item?.lampiran_url ?? null,

    status: toLabelStatus(item?.status),
    alasan: "",
    tempAlasan: "",
    tglKeputusan: item?.updated_at ?? item?.updatedAt ?? null,

    approvalId: pickApprovalId(item),
  };
}

function statusFromTab(tab) {
  if (tab === "disetujui") return "disetujui";
  if (tab === "ditolak") return "ditolak";
  return "pending";
}

export default function useTukarHariViewModel() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pengajuan");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reasonDraft, setReasonDraft] = useState({});

  const listKey = useMemo(() => {
    const qs = { status: statusFromTab(tab), page, pageSize, all: 1 };
    return ApiEndpoints.GetPengajuanTukarHariMobile(qs);
  }, [tab, page, pageSize]);

  const { data, isLoading, mutate } = useSWR(listKey, fetcher, {
    revalidateOnFocus: false,
  });

  const rows = useMemo(() => {
    const items = Array.isArray(data?.data) ? data.data : [];
    return items.map(mapItemToRow);
  }, [data]);

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((d) =>
      [d.nama, d.jabatan, d.kategori, d.keperluan, d.hariIzin, d.hariPengganti]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [rows, search]);

  function handleAlasanChange(id, value) {
    setReasonDraft((prev) => ({ ...prev, [id]: value }));
  }

  const approve = useCallback(
    async (id, note) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      if (!row.approvalId) {
        message.error("Tidak menemukan id approval. Pastikan API list mengembalikan approvals.");
        return;
      }
      try {
        const res = await fetch(
          ApiEndpoints.DecidePengajuanTukarHariMobile(row.approvalId),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "disetujui", note: note ?? null }),
          }
        );
        const json = await res.json();
        if (!res.ok || json?.ok === false) throw new Error(json?.message || "Gagal");
        message.success("Pengajuan tukar hari disetujui");
        mutate();
      } catch (e) {
        message.error(e?.message || "Gagal menyimpan keputusan.");
      }
    },
    [rows, mutate]
  );

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
        message.error("Tidak menemukan id approval. Pastikan API list mengembalikan approvals.");
        return;
      }
      try {
        const res = await fetch(
          ApiEndpoints.DecidePengajuanTukarHariMobile(row.approvalId),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "ditolak", note: reason }),
          }
        );
        const json = await res.json();
        if (!res.ok || json?.ok === false) throw new Error(json?.message || "Gagal");
        message.success("Pengajuan tukar hari ditolak");
        mutate();
      } catch (e) {
        message.error(e?.message || "Gagal menyimpan keputusan.");
      }
    },
    [rows, reasonDraft, mutate]
  );

  const refresh = useCallback(() => mutate(), [mutate]);

  return {
    data: rows,
    filteredData,
    loading: isLoading,

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

    handleAlasanChange,
    approve,
    reject,
    refresh,
  };
}
