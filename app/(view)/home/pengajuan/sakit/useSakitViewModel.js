"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import { message } from "antd";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";

/* ===================== Helpers ====================== */
function norm(v) {
  return String(v ?? "").trim().toLowerCase();
}

function toLabelStatus(s) {
  const v = norm(s);
  if (v === "disetujui") return "Disetujui";
  if (v === "ditolak") return "Ditolak";
  return "Menunggu";
}

function statusFromTab(tab) {
  if (tab === "disetujui") return "disetujui";
  if (tab === "ditolak") return "ditolak";
  return "pending";
}

/* ===== approvals ===== */
function pickApprovalId(item) {
  const approvals = Array.isArray(item?.approvals) ? item.approvals : [];
  const pending = approvals.find((a) =>
    ["pending", "menunggu", ""].includes(norm(a?.decision))
  );
  return pending?.id_approval_izin_sakit || pending?.id || null;
}

/* ===== attachments normalizer (toleran banyak bentuk) ===== */
function normalizeAttachments(item) {
  const out = [];

  const pushUrl = (url, nameFallback = "Lampiran") => {
    const s = String(url ?? "").trim();
    if (!s) return;
    const fileName = s.split("/").pop()?.split("?")[0] || nameFallback;
    out.push({ url: s, name: fileName });
  };

  // Array-based candidates
  const arrCands = [item?.attachments, item?.lampiran, item?.files, item?.berkas];
  for (const arr of arrCands) {
    if (Array.isArray(arr)) {
      for (const it of arr) {
        const url = it?.url ?? it?.link ?? it?.path ?? it?.file_url ?? it;
        const name = it?.name ?? it?.filename ?? undefined;
        if (url) pushUrl(url, name);
      }
    }
  }

  // Single fields (utama: lampiran_izin_sakit_url)
  const single = [
    item?.lampiran_izin_sakit_url,
    item?.lampiran_url,
    item?.bukti_url,
    item?.file_url,
    item?.file_kelengkapan_url,
  ];
  for (const s of single) pushUrl(s);

  return out;
}

/* ===== handover users normalizer ===== */
function normalizeHandoverUsers(item) {
  const raw =
    item?.handover_users ??
    item?.handoverUsers ??
    item?.penerima_handover ??
    item?.handover_assignments ??
    [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((h) => {
      const u = h?.user ?? h;
      const id =
        h?.id_user_tagged ??
        u?.id_user ??
        u?.id ??
        u?.uuid ??
        null;
      const name =
        u?.nama_pengguna ??
        h?.nama_pengguna_tagged ??
        u?.name ??
        u?.nama ??
        u?.full_name ??
        null;
      const photo =
        u?.foto_profil_user ??
        h?.foto_profil_user ??
        u?.photo ??
        u?.avatar ??
        "/avatar-placeholder.jpg";
      if (!id && !name) return null;
      return { id: String(id ?? name), name: name ?? "—", photo };
    })
    .filter(Boolean);
}

/* ===== map item → row UI (gaya konsisten dengan Cuti) ===== */
function mapItemToRow(item) {
  const user = item?.user || {};
  const jabatan =
    user.jabatan ?? user.nama_jabatan ?? user.title ?? null;
  const divisi =
    user.divisi ?? user.nama_divisi ?? user.department ?? null;
  const jabatanDivisi =
    [jabatan, divisi].filter(Boolean).join(" | ") || user.role || "—";

  const attachments = normalizeAttachments(item);
  const handoverUsers = normalizeHandoverUsers(item);

  return {
    id: item?.id_pengajuan_izin_sakit,

    // user
    nama: user?.nama_pengguna ?? "—",
    jabatanDivisi,
    foto: user?.foto_profil_user || "/avatar-placeholder.jpg",

    // waktu
    tglPengajuan: item?.tanggal_pengajuan ?? item?.created_at ?? item?.createdAt ?? null,

    // konten
    kategori:
      item?.kategori?.nama_kategori ??
      item?.kategori_sakit?.nama_kategori ??
      "—",
    handover:
      item?.handover ??
      item?.handover_text ??
      item?.keterangan_handover ??
      "—",

    // status
    statusRaw: item?.status ?? "pending",
    status: toLabelStatus(item?.status),
    alasan: "", // catatan keputusan (jika ada) bisa dilengkapi di detail endpoint bila dibutuhkan
    tempAlasan: "",
    tglKeputusan: item?.updated_at ?? item?.updatedAt ?? null,

    // approvals
    approvalId: pickApprovalId(item),

    // files
    attachments,
    buktiUrl:
      item?.lampiran_izin_sakit_url ??
      item?.lampiran_url ??
      null,

    // handover users
    handoverUsers,
  };
}

export default function useSakitViewModel() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pengajuan");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reasonDraft, setReasonDraft] = useState({});

  /* ===== LIST (tab aktif) ===== */
  const listKey = useMemo(() => {
    const qs = { status: statusFromTab(tab), page, pageSize };
    return ApiEndpoints.GetPengajuanIzinSakitMobile(qs);
  }, [tab, page, pageSize]);

  const { data, isLoading, mutate } = useSWR(listKey, fetcher, {
    revalidateOnFocus: false,
  });

  /* ===== COUNTS ===== */
  const countKey = useCallback(
    (status) =>
      ApiEndpoints.GetPengajuanIzinSakitMobile({ status, page: 1, pageSize: 1 }),
    []
  );

  const swrCntPending  = useSWR(countKey("pending"),   fetcher, { revalidateOnFocus: false });
  const swrCntApproved = useSWR(countKey("disetujui"), fetcher, { revalidateOnFocus: false });
  const swrCntRejected = useSWR(countKey("ditolak"),   fetcher, { revalidateOnFocus: false });

  const totalOf = (json) => {
    const r = json || {};
    return (
      r?.meta?.total ??
      r?.pagination?.total ??
      r?.total ??
      (Array.isArray(r?.data) ? r.data.length : 0)
    );
  };

  const tabCounts = useMemo(
    () => ({
      pengajuan: totalOf(swrCntPending.data),
      disetujui: totalOf(swrCntApproved.data),
      ditolak:   totalOf(swrCntRejected.data),
    }),
    [swrCntPending.data, swrCntApproved.data, swrCntRejected.data]
  );

  /* ===== Rows & filter ===== */
  const rows = useMemo(() => {
    const items = Array.isArray(data?.data) ? data.data : [];
    return items.map(mapItemToRow);
  }, [data]);

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((d) =>
      [
        d.nama,
        d.jabatanDivisi,
        d.kategori,
        d.handover,
        d.tglPengajuan,
        ...(Array.isArray(d.attachments) ? d.attachments.map((a) => a.name) : []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [rows, search]);

  /* ===== Alasan draft ===== */
  function handleAlasanChange(id, value) {
    setReasonDraft((prev) => ({ ...prev, [id]: value }));
  }

  /* ===== Actions ===== */
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
    data: rows,
    filteredData,
    loading: isLoading,

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
  };
}
