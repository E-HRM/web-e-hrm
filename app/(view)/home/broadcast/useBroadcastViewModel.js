"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { fetcher } from "../../../utils/fetcher";
import { crudService } from "../../../utils/services/crudService";
import { ApiEndpoints } from "../../../../constrainst/endpoints";

/** build querystring aman */
function buildQS(obj) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      p.set(k, String(v).trim());
    }
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** mapping status → tag antd */
function mapStatus(status) {
  switch (status) {
    case "DRAFT":
      return { color: "default", text: "Konsep" };
    case "SENDING":
      return { color: "processing", text: "Mengirim" };
    case "CANCELED":
      return { color: "error", text: "Batal" };
    case "OUT_OF_QUOTA":
      return { color: "warning", text: "Kuota Habis" };
    case "DELAYED":
      return { color: "geekblue", text: "Ditunda" };
    case "DONE":
      return { color: "success", text: "Selesai" };
    default:
      return { color: "default", text: status || "—" };
  }
}

export default function useBroadcastViewModel() {
  // filters
  const [receiver, setReceiver] = useState(null); // ALL | DIVISI | JABATAN | INDIVIDU | null
  const [status, setStatus] = useState("ALL"); // tab
  const [q, setQ] = useState("");

  // table
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // list
  const listKey = useMemo(() => {
    const qs = buildQS({
      page,
      pageSize,
      search: q,
      status: status !== "ALL" ? status : "",
      target: receiver || "",
      orderBy: "created_at",
      sort: "desc",
    });
    return `${ApiEndpoints.GetBroadcasts}${qs}`;
  }, [page, pageSize, q, status, receiver]);

  const { data: listRes, isLoading } = useSWR(listKey, fetcher, {
    keepPreviousData: true,
  });

  const rawRows = useMemo(
    () => (Array.isArray(listRes?.data) ? listRes.data : []),
    [listRes]
  );

  const rows = useMemo(() => {
    return rawRows.map((b) => {
      const id = b.id_broadcast || b.id || b.uuid;
      const title = b.judul || b.title || "(Tanpa judul)";
      const creator =
        b.pembuat?.nama_pengguna ||
        b.pembuat?.name ||
        b.pembuat ||
        b.created_by_name ||
        "—";

      const targetType = b.target_type || b.target || b.segment || "ALL";
      const targetName =
        b.target_name ||
        b.nama_target ||
        b.segment_name ||
        (targetType === "ALL" ? "Semua karyawan" : "—");

      const targetLabel =
        targetType === "ALL"
          ? "Semua karyawan"
          : `${targetType} — ${targetName}`;

      const status = b.status || "DRAFT";

      return { id, title, creator, targetLabel, status };
    });
  }, [rawRows]);

  const total = listRes?.pagination?.total ?? rows.length;

  // actions
  const changePage = useCallback((p, ps) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const searchNow = useCallback(() => {
    globalMutate(listKey);
  }, [listKey]);

  const [deletingId, setDeletingId] = useState(null);
  const deleteById = useCallback(
    async (id) => {
      try {
        setDeletingId(id);
        await crudService.delete(ApiEndpoints.DeleteBroadcast(id));
        await globalMutate(listKey);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e?.message || "Gagal" };
      } finally {
        setDeletingId(null);
      }
    },
    [listKey]
  );

  return {
    // filters
    receiver,
    setReceiver,
    status,
    setStatus,
    q,
    setQ,
    searchNow,

    // table
    page,
    pageSize,
    total,
    rows,
    loading: isLoading,
    changePage,

    // helpers
    statusToTag: mapStatus,

    // actions
    deleteById,
    deletingId,
  };
}
