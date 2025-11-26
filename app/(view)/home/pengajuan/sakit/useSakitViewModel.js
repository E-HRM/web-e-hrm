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

/* ============ Helpers ============ */
const norm = (v) => String(v ?? "").trim().toLowerCase();

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

function getApprovalsArray(item) {
  const candidates = [
    item?.approvals,
    item?.approval_izin_sakit,
    item?.approvalIzinSakit,
  ];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}

function pickApprovalId(item) {
  const approvals = getApprovalsArray(item);
  const pending = approvals
    .filter((a) => !a?.deleted_at)
    .find((a) => ["", "pending", "menunggu"].includes(norm(a?.decision)));
  return pending?.id_approval_izin_sakit ?? pending?.id ?? null;
}

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

/* attachments normalizer */
function normalizeAttachments(item) {
  const out = [];
  const pushUrl = (url, nameFallback = "Lampiran") => {
    const s = String(url ?? "").trim();
    if (!s) return;
    const fileName = s.split("/").pop()?.split("?")[0] || nameFallback;
    out.push({ url: s, name: fileName });
  };

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

/* handover users (API + tag) */
function buildHandoverUsers(item, rawText) {
  const fromApi = Array.isArray(item?.handover_users)
    ? item.handover_users
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
        .filter(Boolean)
    : [];

  const fromTags = extractHandoverTags(rawText).map((t) => ({
    id: t.id,
    name: t.name,
    photo: "/avatar-placeholder.jpg",
  }));

  return mergeUsers(fromApi, fromTags);
}

/* ============ Map API item -> Row ============ */
function mapItemToRow(item) {
  const user = item?.user || {};

  const jabatanName = user?.jabatan?.nama_jabatan ?? null;
  const divisiName =
    user?.departement?.nama_departement ?? user?.divisi ?? null;

  const jabatanDivisi =
    [jabatanName, divisiName].filter(Boolean).join(" | ") ||
    user?.role ||
    "—";

  const rawHandover =
    item?.handover ?? item?.handover_text ?? item?.keterangan_handover ?? "—";

  // approvals → ambil note & tanggal keputusan
  const statusRaw = norm(item?.status);
  const latest = pickLatestDecisionInfo(item, statusRaw);

  const handover = handoverPlainText(rawHandover);
  const handoverUsers = buildHandoverUsers(item, rawHandover);
  const attachments = normalizeAttachments(item);

  return {
    id: item?.id_pengajuan_izin_sakit,

    // user
    nama: user?.nama_pengguna ?? "—",
    jabatanDivisi,
    foto: user?.foto_profil_user || "/avatar-placeholder.jpg",

    // waktu
    tglPengajuan:
      item?.tanggal_pengajuan ?? item?.created_at ?? item?.createdAt ?? null,

    // konten
    kategori:
      item?.kategori?.nama_kategori ??
      item?.kategori_sakit?.nama_kategori ??
      "—",
    handover, // @nama rapi
    handoverUsers,

    // status & keputusan
    statusRaw: item?.status ?? "pending",
    status: toLabelStatus(item?.status),
    alasan: latest?.note ?? "",
    tglKeputusan:
      latest?.decided_at ?? item?.updated_at ?? item?.updatedAt ?? null,

    // approvals
    approvalId: pickApprovalId(item),

    // files
    attachments,
    buktiUrl: item?.lampiran_izin_sakit_url ?? item?.lampiran_url ?? null,
  };
}

/* ============ Hook ============ */
export default function useSakitViewModel() {
  const [search, _setSearch] = useState("");
  const [tab, _setTab] = useState("pengajuan");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const setTab = useCallback((t) => {
    _setTab(t);
    setPage(1);
  }, []);
  const setSearch = useCallback((s) => {
    _setSearch(s);
    setPage(1);
  }, []);

  // list (tab aktif)
  const listKey = useMemo(() => {
    const qs = { status: statusFromTab(tab), page, perPage, all: 1 };
    return ApiEndpoints.GetPengajuanIzinSakitMobile(qs);
  }, [tab, page, perPage]);

  const { data, isLoading, mutate } = useSWR(listKey, fetcher, {
    revalidateOnFocus: false,
  });

  // counts
  const countKey = useCallback(
    (status) =>
      ApiEndpoints.GetPengajuanIzinSakitMobile({
        status,
        page: 1,
        perPage: 1,
        all: 1,
      }),
    []
  );

  const swrCntPending = useSWR(countKey("pending"), fetcher, {
    revalidateOnFocus: false,
  });
  const swrCntApproved = useSWR(countKey("disetujui"), fetcher, {
    revalidateOnFocus: false,
  });
  const swrCntRejected = useSWR(countKey("ditolak"), fetcher, {
    revalidateOnFocus: false,
  });

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
      ditolak: totalOf(swrCntRejected.data),
    }),
    [swrCntPending.data, swrCntApproved.data, swrCntRejected.data]
  );

  // rows + filter
  const rows = useMemo(() => {
    const items = Array.isArray(data?.data) ? data.data : [];
    return items.map(mapItemToRow);
  }, [data]);

  const filteredData = useMemo(() => {
    const term = String(search).trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((d) =>
      [
        d.nama,
        d.jabatanDivisi,
        d.kategori,
        d.handover,
        d.tglPengajuan,
        ...(Array.isArray(d.attachments)
          ? d.attachments.map((a) => a.name)
          : []),
        ...(Array.isArray(d.handoverUsers)
          ? d.handoverUsers.map((u) => u.name)
          : []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [rows, search]);

  // actions
  const approve = useCallback(
    async (id, note) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return;

      if (!row.approvalId) {
        message.error(
          "Tidak menemukan id approval. Pastikan API list mengembalikan approvals."
        );
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
        if (!res.ok || json?.ok === false)
          throw new Error(json?.message || "Gagal");
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
      if (!row) return false;

      const reason = String(note ?? "").trim();
      if (!reason) {
        message.error("Alasan wajib diisi saat menolak.");
        return false;
      }

      if (!row.approvalId) {
        message.error(
          "Tidak menemukan id approval pada pengajuan ini. Pastikan API list mengembalikan approvals."
        );
        return false;
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
        if (!res.ok || json?.ok === false)
          throw new Error(json?.message || "Gagal");

        message.success("Pengajuan izin sakit ditolak");
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

  const changePage = useCallback((p, ps) => {
    setPage(p);
    setPerPage(ps);
  }, []);

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
    changePage,

    approve,
    reject,
    refresh,
  };
}
