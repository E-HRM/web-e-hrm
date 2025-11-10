"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import { message } from "antd";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";

/* ===== Helpers ===== */
function statusFromTab(tab) {
  if (tab === "disetujui") return "disetujui";
  if (tab === "ditolak") return "ditolak";
  return "pending"; // tab "pengajuan"
}

function toLabelStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v === "disetujui") return "Disetujui";
  if (v === "ditolak") return "Ditolak";
  return "Menunggu"; // treat pending/menunggu/null/""
}

function toHM(value) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  // dukung "HH:MM" / "HH:MM:SS"
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/* Ambil approval pending untuk aktor dari payload API list (kalau ada) */
function pickApprovalId(item) {
  const approvals = Array.isArray(item?.approvals) ? item.approvals : [];
  const a = approvals.find((ap) => {
    const d = String(ap?.decision ?? "").trim().toLowerCase();
    return d === "" || d === "pending" || d === "menunggu";
  });
  return a?.id_approval_pengajuan_izin_jam || a?.id || null;
}

/* Map item API → row tabel */
function mapItemToRow(item) {
  return {
    id: item?.id_pengajuan_izin_jam,
    // user
    nama: item?.user?.nama_pengguna ?? "—",
    jabatan: item?.user?.role ?? "—",
    foto: item?.user?.foto_profil_user || "/avatar-placeholder.jpg",
    // waktu
    tglPengajuan: item?.created_at ?? item?.createdAt ?? null,
    tglIzin: item?.tanggal_izin ?? null,
    jamMulai: toHM(item?.jam_mulai) ?? "—",
    jamSelesai: toHM(item?.jam_selesai) ?? "—",
    // pengganti (opsional; bisa lintas hari)
    pgTglMulai: item?.tanggal_pengganti ?? null,
    pgJamMulai: toHM(item?.jam_mulai_pengganti) ?? null,
    pgTglSelesai: item?.tanggal_pengganti ?? null, // sering sama dg mulai
    pgJamSelesai: toHM(item?.jam_selesai_pengganti) ?? null,
    // detail
    kategori: item?.kategori?.nama_kategori ?? "—",
    keperluan: item?.keperluan ?? "—",
    handover: item?.handover ?? "—",
    bukti: item?.lampiran_izin_jam_url ?? null,
    // status
    status: toLabelStatus(item?.status),
    alasan: "",
    tempAlasan: "",
    tglKeputusan: item?.updated_at ?? item?.updatedAt ?? null,
    // untuk approve/reject
    approvalId: pickApprovalId(item),
  };
}

export default function useIzinJamViewModel() {
  const [tab, setTab] = useState("pengajuan"); // 'pengajuan' | 'disetujui' | 'ditolak'
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reasonDraft, setReasonDraft] = useState({}); // catatan tolak per-id

  // ===== LIST untuk tab aktif =====
  const listKey = useMemo(() => {
    const qs = { status: statusFromTab(tab), page, pageSize, all: 1 };
    return ApiEndpoints.GetPengajuanIzinJamMobile(qs);
  }, [tab, page, pageSize]);

  const { data, isLoading, mutate } = useSWR(listKey, fetcher, {
    revalidateOnFocus: false,
  });

  // ===== COUNTS per status (ringan: ambil 1 item untuk dapat pagination.total) =====
  const countKey = useCallback(
    (status) => ApiEndpoints.GetPengajuanIzinJamMobile({ status, page: 1, pageSize: 1 }),
    []
  );

  const swrCntPending  = useSWR(countKey("pending"),   fetcher, { revalidateOnFocus: false });
  const swrCntApproved = useSWR(countKey("disetujui"), fetcher, { revalidateOnFocus: false });
  const swrCntRejected = useSWR(countKey("ditolak"),   fetcher, { revalidateOnFocus: false });

  const totalOf = (json) => {
    const r = json || {};
    return r?.pagination?.total ?? r?.total ?? r?.meta?.total ??
      (Array.isArray(r?.data) ? r.data.length : 0);
  };

  const tabCounts = useMemo(() => ({
    pengajuan: totalOf(swrCntPending.data),
    disetujui: totalOf(swrCntApproved.data),
    ditolak:   totalOf(swrCntRejected.data),
  }), [swrCntPending.data, swrCntApproved.data, swrCntRejected.data]);

  // rows dari API
  const rows = useMemo(() => {
    const items = Array.isArray(data?.data) ? data.data : [];
    return items.map(mapItemToRow);
  }, [data]);

  // pencarian client-side
  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((d) =>
      [
        d.nama,
        d.jabatan,
        d.kategori,
        d.keperluan,
        d.handover,
        d.tglIzin,
        d.jamMulai,
        d.jamSelesai,
        d.pgTglMulai,
        d.pgTglSelesai,
        d.pgJamMulai,
        d.pgJamSelesai,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [rows, search]);

  // catatan sementara penolakan
  const handleAlasanChange = useCallback((id, value) => {
    setReasonDraft((prev) => ({ ...prev, [id]: value }));
  }, []);

  // Approve
  const approve = useCallback(
    async (id, note) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      if (!row.approvalId) {
        message.error("Tidak menemukan id approval pada pengajuan ini. Pastikan API list mengembalikan approvals.");
        return;
      }
      try {
        const res = await fetch(
          ApiEndpoints.DecidePengajuanIzinJamMobile(row.approvalId),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "disetujui", note: note ?? null }),
          }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Gagal menyimpan keputusan.");
        message.success("Pengajuan izin jam disetujui");
        await Promise.all([
          mutate(),
          swrCntPending.mutate(),
          swrCntApproved.mutate(),
          swrCntRejected.mutate(),
        ]);
      } catch (e) {
        message.error(e?.message || "Gagal menyimpan keputusan.");
      }
    },
    [rows, mutate, swrCntPending, swrCntApproved, swrCntRejected]
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
        message.error("Tidak menemukan id approval pada pengajuan ini. Pastikan API list mengembalikan approvals.");
        return;
      }
      try {
        const res = await fetch(
          ApiEndpoints.DecidePengajuanIzinJamMobile(row.approvalId),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "ditolak", note: reason }),
          }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Gagal menyimpan keputusan.");
        message.success("Pengajuan izin jam ditolak");
        await Promise.all([
          mutate(),
          swrCntPending.mutate(),
          swrCntApproved.mutate(),
          swrCntRejected.mutate(),
        ]);
      } catch (e) {
        message.error(e?.message || "Gagal menyimpan keputusan.");
      }
    },
    [rows, reasonDraft, mutate, swrCntPending, swrCntApproved, swrCntRejected]
  );

  const refresh = useCallback(
    () =>
      Promise.all([
        mutate(),
        swrCntPending.mutate(),
        swrCntApproved.mutate(),
        swrCntRejected.mutate(),
      ]),
    [mutate, swrCntPending, swrCntApproved, swrCntRejected]
  );

  return {
    // data
    rows,
    filteredData,

    // counts “lengket”
    tabCounts,

    // state UI
    tab,
    setTab,
    search,
    setSearch,

    // pagination
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

    // misc
    loading: isLoading,
  };
}
