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

/* ===================== Attachments normalizer ====================== */
function normalizeAttachments(item) {
  const result = [];

  const pushUrl = (url, nameFallback = "Lampiran") => {
    const s = String(url ?? "").trim();
    if (!s) return;
    const fileName = s.split("/").pop()?.split("?")[0] || nameFallback;
    result.push({ url: s, name: fileName });
  };

  // Kandidat array
  const arrCands = [item?.attachments, item?.lampiran, item?.berkas, item?.files];
  for (const arr of arrCands) {
    if (Array.isArray(arr)) {
      for (const it of arr) {
        const url = it?.url ?? it?.link ?? it?.path ?? it?.file_url ?? it;
        const name = it?.name ?? it?.filename ?? undefined;
        pushUrl(url, name);
      }
    }
  }

  // Kandidat string tunggal
  const strCands = [
    item?.lampiran_tukar_hari_url,
    item?.lampiran_url,
    item?.bukti_url,
    item?.file_kelengkapan_url,
    item?.file_url,
  ];
  for (const s of strCands) pushUrl(s);

  return result;
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

  // Gabung Jabatan | Divisi (fallback ke role bila belum ada)
  const user = item?.user || {};

  const jabatanName =
    user?.jabatan?.nama_jabatan ?? null;

  const divisiName =
    user?.departement?.nama_departement ??
    user?.divisi ??                        
    null;

  const jabatanDivisi =
    [jabatanName, divisiName].filter(Boolean).join(" | ") ||
    user?.role ||
    "—";

  // Handover text
  const handover =
    item?.handover ??
    item?.handover_text ??
    item?.handover_desc ??
    item?.handover_description ??
    item?.keterangan_handover ??
    "—";

  // Handover users (toleran berbagai bentuk)
  const rawHandoverUsers =
    item?.handover_users ??
    item?.handoverUsers ??
    item?.penerima_handover ??
    item?.handover_assignments ??
    [];

  const handoverUsers = Array.isArray(rawHandoverUsers)
    ? rawHandoverUsers
        .map((h) => {
          const u = h?.user ?? h;
          const id = u?.id_user ?? u?.id ?? u?.uuid ?? null;
          const name = u?.nama_pengguna ?? u?.name ?? u?.nama ?? u?.full_name ?? null;
          const photo = u?.foto_profil_user ?? u?.photo ?? u?.avatar ?? "/avatar-placeholder.jpg";
          if (!id && !name) return null;
          return { id: id ?? String(name), name: name ?? "—", photo };
        })
        .filter(Boolean)
    : [];

  // Attachments
  const attachments = normalizeAttachments(item);
  const buktiUrl = attachments[0]?.url ?? null;

  return {
    id: item?.id_izin_tukar_hari,
    nama: user?.nama_pengguna ?? "—",
    jabatanDivisi,
    foto: user?.foto_profil_user || "/avatar-placeholder.jpg",

    tglPengajuan: item?.created_at ?? item?.createdAt ?? null,
    hariIzin,
    hariPengganti,

    kategori: item?.kategori ?? "—",
    keperluan: item?.keperluan ?? "—",

    // ✨ tambahan
    handover,
    handoverUsers,
    attachments,
    buktiUrl,

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

  /* ===== COUNTS untuk badge tab ===== */
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
    return rows.filter((d) => {
      const handoverNames = (d.handoverUsers || []).map((u) => u.name).join(" ");
      const attNames = (d.attachments || []).map((a) => a.name).join(" ");
      return [
        d.nama,
        d.jabatanDivisi,
        d.kategori,
        d.keperluan,
        d.hariIzin,
        d.hariPengganti,
        d.handover,       // ✨ cari di deskripsi handover
        handoverNames,    // ✨ cari di nama penerima
        attNames,         // ✨ cari di nama file
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
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

  // REPLACE seluruh fungsi reject dengan ini:
  const reject = useCallback(
    async (id, note) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return false;

      const reason = String(note ?? "").trim();
      if (!reason) {
        message.error("Alasan wajib diisi saat menolak.");
        return false; 
      }

      const approvalId = row.approvalId || (await ensureApprovalId(row));
      if (!approvalId) {
        message.error("Tidak menemukan id approval pada pengajuan ini.");
        return false;
      }

      try {
        const res = await fetch(
          ApiEndpoints.DecidePengajuanTukarHariMobile(approvalId),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "ditolak", note: reason }),
          }
        );
        const json = await res.json();
        if (!res.ok || json?.ok === false)
          throw new Error(json?.message || "Gagal");

        message.success("Pengajuan tukar hari ditolak");
        await Promise.all([
          mutate(),
          swrCntPending.mutate(),
          swrCntApproved.mutate(),
          swrCntRejected.mutate(),
        ]);
        return true; // <- sukses
      } catch (e) {
        message.error(e?.message || "Gagal menyimpan keputusan.");
        return false;
      }
    },
    [rows, mutate, swrCntPending, swrCntApproved, swrCntRejected]
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

    polaOptions,
    fetchPolaOptions,
    loadingPola,
  };
}
