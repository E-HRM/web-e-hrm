"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import { message } from "antd";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";
import {
  handoverPlainText,
  extractHandoverTags,
  mergeUsers,
} from "@/app/api/mobile/tag-users/helpers/tagged-text";

/* ===================== Utils ====================== */
const norm = (v) => String(v ?? "").trim().toLowerCase();

function isPendingDecision(d) {
  return ["", "pending", "menunggu"].includes(norm(d));
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

/* === URL publik untuk file (samakan dengan menu lain) === */
function toPublicUrl(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  // 1) Jika ada builder resmi
  if (typeof ApiEndpoints?.PublicFile === "function") {
    try {
      const built = ApiEndpoints.PublicFile(raw);
      if (built) return built;
    } catch {}
  }

  // 2) Jika punya baseURL (di endpoints/env)
  const base =
    (typeof ApiEndpoints?.FileBaseURL === "string" && ApiEndpoints.FileBaseURL) ||
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_FILE_BASE_URL) ||
    "";

  if (base) {
    return `${base.replace(/\/$/, "")}/${raw.replace(/^\//, "")}`;
  }

  // 3) Fallback: origin aplikasi
  try {
    const { origin } = window.location;
    return `${origin}/${raw.replace(/^\//, "")}`;
  } catch {
    return `/${raw.replace(/^\//, "")}`;
  }
}

function getApprovalsArray(item) {
  const candidates = [
    item?.approvals,
    item?.approval_izin_tukar_hari,
    item?.ApprovalIzinTukarHari,
    item?.approvalPengajuanTukarHari,
  ];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}

/** Ambil id approval pending level terendah (atau berbagai shortcut field umum) */
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

/** Ambil note & tanggal keputusan dari approval terbaru (bisa difilter by status) */
function pickLatestDecisionInfo(item, want) {
  const approvals = getApprovalsArray(item);
  if (!approvals.length) return null;

  const desired = ["disetujui", "ditolak"].includes(norm(want))
    ? norm(want)
    : null;

  const filtered = approvals
    .filter((a) => !a?.deleted_at)
    .filter((a) => {
      const d = norm(a?.decision);
      return desired ? d === desired : Boolean(a?.decided_at || a?.updated_at);
    });

  if (!filtered.length) return null;

  const top = filtered
    .sort((a, b) => {
      const tb = new Date(b?.decided_at ?? b?.updated_at ?? 0).getTime();
      const ta = new Date(a?.decided_at ?? a?.updated_at ?? 0).getTime();
      return tb - ta;
    })[0];

  return {
    note: top?.note ?? top?.catatan ?? top?.comment ?? "",
    decided_at: top?.decided_at ?? top?.updated_at ?? null,
  };
}

/* ===================== Pola kerja options helper ====================== */
function guessPolaOptionsUrl() {
  try {
    if (typeof ApiEndpoints?.GetPolaKerjaOptions === "function")
      return ApiEndpoints.GetPolaKerjaOptions();
    if (ApiEndpoints?.GetPolaKerjaOptions) return ApiEndpoints.GetPolaKerjaOptions;

    if (typeof ApiEndpoints?.GetPolaKerja === "function")
      return ApiEndpoints.GetPolaKerja({ page: 1, perPage: 999 });
    if (ApiEndpoints?.GetPolaKerja) return ApiEndpoints.GetPolaKerja;

    if (typeof ApiEndpoints?.GetPolaOptions === "function")
      return ApiEndpoints.GetPolaOptions();
    if (ApiEndpoints?.GetPolaOptions) return ApiEndpoints.GetPolaOptions;
  } catch {}
  return null;
}
function normalizePolaItems(json) {
  const items =
    (Array.isArray(json?.data) && json.data) ||
    (Array.isArray(json) && json) ||
    [];
  return items.map((it) => {
    const id =
      it?.id_pola_kerja ?? it?.id ?? it?.polaId ?? it?.uuid ?? String(it?.value);
    const nama = it?.nama_pola_kerja ?? it?.nama ?? it?.label ?? it?.name ?? "Pola";
    const jIn = (it?.jam_masuk ?? it?.jamIn ?? it?.start ?? it?.masuk) || "";
    const jOut = (it?.jam_pulang ?? it?.jamOut ?? it?.end ?? it?.pulang) || "";
    const jam = jIn && jOut ? `${String(jIn).slice(0, 5)}-${String(jOut).slice(0, 5)}` : null;
    return { value: String(id), label: jam ? `${nama} (${jam})` : nama, raw: it };
  });
}

/* ===================== Attachments normalizer (super-kompatibel) ====================== */
function normalizeAttachments(item) {
  const result = [];

  const pushUrl = (maybeUrl, nameFallback = "Lampiran") => {
    const raw = String(maybeUrl ?? "").trim();
    if (!raw) return;
    const url = toPublicUrl(raw);
    const fileName =
      raw.split("/").pop()?.split("?")[0] ||
      nameFallback;
    result.push({ url, name: fileName });
  };

  // Kandidat ARRAY yang sering dipakai backend
  const arrayCandidates = [
    item?.attachments,
    item?.lampiran,
    item?.berkas,
    item?.files,
    item?.file_kelengkapan,     // ← banyak backend pakai ini
    item?.kelengkapan,          // ← atau ini
    item?.kelengkapan_files,    // ← atau ini
    item?.dokumen_kelengkapan,  // ← atau ini
    item?.dokumen,
    item?.documents,
  ];

  for (const arr of arrayCandidates) {
    if (Array.isArray(arr)) {
      for (const it of arr) {
        const rawUrl =
          (typeof it === "string" && it) ||
          it?.url ||
          it?.link ||
          it?.path ||
          it?.file_url ||
          it?.file ||
          it?.lokasi_file ||
          it?.filepath ||
          "";
        const name =
          it?.name ||
          it?.filename ||
          it?.original_name ||
          it?.originalName ||
          it?.nama_file ||
          it?.file_name ||
          undefined;
        pushUrl(rawUrl, name);
      }
    }
  }

  // Kandidat STRING tunggal (1 file saja)
  const singleCandidates = [
    item?.file_kelengkapan,     // ← string path langsung
    item?.file_kelengkapan_url,
    item?.lampiran_tukar_hari_url,
    item?.lampiran_url,
    item?.bukti_url,
    item?.file_url,
    item?.kelengkapan_url,
    item?.dokumen_url,
  ];
  for (const s of singleCandidates) pushUrl(s);

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

  const user = item?.user || {};
  const jabatanName = user?.jabatan?.nama_jabatan ?? null;
  const divisiName =
    user?.departement?.nama_departement ?? user?.divisi ?? null;
  const jabatanDivisi =
    [jabatanName, divisiName].filter(Boolean).join(" | ") ||
    user?.role ||
    "—";

  // ===== Handover (tetap seperti sebelumnya) =====
  const rawHandover =
    item?.handover ??
    item?.handover_text ??
    item?.handover_desc ??
    item?.handover_description ??
    item?.keterangan_handover ??
    "—";

  const handoverClean = handoverPlainText(rawHandover);

  const apiHandoverUsers = Array.isArray(item?.handover_users)
    ? item.handover_users
        .map((h) => {
          const u = h?.user ?? h;
          const id = u?.id_user ?? u?.id ?? u?.uuid ?? null;
          const name =
            u?.nama_pengguna ?? u?.name ?? u?.nama ?? u?.full_name ?? null;
          const photo =
            u?.foto_profil_user ?? u?.photo ?? u?.avatar ?? "/avatar-placeholder.jpg";
          if (!id && !name) return null;
          return { id: String(id ?? name), name: name ?? "—", photo };
        })
        .filter(Boolean)
    : [];

  const tagUsers = extractHandoverTags(rawHandover).map((t) => ({
    id: t.id,
    name: t.name,
    photo: "/avatar-placeholder.jpg",
  }));

  const handoverUsers = mergeUsers(apiHandoverUsers, tagUsers);

  // ===== approvals =====
  const statusRaw = norm(item?.status);
  const latest = pickLatestDecisionInfo(item, statusRaw);

  // ===== FILE PENDUKUNG (INI YANG PENTING) =====
  const buktiUrl =
    item?.lampiran_izin_tukar_hari_url ??
    item?.lampiran_izin_tukar_hari ??
    null;

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

    handover: handoverClean,
    handoverUsers,
    buktiUrl,

    statusRaw: item?.status ?? "pending",
    status: toLabelStatus(item?.status),
    alasan: latest?.note ?? "",
    tempAlasan: "",
    tglKeputusan:
      latest?.decided_at ?? item?.updated_at ?? item?.updatedAt ?? null,

    approvalId: pickApprovalId(item),
    pairs,
  };
}


/* ===================== Hook ViewModel ====================== */
export default function useTukarHariViewModel() {
  const [search, _setSearch] = useState("");
  const [tab, _setTab] = useState("pengajuan");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10); // konsisten pakai perPage

  // reset halaman saat ganti tab / keyword
  const setTab = useCallback((t) => { _setTab(t); setPage(1); }, []);
  const setSearch = useCallback((s) => { _setSearch(s); setPage(1); }, []);

  /* ===== LIST: hanya data untuk tab aktif ===== */
  const listKey = useMemo(() => {
    const qs = { status: statusFromTab(tab), page, perPage, all: 1 };
    return ApiEndpoints.GetPengajuanTukarHariMobile(qs);
  }, [tab, page, perPage]);

  const { data, isLoading, mutate } = useSWR(listKey, fetcher, {
    revalidateOnFocus: false,
  });

  /* ===== COUNTS untuk badge tab ===== */
  const countKey = useCallback(
    (status) =>
      ApiEndpoints.GetPengajuanTukarHariMobile({ status, page: 1, perPage: 1, all: 1 }),
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
    const term = String(search).trim().toLowerCase();
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
        d.handover,
        handoverNames,
        attNames,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [rows, search]);

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
  const [polaOptions, setPolaOptions] = useState([]);
  const [loadingPola, setLoadingPola] = useState(false);
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
      // ignore
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
        return true;
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
    pageSize: perPage,
    changePage: (p, ps) => {
      setPage(p);
      setPerPage(ps);
    },

    approve,
    reject,
    refresh,

    polaOptions,
    fetchPolaOptions,
    loadingPola,
  };
}
