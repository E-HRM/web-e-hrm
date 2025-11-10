"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import { message } from "antd";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";

/* ===================== Utils ====================== */
function norm(v) {
  return String(v ?? "").trim().toLowerCase();
}
function isPendingDecision(d) {
  return norm(d) === "pending";
}
function getApprovalsArray(item) {
  const candidates = [item?.approvals, item?.approval_izin_tukar_hari, item?.ApprovalIzinTukarHari];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}
/** Ambil id approval yang masih pending terendah level-nya */
function pickApprovalId(item) {
  if (item?.my_pending_approval_id) return item.my_pending_approval_id;
  if (item?.next_approval_id_for_me) return item.next_approval_id_for_me;
  if (item?.current_approval_id) return item.current_approval_id;
  const approvals = getApprovalsArray(item);
  if (!approvals.length) return null;
  const pending = approvals
    .filter((a) => !a?.deleted_at)
    .sort((a, b) => (a?.level ?? 0) - (b?.level ?? 0))
    .find((a) => isPendingDecision(a?.decision));
  return pending?.id_approval_izin_tukar_hari ?? pending?.id ?? null;
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

/* ===================== Pola kerja options helper ====================== */
function guessPolaOptionsUrl() {
  try {
    if (typeof ApiEndpoints?.GetPolaKerjaOptions === "function")
      return ApiEndpoints.GetPolaKerjaOptions();
    if (ApiEndpoints?.GetPolaKerjaOptions) return ApiEndpoints.GetPolaKerjaOptions;

    if (typeof ApiEndpoints?.GetPolaKerja === "function")
      return ApiEndpoints.GetPolaKerja({ page: 1, pageSize: 999 });
    if (ApiEndpoints?.GetPolaKerja) return ApiEndpoints.GetPolaKerja;

    if (typeof ApiEndpoints?.GetPolaOptions === "function")
      return ApiEndpoints.GetPolaOptions();
    if (ApiEndpoints?.GetPolaOptions) return ApiEndpoints.GetPolaOptions;
  } catch {}
  return null;
}
function normalizePolaItems(json) {
  const items = (Array.isArray(json?.data) && json.data) || (Array.isArray(json) && json) || [];
  return items.map((it) => {
    const id = it?.id_pola_kerja ?? it?.id ?? it?.polaId ?? it?.uuid ?? String(it?.value);
    const nama = it?.nama_pola_kerja ?? it?.nama ?? it?.label ?? it?.name ?? "Pola";
    const jIn = (it?.jam_masuk ?? it?.jamIn ?? it?.start ?? it?.masuk) || "";
    const jOut = (it?.jam_pulang ?? it?.jamOut ?? it?.end ?? it?.pulang) || "";
    const jam = jIn && jOut ? `${String(jIn).slice(0, 5)}-${String(jOut).slice(0, 5)}` : null;
    return { value: String(id), label: jam ? `${nama} (${jam})` : nama, raw: it };
  });
}

/* ===================== Mapper Row ====================== */
function mapItemToRow(item) {
  const pairsRaw = Array.isArray(item?.pairs) ? item.pairs : [];
  const pairs = pairsRaw.map((p) => ({
    izin: p?.hari_izin ?? null,
    pengganti: p?.hari_pengganti ?? null,
    catatan: p?.catatan_pair ?? null,
  }));

  const hariIzin =
    pairs[0]?.izin ||
    item?.hari_izin ||
    item?.tanggal_izin ||
    item?.tgl_izin ||
    item?.tanggal ||
    null;

  const hariPengganti =
    pairs[0]?.pengganti ||
    item?.hari_pengganti ||
    item?.tanggal_pengganti ||
    item?.tgl_pengganti ||
    null;

  return {
    id: item?.id_izin_tukar_hari,
    nama: item?.user?.nama_pengguna ?? "—",
    jabatan: item?.user?.role ?? "—",
    foto: item?.user?.foto_profil_user || "/avatar-placeholder.jpg",

    tglPengajuan: item?.created_at ?? item?.createdAt ?? null,
    hariIzin,
    hariPengganti,

    kategori: item?.kategori ?? "—",
    keperluan: item?.keperluan ?? "—",

    statusRaw: item?.status ?? "pending",
    status: toLabelStatus(item?.status),
    alasan: "",
    tempAlasan: "",
    tglKeputusan: item?.updated_at ?? item?.updatedAt ?? null,

    approvalId: pickApprovalId(item),
    pairs,
  };
}

/* ===================== Hook ViewModel ====================== */
export default function useTukarHariViewModel() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pengajuan");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reasonDraft, setReasonDraft] = useState({});

  const [polaOptions, setPolaOptions] = useState([]);
  const [loadingPola, setLoadingPola] = useState(false);

  /* ===== LIST: hanya data untuk tab aktif ===== */
  const listKey = useMemo(() => {
    const qs = { status: statusFromTab(tab), page, pageSize, all: 1 };
    return ApiEndpoints.GetPengajuanTukarHariMobile(qs);
  }, [tab, page, pageSize]);

  const { data, isLoading, mutate } = useSWR(listKey, fetcher, {
    revalidateOnFocus: false,
  });

  /* ===== COUNTS: 3 SWR ringan agar badge tab selalu benar ===== */
  const countKey = useCallback(
    (status) => ApiEndpoints.GetPengajuanTukarHariMobile({ status, page: 1, pageSize: 1 }),
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

  /* ===== Rows & filter client-side ===== */
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

  /* ===== Draft alasan ===== */
  function handleAlasanChange(id, value) {
    setReasonDraft((prev) => ({ ...prev, [id]: value }));
  }

  /* ===== Ensure approvalId via detail saat list tidak menyertakan ===== */
  async function ensureApprovalId(row) {
    if (row?.approvalId) return row.approvalId;
    try {
      const detailUrl =
        typeof ApiEndpoints.GetPengajuanTukarHariDetail === "function"
          ? ApiEndpoints.GetPengajuanTukarHariDetail(row.id)
          : ApiEndpoints.GetPengajuanTukarHariMobile({ id: row.id, all: 1 });
      const res = await fetch(detailUrl, { cache: "no-store" });
      const json = await res.json();
      const raw =
        (json?.data && !Array.isArray(json.data) && json.data) ||
        (Array.isArray(json?.data) && json.data[0]) ||
        json?.result ||
        null;
      return raw ? pickApprovalId(raw) : null;
    } catch {
      return null;
    }
  }

  /* ===== Pola kerja options ===== */
  const fetchPolaOptions = useCallback(async () => {
    if (polaOptions.length) return;
    const url = guessPolaOptionsUrl();
    if (!url) return;
    try {
      setLoadingPola(true);
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      setPolaOptions(normalizePolaItems(json));
    } catch {
      // biarkan kosong
    } finally {
      setLoadingPola(false);
    }
  }, [polaOptions.length]);

  /* ===== Actions ===== */
  const approve = useCallback(
    async (id, note = null, idPolaKerjaPengganti = null) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return;

      const approvalId = await ensureApprovalId(row);
      if (!approvalId) {
        message.error("Tidak menemukan id approval. Pastikan API mengembalikan approvals / my_pending_approval_id atau aktifkan endpoint detail.");
        return;
      }

      try {
        const body = { decision: "disetujui", note: note ?? null };
        if (idPolaKerjaPengganti) body.id_pola_kerja_pengganti = String(idPolaKerjaPengganti);

        const res = await fetch(ApiEndpoints.DecidePengajuanTukarHariMobile(approvalId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok || json?.ok === false) throw new Error(json?.message || "Gagal");
        message.success("Pengajuan tukar hari disetujui");

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

      const approvalId = await ensureApprovalId(row);
      if (!approvalId) {
        message.error("Tidak menemukan id approval. Pastikan API mengembalikan approvals / my_pending_approval_id atau aktifkan endpoint detail.");
        return;
      }

      try {
        const res = await fetch(ApiEndpoints.DecidePengajuanTukarHariMobile(approvalId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision: "ditolak", note: reason }),
        });
        const json = await res.json();
        if (!res.ok || json?.ok === false) throw new Error(json?.message || "Gagal");
        message.success("Pengajuan tukar hari ditolak");

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

    // counts “lengket” untuk badge tab
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

    polaOptions,
    fetchPolaOptions,
    loadingPola,
  };
}
