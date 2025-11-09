"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import { message } from "antd";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";

/* ===== Utils kecil ===== */
const norm = (v) => String(v ?? "").trim().toLowerCase();
const toLabelStatus = (s) =>
  norm(s) === "disetujui"
    ? "Disetujui"
    : norm(s) === "ditolak"
    ? "Ditolak"
    : "Menunggu";

function getApprovalsArray(item) {
  const candidates = [
    item?.approvals,
    item?.approval_pengajuan_cuti,
    item?.approvalPengajuanCuti,
  ];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}

function pickApprovalId(item) {
  const approvals = getApprovalsArray(item);
  const pending = approvals
    .filter((a) => !a?.deleted_at)
    .find((a) => norm(a?.decision) === "pending"); // ← hanya pending
  return pending?.id_approval_pengajuan_cuti || pending?.id || null;
}

function pickLatestDecisionInfo(item, want) {
  const approvals = getApprovalsArray(item);
  if (!approvals.length) return null;
  const desired = ["disetujui", "ditolak"].includes(norm(want)) ? norm(want) : null;
  const filtered = approvals.filter((a) =>
    desired ? norm(a?.decision) === desired : Boolean(a?.decided_at)
  );
  if (!filtered.length) return null;
  const sorted = filtered.sort((a, b) => {
    const ta = new Date(a?.decided_at || 0).getTime();
    const tb = new Date(b?.decided_at || 0).getTime();
    return tb - ta;
  });
  const top = sorted[0];
  return { note: top?.note || "", decided_at: top?.decided_at || null };
}

function safeToDate(v) {
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapItemToRow(item) {
  const statusRaw = norm(item?.status);
  const latest = pickLatestDecisionInfo(item, statusRaw);

  // Ambil list tanggal cuti (array Date)
  const tglCutiList = Array.isArray(item?.tanggal_list)
    ? item.tanggal_list
        .map((d) => safeToDate(d?.tanggal_cuti))
        .filter(Boolean)
        .sort((a, b) => a.getTime() - b.getTime())
    : [];

  // First/last dari API (fallback ke turunan dari list)
  const tglCutiFirst =
    safeToDate(item?.tanggal_cuti) || tglCutiList[0] || null;
  const tglCutiLast =
    safeToDate(item?.tanggal_selesai) || tglCutiList[tglCutiList.length - 1] || null;

  return {
    id: item?.id_pengajuan_cuti,
    nama: item?.user?.nama_pengguna ?? "—",
    jabatan: item?.user?.role ?? "—",
    foto: item?.user?.foto_profil_user || "/avatar-placeholder.jpg",
    jenisCuti: item?.kategori_cuti?.nama_kategori ?? "—",
    tglPengajuan: item?.created_at ?? item?.createdAt ?? null,

    // —— UI baru pakai ini:
    tglCutiList,               // array Date
    tglCutiFirst,              // Date
    tglCutiLast,               // Date
    totalHariCuti: tglCutiList.length,

    // tetap dipakai untuk approve modal:
    tglMasuk: item?.tanggal_masuk_kerja ?? null,

    keterangan: item?.keperluan ?? "—",
    handover: item?.handover ?? "—",
    buktiUrl: item?.lampiran_cuti_url ?? null,
    status: toLabelStatus(item?.status),
    alasan: latest?.note || "",
    tglKeputusan: latest?.decided_at ?? item?.updated_at ?? item?.updatedAt ?? null,
    approvalId: pickApprovalId(item),
  };
}

function statusFromTab(tab) {
  if (tab === "disetujui") return "disetujui";
  if (tab === "ditolak") return "ditolak";
  return "pending"; // tab "pengajuan"
}

/* ===== Helper normalize list pola kerja -> options ===== */
function formatJam(hhmmss) {
  if (!hhmmss) return null;
  const s = String(hhmmss);
  return s.length >= 5 ? s.slice(0, 5) : s; // "HH:MM"
}
function toPolaOptions(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map((p) => {
    const id =
      p?.id_pola_kerja ?? p?.id ?? p?.uuid ?? p?.pola_id ?? String(Math.random());
    const nama =
      p?.nama_pola ??
      p?.nama_pola_kerja ??
      p?.nama ??
      p?.kode ??
      p?.label ??
      "Pola";
    const jm = formatJam(p?.jam_masuk || p?.mulai || p?.start_at || p?.jam_masuk_kerja);
    const jp = formatJam(p?.jam_pulang || p?.selesai || p?.end_at || p?.jam_pulang_kerja);
    const jam = jm && jp ? `${jm}–${jp}` : null;
    return { value: String(id), label: jam ? `${nama} (${jam})` : `${nama}` };
  });
}

export default function useCutiViewModel() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pengajuan");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // List pengajuan
  const listKey = useMemo(() => {
    const qs = { status: statusFromTab(tab), page, perPage: pageSize, all: 1 };
    return ApiEndpoints.GetPengajuanCutiMobile(qs);
  }, [tab, page, pageSize]);

  const { data, isLoading, mutate } = useSWR(listKey, fetcher, {
    revalidateOnFocus: false,
  });

  const rows = useMemo(() => {
    const items = Array.isArray(data?.data) ? data.data : [];
    return items.map(mapItemToRow);
  }, [data]);

  // Pencarian lokal (ikut tanggal-tanggal cuti)
  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((d) => {
      const tanggalStr = (d.tglCutiList || [])
        .map((t) => (t instanceof Date ? t.toISOString().slice(0, 10) : String(t)))
        .join(" ");
      return [
        d.nama,
        d.jabatan,
        d.jenisCuti,
        d.keterangan,
        d.handover,
        d.tglMasuk,
        tanggalStr,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [rows, search]);

  // ==== Pola Kerja untuk modal "Setujui" ====
  const { data: polaRes } = useSWR(ApiEndpoints.GetPolaKerja, fetcher, {
    revalidateOnFocus: false,
  });
  const polaOptions = useMemo(() => {
    const list = Array.isArray(polaRes?.data) ? polaRes.data : polaRes?.items || polaRes || [];
    return toPolaOptions(list);
  }, [polaRes]);

  // ==== Actions ====
  const approve = useCallback(
    async (id, note, returnShift /* { date: 'YYYY-MM-DD', id_pola_kerja: '...' } */) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return;

      if (!row.approvalId) {
        message.error(
          "Tidak menemukan id approval pada pengajuan ini. Pastikan API list mengembalikan approvals."
        );
        return;
      }

      const body = { decision: "disetujui", note: note ?? null };
      if (returnShift && returnShift.date && returnShift.id_pola_kerja) {
        body.return_shift = {
          date: returnShift.date,
          id_pola_kerja: returnShift.id_pola_kerja,
        };
      }

      try {
        const res = await fetch(ApiEndpoints.DecidePengajuanCutiMobile(row.approvalId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok || json?.ok === false) throw new Error(json?.message || "Gagal");
        message.success("Pengajuan cuti disetujui");
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

      const reason = String(note ?? "").trim();
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
        const res = await fetch(ApiEndpoints.DecidePengajuanCutiMobile(row.approvalId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision: "ditolak", note: reason }),
        });
        const json = await res.json();
        if (!res.ok || json?.ok === false) throw new Error(json?.message || "Gagal");
        message.success("Pengajuan cuti ditolak");
        mutate();
      } catch (e) {
        message.error(e?.message || "Gagal menyimpan keputusan.");
      }
    },
    [rows, mutate]
  );

  const refresh = useCallback(() => mutate(), [mutate]);

  return {
    // data
    data: rows,
    filteredData,
    // filters
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
    // actions
    approve,
    reject,
    refresh,
    // pola kerja
    polaOptions,
    loading: isLoading,
  };
}
