"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import { message } from "antd";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";

// Normalisasi status API -> label UI
function toLabelStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v === "disetujui") return "Disetujui";
  if (v === "ditolak") return "Ditolak";
  return "Menunggu"; // pending/menunggu
}

// Ambil approvalId pending (API sudah filter approvals relevan untuk aktor)
function pickApprovalId(item) {
  const approvals = Array.isArray(item?.approvals) ? item.approvals : [];
  const pending = approvals.find((a) =>
    ["pending", "menunggu"].includes(String(a?.decision || "").toLowerCase())
  );
  return pending?.id_approval_pengajuan_izin_sakit || null;
}

// Map item API → row UI
function mapItemToRow(item) {
  const tanggal =
    item?.tanggal_sakit ||
    item?.tanggal ||
    item?.created_at ||
    item?.createdAt ||
    null;

  return {
    id: item?.id_pengajuan_izin_sakit,
    tanggal,
    nama: item?.user?.nama_pengguna ?? "—",
    jabatan: item?.user?.role ?? "—",
    kategori: item?.kategori_sakit?.nama_kategori ?? item?.kategori?.nama_kategori ?? "—",
    handover: item?.handover ?? "—",
    buktiUrl: item?.lampiran_sakit_url ?? item?.lampiran_url ?? null,
    status: toLabelStatus(item?.status),
    alasan: "", // biasanya ada di detail approval; list ga wajib
    tempAlasan: "",
    foto: item?.user?.foto_profil_user || "/avatar-placeholder.jpg",
    tglKeputusan: item?.updated_at ?? item?.updatedAt ?? null,
    approvalId: pickApprovalId(item),
  };
}

function statusFromTab(tab) {
  if (tab === "disetujui") return "disetujui";
  if (tab === "ditolak") return "ditolak";
  return "pending"; // tab pengajuan
}

export default function useSakitViewModel() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pengajuan"); // 'pengajuan' | 'disetujui' | 'ditolak'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reasonDraft, setReasonDraft] = useState({});

  // Key SWR
  const listKey = useMemo(() => {
    const qs = { status: statusFromTab(tab), page, pageSize, all: 1 };
    return ApiEndpoints.GetPengajuanIzinSakitMobile(qs);
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
      [d.nama, d.jabatan, d.kategori, d.handover, d.tanggal]
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
          ApiEndpoints.DecidePengajuanIzinSakitMobile(row.approvalId),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "disetujui", note: note ?? null }),
          }
        );
        const json = await res.json();
        if (!res.ok || json?.ok === false) throw new Error(json?.message || "Gagal");
        message.success("Izin sakit disetujui");
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
          ApiEndpoints.DecidePengajuanIzinSakitMobile(row.approvalId),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "ditolak", note: reason }),
          }
        );
        const json = await res.json();
        if (!res.ok || json?.ok === false) throw new Error(json?.message || "Gagal");
        message.success("Izin sakit ditolak");
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
