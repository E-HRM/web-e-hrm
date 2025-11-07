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
    .find((a) => ["pending", "menunggu"].includes(norm(a?.decision)));
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

function mapItemToRow(item) {
  const statusRaw = norm(item?.status);
  const latest = pickLatestDecisionInfo(item, statusRaw);

  return {
    id: item?.id_pengajuan_cuti,
    nama: item?.user?.nama_pengguna ?? "—",
    jabatan: item?.user?.role ?? "—",
    foto: item?.user?.foto_profil_user || "/avatar-placeholder.jpg",
    jenisCuti: item?.kategori_cuti?.nama_kategori ?? "—",
    tglPengajuan: item?.created_at ?? item?.createdAt ?? null,
    tglMulai: item?.tanggal_mulai ?? null,
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
  // ambil 5 digit "HH:MM"
  return s.length >= 5 ? s.slice(0, 5) : s;
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

  // Pencarian lokal
  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((d) =>
      [
        d.nama,
        d.jabatan,
        d.jenisCuti,
        d.keterangan,
        d.handover,
        d.tglMulai,
        d.tglMasuk,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
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
  // Approve dengan optional return_shift
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

      const body = {
        decision: "disetujui",
        note: note ?? null,
      };
      if (returnShift && returnShift.date && returnShift.id_pola_kerja) {
        body.return_shift = {
          date: returnShift.date,
          id_pola_kerja: returnShift.id_pola_kerja,
        };
      }

      try {
        const res = await fetch(
          ApiEndpoints.DecidePengajuanCutiMobile(row.approvalId),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
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

  // Reject (note wajib terisi)
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
        const res = await fetch(
          ApiEndpoints.DecidePengajuanCutiMobile(row.approvalId),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "ditolak", note: reason }),
          }
        );
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
