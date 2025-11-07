"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import { message } from "antd";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";

/* ===================== Utils Normalisasi ====================== */
function norm(v) {
  return String(v ?? "").trim().toLowerCase();
}

function isPendingDecision(d) {
  const v = norm(d);
  // anggap null/kosong juga "pending"
  return (
    v === "" ||
    v === "pending" ||
    v === "menunggu" ||
    v === "null" ||
    v === "0" ||
    v === "undefined"
  );
}

function getApprovalsArray(item) {
  const candidates = [
    item?.approvals,
    item?.approval_izin_tukar_hari,
    item?.ApprovalIzinTukarHari,
  ];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}

function pickApprovalId(item) {
  // kalau backend sudah bantu hitungkan id yang relevan untuk aktor saat ini
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

/* ===================== Mapper Row ====================== */

function mapItemToRow(item) {
  const hariIzin =
    item?.hari_izin ||
    item?.tanggal_izin ||
    item?.tgl_izin ||
    item?.tanggal ||
    null;
  const hariPengganti =
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

    kategori: item?.kategori?.nama_kategori ?? item?.kategori ?? "—",
    keperluan: item?.keperluan ?? "—",

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

/* ===================== Pola kerja options helper ====================== */
// Coba tebak beberapa endpoint umum. Sesuaikan jika perlu.
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
  const items =
    (Array.isArray(json?.data) && json.data) ||
    (Array.isArray(json) && json) ||
    [];
  return items.map((it) => {
    const id =
      it?.id_pola_kerja ?? it?.id ?? it?.polaId ?? it?.uuid ?? String(it?.value);
    const nama =
      it?.nama_pola_kerja ?? it?.nama ?? it?.label ?? it?.name ?? "Pola";
    const jamMasuk = it?.jam_masuk ?? it?.jamIn ?? it?.start ?? it?.masuk;
    const jamPulang = it?.jam_pulang ?? it?.jamOut ?? it?.end ?? it?.pulang;
    const jam =
      jamMasuk && jamPulang ? `${String(jamMasuk).slice(0, 5)}-${String(jamPulang).slice(0, 5)}` : null;

    return {
      value: String(id),
      label: jam ? `${nama} (${jam})` : nama,
      raw: it,
    };
  });
}

/* ===================== Hook ViewModel ====================== */

export default function useTukarHariViewModel() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pengajuan");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reasonDraft, setReasonDraft] = useState({});

  // pola kerja options (untuk modal Setujui)
  const [polaOptions, setPolaOptions] = useState([]);
  const [loadingPola, setLoadingPola] = useState(false);

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

  // Fallback: kalau approvalId belum ada di list, coba fetch detail dulu.
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

  // Loader opsi pola kerja untuk modal
  const fetchPolaOptions = useCallback(async () => {
    if (polaOptions.length) return; // sudah ada
    const url = guessPolaOptionsUrl();
    if (!url) return;

    try {
      setLoadingPola(true);
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      setPolaOptions(normalizePolaItems(json));
    } catch (_e) {
      // Biarkan kosong; user masih bisa Setujui tanpa override jika perlu
    } finally {
      setLoadingPola(false);
    }
  }, [polaOptions.length]);

  // Approve dengan optional override pola kerja hari_pengganti
  const approve = useCallback(
    async (id, note, overridePolaId) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return;

      const approvalId = await ensureApprovalId(row);
      if (!approvalId) {
        message.error(
          "Tidak menemukan id approval. Pastikan API mengembalikan approvals / my_pending_approval_id atau aktifkan endpoint detail."
        );
        return;
      }

      try {
        const body = {
          decision: "disetujui",
          note: note ?? null,
        };
        if (overridePolaId) {
          body.shift_overrides = {
            hari_pengganti: { id_pola_kerja: String(overridePolaId) },
          };
        }

        const res = await fetch(
          ApiEndpoints.DecidePengajuanTukarHariMobile(approvalId),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        const json = await res.json();
        if (!res.ok || json?.ok === false)
          throw new Error(json?.message || "Gagal");
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

      const approvalId = await ensureApprovalId(row);
      if (!approvalId) {
        message.error(
          "Tidak menemukan id approval. Pastikan API mengembalikan approvals / my_pending_approval_id atau aktifkan endpoint detail."
        );
        return;
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

    polaOptions,
    fetchPolaOptions,
    loadingPola,
  };
}
