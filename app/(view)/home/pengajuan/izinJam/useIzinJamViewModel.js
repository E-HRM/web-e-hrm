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
  return "pending";
}

function toLabelStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v === "disetujui") return "Disetujui";
  if (v === "ditolak") return "Ditolak";
  return "Menunggu";
}

/**
 * Ambil jam apa adanya dari string DB TANPA konversi timezone.
 * Menangkap pola "HH:MM" atau "HH:MM:SS" (termasuk jika tertanam di ISO "2025-01-01T08:00:00Z").
 * Output DISESUAIKAN ke "HH:MM" saja.
 */
function toHM(value) {
  const s = String(value ?? "").trim();
  if (!s) return null;

  // Tangkap "H:MM", "HH:MM" atau "HH:MM:SS"
  const m = s.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (!m) return null;

  const hh = String(m[1]).padStart(2, "0");
  const mm = m[2];
  return `${hh}:${mm}`;
}

/* Ambil approval id pending/menunggu */
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
  const u = item?.user || {};
  const jabatan = u.jabatan ?? u.nama_jabatan ?? u.title ?? null;
  const divisi  = u.divisi  ?? u.nama_divisi  ?? u.department ?? null;
  const jabatanDivisi = [jabatan, divisi].filter(Boolean).join(" | ") || u.role || "—";

  // Daftar penerima handover (nama + foto)
  const handoverUsers = Array.isArray(item?.handover_users)
    ? item.handover_users
        .map((h) => {
          const usr = h?.user;
          if (!usr) return null;
          return {
            id: usr.id_user,
            name: usr.nama_pengguna ?? "—",
            photo: usr.foto_profil_user || "/avatar-placeholder.jpg",
          };
        })
        .filter(Boolean)
    : [];

  return {
    id: item?.id_pengajuan_izin_jam,

    // user
    nama: u?.nama_pengguna ?? "—",
    jabatanDivisi,
    foto: u?.foto_profil_user || "/avatar-placeholder.jpg",

    // waktu
    tglPengajuan: item?.created_at ?? item?.createdAt ?? null,
    tglIzin: item?.tanggal_izin ?? null,
    jamMulai:   toHM(item?.jam_mulai)           ?? "—",
    jamSelesai: toHM(item?.jam_selesai)         ?? "—",

    // pengganti (opsional; bisa lintas hari)
    pgTglMulai: item?.tanggal_pengganti ?? null,
    pgJamMulai: toHM(item?.jam_mulai_pengganti) ?? null,
    pgTglSelesai: item?.tanggal_pengganti ?? null,
    pgJamSelesai: toHM(item?.jam_selesai_pengganti) ?? null,

    // detail
    kategori: item?.kategori?.nama_kategori ?? "—",
    keperluan: item?.keperluan ?? "—",
    handover: item?.handover ?? "—",
    buktiUrl: item?.lampiran_izin_jam_url ?? null,
    handoverUsers, // << ditambahkan

    // status
    status: toLabelStatus(item?.status),
    alasan: "",
    tempAlasan: "",
    tglKeputusan: item?.updated_at ?? item?.updatedAt ?? null,

    // approval
    approvalId: pickApprovalId(item),
  };
}

export default function useIzinJamViewModel() {
  const [tab, setTab] = useState("pengajuan");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reasonDraft, setReasonDraft] = useState({});

  // LIST untuk tab aktif
  const listKey = useMemo(() => {
    const qs = { status: statusFromTab(tab), page, pageSize, all: 1 };
    return ApiEndpoints.GetPengajuanIzinJamMobile(qs);
  }, [tab, page, pageSize]);

  const { data, isLoading, mutate } = useSWR(listKey, fetcher, {
    revalidateOnFocus: false,
  });

  // COUNTS ringan
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

  // rows
  const rows = useMemo(() => {
    const items = Array.isArray(data?.data) ? data.data : [];
    return items.map(mapItemToRow);
  }, [data]);

  // pencarian client-side (ikut nama penerima handover)
  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((d) => {
      const handoverNames = (d.handoverUsers || []).map((u) => u.name).join(" ");
      return [
        d.nama,
        d.jabatanDivisi,
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
        handoverNames, // << penting
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
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
        if (!res.ok || json?.ok === false) throw new Error(json?.message || "Gagal menyimpan keputusan.");
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
        if (!res.ok || json?.ok === false) throw new Error(json?.message || "Gagal menyimpan keputusan.");
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
    rows,
    filteredData,
    tabCounts,

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

    loading: isLoading,
  };
}
